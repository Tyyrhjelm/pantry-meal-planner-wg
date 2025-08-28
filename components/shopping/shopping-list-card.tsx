"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ShoppingCart, Calendar, CheckCircle2, Circle, Trash2 } from "lucide-react"
import type { ShoppingList } from "@/lib/types"

interface ShoppingListCardProps {
  shoppingList: ShoppingList
  onUpdate: (updatedList: ShoppingList) => void
  onDelete: (listId: string) => void
}

export function ShoppingListCard({ shoppingList, onUpdate, onDelete }: ShoppingListCardProps) {
  const [updating, setUpdating] = useState(false)

  const purchasedCount = shoppingList.items.filter((item) => item.purchased).length
  const totalCount = shoppingList.items.length
  const progress = totalCount > 0 ? (purchasedCount / totalCount) * 100 : 0

  const toggleItemPurchased = async (itemId: string) => {
    setUpdating(true)

    const updatedItems = shoppingList.items.map((item) =>
      item.id === itemId ? { ...item, purchased: !item.purchased } : item,
    )

    const updatedList = {
      ...shoppingList,
      items: updatedItems,
      updatedAt: new Date(),
    }

    onUpdate(updatedList)
    setUpdating(false)
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Produce: "bg-green-100 text-green-800",
      Dairy: "bg-blue-100 text-blue-800",
      Meat: "bg-red-100 text-red-800",
      "Grains & Cereals": "bg-yellow-100 text-yellow-800",
      Other: "bg-gray-100 text-gray-800",
    }
    return colors[category] || colors["Other"]
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              {shoppingList.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              Created {shoppingList.createdAt.toLocaleDateString()}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(shoppingList.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              {purchasedCount} of {totalCount} items purchased
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {shoppingList.items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
              item.purchased ? "bg-gray-50 opacity-75" : "bg-white"
            }`}
          >
            <Checkbox
              checked={item.purchased}
              onCheckedChange={() => toggleItemPurchased(item.id)}
              disabled={updating}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${item.purchased ? "line-through text-gray-500" : ""}`}>{item.name}</span>
                <Badge variant="secondary" className={getCategoryColor(item.category)}>
                  {item.category}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {item.quantity} {item.unit}
                {item.notes && <span className="ml-2 italic">• {item.notes}</span>}
              </div>
            </div>

            {item.purchased ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400" />
            )}
          </div>
        ))}

        {shoppingList.items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No items in this shopping list</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
