import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ChatThread } from '@/components/messaging/ChatThread'
import type { Message } from '@/types'

interface MessagesThreadPageProps {
  params: Promise<{ id: string }>
}

export default async function MessagesThreadPage({ params }: MessagesThreadPageProps) {
  const { id: conversationId } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch conversation with participants and listing
  const { data: conversation } = await supabase
    .from('conversations')
    .select(`
      id, buyer_id, seller_id,
      listings ( id, title, price, country, listing_photos ( storage_path, display_order ) ),
      buyer_profile:profiles!buyer_id ( id, display_name, avatar_url ),
      seller_profile:profiles!seller_id ( id, display_name, avatar_url )
    `)
    .eq('id', conversationId)
    .single()

  if (!conversation) notFound()

  // Verify the current user is part of this conversation
  const conv = conversation as unknown as {
    id: string
    buyer_id: string
    seller_id: string
    listings: { id: string; title: string; price: number; country: string | null; listing_photos: { storage_path: string; display_order: number }[] } | null
    buyer_profile: { id: string; display_name: string | null; avatar_url: string | null } | null
    seller_profile: { id: string; display_name: string | null; avatar_url: string | null } | null
  }

  if (conv.buyer_id !== user.id && conv.seller_id !== user.id) notFound()

  const isBuyer = conv.buyer_id === user.id
  const otherPerson = isBuyer ? conv.seller_profile : conv.buyer_profile

  // Build listing snippet
  const photo = conv.listings?.listing_photos
    ?.slice()
    .sort((a, b) => a.display_order - b.display_order)[0]
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const listing = {
    id: conv.listings?.id ?? '',
    title: conv.listings?.title ?? 'Item',
    price: conv.listings?.price ?? 0,
    country: conv.listings?.country ?? null,
    photoUrl: photo
      ? `${supabaseUrl}/storage/v1/object/public/listing-photos/${photo.storage_path}`
      : null,
  }

  // Fetch initial messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  return (
    <ChatThread
      conversationId={conversationId}
      currentUserId={user.id}
      otherPerson={{
        id: otherPerson?.id ?? '',
        display_name: otherPerson?.display_name ?? null,
        avatar_url: otherPerson?.avatar_url ?? null,
      }}
      listing={listing}
      initialMessages={(messages as Message[]) ?? []}
    />
  )
}
