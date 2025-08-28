"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Camera, X, Loader2, AlertCircle } from "lucide-react"

interface BarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onScanSuccess: (productData: any) => void
}

interface ScannedProduct {
  name: string
  brand: string
  barcode: string
  image?: string
}

export function BarcodeScanner({ isOpen, onClose, onScanSuccess }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null)
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (isOpen && !isScanning) {
      startScanner()
    }
    return () => {
      stopScanner()
    }
  }, [isOpen])

  const startScanner = async () => {
    try {
      setIsScanning(true)
      setCameraError(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))

      const Quagga = (await import("quagga")).default

      if (videoRef.current) {
        Quagga.init(
          {
            inputStream: {
              name: "Live",
              type: "LiveStream",
              target: videoRef.current,
              constraints: {
                facingMode: "environment",
              },
            },
            decoder: {
              readers: ["ean_reader", "ean_8_reader", "code_128_reader", "upc_reader"],
            },
            locate: true,
          },
          (err: any) => {
            if (err) {
              setCameraError("Scanner initialization failed")
              return
            }

            Quagga.start()

            Quagga.onDetected((result: any) => {
              const code = result.codeResult.code
              handleBarcodeDetected(code)
            })
          },
        )
      }
    } catch (error) {
      setCameraError("Unable to access camera. Please allow camera access.")
    }
  }

  const stopScanner = () => {
    try {
      const Quagga = require("quagga")
      if (Quagga) {
        Quagga.stop()
      }
    } catch (error) {
      // QuaggaJS might not be loaded yet
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsScanning(false)
    setCameraError(null)
  }

  const handleBarcodeDetected = async (barcode: string) => {
    if (isLoading || barcode === lastScannedBarcode) return

    setIsLoading(true)
    setLastScannedBarcode(barcode)

    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
      const data = await response.json()

      if (data.status === 1 && data.product) {
        const product = data.product
        const productData = {
          name: product.product_name || product.product_name_en || "Unknown Product",
          brand: product.brands || "",
          barcode: barcode,
          image: product.image_url || product.image_front_url,
        }

        setScannedProduct(productData)
      } else {
        setScannedProduct({
          name: `Product ${barcode}`,
          brand: "",
          barcode: barcode,
        })
      }
    } catch (error) {
      setScannedProduct({
        name: `Product ${barcode}`,
        brand: "",
        barcode: barcode,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddItem = () => {
    if (scannedProduct) {
      onScanSuccess({
        ...scannedProduct,
        category: "Pantry Staples", // Simple default category
      })
      handleClose()
    }
  }

  const handleScanAnother = () => {
    setScannedProduct(null)
    setLastScannedBarcode(null)
    setIsLoading(false)
    // Scanner continues running
  }

  const handleClose = () => {
    stopScanner()
    setScannedProduct(null)
    setLastScannedBarcode(null)
    onClose()
  }

  if (scannedProduct) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add this item to pantry?</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
              {scannedProduct.image && (
                <img
                  src={scannedProduct.image || "/placeholder.svg"}
                  alt={scannedProduct.name}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="font-medium text-green-900">{scannedProduct.name}</h3>
                {scannedProduct.brand && <p className="text-sm text-green-700">{scannedProduct.brand}</p>}
                <p className="text-xs text-green-600 mt-1">Barcode: {scannedProduct.barcode}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddItem} className="flex-1 bg-green-600 hover:bg-green-700">
                Add to Pantry
              </Button>
              <Button onClick={handleScanAnother} variant="outline" className="flex-1 bg-transparent">
                Scan Another
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Barcode
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} className="w-full h-64 object-cover" autoPlay playsInline muted />

            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Looking up product...</p>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white text-center p-4">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-400" />
                  <p className="text-red-400 font-medium">Camera Error</p>
                  <p className="text-sm mt-1">{cameraError}</p>
                </div>
              </div>
            )}

            {isScanning && !isLoading && !cameraError && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-48 h-32 border-2 border-green-400 rounded-lg"></div>
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <div className="text-white text-sm bg-black/70 px-3 py-2 rounded-full inline-block">
                    Point camera at barcode
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button onClick={handleClose} variant="outline" className="w-full bg-transparent">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
