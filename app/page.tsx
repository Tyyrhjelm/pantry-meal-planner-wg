"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChefHat, Package, Gamepad2, Sparkles, ShoppingCart, LogIn, UserPlus } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"

export default function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Food Storage Suite</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete food management system with AI-powered recipe suggestions and smart shopping lists
          </p>
          <div className="mt-6">
            {user ? (
              <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
                <Link href="/pantry">Manage Your Pantry</Link>
              </Button>
            ) : (
              <div className="flex gap-4 justify-center">
                <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
                  <Link href="/auth/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/auth/signup">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Sign Up
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* App Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* App 1: Pantry & Meal Planner */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ChefHat className="h-8 w-8 text-green-600" />
                <div>
                  <CardTitle>Pantry & Meal Planner</CardTitle>
                  <CardDescription>Daily meal planning & inventory</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Track your pantry items, plan meals, and generate shopping lists with AI-powered recipe suggestions.
              </p>
              <div className="space-y-3">
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✓ Smart inventory tracking</li>
                  <li>✓ AI recipe suggestions</li>
                  <li>✓ Automatic shopping lists</li>
                  <li>✓ Expiration monitoring</li>
                  <li>✓ Barcode & receipt scanning</li>
                </ul>
                {user ? (
                  <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                    <Link href="/pantry">Get Started</Link>
                  </Button>
                ) : (
                  <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                    <Link href="/auth/signup">Sign Up to Start</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* App 2: Extended Storage Manager */}
          <Card className="hover:shadow-lg transition-shadow opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-600" />
                <div>
                  <CardTitle>Extended Storage</CardTitle>
                  <CardDescription>Long-term food storage</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage bulk storage, track shelf life, and plan for emergency preparedness.
              </p>
              <Button disabled className="w-full">
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* App 3: Gamified Experience */}
          <Card className="hover:shadow-lg transition-shadow opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Gamepad2 className="h-8 w-8 text-purple-600" />
                <div>
                  <CardTitle>Storage Game</CardTitle>
                  <CardDescription>Gamified preparedness</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Learn preparedness through challenges, simulations, and achievement tracking.
              </p>
              <Button disabled className="w-full">
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-8">MVP Features Available Now</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <ChefHat className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium mb-2">Smart Inventory</h3>
              <p className="text-sm text-muted-foreground">Track expiration dates and quantities</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium mb-2">AI Recipe Suggestions</h3>
              <p className="text-sm text-muted-foreground">Groq-powered recipe recommendations</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium mb-2">Smart Shopping Lists</h3>
              <p className="text-sm text-muted-foreground">Auto-generate from recipes</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 dark:bg-orange-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-medium mb-2">Cross-Device Sync</h3>
              <p className="text-sm text-muted-foreground">Access your data anywhere</p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center bg-white dark:bg-gray-900 rounded-lg p-8 border">
          <h2 className="text-2xl font-semibold mb-4">{user ? "Welcome Back!" : "Ready to Get Started?"}</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            {user
              ? "Your Food Storage Suite is ready with secure user accounts, cross-device sync, and all the features you need to manage your pantry efficiently."
              : "Create an account to start managing your pantry with AI-powered features, barcode scanning, and cross-device synchronization."}
          </p>
          <div className="flex gap-4 justify-center">
            {user ? (
              <>
                <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
                  <Link href="/pantry">Go to Pantry</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/shopping">View Shopping Lists</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
                  <Link href="/auth/signup">Create Account</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
