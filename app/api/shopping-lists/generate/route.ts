import { type NextRequest, NextResponse } from "next/server"
import type { ShoppingList, ShoppingListItem, Recipe, PantryItem, ApiResponse } from "@/lib/types"

// Mock data (in production, these would be database queries)
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

// POST /api/shopping-lists/generate - Generate shopping list from recipes
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ShoppingList>>> {
  try {
    const body = await request.json()
    const { recipeIds, listName } = body

    if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Recipe IDs are required",
        },
        { status: 400 },
      )
    }

    // Mock recipes (in production, fetch from database)
    const mockRecipes: Recipe[] = [
      {
        id: "1",
        name: "Scrambled Eggs",
        description: "Simple and delicious scrambled eggs",
        ingredients: [
          { pantryItemName: "Eggs", quantity: 2, unit: "pieces" },
          { pantryItemName: "Butter", quantity: 1, unit: "tbsp" },
        ],
        instructions: [],
        prepTime: 5,
        cookTime: 5,
        servings: 1,
        difficulty: "easy",
        tags: ["breakfast"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "French Toast",
        description: "Classic French toast",
        ingredients: [
          { pantryItemName: "Bread", quantity: 4, unit: "slices" },
          { pantryItemName: "Eggs", quantity: 2, unit: "pieces" },
          { pantryItemName: "Milk", quantity: 0.25, unit: "cups" },
          { pantryItemName: "Cinnamon", quantity: 0.5, unit: "tsp" },
        ],
        instructions: [],
        prepTime: 10,
        cookTime: 10,
        servings: 2,
        difficulty: "easy",
        tags: ["breakfast"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    // Get selected recipes
    const selectedRecipes = mockRecipes.filter((recipe) => recipeIds.includes(recipe.id))

    if (selectedRecipes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid recipes found",
        },
        { status: 404 },
      )
    }

    // Aggregate ingredients from all recipes
    const ingredientMap = new Map<string, { quantity: number; unit: string; category: string }>()

    selectedRecipes.forEach((recipe) => {
      recipe.ingredients.forEach((ingredient) => {
        const key = ingredient.pantryItemName.toLowerCase()
        const existing = ingredientMap.get(key)

        if (existing) {
          // Simple quantity addition (in production, handle unit conversions)
          existing.quantity += ingredient.quantity
        } else {
          // Determine category (in production, this would be from a database)
          let category = "Other"
          if (ingredient.pantryItemName.toLowerCase().includes("egg")) category = "Dairy"
          if (ingredient.pantryItemName.toLowerCase().includes("bread")) category = "Grains & Cereals"
          if (ingredient.pantryItemName.toLowerCase().includes("milk")) category = "Dairy"

          ingredientMap.set(key, {
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            category,
          })
        }
      })
    })

    // Check what we already have in pantry
    const pantryMap = new Map<string, PantryItem>()
    mockPantryItems.forEach((item) => {
      pantryMap.set(item.name.toLowerCase(), item)
    })

    // Generate shopping list items (only for items we don't have enough of)
    const shoppingItems: ShoppingListItem[] = []
    let itemId = 1

    ingredientMap.forEach((needed, itemName) => {
      const pantryItem = pantryMap.get(itemName)
      let needToBuy = needed.quantity

      if (pantryItem) {
        // Simple quantity check (in production, handle unit conversions)
        if (pantryItem.quantity >= needed.quantity) {
          needToBuy = 0 // We have enough
        } else {
          needToBuy = needed.quantity - pantryItem.quantity
        }
      }

      if (needToBuy > 0) {
        shoppingItems.push({
          id: itemId.toString(),
          name: itemName.charAt(0).toUpperCase() + itemName.slice(1),
          quantity: Math.ceil(needToBuy), // Round up
          unit: needed.unit,
          category: needed.category,
          purchased: false,
          notes: `For: ${selectedRecipes.map((r) => r.name).join(", ")}`,
        })
        itemId++
      }
    })

    // Create the shopping list
    const newShoppingList: ShoppingList = {
      id: Date.now().toString(),
      name: listName || `Shopping List - ${new Date().toLocaleDateString()}`,
      items: shoppingItems,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return NextResponse.json({
      success: true,
      data: newShoppingList,
      message: `Generated shopping list with ${shoppingItems.length} items`,
    })
  } catch (error) {
    console.error("Error generating shopping list:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate shopping list",
      },
      { status: 500 },
    )
  }
}
