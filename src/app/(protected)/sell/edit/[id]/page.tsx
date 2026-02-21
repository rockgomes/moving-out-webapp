import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { EditListingForm } from './EditListingForm'
import type { ListingPhoto, Profile } from '@/types'

interface EditListingPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditListingPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerClient()
  const { data } = await supabase.from('listings').select('title').eq('id', id).single()
  return { title: data ? `Edit: ${data.title} | MoveOutSale` : 'Edit Listing | MoveOutSale' }
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: listing }, { data: photos }, { data: profile }] = await Promise.all([
    supabase.from('listings').select('*').eq('id', id).single(),
    supabase
      .from('listing_photos')
      .select('id, listing_id, storage_path, display_order')
      .eq('listing_id', id)
      .order('display_order'),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  if (!listing) notFound()
  if (listing.seller_id !== user.id) notFound()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/my-listings" className="hover:text-foreground">My Listings</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/listings/${id}`} className="hover:text-foreground line-clamp-1 max-w-[200px]">
          {listing.title}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">Edit</span>
      </nav>

      <h1 className="mb-6 text-2xl font-bold tracking-tight">Edit Listing</h1>

      <EditListingForm
        listing={listing}
        photos={(photos ?? []) as ListingPhoto[]}
        profile={profile as unknown as Profile}
      />
    </div>
  )
}
