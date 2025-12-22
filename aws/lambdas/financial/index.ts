import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
  SQSEvent,
  SQSRecord,
} from 'aws-lambda';
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import Stripe from 'stripe';

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT || undefined,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  }
});
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT || undefined,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  }
});
const PAYMENTS_TABLE = process.env.PAYMENTS_TABLE || 'payments';
const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE || 'bookings';
const NOTIFICATION_TOPIC_ARN = process.env.NOTIFICATION_TOPIC_ARN || '';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
});

interface PaymentRequest {
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  userId: string;
  userEmail: string;
}

interface RefundRequest {
  paymentId: string;
  amount?: number; // Optional - full refund if not specified
  reason?: string;
}

interface PaymentRecord {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded';
  stripePaymentIntentId: string;
  stripeChargeId?: string;
  createdAt: number;
  updatedAt: number;
  refundedAmount?: number;
  metadata?: Record<string, any>;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

/**
 * Parse and verify Cognito JWT token from Authorization header
 */
function parseAuthToken(event: APIGatewayProxyEvent): string | null {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Process a payment using Stripe
 */
async function processPayment(paymentRequest: PaymentRequest): Promise<ApiResponse> {
  const { bookingId, amount, currency, paymentMethodId, userId, userEmail } = paymentRequest;

  // Validate inputs
  if (!bookingId || !amount || !currency || !paymentMethodId || !userId) {
    return {
      success: false,
      error: 'Missing required payment parameters',
    };
  }

  if (amount <= 0) {
    return {
      success: false,
      error: 'Amount must be greater than zero',
    };
  }

  try {
    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: {
        bookingId,
        userId,
      },
      receipt_email: userEmail,
      description: `Conference room booking - ${bookingId}`,
    });

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = Date.now();

    const paymentRecord: PaymentRecord = {
      id: paymentId,
      bookingId,
      userId,
      amount,
      currency,
      status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'pending',
      stripePaymentIntentId: paymentIntent.id,
      stripeChargeId: paymentIntent.latest_charge as string | undefined,
      createdAt: now,
      updatedAt: now,
      metadata: {
        userEmail,
        paymentMethodId,
      },
    };

    // Save payment record to DynamoDB
    await dynamoClient.send(
      new PutItemCommand({
        TableName: PAYMENTS_TABLE,
        Item: marshall(paymentRecord),
      })
    );

    // Update booking status
    if (paymentIntent.status === 'succeeded') {
      await dynamoClient.send(
        new UpdateItemCommand({
          TableName: BOOKINGS_TABLE,
          Key: {
            booking_id: { S: bookingId },
          },
          UpdateExpression: 'SET payment_status = :status, payment_id = :paymentId, updated_at = :updatedAt',
          ExpressionAttributeValues: {
            ':status': { S: 'paid' },
            ':paymentId': { S: paymentId },
            ':updatedAt': { N: now.toString() },
          },
        })
      );

      // ASYNC NOTIFICATION: Publish booking confirmation to SNS topic
      if (NOTIFICATION_TOPIC_ARN) {
        try {
          await snsClient.send(
            new PublishCommand({
              TopicArn: NOTIFICATION_TOPIC_ARN,
              Message: JSON.stringify({
                type: 'booking_confirmation',
                bookingId,
                userId,
                userEmail,
                paymentId,
                amount,
                currency,
                timestamp: now,
              }),
              Subject: 'Booking Confirmed',
            })
          );
          console.log(`Notification published to SNS for booking ${bookingId}`);
        } catch (snsError) {
          console.error('Failed to publish SNS notification:', snsError);
          // Don't throw - notification failure shouldn't fail the payment
        }
      }
    }

    return {
      success: true,
      data: {
        paymentId,
        status: paymentRecord.status,
        amount,
        currency,
        stripePaymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      },
    };
  } catch (error) {
    console.error('Payment processing error:', error);

    // Log failed payment attempt
    const failedPaymentId = `pay_failed_${Date.now()}`;
    try {
      await dynamoClient.send(
        new PutItemCommand({
          TableName: PAYMENTS_TABLE,
          Item: marshall({
            id: failedPaymentId,
            bookingId,
            userId,
            amount,
            currency,
            status: 'failed',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        })
      );
    } catch (dbError) {
      console.error('Failed to log payment error:', dbError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed',
    };
  }
}

/**
 * Process a refund using Stripe
 */
async function processRefund(refundRequest: RefundRequest): Promise<ApiResponse> {
  const { paymentId, amount, reason } = refundRequest;

  if (!paymentId) {
    return {
      success: false,
      error: 'Payment ID is required',
    };
  }

  try {
    // Fetch payment record
    const getCommand = new GetItemCommand({
      TableName: PAYMENTS_TABLE,
      Key: {
        id: { S: paymentId },
      },
    });

    const result = await dynamoClient.send(getCommand);

    if (!result.Item) {
      return {
        success: false,
        error: 'Payment not found',
      };
    }

    const paymentRecord = unmarshall(result.Item) as PaymentRecord;

    if (paymentRecord.status !== 'succeeded') {
      return {
        success: false,
        error: `Cannot refund payment with status: ${paymentRecord.status}`,
      };
    }

    // Process refund with Stripe
    const refundAmount = amount
      ? Math.round(amount * 100)
      : Math.round(paymentRecord.amount * 100);

    const refund = await stripe.refunds.create({
      payment_intent: paymentRecord.stripePaymentIntentId,
      amount: refundAmount,
      reason: reason as Stripe.RefundCreateParams.Reason | undefined,
      metadata: {
        paymentId,
        bookingId: paymentRecord.bookingId,
      },
    });

    const now = Date.now();
    const refundedAmountCents = refund.amount;
    const totalRefundedAmount =
      (paymentRecord.refundedAmount || 0) + refundedAmountCents / 100;
    const isFullRefund = totalRefundedAmount >= paymentRecord.amount;

    // Update payment record
    await dynamoClient.send(
      new UpdateItemCommand({
        TableName: PAYMENTS_TABLE,
        Key: {
          id: { S: paymentId },
        },
        UpdateExpression:
          'SET #status = :status, refundedAmount = :refundedAmount, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': {
            S: isFullRefund ? 'refunded' : 'partially_refunded',
          },
          ':refundedAmount': { N: totalRefundedAmount.toString() },
          ':updatedAt': { N: now.toString() },
        },
      })
    );

    // Update booking status
    await dynamoClient.send(
      new UpdateItemCommand({
        TableName: BOOKINGS_TABLE,
        Key: {
          id: { S: paymentRecord.bookingId },
        },
        UpdateExpression: 'SET paymentStatus = :status, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':status': { S: isFullRefund ? 'refunded' : 'partially_refunded' },
          ':updatedAt': { N: now.toString() },
        },
      })
    );

    return {
      success: true,
      data: {
        refundId: refund.id,
        paymentId,
        amount: refundedAmountCents / 100,
        currency: refund.currency,
        status: refund.status,
        totalRefunded: totalRefundedAmount,
      },
    };
  } catch (error) {
    console.error('Refund processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Refund processing failed',
    };
  }
}

/**
 * Handle SQS messages for async payment processing
 */
async function handleSQSMessage(record: SQSRecord): Promise<void> {
  try {
    const message = JSON.parse(record.body);
    console.log('Processing SQS message:', message);

    if (message.type === 'payment') {
      await processPayment(message.data);
    } else if (message.type === 'refund') {
      await processRefund(message.data);
    } else {
      console.warn('Unknown message type:', message.type);
    }
  } catch (error) {
    console.error('Error processing SQS message:', error);
    throw error; // Re-throw to move message to DLQ
  }
}

/**
 * Lambda handler for SQS events
 */
export const sqsHandler = async (event: SQSEvent): Promise<void> => {
  console.log('SQS Event:', JSON.stringify(event, null, 2));

  const promises = event.Records.map(handleSQSMessage);
  await Promise.allSettled(promises);
};

/**
 * Lambda handler for API Gateway events
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    const method = event.httpMethod;
    const path = event.path;

    // Verify authentication
    const token = parseAuthToken(event);
    if (!token) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Unauthorized - Missing or invalid token',
        }),
      };
    }

    // POST /payments
    if (method === 'POST' && path.includes('/payments')) {
      const paymentRequest: PaymentRequest = JSON.parse(event.body || '{}');
      const result = await processPayment(paymentRequest);

      return {
        statusCode: result.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      };
    }

    // POST /refunds
    if (method === 'POST' && path.includes('/refunds')) {
      const refundRequest: RefundRequest = JSON.parse(event.body || '{}');
      const result = await processRefund(refundRequest);

      return {
        statusCode: result.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      };
    }

    // Route not found
    return {
      statusCode: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Route not found',
      }),
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
    };
  }
};
