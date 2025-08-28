"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Upload, Loader2, X, Check } from "lucide-react"
import { createWorker } from "tesseract.js"
import type { PantryItemForm } from "@/lib/types"

interface ReceiptScannerProps {
  isOpen: boolean
  onClose: () => void
  onItemsConfirmed: (items: PantryItemForm[]) => void
}

interface ExtractedItem {
  name: string
  price?: number
  quantity: number
  category: string
  unit: string
}

export function ReceiptScanner({ isOpen, onClose, onItemsConfirmed }: ReceiptScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [processingStep, setProcessingStep] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const preprocessImage = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Convert to grayscale with better contrast enhancement
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])

      // Enhanced contrast with threshold-based adjustment
      let enhanced = gray
      if (gray < 50)
        enhanced = 0 // Pure black for dark text
      else if (gray > 200)
        enhanced = 255 // Pure white for background
      else enhanced = gray < 128 ? Math.max(0, gray * 0.6) : Math.min(255, gray * 1.4)

      data[i] = enhanced
      data[i + 1] = enhanced
      data[i + 2] = enhanced
    }

    ctx.putImageData(imageData, 0, 0)

    // Apply additional sharpening filter
    const sharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]

    const tempCanvas = document.createElement("canvas")
    const tempCtx = tempCanvas.getContext("2d")!
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    tempCtx.drawImage(canvas, 0, 0)

    const originalData = tempCtx.getImageData(0, 0, canvas.width, canvas.height)
    const sharpened = ctx.createImageData(canvas.width, canvas.height)

    for (let y = 1; y < canvas.height - 1; y++) {
      for (let x = 1; x < canvas.width - 1; x++) {
        let r = 0,
          g = 0,
          b = 0

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * canvas.width + (x + kx)) * 4
            const weight = sharpenKernel[(ky + 1) * 3 + (kx + 1)]
            r += originalData.data[idx] * weight
            g += originalData.data[idx + 1] * weight
            b += originalData.data[idx + 2] * weight
          }
        }

        const idx = (y * canvas.width + x) * 4
        sharpened.data[idx] = Math.max(0, Math.min(255, r))
        sharpened.data[idx + 1] = Math.max(0, Math.min(255, g))
        sharpened.data[idx + 2] = Math.max(0, Math.min(255, b))
        sharpened.data[idx + 3] = 255
      }
    }

    ctx.putImageData(sharpened, 0, 0)
  }

  const parseReceiptText = (text: string): ExtractedItem[] => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 1) // Less restrictive line length

    const items: ExtractedItem[] = []

    console.log("[v0] OCR lines to parse:", lines)

    const itemPatterns = [
      // Standard formats with prices
      /^(.+?)\s+\$?(\d+\.\d{2})$/,
      /^(.+?)\s+(\d+\.\d{2})$/,
      // With quantity variations
      /^(\d+)x?\s+(.+?)\s+\$?(\d+\.\d{2})$/,
      /^(.+?)\s+(\d+)x?\s+\$?(\d+\.\d{2})$/,
      // Price per unit formats
      /^(.+?)\s+(\d+)\s*@\s*\$?(\d+\.\d{2})$/,
      /^(.+?)\s+(\d+\.?\d*)\s*(LB|OZ|KG|G|EA|CT)\s+\$?(\d+\.\d{2})$/i,
      // Alternative formats
      /^(.+?)\s+(\d+)\s+\$(\d+\.\d{2})$/,
      /^(.+?)\s+QTY\s*(\d+)\s+\$?(\d+\.\d{2})$/i,
      // Simple item name only (no price) - for items that might have price on next line
      /^([A-Z][A-Z\s&'-]{2,40})$/,
    ]

    const skipPatterns = [
      /^(SUBTOTAL|TOTAL|TAX|CHANGE|CASH|CARD|CREDIT|DEBIT|PAYMENT)/i,
      /^(RECEIPT|STORE|THANK|VISIT|PHONE|ADDRESS|MANAGER|CASHIER)/i,
      /^(DATE|TIME|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4})/i,
      /^(SAVINGS|REWARDS|POINTS|BALANCE|ACCOUNT|MEMBER)/i,
      /^(RETURN|EXCHANGE|POLICY|SURVEY|WWW\.|HTTP|\.COM)/i,
      /^[\d\s\-*#.]+$/, // Lines with only numbers/symbols
      /^\$?\d+\.\d{2}$/, // Lines with only prices
      /^[A-Z]{1,3}\s*\d+$/, // Short codes like "TX 1"
      /^(OPEN|CLOSE|AM|PM|\d{1,2}:\d{2})/i,
      /^(APPROVED|DECLINED|PROCESSING|LANE|REGISTER)/i,
    ]

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const nextLine = lines[i + 1]

      const cleanLine = line
        .toUpperCase()
        .replace(/[^\w\s$.@]/g, " ")
        .replace(/\s+/g, " ")
        .trim()

      // Skip obvious non-item lines
      if (skipPatterns.some((pattern) => pattern.test(cleanLine)) || cleanLine.length < 2) {
        continue
      }

      console.log("[v0] Processing line:", cleanLine)

      let matched = false

      // Try to match with existing patterns
      for (const pattern of itemPatterns) {
        const match = cleanLine.match(pattern)
        if (match) {
          let name = ""
          let quantity = 1
          let price = 0

          if (match.length === 3) {
            // Simple ITEM PRICE pattern
            name = match[1].trim()
            price = Number.parseFloat(match[2])
          } else if (match.length === 4) {
            if (cleanLine.includes("@")) {
              // ITEM QTY @ PRICE pattern
              name = match[1].trim()
              quantity = Number.parseInt(match[2]) || 1
              price = Number.parseFloat(match[3])
            } else if (/^\d+x?\s/.test(cleanLine)) {
              // QTY ITEM PRICE pattern
              quantity = Number.parseInt(match[1]) || 1
              name = match[2].trim()
              price = Number.parseFloat(match[3])
            } else {
              // ITEM QTY PRICE pattern
              name = match[1].trim()
              quantity = Number.parseInt(match[2]) || 1
              price = Number.parseFloat(match[3])
            }
          } else if (match.length === 5) {
            // ITEM WEIGHT UNIT PRICE pattern
            name = match[1].trim()
            price = Number.parseFloat(match[4])
          }

          name = name.replace(/\b(ORGANIC|FRESH|GREAT|VALUE|BRAND|SELECT|CHOICE|STORE)\b/g, "").trim()
          name = name.replace(/\s+/g, " ")

          if (
            name &&
            name.length >= 2 && // Reduced from 3
            name.length <= 60 && // Increased from 50
            (!price || (price > 0.01 && price < 1000)) && // Increased price limit, made price optional
            quantity > 0 &&
            quantity <= 50 // Increased quantity limit
          ) {
            // Check for duplicates with more flexible matching
            const existingItem = items.find(
              (item) =>
                item.name.toLowerCase() === name.toLowerCase() ||
                (item.name.length > 5 &&
                  name.length > 5 &&
                  (item.name.toLowerCase().includes(name.toLowerCase()) ||
                    name.toLowerCase().includes(item.name.toLowerCase()))),
            )

            if (!existingItem) {
              const formattedName = name.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())
              items.push({
                name: formattedName,
                price: price || undefined,
                quantity,
                category: categorizeItem(formattedName),
                unit: "piece",
              })
              console.log("[v0] Added item:", formattedName, price || "no price", quantity)
              matched = true
            }
          }
          break
        }
      }

      if (!matched && nextLine) {
        const priceMatch = nextLine.match(/^\$?(\d+\.\d{2})$/)
        if (priceMatch && cleanLine.length >= 3 && cleanLine.length <= 50) {
          const name = cleanLine.replace(/\b(ORGANIC|FRESH|GREAT|VALUE|BRAND|SELECT|CHOICE|STORE)\b/g, "").trim()
          const price = Number.parseFloat(priceMatch[1])

          if (name && price > 0.01 && price < 1000) {
            const existingItem = items.find((item) => item.name.toLowerCase() === name.toLowerCase())
            if (!existingItem) {
              const formattedName = name.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())
              items.push({
                name: formattedName,
                price,
                quantity: 1,
                category: categorizeItem(formattedName),
                unit: "piece",
              })
              console.log("[v0] Added item from name-price pair:", formattedName, price)
              i++ // Skip the price line
            }
          }
        }
      }
    }

    console.log("[v0] Final parsed items:", items)
    return items
  }

  const categorizeItem = (itemName: string): string => {
    const name = itemName.toLowerCase()

    if (name.includes("milk") || name.includes("cheese") || name.includes("yogurt") || name.includes("butter")) {
      return "Dairy"
    }
    if (name.includes("bread") || name.includes("cereal") || name.includes("pasta") || name.includes("rice")) {
      return "Grains"
    }
    if (name.includes("apple") || name.includes("banana") || name.includes("orange") || name.includes("berry")) {
      return "Fruits"
    }
    if (name.includes("lettuce") || name.includes("tomato") || name.includes("onion") || name.includes("carrot")) {
      return "Vegetables"
    }
    if (name.includes("chicken") || name.includes("beef") || name.includes("fish") || name.includes("meat")) {
      return "Proteins"
    }

    return "Pantry Staples"
  }

  const processImage = async (file: File) => {
    setIsProcessing(true)
    setProcessingStep("Loading image...")

    try {
      // Create image preview
      const imageUrl = URL.createObjectURL(file)
      setSelectedImage(imageUrl)

      // Create canvas for preprocessing
      const img = new Image()
      img.onload = async () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")!

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        setProcessingStep("Preprocessing image...")
        preprocessImage(canvas, ctx)

        setProcessingStep("Extracting text with OCR...")

        // Initialize Tesseract worker
        const worker = await createWorker("eng")

        // Configure Tesseract for better receipt recognition
        await worker.setParameters({
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,@$-",
          tessedit_pageseg_mode: "6", // Uniform block of text
          preserve_interword_spaces: "1",
        })

        try {
          const {
            data: { text },
          } = await worker.recognize(canvas)
          console.log("[v0] OCR extracted text:", text)

          setProcessingStep("Parsing receipt items...")
          const items = parseReceiptText(text)
          console.log("[v0] Parsed items:", items)

          setExtractedItems(items)

          if (items.length === 0) {
            setProcessingStep("No items found. Try a clearer image.")
          } else {
            setProcessingStep(`Found ${items.length} items`)
          }
        } finally {
          await worker.terminate()
        }

        URL.revokeObjectURL(imageUrl)
      }

      img.src = imageUrl
    } catch (error) {
      console.error("[v0] OCR processing error:", error)
      setProcessingStep("Error processing image. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) {
      processImage(file)
    }
  }

  const handleItemEdit = (index: number, field: keyof ExtractedItem, value: string | number) => {
    setExtractedItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const handleRemoveItem = (index: number) => {
    setExtractedItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleConfirmItems = () => {
    console.log("[v0] Confirming receipt items:", extractedItems)

    const pantryItems: PantryItemForm[] = extractedItems.map((item) => ({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      location: "Pantry",
      notes: item.price ? `Scanned from receipt - Price: $${item.price.toFixed(2)}` : "Scanned from receipt",
      expirationDate: null, // Set to null instead of undefined
      barcode: undefined, // Explicitly set barcode fields
      brand: undefined,
      price: item.price,
    }))

    console.log("[v0] Converted to pantry items:", pantryItems)
    onItemsConfirmed(pantryItems)
    handleClose()
  }

  const handleClose = () => {
    setExtractedItems([])
    setSelectedImage(null)
    setProcessingStep("")
    setIsProcessing(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Scan Receipt</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedImage && !isProcessing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-32 flex-col gap-2 bg-transparent"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-8 w-8" />
                <span>Take Photo</span>
              </Button>

              <Button
                variant="outline"
                className="h-32 flex-col gap-2 bg-transparent"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8" />
                <span>Upload Image</span>
              </Button>
            </div>
          )}

          {isProcessing && (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">{processingStep}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedImage && !isProcessing && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={selectedImage || "/placeholder.svg"}
                  alt="Receipt"
                  className="max-h-64 object-contain border rounded"
                />
              </div>

              {extractedItems.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Extracted Items ({extractedItems.length})</h3>
                    <Button onClick={handleConfirmItems} className="gap-2">
                      <Check className="h-4 w-4" />
                      Add All to Pantry
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {extractedItems.map((item, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                              <div>
                                <Label className="text-xs">Name</Label>
                                <Input
                                  value={item.name}
                                  onChange={(e) => handleItemEdit(index, "name", e.target.value)}
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Quantity</Label>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleItemEdit(index, "quantity", Number.parseInt(e.target.value) || 1)
                                  }
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Category</Label>
                                <Badge variant="secondary" className="text-xs">
                                  {item.category}
                                </Badge>
                              </div>
                              {item.price && (
                                <div>
                                  <Label className="text-xs">Price</Label>
                                  <div className="text-sm font-medium">${item.price.toFixed(2)}</div>
                                </div>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {processingStep && !isProcessing && (
                <p className="text-center text-sm text-muted-foreground">{processingStep}</p>
              )}
            </div>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  )
}
