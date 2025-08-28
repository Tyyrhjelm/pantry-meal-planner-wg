"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Clock, Users, ChefHat } from "lucide-react"

interface Recipe {
  id: string
  name: string
  description: string
  prepTime: number
  servings: number
  difficulty: string
  tags: string[]
}

interface GenerateListDialogProps {
  onGenerate: (recipeIds: string[], listName: string) => Promise<void>
}

// Mock recipes for demo
const mockRecipes: Recipe[] = [
  {
    id: "1",
    name: "Scrambled Eggs",
    description: "Simple and delicious scrambled eggs",
    prepTime: 5,
    servings: 1,
    difficulty: "easy",
    tags: ["breakfast", "quick"],
  },
  {
    id: "2",
    name: "French Toast",
    description: "Classic French toast with cinnamon",
    prepTime: 10,
    servings: 2,
    difficulty: "easy",
    tags: ["breakfast", "sweet"],
  },
  {
    id: "3",
    name: "Pasta Carbonara",
    description: "Creamy Italian pasta dish",
    prepTime: 20,
    servings: 4,
    difficulty: "medium",
    tags: ["dinner", "italian"],
  },
]

export function GenerateListDialog({ onGenerate }: GenerateListDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([])
  const [listName, setListName] = useState("")
  const [generating, setGenerating] = useState(false)

  const handleRecipeToggle = (recipeId: string) => {
    setSelectedRecipes((prev) => (prev.includes(recipeId) ? prev.filter((id) => id !== recipeId) : [...prev, recipeId]))
  }

  const handleGenerate = async () => {
    if (selectedRecipes.length === 0) return

    setGenerating(true)
    try {
      await onGenerate(selectedRecipes, listName || `Shopping List - ${new Date().toLocaleDateString()}`)
      setOpen(false)
      setSelectedRecipes([])
      setListName("")
    } catch (error) {
      console.error("Failed to generate shopping list:", error)
    } finally {
      setGenerating(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Generate from Recipes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Shopping List from Recipes</DialogTitle>
          <DialogDescription>
            Select recipes to automatically generate a shopping list with all needed ingredients
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="listName">Shopping List Name (Optional)</Label>
            <Input
              id="listName"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="e.g., Weekend Meal Prep"
            />
          </div>

          <div>
            <Label>Select Recipes ({selectedRecipes.length} selected)</Label>
            <div className="grid gap-3 mt-2 max-h-96 overflow-y-auto">
              {mockRecipes.map((recipe) => (
                <Card
                  key={recipe.id}
                  className={`cursor-pointer transition-colors ${
                    selectedRecipes.includes(recipe.id) ? "ring-2 ring-green-500 bg-green-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleRecipeToggle(recipe.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedRecipes.includes(recipe.id)}
                        onChange={() => handleRecipeToggle(recipe.id)}
                      />
                      <div className="flex-1">
                        <CardTitle className="text-base">{recipe.name}</CardTitle>
                        <CardDescription className="text-sm">{recipe.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {recipe.prepTime} min
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {recipe.servings} servings
                      </div>
                      <Badge className={getDifficultyColor(recipe.difficulty)}>{recipe.difficulty}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {recipe.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={selectedRecipes.length === 0 || generating}
            className="bg-green-600 hover:bg-green-700"
          >
            <ChefHat className="h-4 w-4 mr-2" />
            {generating ? "Generating..." : `Generate List (${selectedRecipes.length} recipes)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
