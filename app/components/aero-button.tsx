"use client"

import type React from "react"

import { useRef } from "react"
import { vistaButtonPress } from "@/lib/anime-utils"

interface AeroButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: "blue" | "green"
  size?: "sm" | "md" | "lg"
  className?: string
  type?: "button" | "submit"
  disabled?: boolean
}

export function AeroButton({
  children,
  onClick,
  variant = "blue",
  size = "md",
  className = "",
  type = "button",
  disabled = false,
}: AeroButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = () => {
    if (buttonRef.current && !disabled) {
      vistaButtonPress(buttonRef.current).finished.then(() => {
        onClick?.()
      })
    } else if (!disabled) {
      onClick?.()
    }
  }

  const sizeClasses = {
    sm: "h-12 px-8 text-lg",
    md: "h-16 px-12 text-xl",
    lg: "h-20 px-16 text-2xl",
  }

  const variantClasses = {
    blue: "from-blue-400 via-blue-500 to-blue-600 hover:from-blue-500 hover:via-blue-600 hover:to-blue-700 shadow-blue-400/50",
    green:
      "from-green-400 via-green-500 to-green-600 hover:from-green-500 hover:via-green-600 hover:to-green-700 shadow-green-400/50",
  }

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative group
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        bg-gradient-to-b
        rounded-full
        font-bold
        text-white
        transition-all duration-200
        shadow-2xl
        border-2 border-white/30
        disabled:opacity-50 disabled:cursor-not-allowed
        ${!disabled && "hover:scale-105 active:scale-95"}
        ${className}
      `}
    >
      {/* Top glossy overlay */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/50 via-white/20 to-transparent pointer-events-none" />

      {/* Bottom shadow overlay */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

      {/* Inner glow */}
      <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

      {/* Content */}
      <span className="relative z-10 drop-shadow-lg">{children}</span>
    </button>
  )
}
