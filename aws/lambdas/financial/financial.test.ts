import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBClient, PutItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Stripe from "stripe";

const mockPaymentIntentsCreate = jest.fn();

// Mock Stripe
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: mockPaymentIntentsCreate,
    },
  }));
});

import { sqsHandler } from "./index";

const ddbMock = mockClient(DynamoDBClient);
const snsMock = mockClient(SNSClient);

describe("Financial Lambda (SQS Handler)", () => {
  beforeEach(() => {
    ddbMock.reset();
    snsMock.reset();
    mockPaymentIntentsCreate.mockReset();
    process.env.PAYMENTS_TABLE = "PaymentsTable";
    process.env.BOOKINGS_TABLE = "BookingsTable";
    process.env.NOTIFICATION_TOPIC_ARN = "arn:aws:sns:us-east-1:123456789012:NotificationTopic";
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
  });

  test("processPayment: Should call stripe.paymentIntents.create and update DynamoDB to 'paid'", async () => {
    // Mock Stripe success
    mockPaymentIntentsCreate.mockResolvedValue({
      id: "pi_123",
      status: "succeeded",
      latest_charge: "ch_123",
    });

    // Mock DynamoDB success
    ddbMock.on(PutItemCommand).resolves({});
    ddbMock.on(UpdateItemCommand).resolves({});

    // Mock SNS success
    snsMock.on(PublishCommand).resolves({ MessageId: "msg-123" });

    const event = {
      Records: [
        {
          body: JSON.stringify({
            type: "payment",
            data: {
              bookingId: "booking-123",
              amount: 100,
              currency: "usd",
              paymentMethodId: "pm_123",
              userId: "user-123",
              userEmail: "test@example.com",
            },
          }),
        },
      ],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await sqsHandler(event as any);

    // Verify Stripe call
    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(expect.objectContaining({
      amount: 10000, // 100 * 100
      currency: "usd",
      payment_method: "pm_123",
      confirm: true,
    }));

    // Verify DynamoDB calls
    expect(ddbMock.commandCalls(PutItemCommand).length).toBe(1); // Save payment record
    expect(ddbMock.commandCalls(UpdateItemCommand).length).toBe(1); // Update booking status

    // Verify UpdateItemCommand arguments
    const updateCall = ddbMock.commandCalls(UpdateItemCommand)[0];
    expect(updateCall.args[0].input.TableName).toBe("bookings");
    expect(updateCall.args[0].input.Key).toEqual({ booking_id: { S: "booking-123" } });
    expect(updateCall.args[0].input.ExpressionAttributeValues?.[":status"].S).toBe("CONFIRMED");
  });
});
