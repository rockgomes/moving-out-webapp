import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Package, Sofa, BedDouble, UtensilsCrossed,
  Bath, Monitor, LayoutGrid, ChevronRight,
} from 'lucide-react'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CATEGORIES, ITEMS_PER_PAGE } from '@/lib/constants'
import type { ListingWithSeller } from '@/types'

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  LayoutGrid, Sofa, BedDouble, UtensilsCrossed, Bath, Monitor, Package,
}

interface SalePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ category?: string; page?: string }>
}

export async function generateMetadata({ params }: SalePageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: sale } = await supabase
    .from('moving_sales')
    .select('title, description')
    .eq('id', id)
    .single()

  if (!sale) return { title: 'Moving Sale | MoveOutSale' }
  return {
    title: `${sale.title} | MoveOutSale`,
    description: sale.description ?? `Browse all items from this moving sale.`,
  }
}

export default async function SalePage({ params, searchParams }: SalePageProps) {
  const { id } = await params
  const { category, page } = await searchParams

  const activeCategory = category ?? 'all'
  const currentPage = Math.max(1, Number(page ?? 1))
  const offset = (currentPage - 1) * ITEMS_PER_PAGE

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch the moving sale + seller profile
  const { data: sale } = await supabase
    .from('moving_sales')
    .select('*, profiles ( id, display_name, avatar_url, city, country )')
    .eq('id', id)
    .single()

  if (!sale) notFound()

  const seller = sale.profiles as unknown as {
    id: string; display_name: string | null; avatar_url: string | null; city: string | null; country: string | null
  }

  // Fetch all active listings for category breakdown (for featured bundles)
  const { data: allListings } = await supabase
    .from('listings')
    .select('id, category, listing_photos ( storage_path, display_order )')
    .eq('moving_sale_id', id)
    .eq('status', 'active')

  // Build category counts for featured bundles
  const categoryCounts: Record<string, number> = {}
  for (const l of allListings ?? []) {
    categoryCounts[l.category] = (categoryCounts[l.category] ?? 0) + 1
  }
  const featuredCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([slug, count]) => ({
      slug,
      label: CATEGORIES.find((c) => c.slug === slug)?.label ?? slug,
      icon: CATEGORIES.find((c) => c.slug === slug)?.icon ?? 'Package',
      count,
    }))

  // Fetch paginated listings (filtered by category if selected)
  let listingQuery = supabase
    .from('listings')
    .select('*, listing_photos ( id, storage_path, display_order ), profiles!listings_seller_id_fkey ( id, display_name, avatar_url )', { count: 'exact' })
    .eq('moving_sale_id', id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1)

  if (activeCategory !== 'all') listingQuery = listingQuery.eq('category', activeCategory)

  const [{ data: listings, count }, { data: savedRows }] = await Promise.all([
    listingQuery,
    user
      ? supabase.from('saved_listings').select('listing_id').eq('user_id', user.id)
      : Promise.resolve({ data: null }),
  ])

  const savedIds = new Set(savedRows?.map((r) => r.listing_id) ?? [])
  const totalPages = Math.ceil((count ?? 0) / ITEMS_PER_PAGE)
  const totalItems = allListings?.length ?? 0

  const sellerInitials = seller.display_name
    ?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  function categoryUrl(slug: string) {
    return `/sale/${id}${slug !== 'all' ? `?category=${slug}` : ''}`
  }

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (activeCategory !== 'all') params.set('category', activeCategory)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return `/sale/${id}${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px]">

      {/* Sidebar — category nav */}
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[260px] shrink-0 flex-col gap-1 overflow-y-auto border-r px-4 py-6 lg:flex">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Browse by Room
        </p>
        <Link
          href={categoryUrl('all')}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            activeCategory === 'all' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
          }`}
        >
          <LayoutGrid className="h-4 w-4 shrink-0" />
          All Items
          <span className="ml-auto text-xs text-muted-foreground">{totalItems}</span>
        </Link>
        {featuredCategories.map(({ slug, label, icon, count: cnt }) => {
          const Icon = CATEGORY_ICONS[icon] ?? Package
          return (
            <Link
              key={slug}
              href={categoryUrl(slug)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                activeCategory === slug ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              <span className="ml-auto text-xs text-muted-foreground">{cnt}</span>
            </Link>
          )
        })}
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-6 p-5 lg:p-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/browse" className="hover:text-foreground">Browse</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{sale.title}</span>
        </nav>

        {/* Sale header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{sale.title}</h1>
                <Badge variant="default" className="shrink-0">Active</Badge>
              </div>
              {sale.description && (
                <p className="text-sm text-muted-foreground">{sale.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={seller.avatar_url ?? undefined} alt={seller.display_name ?? 'Seller'} />
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {sellerInitials ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold leading-tight">{seller.display_name ?? 'Anonymous'}</p>
                {(seller.city || seller.country) && (
                  <p className="text-xs text-muted-foreground">
                    {[seller.city, seller.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Featured category bundles */}
        {featuredCategories.length > 0 && activeCategory === 'all' && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Featured Bundles
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {featuredCategories.map(({ slug, label, icon, count: cnt }) => {
                const Icon = CATEGORY_ICONS[icon] ?? Package
                return (
                  <Link
                    key={slug}
                    href={categoryUrl(slug)}
                    className="flex items-center gap-4 rounded-xl border bg-white p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{label}</p>
                      <p className="text-xs text-muted-foreground">{cnt} item{cnt !== 1 ? 's' : ''}</p>
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Filter pills + count */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Link
              href={categoryUrl('all')}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === 'all'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-muted'
              }`}
            >
              All Items
            </Link>
            {featuredCategories.map(({ slug, label }) => (
              <Link
                key={slug}
                href={categoryUrl(slug)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  activeCategory === slug
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:bg-muted'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          <span className="shrink-0 text-sm text-muted-foreground">
            {count ?? 0} item{count !== 1 ? 's' : ''}
          </span>
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
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-lg font-semibold">No items here</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different category or check back soon.
            </p>
            {activeCategory !== 'all' && (
              <Button asChild variant="outline" className="mt-4">
                <Link href={categoryUrl('all')}>View all items</Link>
              </Button>
            )}
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
