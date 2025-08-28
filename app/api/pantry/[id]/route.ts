import { type NextRequest, NextResponse } from "next/server"
import type { PantryItem, ApiResponse } from "@/lib/types"

// This would be imported from a shared data store in production
const pantryItems: PantryItem[] = [
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

// GET /api/pantry/[id] - Get specific pantry item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse<PantryItem>>> {
  try {
    const item = pantryItems.find((item) => item.id === params.id)

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: "Pantry item not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: item,
    })
  } catch (error) {
    console.error("Error fetching pantry item:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch pantry item",
      },
      { status: 500 },
    )
  }
}

// PUT /api/pantry/[id] - Update pantry item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse<PantryItem>>> {
  try {
    const body = await request.json()
    const itemIndex = pantryItems.findIndex((item) => item.id === params.id)

    if (itemIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "Pantry item not found",
        },
        { status: 404 },
      )
    }

    // Update the item
    const updatedItem: PantryItem = {
      ...pantryItems[itemIndex],
      ...body,
      id: params.id, // Ensure ID doesn't change
      updatedAt: new Date(),
      expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
    }

    pantryItems[itemIndex] = updatedItem

    return NextResponse.json({
      success: true,
      data: updatedItem,
      message: "Pantry item updated successfully",
    })
  } catch (error) {
    console.error("Error updating pantry item:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update pantry item",
      },
      { status: 500 },
    )
  }
}

// DELETE /api/pantry/[id] - Delete pantry item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const itemIndex = pantryItems.findIndex((item) => item.id === params.id)

    if (itemIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "Pantry item not found",
        },
        { status: 404 },
      )
    }

    // Remove the item
    pantryItems.splice(itemIndex, 1)

    return NextResponse.json({
      success: true,
      data: null,
      message: "Pantry item deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting pantry item:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete pantry item",
      },
      { status: 500 },
    )
  }
}
