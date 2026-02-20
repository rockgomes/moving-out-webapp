import Link from 'next/link'
import {
  LayoutGrid, Sofa, BedDouble, UtensilsCrossed,
  Bath, Monitor, Package, ArrowRight,
} from 'lucide-react'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { Button } from '@/components/ui/button'
import { CATEGORIES, ITEMS_PER_PAGE, type CategorySlug } from '@/lib/constants'
import type { ListingWithSeller } from '@/types'

export const metadata: Metadata = {
  title: 'MoveOutSale — Local Moving Sales Near You',
  description: 'Browse items from neighbors who are moving. Great deals on furniture, appliances, and more.',
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  LayoutGrid, Sofa, BedDouble, UtensilsCrossed, Bath, Monitor, Package,
}

interface HomePageProps {
  searchParams: Promise<{ category?: string; page?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { category, page } = await searchParams
  const activeCategory = (category ?? 'all') as CategorySlug
  const currentPage = Math.max(1, Number(page ?? 1))
  const offset = (currentPage - 1) * ITEMS_PER_PAGE

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('listings')
    .select(`
      *,
      listing_photos ( id, storage_path, display_order ),
      profiles ( id, display_name, avatar_url )
    `, { count: 'exact' })
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1)

  if (activeCategory !== 'all') {
    query = query.eq('category', activeCategory)
  }

  const [{ data: listings, count }, { data: savedRows }] = await Promise.all([
    query,
    user
      ? supabase.from('saved_listings').select('listing_id').eq('user_id', user.id)
      : Promise.resolve({ data: null }),
  ])
  const savedIds = new Set(savedRows?.map((r) => r.listing_id) ?? [])
  const totalPages = Math.ceil((count ?? 0) / ITEMS_PER_PAGE)

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
            const isActive = activeCategory === cat.slug
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
                  <Link href="/home">Browse Free Items</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Filter bar — mobile pills + item count */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={cat.slug === 'all' ? '/home' : `/home?category=${cat.slug}`}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    activeCategory === cat.slug
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-white text-foreground hover:bg-muted'
                  }`}
                >
                  {cat.label}
                </Link>
              ))}
            </div>
            <p className="shrink-0 text-sm text-muted-foreground">
              {count ?? 0} item{count !== 1 ? 's' : ''} found
            </p>
          </div>

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
                {activeCategory !== 'all'
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
                  <Link
                    href={`/home?${activeCategory !== 'all' ? `category=${activeCategory}&` : ''}page=${currentPage - 1}`}
                  >
                    Previous
                  </Link>
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              {currentPage < totalPages && (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/home?${activeCategory !== 'all' ? `category=${activeCategory}&` : ''}page=${currentPage + 1}`}
                  >
                    Next
                  </Link>
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
