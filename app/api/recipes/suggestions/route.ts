import { type NextRequest, NextResponse } from "next/server"
import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai"
import { z } from "zod"
import type { Recipe, PantryItem, ApiResponse } from "@/lib/types"

// Mock pantry items (in production, this would fetch from database)
const mockPantryItems: PantryItem[] = [
  {
    id: "1",
    name: "Eggs",
    quantity: 12,
    unit: "pieces",
    category: "Dairy",
    expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    purchaseDate: new Date(),
    location: "Refrigerator",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Bread",
    quantity: 1,
    unit: "loaf",
    category: "Grains & Cereals",
    expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    purchaseDate: new Date(),
    location: "Counter",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// Mock recipes database
const mockRecipes: Recipe[] = [
  {
    id: "1",
    name: "Scrambled Eggs",
    description: "Simple and delicious scrambled eggs",
    ingredients: [
      { pantryItemName: "Eggs", quantity: 2, unit: "pieces" },
      { pantryItemName: "Butter", quantity: 1, unit: "tbsp", optional: true },
    ],
    instructions: [
      "Crack eggs into a bowl and whisk",
      "Heat butter in a pan over medium heat",
      "Add eggs and stir gently until cooked",
    ],
    prepTime: 5,
    cookTime: 5,
    servings: 1,
    difficulty: "easy",
    tags: ["breakfast", "quick", "protein"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "French Toast",
    description: "Classic French toast with cinnamon",
    ingredients: [
      { pantryItemName: "Bread", quantity: 4, unit: "slices" },
      { pantryItemName: "Eggs", quantity: 2, unit: "pieces" },
      { pantryItemName: "Milk", quantity: 0.25, unit: "cups" },
      { pantryItemName: "Cinnamon", quantity: 0.5, unit: "tsp" },
    ],
    instructions: [
      "Whisk eggs, milk, and cinnamon in a shallow bowl",
      "Dip bread slices in the mixture",
      "Cook in a buttered pan until golden brown on both sides",
    ],
    prepTime: 10,
    cookTime: 10,
    servings: 2,
    difficulty: "easy",
    tags: ["breakfast", "sweet", "comfort-food"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "Egg Sandwich",
    description: "Quick egg sandwich for breakfast or lunch",
    ingredients: [
      { pantryItemName: "Bread", quantity: 2, unit: "slices" },
      { pantryItemName: "Eggs", quantity: 1, unit: "pieces" },
      { pantryItemName: "Cheese", quantity: 1, unit: "slice", optional: true },
    ],
    instructions: [
      "Toast the bread slices",
      "Fry or scramble the egg",
      "Assemble sandwich with egg and optional cheese",
    ],
    prepTime: 5,
    cookTime: 5,
    servings: 1,
    difficulty: "easy",
    tags: ["breakfast", "lunch", "quick"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

interface RecipeSuggestion extends Recipe {
  matchScore: number
  missingIngredients: string[]
  canMake: boolean
}

// POST /api/recipes/suggestions - Get AI-powered recipe suggestions
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const body = await request.json()
    const { pantryItems, preferences = {} } = body

    if (!pantryItems || pantryItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No pantry items provided",
        },
        { status: 400 },
      )
    }

    const availableIngredients = pantryItems
      .filter((item: PantryItem) => item.quantity > 0)
      .map((item: PantryItem) => `${item.name} (${item.quantity} ${item.unit})`)
      .join(", ")

    const { object } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      schema: RecipeSuggestionsSchema,
      prompt: `You are a creative chef AI. Generate 3 delicious and practical recipes using primarily these available ingredients: ${availableIngredients}.

Requirements:
- Use as many of the available ingredients as possible
- Recipes should be realistic and achievable
- Include prep time in format like "15 minutes" or "30 minutes"
- Provide clear, step-by-step instructions
- Difficulty should be Easy, Medium, or Hard
- Servings should be a reasonable number (1-6)
- Be creative but practical
- If you need a few common ingredients not in the pantry (like salt, pepper, oil), that's okay

Make the recipes diverse in style and cooking method. Focus on creating satisfying, complete meals.`,
    })

    return NextResponse.json({
      success: true,
      data: object,
      message: `Generated ${object.recipes.length} AI-powered recipe suggestions`,
    })
  } catch (error) {
    console.error("Error generating AI recipe suggestions:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate AI recipe suggestions",
      },
      { status: 500 },
    )
  }
}

