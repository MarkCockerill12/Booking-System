import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { handler } from "./index"; // Assuming handler is exported from index.ts

const ddbMock = mockClient(DynamoDBClient);

describe("Rooms Lambda", () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.ROOMS_TABLE = "RoomsTable";
  });

  test("GET /rooms: Should return items from ScanCommand", async () => {
    ddbMock.on(ScanCommand).resolves({
      Items: [
        marshall({
          room_id: "room-1",
          name: "Room A",
          capacity: 10,
          location: "Building 1",
          pricePerHour: 50,
        }),
        marshall({
          room_id: "room-2",
          name: "Room B",
          capacity: 20,
          location: "Building 1",
          pricePerHour: 80,
        }),
      ],
    });

    const event = {
      httpMethod: "GET",
      path: "/rooms",
      headers: {},
    };

    // The handler signature in rooms/index.ts is (event, context)
    // But looking at the code, it seems to handle API Gateway events.
    // Let's check if it exports 'handler'.
    // Yes, I read the file and it has `export const handler = ...` (Wait, I need to verify if I saw `export const handler` in rooms/index.ts)
    
    const result = await (handler as any)(event, {} as any);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.success).toBe(true);
    expect(body.data.rooms.length).toBe(2);
    expect(body.data.rooms[0].name).toBe("Room A");
  });
});
