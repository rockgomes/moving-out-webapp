'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ScrollablePills } from '@/components/common/ScrollablePills'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Listed' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

interface HomeFilterBarProps {
  activeTag: string
  availableTags: { slug: string; label: string }[]
  isFree: boolean
  sort: string
  category: string
}

function buildTagUrl(tag: string, isFree: boolean, sort: string, category: string) {
  const params = new URLSearchParams()
  if (category && category !== 'all') params.set('category', category)
  if (tag) params.set('tag', tag)
  if (isFree) params.set('free', '1')
  if (sort && sort !== 'newest') params.set('sort', sort)
  const qs = params.toString()
  return `/home${qs ? `?${qs}` : ''}`
}

const pillActive = 'border border-primary bg-primary-subtle text-primary font-semibold'
const pillInactive = 'bg-muted text-muted-foreground font-medium hover:bg-muted/80'
const pillBase = 'shrink-0 rounded-full px-3.5 py-1.5 text-xs transition-colors'

export function HomeFilterBar({ activeTag, availableTags, isFree, sort, category }: HomeFilterBarProps) {
  const router = useRouter()
  const noneActive = !activeTag && !isFree

  return (
    <div className="flex items-center justify-between gap-3">
      <ScrollablePills className="min-w-0 flex-1">
        {/* All Items — active when no tag and not free */}
        <Link
          href={buildTagUrl('', false, sort, category)}
          className={`${pillBase} ${noneActive ? pillActive : pillInactive}`}
        >
          All Items
        </Link>

        {/* Free Stuff */}
        <Link
          href={buildTagUrl('', true, sort, category)}
          className={`${pillBase} ${isFree ? pillActive : pillInactive}`}
        >
          Free Stuff 🎁
        </Link>

        {/* Dynamic tag pills — only tags present in the current context */}
        {availableTags.map((tag) => (
          <Link
            key={tag.slug}
            href={buildTagUrl(tag.slug, false, sort, category)}
            className={`${pillBase} ${activeTag === tag.slug && !isFree ? pillActive : pillInactive}`}
          >
            {tag.label}
          </Link>
        ))}
      </ScrollablePills>

      <div className="flex shrink-0 items-center gap-1">
        <span className="text-xs text-muted-foreground">Sort by:</span>
        <select
          value={sort}
          onChange={(e) => router.push(buildTagUrl(activeTag, isFree, e.target.value, category))}
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
