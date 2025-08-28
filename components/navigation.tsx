"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChefHat, ShoppingCart, Home, Sparkles, User, LogOut } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function Navigation() {
  const pathname = usePathname()
  const { user, loading, signOut } = useAuth()

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/pantry", label: "Pantry", icon: ChefHat },
    { href: "/pantry/recipes", label: "AI Recipes", icon: Sparkles },
    { href: "/shopping", label: "Shopping", icon: ShoppingCart },
  ]

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/auth/login"
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <ChefHat className="h-6 w-6 text-green-600" />
            <span className="hidden sm:inline">Food Storage Suite</span>
            <span className="sm:hidden">Food Storage</span>
          </Link>

          <div className="flex items-center gap-1">
            {user && (
              <>
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <Button
                      key={item.href}
                      asChild
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className="hidden sm:flex"
                    >
                      <Link href={item.href} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  )
                })}

                <div className="sm:hidden flex items-center gap-1">
                  {navItems.slice(1).map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                      <Button key={item.href} asChild variant={isActive ? "default" : "ghost"} size="sm">
                        <Link href={item.href}>
                          <Icon className="h-4 w-4" />
                        </Link>
                      </Button>
                    )
                  })}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="ml-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {user.email?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Signed in</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {!loading && !user && (
              <Button asChild size="sm">
                <Link href="/auth/login">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
