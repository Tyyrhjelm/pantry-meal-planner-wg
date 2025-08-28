"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, Users, ChefHat, Loader2 } from "lucide-react"
import Link from "next/link"
import { recipeApi } from "@/lib/api"
import { AIRecipeSuggestions } from "@/components/pantry/ai-recipe-suggestions"
import type { Recipe, PantryItem } from "@/lib/types"

interface RecipeSuggestion extends Recipe {
  matchScore?: number
  missingIngredients?: string[]
  canMake?: boolean
}

export default function PantryRecipesPage() {
  const [recipes, setRecipes] = useState<RecipeSuggestion[]>([])
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const pantryResponse = await fetch("/api/pantry")
      if (pantryResponse.ok) {
        const pantryData = await pantryResponse.json()
        setPantryItems(pantryData.data || [])
      }

      const response = await recipeApi.getSuggestions()
      console.log("[v0] Recipe API response:", response)
      if (response.success && response.data) {
        // The API returns { recipes: [...] }, so we need to access the recipes array
        const recipesData = response.data.recipes || response.data
        console.log("[v0] Setting recipes:", recipesData)
        setRecipes(Array.isArray(recipesData) ? recipesData : [])
      }
    } catch (error) {
      console.error("Failed to load data:", error)
      setRecipes([]) // Ensure recipes is always an array
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading recipes...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/pantry">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Pantry
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Recipe Suggestions</h1>
            <p className="text-muted-foreground mt-2">AI-powered and traditional recipes based on your pantry</p>
          </div>
        </div>

        <div className="mb-12">
          <AIRecipeSuggestions pantryItems={pantryItems} />
        </div>

        {/* Traditional Recipe Suggestions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Traditional Recipe Matches</h2>
          <p className="text-muted-foreground mb-6">Recipes from our database that match your pantry items</p>
        </div>

        {/* Recipes Grid */}
        {recipes.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle>No Traditional Recipe Suggestions</CardTitle>
              <CardDescription>Add more items to your pantry to get personalized recipe suggestions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/pantry">Add Pantry Items</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <Card key={recipe.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{recipe.name}</CardTitle>
                      {recipe.description && (
                        <CardDescription className="line-clamp-2">{recipe.description}</CardDescription>
                      )}
                    </div>
                    {recipe.matchScore !== undefined && (
                      <Badge variant={recipe.canMake ? "default" : "secondary"}>{recipe.matchScore}% match</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Recipe Info */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{(recipe.prepTime || "0") + (recipe.cookTime || "0")} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{recipe.servings || 1} servings</span>
                    </div>
                    <Badge className={getDifficultyColor(recipe.difficulty || "medium")}>
                      {recipe.difficulty || "Medium"}
                    </Badge>
                  </div>

                  {/* Missing Ingredients */}
                  {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Missing ingredients:</p>
                      <div className="flex flex-wrap gap-1">
                        {recipe.missingIngredients.map((ingredient) => (
                          <Badge key={ingredient} variant="outline" className="text-xs">
                            {ingredient}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {recipe.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {recipe.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{recipe.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button className="flex-1" variant={recipe.canMake ? "default" : "outline"}>
                      <ChefHat className="h-4 w-4 mr-2" />
                      {recipe.canMake ? "Cook Now" : "Add to List"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
