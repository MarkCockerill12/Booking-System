"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { VistaLayout } from "@/components/vista-layout"
import { AeroButton } from "@/components/aero-button"
import { AeroIconButton } from "@/components/aero-icon-button"
import { vistaSlideIn, vistaFloatLoop } from "@/lib/anime-utils"
import Image from "next/image"

export default function LandingPage() {
  const router = useRouter()
  const titleRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (titleRef.current) {
      vistaSlideIn(titleRef.current, 200)
    }
    if (globeRef.current) {
      vistaFloatLoop(globeRef.current)
    }
  }, [])

  return (
    <VistaLayout>
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="vista-glass-dark p-12 md:p-16 max-w-4xl w-full relative overflow-visible">
          <div className="absolute top-6 left-6">
            <AeroIconButton icon="info" title="Information" />
          </div>

          {/* Title */}
          <div ref={titleRef} className="text-center mb-12 opacity-0">
            <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
              <div className="w-16 h-16 flex-shrink-0">
                <Image
                  src="/calendar-icon-blue.jpg"
                  alt="Calendar"
                  width={64}
                  height={64}
                  unoptimized
                  className="drop-shadow-lg w-full h-full"
                />
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-teal-500 to-green-500">
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

              <AeroButton variant="green" size="lg" onClick={() => router.push("/search")}>
                Get Started
              </AeroButton>
            </div>
          </div>
        </div>
      </div>
    </VistaLayout>
  )
}
