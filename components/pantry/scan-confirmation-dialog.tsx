"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Edit3 } from "lucide-react"
import { FOOD_CATEGORIES, UNITS, STORAGE_LOCATIONS } from "@/lib/constants"
import type { PantryItemForm } from "@/lib/types"

interface ScanConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (item: PantryItemForm) => void
  productData: {
    name: string
    category: string
    brand: string
    barcode: string
  } | null
}

export function ScanConfirmationDialog({ isOpen, onClose, onConfirm, productData }: ScanConfirmationDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<PantryItemForm>({
    name: productData?.name || "",
    quantity: 1,
    unit: "pieces",
    category: productData?.category || "Other",
    expirationDate: "",
    location: "Pantry",
    notes: productData?.brand ? `Brand: ${productData.brand}` : "",
  })

  const handleConfirm = () => {
    onConfirm(formData)
    onClose()
    setIsEditing(false)
  }

  const handleInputChange = (field: keyof PantryItemForm, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (!productData) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Product Found!
          </DialogTitle>
          <DialogDescription>Confirm the details and add this item to your pantry.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isEditing ? (
            // Simple confirmation view
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800">{productData.name}</h3>
                <p className="text-sm text-green-600">Category: {productData.category}</p>
                {productData.brand && <p className="text-sm text-green-600">Brand: {productData.brand}</p>}
                <p className="text-xs text-green-500 mt-1">Barcode: {productData.barcode}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Quantity</Label>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange("quantity", Number.parseFloat(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label className="text-sm">Unit</Label>
                  <Select value={formData.unit} onValueChange={(value) => handleInputChange("unit", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                  <Edit3 className="h-4 w-4" />
                  Edit Details
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
                    Add to Pantry
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Full editing form
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FOOD_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange("quantity", Number.parseFloat(e.target.value) || 1)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={formData.unit} onValueChange={(value) => handleInputChange("unit", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expirationDate">Expiration Date</Label>
                  <Input
                    id="expirationDate"
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => handleInputChange("expirationDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select
                    value={formData.location || "Pantry"}
                    onValueChange={(value) => handleInputChange("location", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STORAGE_LOCATIONS.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Back
                </Button>
                <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
                  Add to Pantry
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
