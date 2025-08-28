"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { ShoppingListCard } from "@/components/shopping/shopping-list-card"
import { GenerateListDialog } from "@/components/shopping/generate-list-dialog"
import { ShoppingCart, Plus, ListTodo } from "lucide-react"
import type { ShoppingList } from "@/lib/types"

export default function ShoppingPage() {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchShoppingLists()
  }, [])

  const fetchShoppingLists = async () => {
    try {
      const response = await fetch("/api/shopping-lists")
      const data = await response.json()

      if (data.success) {
        setShoppingLists(data.data)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError("Failed to fetch shopping lists")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateList = async (recipeIds: string[], listName: string) => {
    try {
      const response = await fetch("/api/shopping-lists/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipeIds,
          listName,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setShoppingLists((prev) => [data.data, ...prev])
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError("Failed to generate shopping list")
    }
  }

  const handleUpdateList = (updatedList: ShoppingList) => {
    setShoppingLists((prev) => prev.map((list) => (list.id === updatedList.id ? updatedList : list)))
  }

  const handleDeleteList = (listId: string) => {
    setShoppingLists((prev) => prev.filter((list) => list.id !== listId))
  }

  const createEmptyList = async () => {
    try {
      const response = await fetch("/api/shopping-lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `Shopping List - ${new Date().toLocaleDateString()}`,
          items: [],
        }),
      })

      const data = await response.json()

      if (data.success) {
        setShoppingLists((prev) => [data.data, ...prev])
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError("Failed to create shopping list")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading shopping lists...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            Shopping Lists
          </h1>
          <p className="text-muted-foreground mt-2">Manage your shopping lists and generate them from recipes</p>
        </div>

        <div className="flex gap-3">
          <GenerateListDialog onGenerate={handleGenerateList} />
          <Button onClick={createEmptyList} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            New List
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {shoppingLists.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shoppingLists.map((list) => (
            <ShoppingListCard
              key={list.id}
              shoppingList={list}
              onUpdate={handleUpdateList}
              onDelete={handleDeleteList}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <ListTodo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No Shopping Lists Yet</CardTitle>
            <CardDescription className="mb-4">
              Create your first shopping list or generate one from your favorite recipes
            </CardDescription>
            <div className="flex gap-3 justify-center">
              <GenerateListDialog onGenerate={handleGenerateList} />
              <Button onClick={createEmptyList} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Empty List
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
