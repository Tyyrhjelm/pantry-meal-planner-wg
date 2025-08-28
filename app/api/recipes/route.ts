import { type NextRequest, NextResponse } from "next/server"
import type { Recipe, ApiResponse } from "@/lib/types"

// In-memory storage for demo
const recipes: Recipe[] = [
  {
    id: "1",
    name: "Scrambled Eggs",
    description: "Simple and delicious scrambled eggs",
    ingredients: [
      { pantryItemName: "Eggs", quantity: 2, unit: "pieces" },
      { pantryItemName: "Butter", quantity: 1, unit: "tbsp" },
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
]

// GET /api/recipes - Get all recipes
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Recipe[]>>> {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const difficulty = searchParams.get("difficulty")
    const tag = searchParams.get("tag")
    const availableIngredients = searchParams.get("availableIngredients")

    let filteredRecipes = [...recipes]

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase()
      filteredRecipes = filteredRecipes.filter(
        (recipe) =>
          recipe.name.toLowerCase().includes(searchLower) ||
          recipe.description?.toLowerCase().includes(searchLower) ||
          recipe.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
      )
    }

    // Filter by difficulty
    if (difficulty && difficulty !== "all") {
      filteredRecipes = filteredRecipes.filter((recipe) => recipe.difficulty === difficulty)
    }

    // Filter by tag
    if (tag) {
      filteredRecipes = filteredRecipes.filter((recipe) => recipe.tags.includes(tag))
    }

    // Filter by available ingredients (comma-separated list)
    if (availableIngredients) {
      const available = availableIngredients.split(",").map((item) => item.trim().toLowerCase())
      filteredRecipes = filteredRecipes.filter((recipe) => {
        const requiredIngredients = recipe.ingredients
          .filter((ing) => !ing.optional)
          .map((ing) => ing.pantryItemName.toLowerCase())

        return requiredIngredients.every((ingredient) => available.some((available) => available.includes(ingredient)))
      })
    }

    return NextResponse.json({
      success: true,
      data: filteredRecipes,
      message: `Found ${filteredRecipes.length} recipes`,
    })
  } catch (error) {
    console.error("Error fetching recipes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch recipes",
      },
      { status: 500 },
    )
  }
}

// POST /api/recipes - Create new recipe
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Recipe>>> {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.ingredients || !body.instructions) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name, ingredients, instructions",
        },
        { status: 400 },
      )
    }

    const newRecipe: Recipe = {
      id: Date.now().toString(),
      name: body.name,
      description: body.description || "",
      ingredients: body.ingredients,
      instructions: body.instructions,
      prepTime: body.prepTime || 15,
      cookTime: body.cookTime || 30,
      servings: body.servings || 4,
      difficulty: body.difficulty || "medium",
      tags: body.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    recipes.push(newRecipe)

    return NextResponse.json({
      success: true,
      data: newRecipe,
      message: "Recipe created successfully",
    })
  } catch (error) {
    console.error("Error creating recipe:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create recipe",
      },
      { status: 500 },
    )
  }
}
