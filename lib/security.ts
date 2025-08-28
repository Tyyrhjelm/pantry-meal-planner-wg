import { z } from "zod"
import type { NextRequest } from "next/server"
import DOMPurify from "isomorphic-dompurify"
import crypto from "crypto"

export class SecurityError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
  ) {
    super(message)
    this.name = "SecurityError"
  }
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(ip: string, maxRequests = 100, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const key = `rate_limit_${ip}`
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

// Input sanitization
export function sanitizeString(input: string, maxLength = 1000): string {
  if (typeof input !== "string") {
    throw new SecurityError("Input must be a string")
  }

  if (input.length > maxLength) {
    throw new SecurityError(`Input exceeds maximum length of ${maxLength} characters`)
  }

  // Remove HTML tags and dangerous characters
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim()
}

export function sanitizeNumber(input: any, min = 0, max = 1000000): number {
  const num = Number(input)
  if (isNaN(num)) {
    throw new SecurityError("Input must be a valid number")
  }

  if (num < min || num > max) {
    throw new SecurityError(`Number must be between ${min} and ${max}`)
  }

  return num
}

// Generate secure UUIDs
export function generateSecureId(): string {
  return crypto.randomUUID()
}

// Validation schemas
export const PantryItemSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9\s\-&'.,()]+$/, "Invalid characters in name"),
  quantity: z.number().min(0).max(10000),
  unit: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[a-zA-Z\s]+$/, "Invalid unit format"),
  category: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z\s&]+$/, "Invalid category format"),
  expirationDate: z.union([z.string().datetime(), z.null()]).optional(),
  location: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  barcode: z.string().optional(),
  brand: z.string().optional(),
  price: z.number().optional(),
})

export const RecipeSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  ingredients: z
    .array(
      z.object({
        pantryItemName: z.string().min(1).max(100),
        quantity: z.number().min(0).max(1000),
        unit: z.string().min(1).max(20),
        optional: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(50),
  instructions: z.array(z.string().min(1).max(500)).min(1).max(20),
  prepTime: z.number().min(0).max(1440), // max 24 hours
  cookTime: z.number().min(0).max(1440),
  servings: z.number().min(1).max(20),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string().max(30)).max(10),
})

export const ShoppingListSchema = z.object({
  name: z.string().min(1).max(200),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        quantity: z.number().min(0).max(1000),
        unit: z.string().min(1).max(20),
        category: z.string().max(50),
        purchased: z.boolean(),
        notes: z.string().max(200).optional(),
      }),
    )
    .max(100),
})

// Security middleware
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return "unknown"
}

export function validateContentType(request: NextRequest): void {
  const contentType = request.headers.get("content-type")
  if (!contentType || !contentType.includes("application/json")) {
    throw new SecurityError("Invalid content type. Expected application/json", 415)
  }
}

export async function validateRequestSize(request: NextRequest, maxSize = 1024 * 1024): Promise<void> {
  const contentLength = request.headers.get("content-length")
  if (contentLength && Number.parseInt(contentLength) > maxSize) {
    throw new SecurityError("Request body too large", 413)
  }
}

export async function validateRequest(request: NextRequest): Promise<{ success: boolean; error?: string }> {
  try {
    validateContentType(request)
    await validateRequestSize(request)
    return { success: true }
  } catch (error) {
    if (error instanceof SecurityError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Request validation failed" }
  }
}

export async function rateLimitByIP(request: NextRequest): Promise<{ success: boolean; error?: string }> {
  const ip = getClientIP(request)
  const allowed = rateLimit(ip)

  if (!allowed) {
    return { success: false, error: "Rate limit exceeded" }
  }

  return { success: true }
}
