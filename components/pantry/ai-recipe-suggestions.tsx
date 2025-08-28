"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, ChefHat, Users, Sparkles } from "lucide-react"
import type { PantryItem } from "@/lib/types"

interface Recipe {
  name: string
  description: string
  ingredients: string[]
  prepTime: string
  difficulty: "Easy" | "Medium" | "Hard"
  instructions: string[]
  servings: number
}

interface AIRecipeSuggestionsProps {
  pantryItems: PantryItem[]
}

export function AIRecipeSuggestions({ pantryItems }: AIRecipeSuggestionsProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateSuggestions = async () => {
    if (pantryItems.length === 0) {
      setError("Add some items to your pantry first!")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/recipes/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pantryItems: pantryItems.filter((item) => item.quantity > 0),
          preferences: {
            difficulty: "Easy",
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate suggestions")
      }

      const data = await response.json()
      setRecipes(data.recipes || [])
    } catch (err) {
      setError("Failed to generate recipe suggestions. Please try again.")
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            AI Recipe Suggestions
          </h2>
          <p className="text-muted-foreground">Get personalized recipes based on your pantry items</p>
        </div>
        <Button
          onClick={generateSuggestions}
          disabled={loading || pantryItems.length === 0}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {loading ? "Generating..." : "Get AI Suggestions"}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {recipes.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {recipes.map((recipe, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span>{recipe.name}</span>
                  <Badge className={getDifficultyColor(recipe.difficulty)}>{recipe.difficulty}</Badge>
                </CardTitle>
                <CardDescription>{recipe.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {recipe.prepTime}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {recipe.servings} servings
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-1">
                    <ChefHat className="h-4 w-4" />
                    Ingredients from your pantry:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {recipe.ingredients.map((ingredient, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Instructions:</h4>
                  <ol className="text-sm space-y-1">
                    {recipe.instructions.map((step, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="font-medium text-purple-600 min-w-[1.5rem]">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pantryItems.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Add some items to your pantry to get AI-powered recipe suggestions!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
