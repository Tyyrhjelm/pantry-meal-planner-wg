import { STORAGE_KEYS } from "@/lib/constants"
import type { PantryItem, Recipe, MealPlan, ShoppingList } from "@/lib/types"

// Generic storage functions
export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error("Failed to save to localStorage:", error)
  }
}

export function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch (error) {
    console.error("Failed to load from localStorage:", error)
    return null
  }
}

export function removeFromLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error("Failed to remove from localStorage:", error)
  }
}

// Pantry Items
export function savePantryItems(items: PantryItem[]): void {
  saveToLocalStorage(STORAGE_KEYS.pantryItems, items)
}

export function loadPantryItems(): PantryItem[] {
  const items = loadFromLocalStorage<PantryItem[]>(STORAGE_KEYS.pantryItems)
  return items || []
}

// Recipes
export function saveRecipes(recipes: Recipe[]): void {
  saveToLocalStorage(STORAGE_KEYS.recipes, recipes)
}

export function loadRecipes(): Recipe[] {
  const recipes = loadFromLocalStorage<Recipe[]>(STORAGE_KEYS.recipes)
  return recipes || []
}

// Meal Plans
export function saveMealPlans(mealPlans: MealPlan[]): void {
  saveToLocalStorage(STORAGE_KEYS.mealPlans, mealPlans)
}

export function loadMealPlans(): MealPlan[] {
  const mealPlans = loadFromLocalStorage<MealPlan[]>(STORAGE_KEYS.mealPlans)
  return mealPlans || []
}

// Shopping Lists
export function saveShoppingLists(lists: ShoppingList[]): void {
  saveToLocalStorage(STORAGE_KEYS.shoppingLists, lists)
}

export function loadShoppingLists(): ShoppingList[] {
  const lists = loadFromLocalStorage<ShoppingList[]>(STORAGE_KEYS.shoppingLists)
  return lists || []
}

// Data validation and migration
export function validatePantryItem(item: any): item is PantryItem {
  return (
    typeof item === "object" &&
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.quantity === "number" &&
    typeof item.unit === "string" &&
    typeof item.category === "string"
  )
}

export function validateRecipe(recipe: any): recipe is Recipe {
  return (
    typeof recipe === "object" &&
    typeof recipe.id === "string" &&
    typeof recipe.name === "string" &&
    Array.isArray(recipe.ingredients) &&
    Array.isArray(recipe.instructions)
  )
}

// Initialize default data
export function initializeDefaultData(): void {
  const existingPantryItems = loadPantryItems()
  const existingRecipes = loadRecipes()

  if (existingPantryItems.length === 0) {
    // Add some sample pantry items
    const sampleItems: PantryItem[] = [
      {
        id: "1",
        name: "Eggs",
        quantity: 12,
        unit: "pieces",
        category: "Dairy",
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
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
        expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        purchaseDate: new Date(),
        location: "Counter",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    savePantryItems(sampleItems)
  }

  if (existingRecipes.length === 0) {
    // Add some sample recipes
    const sampleRecipes: Recipe[] = [
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
    ]
    saveRecipes(sampleRecipes)
  }
}
