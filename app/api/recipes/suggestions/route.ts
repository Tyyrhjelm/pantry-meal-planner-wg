import { type NextRequest, NextResponse } from "next/server"
import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"
import { z } from "zod"
import type { Recipe, PantryItem, ApiResponse } from "@/lib/types"
import { createServerClient } from "@/lib/supabase/server"
import { validateRequest, rateLimitByIP } from "@/lib/security"

const RecipeSchema = z.object({
  name: z.string(),
  description: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
  prepTime: z.string(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  servings: z.union([z.number(), z.string()]),
})

const RecipeSuggestionsSchema = z.object({
  recipes: z.array(RecipeSchema),
})

interface RecipeSuggestion extends Recipe {
  matchScore: number
  missingIngredients: string[]
  canMake: boolean
}

// GET /api/recipes/suggestions - Get AI-powered recipe suggestions using real pantry data
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  try {
    console.log("[v0] Recipe suggestions API called")

    // Rate limiting and request validation
    const rateLimitResult = await rateLimitByIP(request)
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 })
    }

    const requestValidationResult = await validateRequest(request)
    if (!requestValidationResult.success) {
      return NextResponse.json({ success: false, error: requestValidationResult.error }, { status: 400 })
    }

    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Recipe suggestions - Authentication failed:", authError?.message)
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log("[v0] Recipe suggestions - User authenticated:", user.email)

    // Fetch user's actual pantry items from database
    const { data: pantryItems, error: fetchError } = await supabase
      .from("pantry_items")
      .select("*")
      .eq("user_id", user.id)
      .gt("quantity", 0) // Only items with quantity > 0

    if (fetchError) {
      console.error("[v0] Recipe suggestions - Database error:", fetchError)
      return NextResponse.json({ success: false, error: "Failed to fetch pantry items" }, { status: 500 })
    }

    console.log("[v0] Recipe suggestions - Found pantry items:", pantryItems?.length || 0)

    if (!pantryItems || pantryItems.length === 0) {
      console.log("[v0] Recipe suggestions - No pantry items found")
      return NextResponse.json({
        success: true,
        data: { recipes: [] },
        message: "No pantry items available for recipe suggestions. Add some items to your pantry first!",
      })
    }

    const availableIngredients = pantryItems
      .map((item: PantryItem) => `${item.name} (${item.quantity} ${item.unit})`)
      .join(", ")

    console.log("[v0] Recipe suggestions - Available ingredients:", availableIngredients)

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt: `You are a creative chef AI. Generate exactly 3 delicious and practical recipes using primarily these available ingredients: ${availableIngredients}.

Requirements:
- Use as many of the available ingredients as possible
- Recipes should be realistic and achievable
- Include prep time in format like "15 minutes" or "30 minutes"
- Provide clear, step-by-step instructions
- Difficulty should be Easy, Medium, or Hard
- Servings should be a reasonable number (1-6) - use quotes for ranges like "2-3"
- Be creative but practical
- If you need a few common ingredients not in the pantry (like salt, pepper, oil), that's okay

IMPORTANT: Return your response as valid JSON in this exact format:
{
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "Brief description",
      "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3"],
      "instructions": ["step 1", "step 2", "step 3"],
      "prepTime": "30 minutes",
      "difficulty": "Easy",
      "servings": 4
    }
  ]
}

Make the recipes diverse in style and cooking method. Focus on creating satisfying, complete meals that actually use the ingredients: ${availableIngredients}.`,
    })

    console.log("[v0] Recipe suggestions - Raw AI response:", text)

    const cleanedText = text
      .replace(/(\d+)-(\d+)/g, '"$1-$2"') // Fix servings like 2-3 to "2-3"
      .replace(/,\s*}/g, "}") // Remove trailing commas in objects
      .replace(/,\s*]/g, "]") // Remove trailing commas in arrays
      .replace(/"_([^"]+)"/g, '"$1"') // Remove leading underscores from strings like "_salt"
      .replace(/\n/g, " ") // Replace newlines with spaces
      .replace(/\s+/g, " ") // Normalize multiple spaces to single space
      .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas before closing brackets/braces
      .replace(/(["\]])\s*,\s*([}\]])/g, "$1$2") // Remove commas between array/object endings
      .trim()

    let parsedResponse
    try {
      parsedResponse = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("[v0] Recipe suggestions - JSON parse error:", parseError)
      console.log("[v0] Recipe suggestions - Cleaned text:", cleanedText)

      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          let extractedJson = jsonMatch[0]
            .replace(/(\d+)-(\d+)/g, '"$1-$2"')
            .replace(/,\s*}/g, "}")
            .replace(/,\s*]/g, "]")
            .replace(/"_([^"]+)"/g, '"$1"')
            .replace(/,(\s*[}\]])/g, "$1")
            .replace(/(["\]])\s*,\s*([}\]])/g, "$1$2")

          // Try to fix common array issues
          extractedJson = extractedJson.replace(/"\s*,\s*,/g, '",') // Fix double commas
          extractedJson = extractedJson.replace(/,\s*,/g, ",") // Fix double commas without quotes

          parsedResponse = JSON.parse(extractedJson)
        } catch (fallbackError) {
          console.error("[v0] Recipe suggestions - Fallback parse error:", fallbackError)
          console.log("[v0] Recipe suggestions - Extracted JSON:", jsonMatch[0])

          return NextResponse.json({
            success: true,
            data: {
              recipes: [
                {
                  name: "Simple Pantry Recipe",
                  description: "A basic recipe using your available ingredients",
                  ingredients: pantryItems.slice(0, 3).map((item: PantryItem) => item.name),
                  instructions: ["Combine ingredients", "Cook as desired", "Season to taste", "Serve hot"],
                  prepTime: "30 minutes",
                  difficulty: "Easy",
                  servings: 4,
                },
              ],
            },
            message: "Generated fallback recipe due to AI parsing issues",
          })
        }
      } else {
        return NextResponse.json({ success: false, error: "Invalid AI response format" }, { status: 500 })
      }
    }

    const validationResult = RecipeSuggestionsSchema.safeParse(parsedResponse)
    if (!validationResult.success) {
      console.error("[v0] Recipe suggestions - Validation error:", validationResult.error)
      return NextResponse.json({ success: false, error: "Invalid recipe format from AI" }, { status: 500 })
    }

    console.log("[v0] Recipe suggestions - Generated recipes:", validationResult.data.recipes.length)

    return NextResponse.json({
      success: true,
      data: validationResult.data,
      message: `Generated ${validationResult.data.recipes.length} AI-powered recipe suggestions based on your pantry items`,
    })
  } catch (error) {
    console.error("[v0] Recipe suggestions - Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate AI recipe suggestions",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  try {
    console.log("[v0] Recipe suggestions POST API called")

    const rateLimitResult = await rateLimitByIP(request)
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: rateLimitResult.error }, { status: 429 })
    }

    const requestValidationResult = await validateRequest(request)
    if (!requestValidationResult.success) {
      return NextResponse.json({ success: false, error: requestValidationResult.error }, { status: 400 })
    }

    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { preferences = {} } = body

    // Fetch user's actual pantry items
    const { data: pantryItems, error: fetchError } = await supabase
      .from("pantry_items")
      .select("*")
      .eq("user_id", user.id)
      .gt("quantity", 0)

    if (fetchError || !pantryItems || pantryItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No pantry items found",
        },
        { status: 400 },
      )
    }

    const availableIngredients = pantryItems
      .map((item: PantryItem) => `${item.name} (${item.quantity} ${item.unit})`)
      .join(", ")

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      prompt: `You are a creative chef AI. Generate exactly 3 delicious and practical recipes using primarily these available ingredients: ${availableIngredients}.

Requirements:
- Use as many of the available ingredients as possible
- Recipes should be realistic and achievable
- Include prep time in format like "15 minutes" or "30 minutes"
- Provide clear, step-by-step instructions
- Difficulty should be Easy, Medium, or Hard
- Servings should be a reasonable number (1-6) - use quotes for ranges like "2-3"
- Be creative but practical
- If you need a few common ingredients not in the pantry (like salt, pepper, oil), that's okay

IMPORTANT: Return your response as valid JSON in this exact format:
{
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "Brief description",
      "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3"],
      "instructions": ["step 1", "step 2", "step 3"],
      "prepTime": "30 minutes",
      "difficulty": "Easy",
      "servings": 4
    }
  ]
}

Make the recipes diverse in style and cooking method. Focus on creating satisfying, complete meals that actually use the ingredients: ${availableIngredients}.`,
    })

    console.log("[v0] Recipe suggestions - Raw AI response:", text)

    const cleanedText = text
      .replace(/(\d+)-(\d+)/g, '"$1-$2"') // Fix servings like 2-3 to "2-3"
      .replace(/,\s*}/g, "}") // Remove trailing commas in objects
      .replace(/,\s*]/g, "]") // Remove trailing commas in arrays
      .replace(/"_([^"]+)"/g, '"$1"') // Remove leading underscores from strings like "_salt"
      .replace(/\n/g, " ") // Replace newlines with spaces
      .replace(/\s+/g, " ") // Normalize multiple spaces to single space
      .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas before closing brackets/braces
      .replace(/(["\]])\s*,\s*([}\]])/g, "$1$2") // Remove commas between array/object endings
      .trim()

    let parsedResponse
    try {
      parsedResponse = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("[v0] Recipe suggestions - JSON parse error:", parseError)
      console.log("[v0] Recipe suggestions - Cleaned text:", cleanedText)

      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          let extractedJson = jsonMatch[0]
            .replace(/(\d+)-(\d+)/g, '"$1-$2"')
            .replace(/,\s*}/g, "}")
            .replace(/,\s*]/g, "]")
            .replace(/"_([^"]+)"/g, '"$1"')
            .replace(/,(\s*[}\]])/g, "$1")
            .replace(/(["\]])\s*,\s*([}\]])/g, "$1$2")

          // Try to fix common array issues
          extractedJson = extractedJson.replace(/"\s*,\s*,/g, '",') // Fix double commas
          extractedJson = extractedJson.replace(/,\s*,/g, ",") // Fix double commas without quotes

          parsedResponse = JSON.parse(extractedJson)
        } catch (fallbackError) {
          console.error("[v0] Recipe suggestions - Fallback parse error:", fallbackError)
          console.log("[v0] Recipe suggestions - Extracted JSON:", jsonMatch[0])

          return NextResponse.json({
            success: true,
            data: {
              recipes: [
                {
                  name: "Simple Pantry Recipe",
                  description: "A basic recipe using your available ingredients",
                  ingredients: pantryItems.slice(0, 3).map((item: PantryItem) => item.name),
                  instructions: ["Combine ingredients", "Cook as desired", "Season to taste", "Serve hot"],
                  prepTime: "30 minutes",
                  difficulty: "Easy",
                  servings: 4,
                },
              ],
            },
            message: "Generated fallback recipe due to AI parsing issues",
          })
        }
      } else {
        return NextResponse.json({ success: false, error: "Invalid AI response format" }, { status: 500 })
      }
    }

    const validationResult = RecipeSuggestionsSchema.safeParse(parsedResponse)
    if (!validationResult.success) {
      return NextResponse.json({ success: false, error: "Invalid recipe format from AI" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: validationResult.data,
      message: `Generated ${validationResult.data.recipes.length} AI-powered recipe suggestions`,
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
