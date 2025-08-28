"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, AlertTriangle, Calendar, TrendingUp } from "lucide-react"
import type { PantryItem } from "@/lib/types"

interface PantryStatsProps {
  items: PantryItem[]
}

export function PantryStats({ items }: PantryStatsProps) {
  const totalItems = items.length

  const expiringSoon = items.filter((item) => {
    if (!item.expirationDate) return false
    const daysUntilExpiration = Math.ceil(
      (new Date(item.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    )
    return daysUntilExpiration <= 7 && daysUntilExpiration >= 0
  }).length

  const expired = items.filter((item) => {
    if (!item.expirationDate) return false
    return new Date(item.expirationDate) < new Date()
  }).length

  const categories = [...new Set(items.map((item) => item.category))].length

  const stats = [
    {
      title: "Total Items",
      value: totalItems,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
    },
    {
      title: "Expiring Soon",
      value: expiringSoon,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900",
    },
    {
      title: "Expired",
      value: expired,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900",
    },
    {
      title: "Categories",
      value: categories,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`rounded-full p-2 ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
