import Link from 'next/link'
import {
  LayoutGrid, Sofa, Plug, Flower2,
  Monitor, Shirt, Package, Truck,
} from 'lucide-react'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CATEGORIES, ITEMS_PER_PAGE, type CategorySlug } from '@/lib/constants'
import type { ListingWithSeller } from '@/types'
import { BrowseFilters } from './BrowseFilters'

export const metadata: Metadata = {
  title: 'Browse Listings | MoveOutSale',
  description: 'Search and filter items from neighbors who are moving. Filter by category, condition, and price.',
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  LayoutGrid, Sofa, Plug, Flower2, Monitor, Shirt, Package,
}

interface BrowsePageProps {
  searchParams: Promise<{
    category?: string
    q?: string
    condition?: string
    min?: string
    max?: string
    page?: string
    type?: string
  }>
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const { category, q, condition, min, max, page, type } = await searchParams

  const activeCategory = (category ?? 'all') as CategorySlug
  const currentPage = Math.max(1, Number(page ?? 1))
  const offset = (currentPage - 1) * ITEMS_PER_PAGE

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Moving Sales view
  if (type === 'sales') {
    const { data: sales } = await supabase
      .from('moving_sales')
      .select('*, profiles ( id, display_name, avatar_url, city, country ), listings ( id )')
      .order('created_at', { ascending: false })
      .limit(24)

    const salesWithCount = (sales ?? []).map((s) => ({
      ...s,
      itemCount: (s.listings as unknown as { id: string }[])?.length ?? 0,
      seller: s.profiles as unknown as { id: string; display_name: string | null; avatar_url: string | null; city: string | null; country: string | null },
    })).filter((s) => s.itemCount > 0)

    return (
      <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <Truck className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">Moving Sales</h1>
          <span className="text-sm text-muted-foreground">({salesWithCount.length})</span>
          <Link href="/browse" className="ml-auto text-sm text-muted-foreground hover:text-foreground">
            Browse individual items →
          </Link>
        </div>
        {salesWithCount.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Truck className="mb-4 h-12 w-12 text-muted-foreground/20" />
            <p className="text-lg font-semibold">No moving sales yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first to start a moving sale!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {salesWithCount.map((sale) => {
              const initials = sale.seller.display_name
                ?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
              return (
                <Link
                  key={sale.id}
                  href={`/sale/${sale.id}`}
                  className="flex flex-col gap-4 rounded-xl border bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={sale.seller.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {initials ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{sale.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {sale.seller.display_name ?? 'Anonymous'}
                        {sale.seller.city ? ` · ${sale.seller.city}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {sale.itemCount} item{sale.itemCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs font-medium text-primary">View Sale →</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  let query = supabase
    .from('listings')
    .select(`
      *,
      listing_photos ( id, storage_path, display_order ),
      profiles!listings_seller_id_fkey ( id, display_name, avatar_url )
    `, { count: 'exact' })
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1)

  if (activeCategory !== 'all') query = query.eq('category', activeCategory)
  if (condition) query = query.eq('condition', condition as 'new' | 'like_new' | 'good' | 'fair')
  if (min) query = query.gte('price', Number(min))
  if (max) query = query.lte('price', Number(max))
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)

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
    if (category && category !== 'all') params.set('category', category)
    if (q) params.set('q', q)
    if (condition) params.set('condition', condition)
    if (min) params.set('min', min)
    if (max) params.set('max', max)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return `/browse${qs ? `?${qs}` : ''}`
  }

  function categoryUrl(slug: string) {
    const params = new URLSearchParams()
    if (slug !== 'all') params.set('category', slug)
    if (q) params.set('q', q)
    if (condition) params.set('condition', condition)
    if (min) params.set('min', min)
    if (max) params.set('max', max)
    const qs = params.toString()
    return `/browse${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px]">

      {/* Sidebar */}
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[260px] shrink-0 flex-col gap-1 overflow-y-auto border-r px-4 py-6 lg:flex">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Category
        </p>
        {CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.icon]
          const isActive = activeCategory === cat.slug
          return (
            <Link
              key={cat.slug}
              href={categoryUrl(cat.slug)}
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
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-5 p-5 lg:p-8">

        {/* Page heading + filters */}
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h1 className="text-xl font-bold tracking-tight">
              {q ? `Results for "${q}"` : activeCategory !== 'all'
                ? CATEGORIES.find((c) => c.slug === activeCategory)?.label ?? 'Browse'
                : 'Browse All Items'}
            </h1>
            <span className="text-sm text-muted-foreground">
              {count ?? 0} item{count !== 1 ? 's' : ''}
            </span>
          </div>

          <BrowseFilters
            category={activeCategory}
            q={q ?? ''}
            condition={condition ?? ''}
            min={min ?? ''}
            max={max ?? ''}
          />
        </div>

        {/* Mobile category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={categoryUrl(cat.slug)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === cat.slug
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-muted'
              }`}
            >
              {cat.label}
            </Link>
          ))}
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
          <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
            <Package className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-lg font-semibold">No listings found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {q
                ? `No results for "${q}". Try different keywords or remove some filters.`
                : 'Nothing here yet — try a different category or check back soon.'}
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/browse">Clear all filters</Link>
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
  )
}
