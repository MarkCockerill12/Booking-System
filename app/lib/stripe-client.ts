export const mockStripeClient = {
  createPaymentIntent: async (bookingId: string, amount: number) => {
    console.log("[v0] Mock payment intent created for booking:", bookingId, "Amount:", amount)
    return { clientSecret: "mock_secret" }
  },
  confirmPayment: async () => {
    console.log("[v0] Mock payment confirmed")
    return { success: true }
  },
}
