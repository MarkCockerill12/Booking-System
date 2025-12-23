"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { VistaLayout } from "@/components/vista-layout"
import { AeroButton } from "@/components/aero-button"
import { vistaSlideIn } from "@/lib/anime-utils"
import { authAPI } from "@/lib/api"
import { toast } from "sonner"
import Image from "next/image"

export default function AuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (formRef.current) {
      vistaSlideIn(formRef.current, 100)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isLogin) {
        const response = await authAPI.login(email, password)
        if (response.data?.token) {
          localStorage.setItem("token", response.data.token)
        }
        toast.success("Logged in successfully!")
        router.push("/search")
      } else {
        const response = await authAPI.signup(email, password, name)
        if (response.data?.token) {
          localStorage.setItem("token", response.data.token)
        }
        toast.success("Account created successfully!")
        router.push("/search")
      }
    } catch (error: unknown) {
      console.error("Auth error:", error)
      const errorMessage = error instanceof Error ? error.message : "Authentication failed"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }

    /* PRODUCTION AWS COGNITO CODE (COMMENTED OUT)
    import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js'
    
    const poolData = {
      UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    }
    const userPool = new CognitoUserPool(poolData)

    if (isLogin) {
      const authDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      })
      
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      })

      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (result) => {
          const token = result.getIdToken().getJwtToken()
          localStorage.setItem('token', token)
          router.push('/search')
        },
        onFailure: (err) => {
          console.error('Cognito login error:', err)
          toast.error('Login failed')
        },
      })
    } else {
      userPool.signUp(email, password, [], [], (err, result) => {
        if (err) {
          console.error('Cognito signup error:', err)
          toast.error('Signup failed')
          return
        }
        toast.success('Account created! Please verify your email and log in.')
        setIsLogin(true)
      })
    }
    */
  }

  return (
    <VistaLayout>
      <div className="flex items-center justify-center min-h-[80vh]">
        <div ref={formRef} className="vista-glass-dark p-4 md:p-6 max-w-lg w-full opacity-0">
          {/* Header with icon */}
          <div className="text-center mb-2">
            <div className="inline-block mb-2 vista-float-slow">
              <Image
                src="/images/Aero Circle 9.png"
                alt="User Account"
                width={200}
                height={200}
                className="drop-shadow-2xl"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent pb-2">
              {isLogin ? "Log In" : "Sign Up"}
            </h1>
          </div>

          {/* Dev Mode Quick Login */}
          {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
            <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
              <p className="text-sm font-bold text-yellow-800 mb-2">🚀 Development Mode</p>
              <AeroButton
                variant="blue"
                size="md"
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900"
                onClick={() => {
                  // Set dev mode in localStorage for client-side checks
                  localStorage.setItem('DEV_MODE', 'true');
                  localStorage.setItem('authToken', 'dev-mode-token-12345');
                  // Set dev mode cookie for server-side API routes
                  document.cookie = 'dev-mode=true; path=/; max-age=86400'; // 24 hours
                  toast.success('Dev mode activated!');
                  router.push('/search');
                }}
              >
                Quick Dev Login (Skip Auth)
              </AeroButton>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="vista-input w-full text-gray-800 font-medium"
                  placeholder="John Doe"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="vista-input w-full text-gray-800 font-medium"
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="vista-input w-full text-gray-800 font-medium"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="pt-2">
              <AeroButton type="submit" variant="blue" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? "Loading..." : isLogin ? "Log In" : "Sign Up"}
              </AeroButton>
            </div>
          </form>

          {/* Toggle */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:text-blue-700 font-bold text-base hover:underline transition-all"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
          </div>
        </div>
      </div>
    </VistaLayout>
  )
}
