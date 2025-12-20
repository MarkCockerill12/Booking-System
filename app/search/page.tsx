"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { VistaLayout } from "@/components/vista-layout"
import { Filter, MapPin, Users, Calendar } from "lucide-react"
import { vistaSlideIn } from "@/lib/anime-utils"
import { AeroIconButton } from "@/components/aero-icon-button"
import { authAPI, roomsAPI } from "@/lib/api"
import { toast } from "sonner"
import type { Room } from "@/lib"
import Image from "next/image"

import { AeroButton } from "@/components/aero-button"

export default function SearchPage() {
  const router = useRouter()
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [capacityFilter, setCapacityFilter] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(true)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (headerRef.current) {
      vistaSlideIn(headerRef.current, 0)
    }
    fetchRooms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchRooms = async () => {
    try {
      const response = await roomsAPI.getAll()
      if (response.success) {
        setFilteredRooms(response.data.rooms)
      }
    } catch (error: any) {
      console.error("Error fetching rooms:", error)
      toast.error("Failed to load rooms")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    try {
      const filters: any = {}
      if (capacityFilter) filters.capacity = Number.parseInt(capacityFilter)
      if (locationFilter) filters.location = locationFilter
      filters.available = true

      const response = await roomsAPI.getAll(filters)
      if (response.success) {
        setFilteredRooms(response.data.rooms)
        toast.success(`Found ${response.data.rooms.length} room(s)`)
      }
    } catch (error) {
      console.error("Search error:", error)
      toast.error("Search failed")
    }
  }

  const handleRoomClick = (roomId: string) => {
    router.push(`/booking/${roomId}?date=${dateFilter}`)
  }

  return (
    <VistaLayout>
      <div ref={headerRef} className="vista-glass-dark opacity-0">
        {/* Navigation Bar - Integrated */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20">
          <div>
            <AeroIconButton icon="arrow" title="Back" onClick={() => router.push("/")} />
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
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-10">
            <div className="vista-float-slow drop-shadow-2xl flex-shrink-0">
              <Image
                src="/images/globesearch.png"
                alt="Search Rooms"
                width={120}
                height={120}
                className="drop-shadow-2xl w-32 h-32 md:w-36 md:h-36"
                unoptimized
              />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-green-500 bg-clip-text text-transparent drop-shadow-sm mb-2">
                Search for Rooms
              </h1>
              <p className="text-gray-700 text-base md:text-lg font-medium">
                Find the perfect conference room for your needs
              </p>
            </div>
          </div>

          <div className="vista-glass-dark p-4 md:p-6 rounded-2xl shadow-2xl mb-10 border-2 border-white/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <Filter className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-xl md:text-2xl">Filter Rooms</span>
            </div>

            <div className="flex flex-wrap gap-3 md:gap-4 mb-6">
              <div className="flex items-center gap-3 vista-glass py-3 md:py-4 px-4 md:px-5 rounded-xl shadow-lg border border-white/40">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <input
                  type="number"
                  placeholder="Capacity"
                  value={capacityFilter}
                  onChange={(e) => setCapacityFilter(e.target.value)}
                  className="bg-transparent outline-none w-20 md:w-28 text-gray-900 font-bold text-base md:text-lg placeholder:text-gray-500"
                  min="1"
                />
              </div>

              <div className="flex items-center gap-3 vista-glass py-3 md:py-4 px-4 md:px-5 rounded-xl shadow-lg border border-white/40">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <input
                  type="text"
                  placeholder="Location"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="bg-transparent outline-none w-32 md:w-40 text-gray-900 font-bold text-base md:text-lg placeholder:text-gray-500"
                />
              </div>

              <div className="flex items-center gap-3 vista-glass py-3 md:py-4 px-4 md:px-5 rounded-xl shadow-lg border border-white/40">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 font-semibold mb-1">Select Day</label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="bg-transparent outline-none text-gray-900 font-bold text-sm md:text-base"
                  />
                </div>
              </div>
            </div>

            <AeroButton variant="green" size="md" onClick={handleSearch}>
              Search Rooms
            </AeroButton>
          </div>

          {/* Room Cards */}
          {loading ? (
            <div className="vista-glass p-12 md:p-16 rounded-2xl text-center shadow-2xl">
              <div className="inline-block vista-float-slow mb-4">
                <Image src="/images/globesearch.png" alt="Loading" width={100} height={100} unoptimized />
              </div>
              <p className="text-gray-800 text-xl md:text-2xl font-bold">Searching for rooms...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="vista-glass p-12 md:p-16 rounded-2xl text-center shadow-2xl">
              <p className="text-gray-700 text-xl md:text-2xl font-bold">No rooms found matching your criteria.</p>
              <p className="text-gray-600 mt-2 text-base md:text-lg">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  className="vista-card p-6 md:p-7 cursor-pointer border-2 border-white/40 transition-transform hover:scale-105"
                  onClick={() => handleRoomClick(room.id)}
                >
                  <div className="w-full h-40 md:h-48 bg-gradient-to-br from-blue-400 via-cyan-300 to-green-400 rounded-xl mb-6 relative overflow-hidden shadow-xl">
                    <img
                      src={room.imageUrl || "/placeholder.svg?height=192&width=400"}
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
                    {/* Multi-layer glossy effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-gray-900 font-bold text-xl md:text-2xl mb-3">{room.name}</h3>

                    <div className="flex items-center gap-3 vista-glass p-3 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-xs text-gray-600 font-semibold block">Capacity</span>
                        <span className="font-bold text-gray-900 text-sm md:text-base">{room.capacity} people</span>
                      </div>
                    </div>

                    <p className="text-gray-700 text-sm leading-relaxed font-medium bg-white/40 p-3 rounded-lg">
                      {room.description}
                    </p>

                    <div className="flex items-center gap-2 text-gray-800 font-semibold text-sm md:text-base">
                      <MapPin className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="truncate">{room.location}</span>
                    </div>

                    <div className="pt-4 border-t-4 border-gradient-to-r from-blue-400 to-cyan-400 flex items-baseline gap-2">
                      <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                        £{room.pricePerHour}
                      </span>
                      <span className="text-sm text-gray-600 font-bold">/hour</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </VistaLayout>
  )
}
