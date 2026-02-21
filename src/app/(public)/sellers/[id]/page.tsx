import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Calendar, Package, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ListingCard } from '@/components/listings/ListingCard'
import { CATEGORIES, LISTING_TAGS, ITEMS_PER_PAGE } from '@/lib/constants'
import { ScrollablePills } from '@/components/common/ScrollablePills'
import type { ListingWithSeller } from '@/types'

interface SellerPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ category?: string; tag?: string; page?: string }>
}

export async function generateMetadata({ params }: SellerPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: seller } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', id)
    .single()

  if (!seller) return { title: 'Seller | MoveOutSale' }
  return {
    title: `${seller.display_name ?? 'Seller'}'s Moving Sale | MoveOutSale`,
    description: `Browse all items listed by ${seller.display_name ?? 'this seller'} on MoveOutSale.`,
  }
}

export default async function SellerPage({ params, searchParams }: SellerPageProps) {
  const { id } = await params
  const { category, tag, page } = await searchParams

  const activeCategory = category ?? 'all'
  const activeTag = tag ?? ''
  const currentPage = Math.max(1, Number(page ?? 1))
  const offset = (currentPage - 1) * ITEMS_PER_PAGE

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch seller profile
  const { data: seller } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, city, state, country, created_at')
    .eq('id', id)
    .single()

  if (!seller) notFound()

  // Fetch all active listings for category breakdown + tag inventory
  const { data: allListings } = await supabase
    .from('listings')
    .select('id, category, tags')
    .eq('seller_id', id)
    .eq('status', 'active')

  const totalItems = allListings?.length ?? 0

  // Build category counts
  const categoryCounts: Record<string, number> = {}
  for (const l of allListings ?? []) {
    categoryCounts[l.category] = (categoryCounts[l.category] ?? 0) + 1
  }
  const categoryList = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([slug, cnt]) => ({
      slug,
      label: CATEGORIES.find((c) => c.slug === slug)?.label ?? slug,
      count: cnt,
    }))

  // Derive available tag pills from actual listing data
  const usedTagSlugs = new Set(
    (allListings ?? []).flatMap((l) => (l as unknown as { tags: string[] }).tags ?? [])
  )
  const availableTags = LISTING_TAGS.filter((t) => usedTagSlugs.has(t.slug))

  // Fetch paginated listings
  let listingQuery = supabase
    .from('listings')
    .select(
      '*, listing_photos ( id, storage_path, display_order ), profiles!listings_seller_id_fkey ( id, display_name, avatar_url )',
      { count: 'exact' },
    )
    .eq('seller_id', id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1)

  if (activeCategory !== 'all') listingQuery = listingQuery.eq('category', activeCategory)
  if (activeTag) listingQuery = listingQuery.contains('tags', [activeTag])

  const [{ data: listings, count }, { data: savedRows }] = await Promise.all([
    listingQuery,
    user
      ? supabase.from('saved_listings').select('listing_id').eq('user_id', user.id)
      : Promise.resolve({ data: null }),
  ])

  const savedIds = new Set(savedRows?.map((r) => r.listing_id) ?? [])
  const totalPages = Math.ceil((count ?? 0) / ITEMS_PER_PAGE)

  const sellerInitials = seller.display_name
    ?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const memberYear = new Date(seller.created_at).getFullYear()
  const location = [seller.city, seller.state].filter(Boolean).join(', ')

  function categoryUrl(slug: string) {
    const qs = new URLSearchParams()
    if (slug !== 'all') qs.set('category', slug)
    if (activeTag) qs.set('tag', activeTag)
    const s = qs.toString()
    return `/sellers/${id}${s ? `?${s}` : ''}`
  }

  function tagUrl(slug: string) {
    const qs = new URLSearchParams()
    if (activeCategory !== 'all') qs.set('category', activeCategory)
    if (slug) qs.set('tag', slug)
    const s = qs.toString()
    return `/sellers/${id}${s ? `?${s}` : ''}`
  }

  function pageUrl(p: number) {
    const qs = new URLSearchParams()
    if (activeCategory !== 'all') qs.set('category', activeCategory)
    if (activeTag) qs.set('tag', activeTag)
    if (p > 1) qs.set('page', String(p))
    const s = qs.toString()
    return `/sellers/${id}${s ? `?${s}` : ''}`
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/home" className="hover:text-foreground">Browse</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{seller.display_name ?? 'Seller'}&apos;s Moving Sale</span>
      </nav>

      {/* Seller profile card */}
      <div className="mb-8 flex flex-col gap-4 rounded-2xl border bg-white p-6 sm:flex-row sm:items-center">
        <Avatar className="h-16 w-16 shrink-0">
          <AvatarImage src={seller.avatar_url ?? undefined} alt={seller.display_name ?? 'Seller'} />
          <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
            {sellerInitials ?? 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-bold text-foreground">
            {seller.display_name ?? 'Anonymous'}&apos;s Moving Sale
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              Member since {memberYear}
            </span>
            <Badge variant="secondary">
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </div>

      {/* Room filter pills — only shown when seller has items in multiple categories */}
      {categoryList.length > 1 && (
        <ScrollablePills className="mb-3">
          <Link
            href={categoryUrl('all')}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs transition-colors ${
              activeCategory === 'all'
                ? 'border border-primary bg-primary-subtle text-primary font-semibold'
                : 'bg-muted text-muted-foreground font-medium hover:bg-muted/80'
            }`}
          >
            All Rooms <span className="opacity-60">({totalItems})</span>
          </Link>
          {categoryList.map(({ slug, label, count: cnt }) => (
            <Link
              key={slug}
              href={categoryUrl(slug)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                activeCategory === slug
                  ? 'border border-primary bg-primary-subtle text-primary font-semibold'
                  : 'bg-muted text-muted-foreground font-medium hover:bg-muted/80'
              }`}
            >
              {label} <span className="opacity-60">({cnt})</span>
            </Link>
          ))}
        </ScrollablePills>
      )}

      {/* Tag filter pills — derived from seller's actual listing tags */}
      {availableTags.length > 0 && (
        <ScrollablePills className="mb-6">
          <Link
            href={tagUrl('')}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs transition-colors ${
              !activeTag
                ? 'border border-primary bg-primary-subtle text-primary font-semibold'
                : 'bg-muted text-muted-foreground font-medium hover:bg-muted/80'
            }`}
          >
            All Items
          </Link>
          {availableTags.map(({ slug, label }) => (
            <Link
              key={slug}
              href={tagUrl(slug)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                activeTag === slug
                  ? 'border border-primary bg-primary-subtle text-primary font-semibold'
                  : 'bg-muted text-muted-foreground font-medium hover:bg-muted/80'
              }`}
            >
              {label}
            </Link>
          ))}
        </ScrollablePills>
      )}

      {/* Listing grid */}
      {listings && listings.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(listings as unknown as ListingWithSeller[]).map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isSaved={user ? savedIds.has(listing.id) : undefined}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {currentPage > 1 && (
                <Button asChild variant="outline" size="sm">
                  <Link href={pageUrl(currentPage - 1)}>Previous</Link>
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              {currentPage < totalPages && (
                <Button asChild variant="outline" size="sm">
                  <Link href={pageUrl(currentPage + 1)}>Next</Link>
                </Button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <p className="text-lg font-semibold">No items here</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCategory !== 'all'
              ? 'No items in this category. Try a different one.'
              : 'This seller has no active listings right now.'}
          </p>
          {activeCategory !== 'all' && (
            <Button asChild variant="outline" className="mt-4">
              <Link href={categoryUrl('all')}>View all items</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
