"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        console.log("[v0] Login page - checking existing user:", user ? user.email : "No user")

        if (user) {
          console.log("[v0] Login page - user already authenticated, redirecting to pantry")
          router.push("/pantry")
          return
        }
      } catch (error) {
        console.log("[v0] Login page - error checking user:", error)
      } finally {
        setChecking(false)
      }
    }

    checkUser()
  }, [router, supabase.auth])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking authentication...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address first.",
        variant: "destructive",
      })
      return
    }

    setResendingEmail(true)
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/pantry`,
        },
      })

      if (error) {
        toast({
          title: "Failed to resend email",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Email sent!",
          description: "Please check your email for the confirmation link.",
        })
      }
    } catch (error) {
      toast({
        title: "Failed to resend email",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setResendingEmail(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setNeedsConfirmation(false)

    console.log("[v0] Starting login process", { email })

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("[v0] Login response", { data, error })

      if (error) {
        console.log("[v0] Login error", error)

        if (error.message === "Email not confirmed") {
          setNeedsConfirmation(true)
          toast({
            title: "Email not confirmed",
            description: "Please check your email and click the confirmation link before signing in.",
            variant: "destructive",
          })
          return
        }

        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      if (data.user) {
        console.log("[v0] User logged in successfully", data.user)
        toast({
          title: "Welcome back!",
          description: "You have been successfully logged in.",
        })
        window.location.href = "/pantry"
      }
    } catch (error) {
      console.log("[v0] Login catch error", error)
      toast({
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-green-700">Welcome Back</CardTitle>
          <CardDescription>Sign in to your Food Storage account</CardDescription>
        </CardHeader>
        <CardContent>
          {needsConfirmation && (
            <Alert className="mb-4">
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Your email address hasn't been confirmed yet. Please check your email and click the confirmation link.
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal text-green-600 hover:text-green-700"
                  onClick={handleResendConfirmation}
                  disabled={resendingEmail}
                >
                  {resendingEmail ? "Sending..." : "Resend confirmation email"}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-green-600 hover:text-green-700 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
