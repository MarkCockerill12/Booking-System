"use client"

import Link from "next/link"
import Image from "next/image"

export function VistaNav() {
  return (
    <nav className="absolute top-6 right-6 z-50 flex gap-4">
      <Link
        href="/auth"
        className="vista-icon transition-transform hover:scale-110 p-0 w-14 h-14 flex items-center justify-center"
        title="Sign In / Sign Up"
      >
        <Image src="/images/Aero Circle 9.png" alt="User Account" width={56} height={56} unoptimized />
      </Link>
      <button
        className="vista-icon transition-transform hover:scale-110 p-0 w-14 h-14 flex items-center justify-center"
        title="Contact"
      >
        <Image src="/images/aero-20circle-2010.png" alt="Contact" width={56} height={56} unoptimized />
      </button>
    </nav>
  )
}
