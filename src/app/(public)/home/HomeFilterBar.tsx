'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ITEM_GROUPS } from '@/lib/constants'
import type { ItemGroupSlug } from '@/lib/constants'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Listed' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

interface HomeFilterBarProps {
  activeGroup: string   // active type-based pill ('furniture' | 'appliances' | 'decor-plants' | '')
  isFree: boolean
  sort: string
}

function buildGroupUrl(group: string, isFree: boolean, sort: string) {
  const params = new URLSearchParams()
  if (group) params.set('group', group)
  if (isFree) params.set('free', '1')
  if (sort && sort !== 'newest') params.set('sort', sort)
  const qs = params.toString()
  return `/home${qs ? `?${qs}` : ''}`
}

export function HomeFilterBar({ activeGroup, isFree, sort }: HomeFilterBarProps) {
  const router = useRouter()
  const noneActive = !activeGroup && !isFree

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {/* All Items — active when no group and not free */}
        <Link
          href={buildGroupUrl('', false, sort)}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
            noneActive
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-white text-foreground hover:bg-muted'
          }`}
        >
          All Items
        </Link>

        {/* Free Stuff */}
        <Link
          href={buildGroupUrl('', true, sort)}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
            isFree
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-white text-foreground hover:bg-muted'
          }`}
        >
          Free Stuff 🎁
        </Link>

        {/* Type-based group pills */}
        {ITEM_GROUPS.map((group) => (
          <Link
            key={group.slug}
            href={buildGroupUrl(group.slug, false, sort)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeGroup === group.slug && !isFree
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-white text-foreground hover:bg-muted'
            }`}
          >
            {group.label}
          </Link>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span className="text-xs text-muted-foreground">Sort by:</span>
        <select
          value={sort}
          onChange={(e) => router.push(buildGroupUrl(activeGroup, isFree, e.target.value))}
          className="cursor-pointer border-none bg-transparent text-xs font-semibold text-foreground outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
