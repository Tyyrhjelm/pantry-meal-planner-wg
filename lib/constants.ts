export const FOOD_CATEGORIES = [
  "Produce",
  "Dairy",
  "Meat & Poultry",
  "Seafood",
  "Pantry Staples",
  "Grains & Cereals",
  "Canned Goods",
  "Frozen Foods",
  "Beverages",
  "Snacks",
  "Condiments & Sauces",
  "Baking Supplies",
  "Herbs & Spices",
  "Other",
] as const

export const UNITS = [
  "pieces",
  "lbs",
  "oz",
  "kg",
  "g",
  "cups",
  "tbsp",
  "tsp",
  "ml",
  "l",
  "fl oz",
  "qt",
  "gal",
  "cans",
  "boxes",
  "bags",
  "bottles",
  "jars",
] as const

export const STORAGE_LOCATIONS = [
  "Refrigerator",
  "Freezer",
  "Pantry",
  "Cupboard",
  "Counter",
  "Basement",
  "Garage",
  "Other",
] as const

export const RECIPE_DIFFICULTIES = ["easy", "medium", "hard"] as const

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const

// Extended Storage Constants
export const STORAGE_TYPES = ["freezer", "pantry", "cellar", "emergency"] as const

export const SHELF_LIFE_CATEGORIES = {
  short: { months: 3, color: "red" },
  medium: { months: 12, color: "yellow" },
  long: { months: 24, color: "green" },
  extended: { months: 60, color: "blue" },
} as const

// Game Constants
export const CHALLENGE_TYPES = ["inventory", "meal-planning", "emergency-prep"] as const

export const DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"] as const

export const ACHIEVEMENT_CATEGORIES = [
  "inventory-master",
  "meal-planner",
  "storage-expert",
  "preparedness-pro",
] as const

// API Endpoints
export const API_ENDPOINTS = {
  pantry: "/api/pantry",
  recipes: "/api/recipes",
  mealPlans: "/api/meal-plans",
  shoppingLists: "/api/shopping-lists",
  extendedStorage: "/api/extended-storage",
  challenges: "/api/challenges",
  achievements: "/api/achievements",
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  pantryItems: "food-storage-pantry-items",
  recipes: "food-storage-recipes",
  mealPlans: "food-storage-meal-plans",
  shoppingLists: "food-storage-shopping-lists",
  userPreferences: "food-storage-user-preferences",
  gameProgress: "food-storage-game-progress",
} as const

// Default Values
export const DEFAULT_PANTRY_ITEM = {
  name: "",
  quantity: 1,
  unit: "pieces",
  category: "Other",
  expirationDate: "",
  location: "Pantry",
  notes: "",
}

export const DEFAULT_RECIPE = {
  name: "",
  description: "",
  ingredients: [],
  instructions: [""],
  prepTime: 15,
  cookTime: 30,
  servings: 4,
  difficulty: "medium" as const,
  tags: [],
}
