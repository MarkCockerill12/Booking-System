import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { handler } from "./index";

const ddbMock = mockClient(DynamoDBDocumentClient);
const sqsMock = mockClient(SQSClient);
const lambdaMock = mockClient(LambdaClient);

describe("Booking Lambda", () => {
  beforeEach(() => {
    ddbMock.reset();
    sqsMock.reset();
    lambdaMock.reset();
    process.env.BOOKINGS_TABLE = "BookingsTable";
    process.env.ROOMS_TABLE = "RoomsTable";
    process.env.PRICING_RULES_TABLE = "PricingRulesTable";
    process.env.PAYMENT_QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/123456789012/PaymentQueue";
    process.env.WEATHER_FUNCTION_NAME = "WeatherFunction";
  });

  test("POST /bookings: Should check availability, calculate price, save booking, and send SQS message", async () => {
    // Mock availability check (QueryCommand returns empty items -> available)
    ddbMock.on(QueryCommand).resolves({
      Items: [],
    });

    // Mock GetCommand for room details
    ddbMock.on(GetCommand).resolves({
      Item: {
        room_id: "room-1",
        name: "Room A",
        pricePerHour: 50,
        location: "NYC",
      },
    });

    // Mock Weather Lambda invocation
    lambdaMock.on(InvokeCommand).resolves({
      Payload: new TextEncoder().encode(JSON.stringify({
        body: JSON.stringify({ temperature: 25 })
      })) as any,
    });

    // Mock Pricing Rules Scan
    ddbMock.on(ScanCommand).resolves({
      Items: [],
    });

    // Mock saving booking
    ddbMock.on(PutCommand).resolves({});

    // Mock SQS message
    sqsMock.on(SendMessageCommand).resolves({
      MessageId: "msg-id",
    });

    const event = {
      httpMethod: "POST",
      path: "/bookings",
      body: JSON.stringify({
        roomId: "room-1",
        date: "2023-10-27",
        startTime: "10:00",
        endTime: "12:00",
        attendees: 5,
        paymentMethodId: "pm_123",
      }),
      requestContext: {
        authorizer: {
          claims: {
            sub: "user-123",
            email: "test@example.com",
          },
        },
      },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(true);
    expect(body.data.booking.booking_id).toBeDefined();
    
    // Verify calls
    expect(ddbMock.commandCalls(QueryCommand).length).toBeGreaterThan(0); // Availability check
    expect(ddbMock.commandCalls(PutCommand).length).toBe(1); // Save booking
    expect(sqsMock.commandCalls(SendMessageCommand).length).toBe(1); // Send to payment queue
  });

  test("GET /bookings: Should return a list of bookings", async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: [
        { booking_id: "booking-1", room_id: "room-1", user_id: "user-123", booking_status: "CONFIRMED", start_time: "10:00", end_time: "11:00", total_price: 50, created_at: "2023-10-27" },
        { booking_id: "booking-2", room_id: "room-2", user_id: "user-123", booking_status: "PENDING", start_time: "12:00", end_time: "13:00", total_price: 60, created_at: "2023-10-27" },
      ],
    });

    const event = {
      httpMethod: "GET",
      path: "/bookings",
      requestContext: {
        authorizer: {
          claims: {
            sub: "user-123",
          },
        },
      },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(true);
    expect(body.data.bookings.length).toBe(2);
  });
});
