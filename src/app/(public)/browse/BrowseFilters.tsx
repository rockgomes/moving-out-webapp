'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LISTING_CONDITIONS } from '@/lib/constants'

interface BrowseFiltersProps {
  category: string
  q: string
  condition: string
  min: string
  max: string
}

export function BrowseFilters({ category, q, condition, min, max }: BrowseFiltersProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams()
    const values = { category, q, condition, min, max, ...overrides }
    if (values.category && values.category !== 'all') params.set('category', values.category)
    if (values.q) params.set('q', values.q)
    if (values.condition) params.set('condition', values.condition)
    if (values.min) params.set('min', values.min)
    if (values.max) params.set('max', values.max)
    const qs = params.toString()
    return `/browse${qs ? `?${qs}` : ''}`
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    router.push(buildUrl({
      q: fd.get('q') as string ?? '',
      min: fd.get('min') as string ?? '',
      max: fd.get('max') as string ?? '',
    }))
  }

  function handleConditionChange(value: string) {
    router.push(buildUrl({ condition: value === 'any' ? '' : value }))
  }

  const hasFilters = q || condition || min || max

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
      {/* Search row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search listings…"
            className="pl-9"
          />
        </div>
        <Button type="submit" size="default">Search</Button>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />

        {/* Condition */}
        <Select
          defaultValue={condition || 'any'}
          onValueChange={handleConditionChange}
        >
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any condition</SelectItem>
            {LISTING_CONDITIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Price range */}
        <div className="flex items-center gap-1.5">
          <Input
            name="min"
            type="number"
            min={0}
            defaultValue={min}
            placeholder="Min $"
            className="h-8 w-20 text-xs"
          />
          <span className="text-xs text-muted-foreground">–</span>
          <Input
            name="max"
            type="number"
            min={0}
            defaultValue={max}
            placeholder="Max $"
            className="h-8 w-20 text-xs"
          />
          <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">
            Go
          </Button>
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs text-muted-foreground"
            onClick={() => router.push(category && category !== 'all' ? `/browse?category=${category}` : '/browse')}
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
    </form>
  )
}
