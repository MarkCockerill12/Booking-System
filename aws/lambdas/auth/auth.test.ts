import { mockClient } from "aws-sdk-client-mock";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { handler } from "./index";

const cognitoMock = mockClient(CognitoIdentityProviderClient);

describe("Auth Lambda", () => {
  beforeEach(() => {
    cognitoMock.reset();
    process.env.COGNITO_CLIENT_ID = "test-client-id";
    process.env.COGNITO_USER_POOL_ID = "test-user-pool-id";
  });

  test("signup (POST): Should return 201 when Cognito succeeds", async () => {
    cognitoMock.on(SignUpCommand).resolves({
      UserSub: "test-user-sub",
    });

    const event = {
      httpMethod: "POST",
      path: "/auth/signup",
      body: JSON.stringify({
        email: "test@example.com",
        password: "Password123!",
        name: "Test User",
      }),
      headers: {},
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await handler(event as any);

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(true);
    expect(body.data.userId).toBe("test-user-sub");
  });

  test("login (POST): Should return 200 with tokens when auth succeeds", async () => {
    cognitoMock.on(InitiateAuthCommand).resolves({
      AuthenticationResult: {
        AccessToken: "access-token",
        IdToken: "id-token",
        RefreshToken: "refresh-token",
      },
    });

    const event = {
      httpMethod: "POST",
      path: "/auth/login",
      body: JSON.stringify({
        email: "test@example.com",
        password: "Password123!",
      }),
      headers: {},
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await handler(event as any);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBe("access-token");
  });

  test("invalid input (missing fields) returns 400", async () => {
    const event = {
      httpMethod: "POST",
      path: "/auth/signup",
      body: JSON.stringify({
        email: "test@example.com",
        // Missing password and name
      }),
      headers: {},
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await handler(event as any);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body as string);
    expect(body.success).toBe(false);
    expect(body.error).toBe("Missing required fields");
  });
});
