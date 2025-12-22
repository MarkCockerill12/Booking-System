"use client"

import Image from "next/image"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface AeroIconButtonProps {
  icon: "user" | "mail" | "info" | "arrow" | "x" | "menu"
  onClick?: () => void
  className?: string
  title?: string
}

const iconMap = {
  user: "/images/Aero Circle 9.png",
  mail: "/images/Aero Circle 10.png",
  info: "/images/image 4.png",
  arrow: "/images/Aero Circle 01.png",
  x: "/images/Aero Circle 9.png",
  menu: "/images/Aero Circle 10.png",
}

export function AeroIconButton({ icon, onClick, className = "", title }: AeroIconButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "transition-transform hover:scale-105 active:scale-95 p-0 w-14 h-14 flex items-center justify-center",
        className
      )}
    >
      {icon === 'x' ? (
        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg border-2 border-white/50">
          <X className="w-6 h-6 text-slate-600" />
        </div>
      ) : (
        <Image
          src={iconMap[icon] || "/placeholder.svg"}
          alt={title || icon}
          width={56}
          height={56}
          className={`w-full h-full drop-shadow-lg scale-125 ${icon === 'arrow' ? '-scale-x-125' : ''}`}
          unoptimized
        />
      )}
    </button>
  )
}
