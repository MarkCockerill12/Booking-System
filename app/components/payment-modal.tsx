"use client"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { AeroButton } from "./aero-button"
import { X } from "lucide-react"
import { toast } from "sonner"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const CARD_STYLE = {
  style: {
    base: { color: "#32325d", fontFamily: 'sans-serif', fontSize: "16px", "::placeholder": { color: "#aab7c4" } },
    invalid: { color: "#fa755a", iconColor: "#fa755a" },
  },
}

const PaymentForm = ({ amount, onSuccess, onCancel }: { amount: number, onSuccess: (id: string) => void, onCancel: () => void }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!stripe || !elements) return
    setProcessing(true)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) return

    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({ type: "card", card: cardElement })
      if (error) {
        toast.error(error.message || "Payment failed")
        setProcessing(false)
      } else {
        onSuccess(paymentMethod.id)
      }
    } catch (err) {
      console.error("Payment error:", err)
      toast.error("An unexpected error occurred")
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-xl bg-white shadow-inner">
        <CardElement options={CARD_STYLE} />
      </div>
      <div className="flex gap-3 justify-end">
        <AeroButton type="button" variant="secondary" size="sm" onClick={onCancel} disabled={processing}>Cancel</AeroButton>
        <AeroButton type="submit" variant="blue" size="sm" disabled={!stripe || processing}>
          {processing ? "Processing..." : `Pay £${amount.toFixed(2)}`}
        </AeroButton>
      </div>
    </form>
  )
}

export function PaymentModal({ isOpen, onClose, amount, onPaymentSuccess }: { isOpen: boolean, onClose: () => void, amount: number, onPaymentSuccess: (id: string) => void }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-6 bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Secure Payment</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X className="w-6 h-6 text-gray-500" /></button>
        </div>
        <p className="text-gray-600 mb-6">Complete your booking for <strong>£{amount.toFixed(2)}</strong></p>
        <Elements stripe={stripePromise}>
          <PaymentForm amount={amount} onSuccess={onPaymentSuccess} onCancel={onClose} />
        </Elements>
      </div>
    </div>
  )
}
