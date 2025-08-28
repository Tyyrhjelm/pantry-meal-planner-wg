"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChefHat, ArrowLeft, Loader2, Camera, Upload } from "lucide-react"
import Link from "next/link"
import { AddItemDialog } from "@/components/pantry/add-item-dialog"
import { BarcodeScanner } from "@/components/pantry/barcode-scanner"
import { PantryItemCard } from "@/components/pantry/pantry-item-card"
import { PantryFilters } from "@/components/pantry/pantry-filters"
import { PantryStats } from "@/components/pantry/pantry-stats"
import { ReceiptScanner } from "@/components/pantry/receipt-scanner"
import { pantryApi } from "@/lib/api"
import type { PantryItem, PantryItemForm } from "@/lib/types"

export default function PantryPage() {
  const [items, setItems] = useState<PantryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [addingItem, setAddingItem] = useState(false)

  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannedProduct, setScannedProduct] = useState<any>(null)
  const [receiptScannerOpen, setReceiptScannerOpen] = useState(false)

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showExpiringSoon, setShowExpiringSoon] = useState(false)

  // Load pantry items
  useEffect(() => {
    loadPantryItems()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...items]

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower) ||
          item.location?.toLowerCase().includes(searchLower),
      )
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory)
    }

    // Expiring soon filter
    if (showExpiringSoon) {
      filtered = filtered.filter((item) => {
        if (!item.expirationDate) return false
        const daysUntilExpiration = Math.ceil(
          (new Date(item.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        )
        return daysUntilExpiration <= 7 && daysUntilExpiration >= 0
      })
    }

    // Sort by expiration date (soonest first)
    filtered.sort((a, b) => {
      if (!a.expirationDate && !b.expirationDate) return 0
      if (!a.expirationDate) return 1
      if (!b.expirationDate) return -1
      return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
    })

    setFilteredItems(filtered)
  }, [items, searchTerm, selectedCategory, showExpiringSoon])

  const loadPantryItems = async () => {
    setLoading(true)
    try {
      const response = await pantryApi.getAll()
      if (response.success && response.data) {
        setItems(response.data)
      }
    } catch (error) {
      console.error("Failed to load pantry items:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (itemData: PantryItemForm) => {
    setAddingItem(true)
    try {
      const response = await pantryApi.create({
        ...itemData,
        purchaseDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      if (response.success && response.data) {
        setItems((prev) => [...prev, response.data!])
      }
    } catch (error) {
      console.error("Failed to add item:", error)
    } finally {
      setAddingItem(false)
    }
  }

  const handleScanSuccess = async (productData: any) => {
    const itemData: PantryItemForm = {
      name: productData.name,
      category: productData.category || "Pantry Staples",
      quantity: 1,
      unit: "piece",
      location: "Pantry",
      notes: productData.brand ? `Brand: ${productData.brand}` : undefined,
    }

    await handleAddItem(itemData)
    setScannerOpen(false)
  }

  const handleReceiptItemsConfirmed = async (receiptItems: PantryItemForm[]) => {
    console.log("[v0] Processing receipt items:", receiptItems)
    setAddingItem(true)
    try {
      const newItems: PantryItem[] = []

      // Add all items from receipt sequentially to avoid race conditions
      for (const itemData of receiptItems) {
        console.log("[v0] Adding receipt item:", itemData)
        const response = await pantryApi.create({
          ...itemData,
          purchaseDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        if (response.success && response.data) {
          console.log("[v0] Successfully added item with ID:", response.data.id)
          newItems.push(response.data)
        } else {
          console.error("[v0] Failed to add item:", response)
        }
      }

      // Update state once with all new items
      if (newItems.length > 0) {
        console.log("[v0] Adding", newItems.length, "new items to state")
        setItems((prev) => {
          const updated = [...prev, ...newItems]
          console.log("[v0] Updated items state, total count:", updated.length)
          return updated
        })
      }
    } catch (error) {
      console.error("Failed to add receipt items:", error)
    } finally {
      setAddingItem(false)
    }
  }

  const handleEditItem = (item: PantryItem) => {
    // TODO: Implement edit functionality
    console.log("Edit item:", item)
  }

  const handleDeleteItem = async (id: string) => {
    console.log("[v0] Attempting to delete item with ID:", id)
    console.log(
      "[v0] Current items in state:",
      items.map((item) => ({ id: item.id, name: item.name })),
    )

    const itemToDelete = items.find((item) => item.id === id)
    if (!itemToDelete) {
      console.error("[v0] Item not found in state for deletion:", id)
      return
    }

    console.log("[v0] Found item to delete:", itemToDelete)

    try {
      const response = await pantryApi.delete(id)
      console.log("[v0] Delete API response:", response)
      if (response.success) {
        setItems((prev) => {
          const filtered = prev.filter((item) => item.id !== id)
          console.log("[v0] Removed item from state, remaining count:", filtered.length)
          console.log(
            "[v0] Remaining items:",
            filtered.map((item) => ({ id: item.id, name: item.name })),
          )
          return filtered
        })
        console.log("[v0] Delete operation completed successfully")
      } else {
        console.error("[v0] Delete failed:", response)
      }
    } catch (error) {
      console.error("[v0] Delete error:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading pantry...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 md:mb-8">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pantry Inventory</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Manage your food items and track expiration dates
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setScannerOpen(true)}
                className="gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 flex-1 sm:flex-none"
              >
                <Camera className="h-4 w-4" />
                Scan Barcode
              </Button>
              <Button
                variant="outline"
                onClick={() => setReceiptScannerOpen(true)}
                className="gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 flex-1 sm:flex-none"
              >
                <Upload className="h-4 w-4" />
                Scan Receipt
              </Button>
              <Button variant="outline" asChild className="flex-1 sm:flex-none bg-transparent">
                <Link href="/pantry/recipes">
                  <ChefHat className="h-4 w-4 mr-2" />
                  Find Recipes
                </Link>
              </Button>
              <div className="flex-1 sm:flex-none">
                <AddItemDialog onAddItem={handleAddItem} isLoading={addingItem} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 md:mb-8">
          <PantryStats items={items} />
        </div>

        {/* Filters */}
        <div className="mb-4 md:mb-6">
          <PantryFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            showExpiringSoon={showExpiringSoon}
            onExpiringToggle={() => setShowExpiringSoon(!showExpiringSoon)}
            totalItems={items.length}
            filteredItems={filteredItems.length}
          />
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <Card className="text-center py-8 md:py-12">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">No Items Found</CardTitle>
              <CardDescription className="text-sm md:text-base">
                {items.length === 0
                  ? "Your pantry is empty. Add some items to get started!"
                  : "No items match your current filters. Try adjusting your search criteria."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {items.length === 0 && <AddItemDialog onAddItem={handleAddItem} isLoading={addingItem} />}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {filteredItems.map((item) => (
              <PantryItemCard key={item.id} item={item} onEdit={handleEditItem} onDelete={handleDeleteItem} />
            ))}
          </div>
        )}
      </div>

      <BarcodeScanner isOpen={scannerOpen} onClose={() => setScannerOpen(false)} onScanSuccess={handleScanSuccess} />
      <ReceiptScanner
        isOpen={receiptScannerOpen}
        onClose={() => setReceiptScannerOpen(false)}
        onItemsConfirmed={handleReceiptItemsConfirmed}
      />
    </div>
  )
}
