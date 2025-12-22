import { handler } from "./index";

describe("Weather Lambda", () => {
  test("GET /weather: Should return a JSON body with a random temperature", async () => {
    const event = {
      httpMethod: "GET",
      queryStringParameters: {
        location: "Dundee",
        date: "2023-10-27",
      },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.success).toBe(true);
    expect(body.data.weather.temperature).toBeDefined();
    expect(typeof body.data.weather.temperature).toBe("number");
    expect(body.data.weather.location).toBe("Dundee");
  });

  test("GET /weather: Should return 400 if location is missing", async () => {
    const event = {
      httpMethod: "GET",
      queryStringParameters: {
        // location missing
        date: "2023-10-27",
      },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe("Missing required parameter: location");
  });
});
