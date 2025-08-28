export interface PantryItem {
  id: string
  name: string
  quantity: number
  unit: string
  category: string
  expirationDate: Date | null
  purchaseDate: Date
  location?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Recipe {
  id: string
  name: string
  description?: string
  ingredients: RecipeIngredient[]
  instructions: string[]
  prepTime: number // minutes
  cookTime: number // minutes
  servings: number
  difficulty: "easy" | "medium" | "hard"
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface RecipeIngredient {
  pantryItemName: string
  quantity: number
  unit: string
  optional?: boolean
}

export interface MealPlan {
  id: string
  date: Date
  meals: {
    breakfast?: Recipe
    lunch?: Recipe
    dinner?: Recipe
    snacks?: Recipe[]
  }
  createdAt: Date
  updatedAt: Date
}

export interface ShoppingListItem {
  id: string
  name: string
  quantity: number
  unit: string
  category: string
  purchased: boolean
  notes?: string
}

export interface ShoppingList {
  id: string
  name: string
  items: ShoppingListItem[]
  createdAt: Date
  updatedAt: Date
}

// Extended Storage Types (for App 2)
export interface ExtendedStorageItem {
  id: string
  name: string
  quantity: number
  unit: string
  category: string
  storageType: "freezer" | "pantry" | "cellar" | "emergency"
  shelfLife: number // months
  purchaseDate: Date
  rotationDate: Date
  calories: number
  nutritionalInfo?: NutritionalInfo
  location: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface NutritionalInfo {
  calories: number
  protein: number // grams
  carbs: number // grams
  fat: number // grams
  fiber: number // grams
  sodium: number // mg
}

// Game Types (for App 3)
export interface GameChallenge {
  id: string
  title: string
  description: string
  type: "inventory" | "meal-planning" | "emergency-prep"
  difficulty: "beginner" | "intermediate" | "advanced"
  points: number
  requirements: string[]
  completed: boolean
  completedAt?: Date
}

export interface UserProgress {
  id: string
  totalPoints: number
  level: number
  achievements: Achievement[]
  challengesCompleted: string[]
  streakDays: number
  lastActivity: Date
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt: Date
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Form Types
export interface PantryItemForm {
  name: string
  quantity: number
  unit: string
  category: string
  expirationDate?: string | null // Made optional and allow null
  location?: string
  notes?: string
  barcode?: string // Added barcode field for receipt scanner
  brand?: string // Added brand field for receipt scanner
  price?: number // Added price field for receipt scanner
}

export interface RecipeForm {
  name: string
  description?: string
  ingredients: RecipeIngredient[]
  instructions: string[]
  prepTime: number
  cookTime: number
  servings: number
  difficulty: "easy" | "medium" | "hard"
  tags: string[]
}
