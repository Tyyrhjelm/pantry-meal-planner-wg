import { type NextRequest, NextResponse } from "next/server"
import type { PantryItem, ApiResponse } from "@/lib/types"
import {
  rateLimit,
  getClientIP,
  SecurityError,
  PantryItemSchema,
  sanitizeString,
  validateContentType,
  validateRequestSize,
} from "@/lib/security"
import { createClient } from "@/lib/supabase/server"

// GET /api/pantry - Get all pantry items
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<PantryItem[]>>> {
  try {
    const clientIP = getClientIP(request)
    if (!rateLimit(clientIP, 100, 15 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const expiringSoon = searchParams.get("expiringSoon")

    let query = supabase.from("pantry_items").select("*").eq("user_id", user.id)

    if (category && category !== "all") {
      const sanitizedCategory = sanitizeString(category, 50)
      query = query.eq("category", sanitizedCategory)
    }

    if (search) {
      const sanitizedSearch = sanitizeString(search, 100)
      query = query.or(`name.ilike.%${sanitizedSearch}%,category.ilike.%${sanitizedSearch}%`)
    }

    if (expiringSoon === "true") {
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      query = query.lte("expiration_date", sevenDaysFromNow)
    }

    const { data: items, error } = await query.order("expiration_date", { ascending: true, nullsLast: true })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch items" }, { status: 500 })
    }

    const transformedItems: PantryItem[] = items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      expirationDate: item.expiration_date ? new Date(item.expiration_date) : null,
      purchaseDate: new Date(item.purchase_date),
      location: "Pantry", // Default for now
      notes: item.notes || "",
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }))

    return NextResponse.json({
      success: true,
      data: transformedItems,
      message: `Found ${transformedItems.length} items`,
    })
  } catch (error) {
    console.error("Error fetching pantry items:", error)

    if (error instanceof SecurityError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode })
    }

    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/pantry - Create new pantry item
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<PantryItem>>> {
  try {
    const clientIP = getClientIP(request)
    if (!rateLimit(clientIP, 50, 15 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    validateContentType(request)
    await validateRequestSize(request)

    const body = await request.json()
    const validatedData = PantryItemSchema.parse(body)

    const { data: newItem, error } = await supabase
      .from("pantry_items")
      .insert({
        user_id: user.id,
        name: validatedData.name,
        quantity: validatedData.quantity,
        unit: validatedData.unit,
        category: validatedData.category,
        expiration_date: validatedData.expirationDate,
        purchase_date: new Date().toISOString(),
        notes: validatedData.notes || "",
        barcode: validatedData.barcode || null,
        brand: validatedData.brand || null,
        price: validatedData.price || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, error: "Failed to create item" }, { status: 500 })
    }

    const transformedItem: PantryItem = {
      id: newItem.id,
      name: newItem.name,
      quantity: newItem.quantity,
      unit: newItem.unit,
      category: newItem.category,
      expirationDate: newItem.expiration_date ? new Date(newItem.expiration_date) : null,
      purchaseDate: new Date(newItem.purchase_date),
      location: "Pantry",
      notes: newItem.notes || "",
      createdAt: new Date(newItem.created_at),
      updatedAt: new Date(newItem.updated_at),
    }

    return NextResponse.json({
      success: true,
      data: transformedItem,
      message: "Pantry item created successfully",
    })
  } catch (error) {
    console.error("Error creating pantry item:", error)

    if (error instanceof SecurityError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode })
    }

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Invalid input data" }, { status: 400 })
    }

    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
