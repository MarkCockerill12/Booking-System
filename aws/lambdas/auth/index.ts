import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  GetUserCommand,
  GlobalSignOutCommand,
} from "@aws-sdk/client-cognito-identity-provider"

const getClientConfig = () => {
  const isLocal = process.env.AWS_SAM_LOCAL === 'true';
  const endpoint = process.env.AWS_ENDPOINT || (isLocal ? 'http://localstack:4566' : undefined);

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

const cognito = new CognitoIdentityProviderClient(getClientConfig())
const CLIENT_ID = process.env.COGNITO_CLIENT_ID!
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!

interface AuthEvent {
  httpMethod: string
  path: string
  body: string | null
  headers: Record<string, string>
}

export const handler = async (event: AuthEvent) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  }

  try {
    const path = event.path
    const method = event.httpMethod

    // Handle OPTIONS for CORS
    if (method === "OPTIONS") {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: "",
      }
    }

    const body = event.body ? JSON.parse(event.body) : {}

    // POST /auth/signup
    if (path.includes("/signup") && method === "POST") {
      const { email, password, name } = body

      if (!email || !password || !name) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: "Missing required fields" }),
        }
      }

      const command = new SignUpCommand({
        ClientId: CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "name", Value: name },
        ],
      })

      const result = await cognito.send(command)

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          data: {
            userId: result.UserSub,
            email,
            name,
          },
        }),
      }
    }

    // POST /auth/login
    if (path.includes("/login") && method === "POST") {
      const { email, password } = body

      if (!email || !password) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: "Missing email or password" }),
        }
      }

      const command = new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      })

      const result = await cognito.send(command)

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          data: {
            token: result.AuthenticationResult?.IdToken,
            accessToken: result.AuthenticationResult?.AccessToken,
            refreshToken: result.AuthenticationResult?.RefreshToken,
          },
        }),
      }
    }

    // GET /auth/me
    if (path.includes("/me") && method === "GET") {
      const accessToken = event.headers.Authorization?.replace("Bearer ", "")

      if (!accessToken) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: "Not authenticated" }),
        }
      }

      const command = new GetUserCommand({
        AccessToken: accessToken,
      })

      const result = await cognito.send(command)

      const user = {
        id: result.Username,
        email: result.UserAttributes?.find((attr) => attr.Name === "email")?.Value,
        name: result.UserAttributes?.find((attr) => attr.Name === "name")?.Value,
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          data: { user },
        }),
      }
    }

    // POST /auth/logout
    if (path.includes("/logout") && method === "POST") {
      const accessToken = event.headers.Authorization?.replace("Bearer ", "")

      if (accessToken) {
        const command = new GlobalSignOutCommand({
          AccessToken: accessToken,
        })

        await cognito.send(command)
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true }),
      }
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: "Not found" }),
    }
  } catch (error: any) {
    console.error("Auth Lambda error:", error)
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: error.message || "Internal server error" }),
    }
  }
}
