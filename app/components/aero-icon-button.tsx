"use client"

import Image from "next/image"

interface AeroIconButtonProps {
  icon: "user" | "mail" | "info" | "arrow"
  onClick?: () => void
  className?: string
  title?: string
}

const iconMap = {
  user: "/images/Aero Circle 9.png",
  mail: "/images/Aero Circle 10.png",
  info: "/images/image-204.png",
  arrow: "/images/Aero Circle 01.png",
}

export function AeroIconButton({ icon, onClick, className = "", title }: AeroIconButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        vista-icon 
        transition-transform 
        hover:scale-110 
        active:scale-95
        p-0 
        w-14 h-14 
        flex items-center justify-center
        ${className}
      `}
    >
      <Image
        src={iconMap[icon] || "/placeholder.svg"}
        alt={title || icon}
        width={56}
        height={56}
        className={`w-full h-full drop-shadow-lg ${icon === 'arrow' ? 'scale-x-[-1]' : ''}`}
        unoptimized
      />
    </button>
  )
}
