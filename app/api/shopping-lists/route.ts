import { type NextRequest, NextResponse } from "next/server"
import type { ShoppingList, ApiResponse } from "@/lib/types"

// In-memory storage for demo
const shoppingLists: ShoppingList[] = [
  {
    id: "1",
    name: "Weekly Groceries",
    items: [
      {
        id: "1",
        name: "Milk",
        quantity: 1,
        unit: "gallon",
        category: "Dairy",
        purchased: false,
      },
      {
        id: "2",
        name: "Bananas",
        quantity: 6,
        unit: "pieces",
        category: "Produce",
        purchased: true,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// GET /api/shopping-lists - Get all shopping lists
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<ShoppingList[]>>> {
  try {
    return NextResponse.json({
      success: true,
      data: shoppingLists,
      message: `Found ${shoppingLists.length} shopping lists`,
    })
  } catch (error) {
    console.error("Error fetching shopping lists:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch shopping lists",
      },
      { status: 500 },
    )
  }
}

// POST /api/shopping-lists - Create new shopping list
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ShoppingList>>> {
  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: "Shopping list name is required",
        },
        { status: 400 },
      )
    }

    const newList: ShoppingList = {
      id: Date.now().toString(),
      name: body.name,
      items: body.items || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    shoppingLists.push(newList)

    return NextResponse.json({
      success: true,
      data: newList,
      message: "Shopping list created successfully",
    })
  } catch (error) {
    console.error("Error creating shopping list:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create shopping list",
      },
      { status: 500 },
    )
  }
}
