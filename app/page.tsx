"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { VistaLayout } from "@/components/vista-layout"
import { AeroButton } from "@/components/aero-button"
import { AeroIconButton } from "@/components/aero-icon-button"
import { vistaSlideIn, vistaFloatLoop } from "@/lib/anime-utils"
import { Calendar } from "lucide-react"
import Image from "next/image"

export default function LandingPage() {
  const router = useRouter()
  const titleRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<HTMLDivElement>(null)
  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    if (titleRef.current) {
      vistaSlideIn(titleRef.current, 200)
    }
    if (globeRef.current) {
      vistaFloatLoop(globeRef.current)
    }
  }, [router])

  return (
    <VistaLayout>
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={() => setShowInfo(false)}>
          <div className="vista-glass-dark p-8 max-w-md w-full relative animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">About Vista Booking</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Welcome to the future of workspace management. Experience seamless global conference room booking with our Frutiger Aero inspired interface.
            </p>
            <div className="flex justify-end">
              <AeroButton onClick={() => setShowInfo(false)} size="sm">Close</AeroButton>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="vista-glass-dark p-12 md:p-16 max-w-4xl w-full relative overflow-visible">
          <div className="absolute top-6 left-6 scale-75 origin-top-left">
            <AeroIconButton 
              icon="info" 
              title="Information" 
              onClick={() => setShowInfo(true)} 
              className="hover:scale-105 hover:brightness-90 transition-all duration-300"
            />
          </div>

          {/* Title */}
          <div ref={titleRef} className="text-center mb-12 opacity-0">
            <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
              <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-white rounded-full shadow-lg">
                <Calendar className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-teal-500 to-green-500 pb-2">
                Booking System
              </h1>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div ref={globeRef} className="flex-shrink-0 vista-float-slow">
              <div className="relative w-48 h-48 md:w-56 md:h-56 drop-shadow-2xl">
                <Image
                  src="/images/globe-people.png"
                  alt="Global Conference Booking"
                  width={224}
                  height={224}
                  className="w-full h-full"
                  priority
                />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <p className="text-2xl md:text-3xl text-gray-800 font-medium mb-10 leading-relaxed drop-shadow-sm">
                Join our worldwide conference room booking system
              </p>

              <AeroButton variant="green" size="lg" onClick={() => router.push("/auth")}>
                Get Started
              </AeroButton>
            </div>
          </div>
        </div>
      </div>
    </VistaLayout>
  )
}