// GET /api/recipes/suggestions - Get AI-powered recipe suggestions
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<RecipeSuggestion[]>>> {
  try {
    const { searchParams } = new URL(request.url)
    const mealType = searchParams.get("mealType") // breakfast, lunch, dinner, snack
    const maxPrepTime = searchParams.get("maxPrepTime")
    const difficulty = searchParams.get("difficulty")

    // Get available pantry items (in production, this would be a database query)
    const availableItems = mockPantryItems.map((item) => item.name.toLowerCase())

    // Calculate recipe suggestions with match scores
    const suggestions: RecipeSuggestion[] = mockRecipes.map((recipe) => {
      const requiredIngredients = recipe.ingredients.filter((ing) => !ing.optional)
      const optionalIngredients = recipe.ingredients.filter((ing) => ing.optional)

      // Check which ingredients we have
      const availableRequired = requiredIngredients.filter((ing) =>
        availableItems.some((available) => available.includes(ing.pantryItemName.toLowerCase())),
      )

      const availableOptional = optionalIngredients.filter((ing) =>
        availableItems.some((available) => available.includes(ing.pantryItemName.toLowerCase())),
      )

      // Calculate missing ingredients
      const missingRequired = requiredIngredients.filter(
        (ing) => !availableItems.some((available) => available.includes(ing.pantryItemName.toLowerCase())),
      )

      // Calculate match score (0-100)
      const requiredScore =
        requiredIngredients.length > 0 ? (availableRequired.length / requiredIngredients.length) * 80 : 80
      const optionalScore =
        optionalIngredients.length > 0 ? (availableOptional.length / optionalIngredients.length) * 20 : 20

      const matchScore = Math.round(requiredScore + optionalScore)
      const canMake = missingRequired.length === 0

      return {
        ...recipe,
        matchScore,
        missingIngredients: missingRequired.map((ing) => ing.pantryItemName),
        canMake,
      }
    })

    // Filter suggestions
    let filteredSuggestions = suggestions

    // Filter by meal type
    if (mealType && mealType !== "all") {
      filteredSuggestions = filteredSuggestions.filter((recipe) => recipe.tags.includes(mealType))
    }

    // Filter by max prep time
    if (maxPrepTime) {
      const maxTime = Number.parseInt(maxPrepTime)
      filteredSuggestions = filteredSuggestions.filter((recipe) => recipe.prepTime <= maxTime)
    }

    // Filter by difficulty
    if (difficulty && difficulty !== "all") {
      filteredSuggestions = filteredSuggestions.filter((recipe) => recipe.difficulty === difficulty)
    }

    // Sort by match score (highest first), then by whether we can make it
    filteredSuggestions.sort((a, b) => {
      if (a.canMake && !b.canMake) return -1
      if (!a.canMake && b.canMake) return 1
      return b.matchScore - a.matchScore
    })

    // Limit to top 10 suggestions
    const topSuggestions = filteredSuggestions.slice(0, 10)

    return NextResponse.json({
      success: true,
      data: topSuggestions,
      message: `Found ${topSuggestions.length} recipe suggestions`,
    })
  } catch (error) {
    console.error("Error generating recipe suggestions:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate recipe suggestions",
      },
      { status: 500 },
    )
  }
}

const RecipeSchema = z.object({
  name: z.string(),
  description: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
  prepTime: z.string(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  servings: z.number(),
})

const RecipeSuggestionsSchema = z.object({
  recipes: z.array(RecipeSchema),
})
