"use client"

import { AeroIconButton } from "./aero-icon-button"
import { useRouter } from "next/navigation"
import { authAPI } from "@/lib/api"
import { toast } from "sonner"

export function AuthenticatedNav() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await authAPI.logout()
      toast.success("Logged out successfully")
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Logout failed")
    }
  }

  return (
    <div className="relative">
      <div className="max-w-[90rem] mx-auto px-6">
        <div className="vista-glass-dark">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left side - Info button */}
            <div>
              <AeroIconButton icon="info" title="Information" onClick={() => router.push("/")} />
            </div>

            {/* Right side - Mail and User buttons */}
            <div className="flex gap-4">
              <AeroIconButton icon="mail" title="Contact" />
              <AeroIconButton icon="user" title="Account / Logout" onClick={handleLogout} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
