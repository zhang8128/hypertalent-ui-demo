"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Target, Loader2 } from "lucide-react"
import { useAuth } from "./auth-provider"

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export function LoginForm() {
  const { signInWithGoogle, isLoading, authError } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Target className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold">Hyper Talent</h1>
            <p className="text-sm text-muted-foreground">Deal Hunter</p>
          </div>
        </div>

        {authError && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg mb-6 text-center">
            {authError}
          </div>
        )}

        <Button
          onClick={signInWithGoogle}
          className="w-full"
          variant="outline"
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <GoogleIcon className="w-5 h-5 mr-2" />
              Sign in with Google
            </>
          )}
        </Button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Restricted to @hypertalent.ai accounts
        </p>
      </Card>
    </div>
  )
}
