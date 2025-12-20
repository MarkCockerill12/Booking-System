export const handler = async () => {
  return {
    statusCode: 501,
    body: JSON.stringify({ message: "Use local mock service for development" }),
  }
}
