import { mockClient } from "aws-sdk-client-mock";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { handler } from "./index";

const sesMock = mockClient(SESClient);
const ddbMock = mockClient(DynamoDBClient);

describe("Notification Lambda", () => {
  beforeEach(() => {
    sesMock.reset();
    ddbMock.reset();
    process.env.FROM_EMAIL = "2505285@dundee.ac.uk";
    process.env.ADMIN_EMAIL = "2505285@dundee.ac.uk";
    process.env.BOOKINGS_TABLE = "BookingsTable";
  });

  test("handler (SNS Event): Should parse the SNS message and call SendEmailCommand with the correct Source", async () => {
    // Mock Booking Details
    ddbMock.on(GetItemCommand).resolves({
      Item: marshall({
        booking_id: "booking-123",
        user_id: "user-123",
        room_id: "room-1",
        start_time: "2023-10-27T10:00:00Z",
        end_time: "2023-10-27T12:00:00Z",
        total_price: 100,
        attendees: 5,
        booking_status: "confirmed",
      }),
    });

    // Mock SES Success
    sesMock.on(SendEmailCommand).resolves({
      MessageId: "msg-123",
    });

    const event = {
      Records: [
        {
          Sns: {
            Message: JSON.stringify({
              type: "booking_confirmation",
              bookingId: "booking-123",
              userId: "user-123",
              userEmail: "user@example.com",
            }),
          },
        },
      ],
    };

    await handler(event as any, {} as any);

    // Verify SES call
    expect(sesMock.commandCalls(SendEmailCommand).length).toBe(1);
    const sendEmailCall = sesMock.commandCalls(SendEmailCommand)[0];
    expect(sendEmailCall.args[0].input.Source).toBe("2505285@dundee.ac.uk");
    expect(sendEmailCall.args[0].input.Destination?.ToAddresses).toContain("user@example.com");
    expect(sendEmailCall.args[0].input.Message?.Subject?.Data).toContain("Booking Confirmed");
  });
});
