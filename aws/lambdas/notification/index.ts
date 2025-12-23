import { SNSEvent, SNSEventRecord, Context } from 'aws-lambda';
import {
  SESClient,
  SendEmailCommand, 
} from '@aws-sdk/client-ses';
import {
  DynamoDBClient, 
  GetItemCommand, 
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const getClientConfig = () => {
  const isLocal = process.env.AWS_SAM_LOCAL === 'true';
  const endpoint = process.env.AWS_ENDPOINT || (isLocal ? 'http://localstack:4566' : undefined);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config: any = {
    region: process.env.AWS_REGION || "us-east-1",
    endpoint: endpoint,
  };
  
  if (endpoint) {
    config.credentials = {
      accessKeyId: 'test',
      secretAccessKey: 'test'
    };
  }
  
  return config;
};

const sesClient = new SESClient(getClientConfig());
const dynamoClient = new DynamoDBClient(getClientConfig());

const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE || 'notifications';
const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE || 'bookings';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const USERS_TABLE = process.env.USERS_TABLE || 'users';
const ROOMS_TABLE = process.env.ROOMS_TABLE || 'rooms';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@conferencerooms.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@conferencerooms.com';

interface NotificationPayload {
  type: 'booking_confirmation' | 'booking_cancellation' | 'booking_reminder' | 'payment_receipt';
  bookingId: string;
  userId: string;
  userEmail: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}

interface BookingDetails {
  id: string;
  userId: string;
  roomId: string;
  roomName?: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  attendees: number;
  purpose?: string;
  bookingStatus: string;
  paymentStatus?: string;
}

interface NotificationRecord {
  id: string;
  type: string;
  userId: string;
  email: string;
  bookingId: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt?: number;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}

/**
 * Fetch booking details from DynamoDB
 */
async function getBookingDetails(bookingId: string): Promise<BookingDetails | null> {
  try {
    const command = new GetItemCommand({
      TableName: BOOKINGS_TABLE,
      Key: {
        id: { S: bookingId },
      },
    });

    const result = await dynamoClient.send(command);

    if (!result.Item) {
      return null;
    }

    const booking = unmarshall(result.Item) as BookingDetails;

    // Fetch room details
    if (booking.roomId) {
      const roomCommand = new GetItemCommand({
        TableName: ROOMS_TABLE,
        Key: {
          id: { S: booking.roomId },
        },
      });

      const roomResult = await dynamoClient.send(roomCommand);
      if (roomResult.Item) {
        const room = unmarshall(roomResult.Item);
        booking.roomName = room.name;
      }
    }

    return booking;
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return null;
  }
}

/**
 * Format date for email display
 */
function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

/**
 * Generate booking confirmation email HTML
 */
function generateConfirmationEmail(booking: BookingDetails): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .label { font-weight: bold; color: #667eea; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Booking Confirmed!</h1>
    </div>
    <div class="content">
      <p>Your conference room has been successfully booked.</p>
      
      <div class="booking-details">
        <h2>Booking Details</h2>
        <div class="detail-row">
          <span class="label">Booking ID:</span>
          <span>${booking.id}</span>
        </div>
        <div class="detail-row">
          <span class="label">Room:</span>
          <span>${booking.roomName || 'Conference Room'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Start Time:</span>
          <span>${formatDateTime(booking.startTime)}</span>
        </div>
        <div class="detail-row">
          <span class="label">End Time:</span>
          <span>${formatDateTime(booking.endTime)}</span>
        </div>
        <div class="detail-row">
          <span class="label">Attendees:</span>
          <span>${booking.attendees} people</span>
        </div>
        ${booking.purpose ? `
        <div class="detail-row">
          <span class="label">Purpose:</span>
          <span>${booking.purpose}</span>
        </div>
        ` : ''}
        <div class="detail-row">
          <span class="label">Total Amount:</span>
          <span>$${booking.totalAmount.toFixed(2)}</span>
        </div>
        <div class="detail-row">
          <span class="label">Payment Status:</span>
          <span>${booking.paymentStatus || 'Pending'}</span>
        </div>
      </div>
      
      <p>We look forward to hosting your meeting!</p>
      
      <p style="color: #666; font-size: 14px;">
        Need to make changes? Contact us at ${ADMIN_EMAIL}
      </p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} Conference Room Booking System</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate cancellation email HTML
 */
function generateCancellationEmail(booking: BookingDetails): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .label { font-weight: bold; color: #dc3545; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Booking Cancelled</h1>
    </div>
    <div class="content">
      <p>Your conference room booking has been cancelled.</p>
      
      <div class="booking-details">
        <h2>Cancelled Booking Details</h2>
        <div class="detail-row">
          <span class="label">Booking ID:</span>
          <span>${booking.id}</span>
        </div>
        <div class="detail-row">
          <span class="label">Room:</span>
          <span>${booking.roomName || 'Conference Room'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Originally Scheduled:</span>
          <span>${formatDateTime(booking.startTime)}</span>
        </div>
        <div class="detail-row">
          <span class="label">Amount:</span>
          <span>$${booking.totalAmount.toFixed(2)}</span>
        </div>
      </div>
      
      <p>If you paid for this booking, a refund will be processed within 5-7 business days.</p>
      
      <p style="color: #666; font-size: 14px;">
        Questions? Contact us at ${ADMIN_EMAIL}
      </p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} Conference Room Booking System</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send email notification via SES
 */
async function sendEmailNotification(
  payload: NotificationPayload,
  booking: BookingDetails
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    let subject: string;
    let htmlBody: string;

    switch (payload.type) {
      case 'booking_confirmation':
        subject = `Booking Confirmed - ${booking.roomName || 'Conference Room'}`;
        htmlBody = generateConfirmationEmail(booking);
        break;

      case 'booking_cancellation':
        subject = `Booking Cancelled - ${booking.roomName || 'Conference Room'}`;
        htmlBody = generateCancellationEmail(booking);
        break;

      case 'booking_reminder':
        subject = `Reminder: Upcoming Booking - ${booking.roomName || 'Conference Room'}`;
        htmlBody = generateConfirmationEmail(booking);
        break;

      case 'payment_receipt':
        subject = `Payment Receipt - Booking ${booking.id}`;
        htmlBody = generateConfirmationEmail(booking);
        break;

      default:
        throw new Error(`Unknown notification type: ${payload.type}`);
    }

    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [payload.userEmail],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          Text: {
            Data: `Booking ${payload.type.replace('_', ' ')} for ${booking.roomName}. Booking ID: ${booking.id}`,
            Charset: 'UTF-8',
          },
        },
      },
    });

    const result = await sesClient.send(command);

    return {
      success: true,
      messageId: result.MessageId,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Save notification record to DynamoDB
 */
async function saveNotificationRecord(
  payload: NotificationPayload,
  status: 'sent' | 'failed',
  error?: string
): Promise<void> {
  try {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const record: NotificationRecord = {
      id: notificationId,
      type: payload.type,
      userId: payload.userId,
      email: payload.userEmail,
      bookingId: payload.bookingId,
      status,
      sentAt: Date.now(),
      error,
      metadata: payload.metadata,
    };

    await dynamoClient.send(
      new PutItemCommand({
        TableName: NOTIFICATIONS_TABLE,
        Item: marshall(record, { removeUndefinedValues: true }),
      })
    );
  } catch (error) {
    console.error('Error saving notification record:', error);
    // Don't throw - logging failure shouldn't break notification
  }
}

/**
 * Process a single SNS notification   
 */
async function processSNSRecord(record: SNSEventRecord): Promise<void> {
  try {
    const message = JSON.parse(record.Sns.Message);
    console.log('Processing notification:', message);

    const payload: NotificationPayload = message;

    // Validate payload
    if (!payload.bookingId || !payload.userId || !payload.userEmail || !payload.type) {
      throw new Error('Invalid notification payload');
    }

    // Fetch booking details
    const booking = await getBookingDetails(payload.bookingId);

    if (!booking) {
      throw new Error(`Booking not found: ${payload.bookingId}`);
    }

    // Send email
    const result = await sendEmailNotification(payload, booking);

    // Save notification record
    await saveNotificationRecord(
      payload,
      result.success ? 'sent' : 'failed',
      result.error
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to send notification');
    }

    console.log('Notification sent successfully:', result.messageId);
  } catch (error) {
    console.error('Error processing SNS record:', error);
    throw error; // Re-throw to trigger retry
  }
}

/**
 * Main Lambda handler for SNS events
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (event: SNSEvent, context: Context): Promise<void> => {
  console.log('SNS Event:', JSON.stringify(event, null, 2));

  const promises = event.Records.map(processSNSRecord);
  const results = await Promise.allSettled(promises);

  const failures = results.filter((r) => r.status === 'rejected');

  if (failures.length > 0) {
    console.error(`${failures.length} notifications failed to process`);
    failures.forEach((failure, index) => {
      if (failure.status === 'rejected') {
        console.error(`Failure ${index + 1}:`, failure.reason);
      }
    });
  }

  console.log(`Processed ${results.length} notifications: ${results.length - failures.length} succeeded, ${failures.length} failed`);
};
