"use client"

import { useEffect, useState } from "react"
import { X, Calendar, Clock, MapPin, AlertCircle } from "lucide-react"
import { bookingsAPI } from "@/lib/api"
import { AeroButton } from "./aero-button"
import { AeroIconButton } from "./aero-icon-button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Booking {
  id: string
  roomName: string
  startTime: string
  endTime: string
  status: "confirmed" | "cancelled" | "PENDING"
  totalPrice: number
}

interface BookingSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function BookingSidebar({ isOpen, onClose }: BookingSidebarProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchBookings()
    }
  }, [isOpen])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const response = await bookingsAPI.getUserBookings()
      if (response.success) {
        // Handle both { bookings: [] } and direct array
        let list = response.data?.bookings || response.data || []
        if (!Array.isArray(list)) {
          list = []
        }
        setBookings(list)
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error)
      toast.error("Failed to load your bookings")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      const response = await bookingsAPI.updateStatus(id, "CANCELLED")
      if (response.success) {
        toast.success("Booking cancelled successfully")
        fetchBookings() // Refresh list
      }
    } catch (error) {
      console.error("Failed to cancel booking:", error)
      toast.error("Failed to cancel booking")
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full md:w-[400px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl z-50 transition-transform duration-300 ease-out border-l border-white/20",
          isOpen ? "translate-x-0" : "translate-x-full invisible"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-purple-600/10">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent pb-1">
              My Bookings
            </h2>
            <AeroIconButton icon="x" onClick={onClose} title="Close" />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center text-slate-900 py-10">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50 text-slate-900" />
                <p className="font-medium">No bookings found.</p>
              </div>
            ) : (
              <>
                {/* Upcoming Bookings Section */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Upcoming Bookings
                  </h3>
                  <div className="space-y-4">
                    {bookings
                      .filter(b => ['confirmed', 'pending'].includes(b.status.toLowerCase()))
                      .length === 0 ? (
                        <p className="text-sm text-slate-500 italic">No upcoming bookings</p>
                      ) : (
                        bookings
                          .filter(b => ['confirmed', 'pending'].includes(b.status.toLowerCase()))
                          .map((booking) => (
                            <BookingCard key={booking.id} booking={booking} onCancel={handleCancel} />
                          ))
                      )}
                  </div>
                </div>

                {/* Past / Other Bookings Section */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-t border-white/10 pt-4">
                    <Clock className="w-5 h-5 text-slate-500" />
                    Past & Cancelled
                  </h3>
                  <div className="space-y-4">
                    {bookings
                      .filter(b => !['confirmed', 'pending'].includes(b.status.toLowerCase()))
                      .length === 0 ? (
                        <p className="text-sm text-slate-500 italic">No past bookings</p>
                      ) : (
                        bookings
                          .filter(b => !['confirmed', 'pending'].includes(b.status.toLowerCase()))
                          .map((booking) => (
                            <BookingCard key={booking.id} booking={booking} onCancel={handleCancel} />
                          ))
                      )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel: (id: string) => void }) {
  return (
    <div
      className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-white/20 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{booking.roomName || "Conference Room"}</h3>
        <span
          className={cn(
            "px-2 py-1 rounded-full text-xs font-bold",
            booking.status.toLowerCase() === "confirmed"
              ? "bg-green-100 text-green-800"
              : booking.status.toLowerCase() === "cancelled"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          )}
        >
          {booking.status.toUpperCase()}
        </span>
      </div>

      <div className="space-y-2 text-sm text-slate-900 dark:text-white mb-4 font-medium">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{new Date(booking.startTime).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>
            {new Date(booking.startTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" - "}
            {new Date(booking.endTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <span>Total: ${booking.totalPrice?.toFixed(2)}</span>
        </div>
      </div>

      {booking.status.toLowerCase() !== "cancelled" && (
        <AeroButton
          className="w-full bg-red-500 text-white hover:bg-red-600"
          onClick={() => onCancel(booking.id)}
        >
          Cancel Booking
        </AeroButton>
      )}
    </div>
  )
}

