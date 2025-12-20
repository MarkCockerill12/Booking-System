export const handler = async () => {
  return {
    statusCode: 501,
    body: JSON.stringify({ message: "Use local Express server for development" }),
  }
}
