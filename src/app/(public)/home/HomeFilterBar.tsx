'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CATEGORIES, FEATURED_PILL_SLUGS } from '@/lib/constants'
import type { CategorySlug } from '@/lib/constants'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Listed' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

interface HomeFilterBarProps {
  activeCategory: CategorySlug
  isFree: boolean
  sort: string
}

function buildUrl(category: string, isFree: boolean, sort: string) {
  const params = new URLSearchParams()
  if (category !== 'all') params.set('category', category)
  if (isFree) params.set('free', '1')
  if (sort && sort !== 'newest') params.set('sort', sort)
  const qs = params.toString()
  return `/home${qs ? `?${qs}` : ''}`
}

export function HomeFilterBar({ activeCategory, isFree, sort }: HomeFilterBarProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        <Link
          href={buildUrl('all', false, sort)}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
            activeCategory === 'all' && !isFree
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-white text-foreground hover:bg-muted'
          }`}
        >
          All Items
        </Link>
        <Link
          href={buildUrl('all', true, sort)}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
            isFree
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-white text-foreground hover:bg-muted'
          }`}
        >
          Free Stuff 🎁
        </Link>
        {CATEGORIES.filter((c) => FEATURED_PILL_SLUGS.includes(c.slug as CategorySlug)).map((cat) => (
          <Link
            key={cat.slug}
            href={buildUrl(cat.slug, false, sort)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === cat.slug && !isFree
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-white text-foreground hover:bg-muted'
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span className="text-xs text-muted-foreground">Sort by:</span>
        <select
          value={sort}
          onChange={(e) => router.push(buildUrl(activeCategory, isFree, e.target.value))}
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
