"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { VistaLayout } from "@/components/vista-layout"
import { AeroIconButton } from "@/components/aero-icon-button"
import { AeroButton } from "@/components/aero-button"
import { MapPin, Users, Calendar, ThermometerSun } from "lucide-react"
import { vistaSlideIn } from "@/lib/anime-utils"
import { roomsAPI, bookingsAPI, weatherAPI, authAPI } from "@/lib/api"
import { toast } from "sonner"
import type { Room, WeatherData } from "@/lib"
import Image from "next/image"

export default function BookingPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const roomId = params.id as string
  const bookingDate = searchParams.get("date") || new Date().toISOString().split("T")[0]

  const [room, setRoom] = useState<Room | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [basePrice, setBasePrice] = useState(0)
  const [weatherSurcharge, setWeatherSurcharge] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)
  const [loading, setLoading] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current) {
      vistaSlideIn(contentRef.current, 100)
    }
    fetchRoomDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  const fetchRoomDetails = async () => {
    try {
      console.log("[v0] Fetching room details for:", roomId)
      const roomResponse = await roomsAPI.getById(roomId)
      if (roomResponse.success) {
        // Handle both direct object or { room: ... } structure
        const roomData = roomResponse.data.room || roomResponse.data
        setRoom(roomData)
        console.log("[v0] Room data loaded:", roomData)

        console.log("[v0] Fetching weather for location:", roomData.location, "on date:", bookingDate)
        const weatherResponse = await weatherAPI.getByLocation(roomData.location, bookingDate)
        if (weatherResponse.success) {
          // Handle both direct object or { weather: ... } structure
          const weatherData = weatherResponse.data?.weather || weatherResponse.data
          console.log("[v0] Weather data loaded:", weatherData)
          setWeather(weatherData)
          
          // Calculate price once both room and weather are loaded
          calculatePriceOnce(roomData, weatherData)
        }
      }
    } catch (error: any) {
      console.error("[v0] Error fetching room details:", error)
      toast.error("Failed to load room details")
    } finally {
      setLoading(false)
    }
  }

  const calculatePriceOnce = (roomData: Room, weatherData: WeatherData) => {
    // Full day booking (8 hours standard work day)
    const hoursPerDay = 8
    const base = roomData.pricePerHour * hoursPerDay
    setBasePrice(base)

    // Calculate weather surcharge based on optimal 21°C
    const surcharge = calculateWeatherSurcharge(base, weatherData.temperature)
    setWeatherSurcharge(surcharge)

    const total = base + surcharge
    setTotalPrice(Math.round(total * 100) / 100)

    console.log("[v0] Price calculated - Base:", base, "Surcharge:", surcharge, "Total:", total)
  }

  const calculateWeatherSurcharge = (basePrice: number, temperature: number): number => {
    // Optimal temperature is 21°C (from report)
    const optimalTemp = 21
    const diff = Math.abs(temperature - optimalTemp)

    if (diff <= 2) return 0
    if (diff <= 5) return basePrice * 0.1 // 10% surcharge
    if (diff <= 10) return basePrice * 0.2 // 20% surcharge
    return basePrice * 0.3 // 30% surcharge
  }

  const getSurchargePercentage = (temperature: number): number => {
    const optimalTemp = 21
    const diff = Math.abs(temperature - optimalTemp)

    if (diff <= 2) return 0
    if (diff <= 5) return 10
    if (diff <= 10) return 20
    return 30
  }

  const handleBookRoom = async () => {
    if (!room) return

    try {
      const startDateTime = `${bookingDate}T09:00:00.000Z`
      const endDateTime = `${bookingDate}T17:00:00.000Z`

      console.log("[v0] Creating booking:", {
        roomId,
        startDateTime,
        endDateTime,
        totalPrice,
      })

      const response = await bookingsAPI.create(roomId, startDateTime, endDateTime)

      if (response.success) {
        toast.success("Booking successful! Confirmation sent.")
        router.push("/search")
      }
    } catch (error: any) {
      console.error("[v0] Booking error:", error)
      toast.error(error.message || "Booking failed. Please try again.")
    }

    /* PRODUCTION STRIPE PAYMENT CODE (COMMENTED OUT)
    import { loadStripe } from '@stripe/stripe-js'
    
    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
    
    // Create payment intent on backend
    const paymentResponse = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        amount: totalPrice * 100,  // Convert to cents
        currency: 'gbp',
        bookingId: response.data.booking.id,
      }),
    })

    const { clientSecret } = await paymentResponse.json()

    // Confirm payment
    const { error } = await stripe!.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,  // Stripe card element
      },
    })

    if (error) {
      toast.error('Payment failed: ' + error.message)
    } else {
      toast.success('Payment successful! Booking confirmed.')
      router.push('/search')
    }
    */
  }

  if (loading || !room) {
    return (
      <VistaLayout>
        <div className="vista-glass-dark text-center">
          {/* Navigation Bar - Integrated */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/20">
            <div>
              <AeroIconButton icon="arrow" title="Back" onClick={() => router.back()} />
            </div>
            <div className="flex gap-4">
              <AeroIconButton icon="mail" title="Contact" />
              <AeroIconButton icon="user" title="Account / Logout" onClick={async () => {
                try {
                  await authAPI.logout()
                  toast.success("Logged out successfully")
                  router.push("/")
                } catch (error) {
                  toast.error("Logout failed")
                }
              }} />
            </div>
          </div>
          <div className="p-12 md:p-16">
            <div className="inline-block vista-float-slow">
              <Image src="/images/image-204.png" alt="Loading" width={80} height={80} className="drop-shadow-2xl" unoptimized />
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-800 mt-6">Loading room details...</p>
          </div>
        </div>
      </VistaLayout>
    )
  }

  return (
    <VistaLayout>
      <div ref={contentRef} className="max-w-6xl mx-auto">
        <div className="vista-glass-dark">
          {/* Navigation Bar - Integrated */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/20">
            <div>
              <AeroIconButton icon="arrow" title="Back" onClick={() => router.back()} />
            </div>
            <div className="flex gap-4">
              <AeroIconButton icon="mail" title="Contact" />
              <AeroIconButton icon="user" title="Account / Logout" onClick={async () => {
                try {
                  await authAPI.logout()
                  toast.success("Logged out successfully")
                  router.push("/")
                } catch (error) {
                  toast.error("Logout failed")
                }
              }} />
            </div>
          </div>
          
          {/* Main Content */}
          <div className="p-6 md:p-10">
            <div className="w-full h-60 md:h-80 bg-gradient-to-br from-blue-400 via-cyan-300 to-green-400 rounded-2xl mb-8 relative overflow-hidden shadow-2xl">
              <img
                src={room.imageUrl || "/placeholder.svg?height=320&width=1000"}
                alt={room.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement
                  if (!img.dataset.fallback) {
                    img.dataset.fallback = "true"
                    img.src = "/images/globe-people.png"
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>

            <div className="grid md:grid-cols-2 gap-8 md:gap-10 mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-green-600 bg-clip-text text-transparent mb-6 drop-shadow-sm">
                  {room.name}
                </h1>
                <p className="text-gray-800 text-base md:text-lg mb-6 leading-relaxed">{room.description}</p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-4 text-gray-900 vista-glass p-4 rounded-xl shadow-lg border border-white/50">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <span className="font-bold block text-gray-600 text-sm">Capacity</span>
                      <span className="font-bold text-base md:text-lg">{room.capacity} people</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-gray-900 vista-glass p-4 rounded-xl shadow-lg border border-white/50">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg flex-shrink-0">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <span className="font-bold block text-gray-600 text-sm">Location</span>
                      <span className="font-bold text-base md:text-lg">{room.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-gray-900 vista-glass p-4 rounded-xl shadow-lg border border-white/50">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <span className="font-bold block text-gray-600 text-sm">Booking Date</span>
                      <span className="font-bold text-base md:text-lg">
                        {new Date(bookingDate).toLocaleDateString("en-GB", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {weather && (
                    <div className="flex items-center gap-4 text-gray-900 vista-glass p-4 rounded-xl shadow-lg border border-white/50">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg vista-float-slow flex-shrink-0">
                        <ThermometerSun className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <span className="font-bold block text-gray-600 text-sm">Forecasted Temperature</span>
                        <span className="font-bold text-base md:text-lg">{Math.round(weather.temperature)}°C</span>
                        <span className="text-sm text-gray-600 ml-2">({weather.condition})</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="vista-glass-dark p-6 md:p-8 rounded-2xl shadow-2xl border-2 border-white/30">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Booking Details</h3>
                  <div className="space-y-5">
                    <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                      <p className="text-sm font-bold text-blue-900 mb-1">Full Day Booking</p>
                      <p className="text-xs text-blue-700">9:00 AM - 5:00 PM (8 hours)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="vista-glass-dark p-6 md:p-8 rounded-2xl h-fit shadow-2xl border-2 border-white/30">
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-8 flex items-center gap-3">
                  💰 Pricing Breakdown
                </h2>

                <div className="space-y-6 mb-8">
                  {/* Base Price */}
                  <div className="vista-glass p-5 rounded-xl shadow-lg border border-blue-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-gray-700 text-sm">Base Rate</span>
                      <span className="font-bold text-blue-600">£{room.pricePerHour}/hour</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">8 hours (Full Day)</span>
                      <span className="font-bold text-gray-900 text-lg">£{basePrice.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Weather Surcharge */}
                  {weather && (
                    <div className="vista-glass p-5 rounded-xl shadow-lg border border-orange-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg flex-shrink-0">
                          <ThermometerSun className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="font-bold text-gray-700 text-sm block">Weather Adjustment</span>
                          <span className="text-xs text-gray-600">
                            Forecasted: {Math.round(weather.temperature)}°C (Optimal: 21°C)
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">
                          {getSurchargePercentage(weather.temperature)}% surcharge
                        </span>
                        <span className="font-bold text-orange-600 text-lg">
                          {weatherSurcharge > 0 ? "+" : ""}£{weatherSurcharge.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                        Additional heating/cooling costs for comfort
                      </p>
                    </div>
                  )}

                  {/* Total */}
                  <div className="pt-6 border-t-4 border-gradient-to-r from-green-400 to-blue-400">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xl md:text-2xl font-bold text-gray-900">Total Price:</span>
                      <span className="text-3xl md:text-4xl font-bold text-green-600">£{totalPrice.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      * Final price includes dynamic weather-based pricing to maintain optimal 21°C environment
                    </p>
                  </div>
                </div>

                <AeroButton variant="blue" size="lg" onClick={handleBookRoom} className="w-full">
                  Confirm Booking
                </AeroButton>
              </div>
            </div>

            {room.amenities && room.amenities.length > 0 && (
              <div className="vista-glass-dark p-6 md:p-8 rounded-2xl shadow-2xl border-2 border-white/30">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">✨ Amenities</h3>
                <div className="flex flex-wrap gap-3 md:gap-4">
                  {room.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="px-4 md:px-6 py-2 md:py-3 vista-glass rounded-full font-bold shadow-lg text-gray-900 border-2 border-white/40 hover:scale-105 transition-transform text-sm md:text-base"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </VistaLayout>
  )
}
