import Link from 'next/link'
import {
  LayoutGrid, Sofa, BedDouble, UtensilsCrossed,
  Bath, Monitor, Flower2, Package, ArrowRight,
} from 'lucide-react'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { Button } from '@/components/ui/button'
import { HomeFilterBar } from './HomeFilterBar'
import { CATEGORIES, ITEM_GROUPS, ITEMS_PER_PAGE, type CategorySlug } from '@/lib/constants'
import type { ListingWithSeller } from '@/types'

export const metadata: Metadata = {
  title: 'MoveOutSale — Local Moving Sales Near You',
  description: 'Browse items from neighbors who are moving. Great deals on furniture, appliances, and more.',
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  LayoutGrid, Sofa, BedDouble, UtensilsCrossed, Bath, Monitor, Flower2, Package,
}

interface HomePageProps {
  searchParams: Promise<{ category?: string; group?: string; page?: string; free?: string; sort?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { category, group, page, free, sort } = await searchParams
  const activeCategory = (category ?? 'all') as CategorySlug
  const activeGroup = group ?? ''
  const isFree = free === '1'
  const activeSort = sort ?? 'newest'
  const currentPage = Math.max(1, Number(page ?? 1))
  const offset = (currentPage - 1) * ITEMS_PER_PAGE

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Build sort order
  let sortColumn: string
  let sortAscending: boolean
  if (activeSort === 'oldest') { sortColumn = 'created_at'; sortAscending = true }
  else if (activeSort === 'price_asc') { sortColumn = 'price'; sortAscending = true }
  else if (activeSort === 'price_desc') { sortColumn = 'price'; sortAscending = false }
  else { sortColumn = 'created_at'; sortAscending = false } // newest (default)

  let query = supabase
    .from('listings')
    .select(`
      *,
      listing_photos ( id, storage_path, display_order ),
      profiles!listings_seller_id_fkey ( id, display_name, avatar_url )
    `, { count: 'exact' })
    .eq('status', 'active')
    .order(sortColumn, { ascending: sortAscending })
    .range(offset, offset + ITEMS_PER_PAGE - 1)

  // Sidebar category filter (room-based) and pill group filter (type-based) are mutually exclusive.
  // If a group is set, map it to its room categories.
  if (activeGroup) {
    const groupDef = ITEM_GROUPS.find((g) => g.slug === activeGroup)
    if (groupDef) query = query.in('category', groupDef.categories as string[])
  } else if (activeCategory !== 'all') {
    query = query.eq('category', activeCategory)
  }
  if (isFree) query = query.eq('price', 0)

  const [{ data: listings, count }, { data: savedRows }] = await Promise.all([
    query,
    user
      ? supabase.from('saved_listings').select('listing_id').eq('user_id', user.id)
      : Promise.resolve({ data: null }),
  ])
  const savedIds = new Set(savedRows?.map((r) => r.listing_id) ?? [])
  const totalPages = Math.ceil((count ?? 0) / ITEMS_PER_PAGE)

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (activeGroup) params.set('group', activeGroup)
    else if (activeCategory !== 'all') params.set('category', activeCategory)
    if (isFree) params.set('free', '1')
    if (activeSort !== 'newest') params.set('sort', activeSort)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return `/home${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Main body: sidebar + content */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-1">

        {/* Sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[260px] shrink-0 flex-col gap-1.5 overflow-y-auto border-r bg-white px-4 py-6 lg:flex">
          <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            My Area
          </p>

          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.icon]
            // Sidebar is active only when no group pill is selected and this category matches
            const isActive = !activeGroup && activeCategory === cat.slug && !isFree
            return (
              <Link
                key={cat.slug}
                href={cat.slug === 'all' ? '/home' : `/home?category=${cat.slug}`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                {cat.label}
              </Link>
            )
          })}

          {/* Seller promo card */}
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-semibold text-foreground">Moving Items?</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              List your items in seconds. Snap a photo, set a price, done.
            </p>
            <Button asChild size="sm" className="mt-3 w-full">
              <Link href="/sell">Start Listing</Link>
            </Button>
          </div>
        </aside>

        {/* Content area */}
        <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">

          {/* Hero Banner */}
          <div className="relative flex min-h-[220px] items-center overflow-hidden rounded-2xl bg-primary/10 px-8 sm:px-12">
            <div className="relative z-10 max-w-lg">
              <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                Give your pre-loved items<br className="hidden sm:block" /> a new home.
              </h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Browse items from neighbors moving in your area. Buy well, spend less.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild size="default">
                  <Link href="/sell">Start Selling</Link>
                </Button>
                <Button asChild variant="outline" size="default">
                  <Link href="/home?free=1">Browse Free Items</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Filter bar */}
          <HomeFilterBar
            activeGroup={activeGroup}
            isFree={isFree}
            sort={activeSort}
          />

          {/* Item count */}
          <p className="-mt-3 text-sm text-muted-foreground">
            {count ?? 0} item{count !== 1 ? 's' : ''} found
          </p>

          {/* Listing grid */}
          {listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {(listings as unknown as ListingWithSeller[]).map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isSaved={user ? savedIds.has(listing.id) : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
              <Package className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <p className="text-lg font-semibold text-foreground">No listings yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isFree
                  ? 'No free items right now. Check back soon!'
                  : activeGroup || activeCategory !== 'all'
                    ? 'No items in this category. Try a different one.'
                    : 'Be the first to list something in your area!'}
              </p>
              <Button asChild className="mt-4">
                <Link href="/sell">List an Item</Link>
              </Button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
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
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="flex flex-col items-center justify-between gap-6 bg-primary px-8 py-10 sm:flex-row sm:px-16">
        <div className="text-center sm:text-left">
          <p className="text-[22px] font-bold text-white">Moving out soon?</p>
          <p className="mt-1.5 max-w-[500px] text-sm text-white/80">
            List your items in seconds. Snap a photo, add a price, and let your
            neighbors near you clear the stock.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
            <Link href="/sell">Post Items</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="border border-white/40 text-white hover:bg-white/10">
            <Link href="/how-it-works" className="flex items-center gap-1.5">
              How it Works <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
