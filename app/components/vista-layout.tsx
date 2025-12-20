"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { vistaFadeIn } from "@/lib/anime-utils"

interface VistaLayoutProps {
  children: React.ReactNode
}

export function VistaLayout({ children }: VistaLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      vistaFadeIn(containerRef.current)
    }
  }, [])

  return (
    <>
      <div className="vista-lens-flare" />
      <div ref={containerRef} className="min-h-screen relative z-10 py-8 px-4">
        <div className="container mx-auto max-w-6xl">{children}</div>
      </div>
    </>
  )
}
