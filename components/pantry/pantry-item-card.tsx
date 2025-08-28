"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, MapPin, Calendar } from "lucide-react"
import type { PantryItem } from "@/lib/types"

interface PantryItemCardProps {
  item: PantryItem
  onEdit: (item: PantryItem) => void
  onDelete: (id: string) => void
}

export function PantryItemCard({ item, onEdit, onDelete }: PantryItemCardProps) {
  const getExpirationStatus = () => {
    if (!item.expirationDate) return { status: "none", color: "secondary", text: "No expiration" }

    const now = new Date()
    const expiration = new Date(item.expirationDate)
    const daysUntilExpiration = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiration < 0) {
      return { status: "expired", color: "destructive", text: "Expired" }
    } else if (daysUntilExpiration <= 3) {
      return { status: "critical", color: "destructive", text: `${daysUntilExpiration} days left` }
    } else if (daysUntilExpiration <= 7) {
      return { status: "warning", color: "default", text: `${daysUntilExpiration} days left` }
    } else {
      return { status: "good", color: "secondary", text: `${daysUntilExpiration} days left` }
    }
  }

  const expirationInfo = getExpirationStatus()

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">{item.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {item.quantity} {item.unit}
              </span>
              <span>•</span>
              <Badge variant="outline" className="text-xs">
                {item.category}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 md:h-8 md:w-8 touch-manipulation">
                <MoreHorizontal className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
              <DropdownMenuItem onClick={() => onEdit(item)} className="cursor-pointer">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(item.id)}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Expiration Status */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Badge variant={expirationInfo.color as any} className="text-xs">
            {expirationInfo.text}
          </Badge>
        </div>

        {/* Location */}
        {item.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{item.location}</span>
          </div>
        )}

        {/* Notes */}
        {item.notes && <p className="text-sm text-muted-foreground line-clamp-2">{item.notes}</p>}

        {/* Purchase Date */}
        <div className="text-xs text-muted-foreground">Added {new Date(item.purchaseDate).toLocaleDateString()}</div>
      </CardContent>
    </Card>
  )
}
