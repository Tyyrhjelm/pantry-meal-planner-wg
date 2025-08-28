import type { PantryItem, Recipe, ShoppingList, ApiResponse } from "@/lib/types"

const API_BASE = "/api"

// Generic API request function
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error("API request failed:", error)
    return {
      success: false,
      error: "Network error occurred",
    }
  }
}

// Pantry API functions
export const pantryApi = {
  // Get all pantry items with optional filters
  getAll: (params?: {
    category?: string
    search?: string
    expiringSoon?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.category) searchParams.set("category", params.category)
    if (params?.search) searchParams.set("search", params.search)
    if (params?.expiringSoon) searchParams.set("expiringSoon", "true")

    const query = searchParams.toString()
    return apiRequest<PantryItem[]>(`/pantry${query ? `?${query}` : ""}`)
  },

  // Get specific pantry item
  getById: (id: string) => apiRequest<PantryItem>(`/pantry/${id}`),

  // Create new pantry item
  create: (item: Omit<PantryItem, "id" | "createdAt" | "updatedAt">) =>
    apiRequest<PantryItem>("/pantry", {
      method: "POST",
      body: JSON.stringify(item),
    }),

  // Update pantry item
  update: (id: string, item: Partial<PantryItem>) =>
    apiRequest<PantryItem>(`/pantry/${id}`, {
      method: "PUT",
      body: JSON.stringify(item),
    }),

  // Delete pantry item
  delete: (id: string) =>
    apiRequest<null>(`/pantry/${id}`, {
      method: "DELETE",
    }),
}

// Recipe API functions
export const recipeApi = {
  // Get all recipes with optional filters
  getAll: (params?: {
    search?: string
    difficulty?: string
    tag?: string
    availableIngredients?: string[]
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set("search", params.search)
    if (params?.difficulty) searchParams.set("difficulty", params.difficulty)
    if (params?.tag) searchParams.set("tag", params.tag)
    if (params?.availableIngredients) {
      searchParams.set("availableIngredients", params.availableIngredients.join(","))
    }

    const query = searchParams.toString()
    return apiRequest<Recipe[]>(`/recipes${query ? `?${query}` : ""}`)
  },

  // Get recipe suggestions based on pantry items
  getSuggestions: (params?: {
    mealType?: string
    maxPrepTime?: number
    difficulty?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.mealType) searchParams.set("mealType", params.mealType)
    if (params?.maxPrepTime) searchParams.set("maxPrepTime", params.maxPrepTime.toString())
    if (params?.difficulty) searchParams.set("difficulty", params.difficulty)

    const query = searchParams.toString()
    return apiRequest<Recipe[]>(`/recipes/suggestions${query ? `?${query}` : ""}`)
  },

  // Create new recipe
  create: (recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">) =>
    apiRequest<Recipe>("/recipes", {
      method: "POST",
      body: JSON.stringify(recipe),
    }),
}

// Shopping List API functions
export const shoppingListApi = {
  // Get all shopping lists
  getAll: () => apiRequest<ShoppingList[]>("/shopping-lists"),

  // Create new shopping list
  create: (list: { name: string; items?: any[] }) =>
    apiRequest<ShoppingList>("/shopping-lists", {
      method: "POST",
      body: JSON.stringify(list),
    }),

  // Generate shopping list from recipes
  generateFromRecipes: (recipeIds: string[], listName?: string) =>
    apiRequest<ShoppingList>("/shopping-lists/generate", {
      method: "POST",
      body: JSON.stringify({ recipeIds, listName }),
    }),
}

// Utility functions for API responses
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined
}

export function getApiError<T>(response: ApiResponse<T>): string {
  return response.error || "An unknown error occurred"
}
