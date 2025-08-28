"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X } from "lucide-react"
import { FOOD_CATEGORIES } from "@/lib/constants"

interface PantryFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedCategory: string
  onCategoryChange: (value: string) => void
  showExpiringSoon: boolean
  onExpiringToggle: () => void
  totalItems: number
  filteredItems: number
}

export function PantryFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  showExpiringSoon,
  onExpiringToggle,
  totalItems,
  filteredItems,
}: PantryFiltersProps) {
  const hasActiveFilters = searchTerm || selectedCategory !== "all" || showExpiringSoon

  const clearFilters = () => {
    onSearchChange("")
    onCategoryChange("all")
    if (showExpiringSoon) onExpiringToggle()
  }

  return (
    <div className="space-y-4">
      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {FOOD_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showExpiringSoon ? "default" : "outline"}
            onClick={onExpiringToggle}
            className="whitespace-nowrap"
          >
            Expiring Soon
          </Button>
        </div>
      </div>

      {/* Active Filters and Results */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <>
              <span className="text-sm text-muted-foreground">Filters:</span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchTerm}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => onSearchChange("")} />
                </Badge>
              )}
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {selectedCategory}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => onCategoryChange("all")} />
                </Badge>
              )}
              {showExpiringSoon && (
                <Badge variant="secondary" className="gap-1">
                  Expiring Soon
                  <X className="h-3 w-3 cursor-pointer" onClick={onExpiringToggle} />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredItems} of {totalItems} items
        </div>
      </div>
    </div>
  )
}
