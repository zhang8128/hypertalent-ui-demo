"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { apiClient } from "@/services/api-client"

interface User {
  email: string
  name: string
  picture?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  authError: string | null
  signInWithGoogle: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized_domain: "Access restricted to @hypertalent.ai accounts",
  invalid_state: "Login session expired. Please try again.",
  authentication_failed: "Authentication failed. Please try again.",
  access_denied: "Access was denied. Please try again.",
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        // Check URL for callback params
        const params = new URLSearchParams(window.location.search)
        const sessionId = params.get("session_id")
        const error = params.get("auth_error")

        // Clean URL
        if (sessionId || error) {
          window.history.replaceState({}, "", window.location.pathname)
        }

        if (error) {
          setAuthError(ERROR_MESSAGES[error] || `Login failed: ${error}`)
          setIsLoading(false)
          return
        }

        if (sessionId) {
          apiClient.setSessionId(sessionId)
        }

        // Validate existing session
        if (apiClient.getSessionId()) {
          try {
            const me = await apiClient.getMe()
            setUser(me)
          } catch {
            // Session invalid, clear it
            apiClient.setSessionId(null)
          }
        }
      } catch (err) {
        console.error("Auth init failed:", err)
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  const signInWithGoogle = () => {
    window.location.href = apiClient.getLoginUrl()
  }

  const signOut = async () => {
    setIsLoading(true)
    try {
      await apiClient.logout()
      setUser(null)
    } catch (err) {
      console.error("Sign out failed:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    authError,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
