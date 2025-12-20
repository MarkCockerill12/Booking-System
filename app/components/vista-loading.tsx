"use client"

import { useEffect, useRef } from "react"
import anime from "animejs"

export function VistaLoading() {
  const dotsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (dotsRef.current) {
      anime({
        targets: dotsRef.current.children,
        translateY: [-20, 0],
        opacity: [0, 1, 0],
        duration: 1000,
        delay: anime.stagger(200),
        loop: true,
        easing: "easeInOutSine",
      })
    }
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="vista-glass-dark p-12 rounded-2xl">
        <div ref={dotsRef} className="flex gap-4">
          <div className="w-4 h-4 rounded-full bg-blue-500" />
          <div className="w-4 h-4 rounded-full bg-green-500" />
          <div className="w-4 h-4 rounded-full bg-blue-500" />
        </div>
        <p className="mt-6 text-gray-700 font-semibold text-center">Loading...</p>
      </div>
    </div>
  )
}
