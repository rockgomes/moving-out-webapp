import { MessageSquare } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { ConversationItem } from './ConversationItem'

type RawConversation = {
  id: string
  buyer_id: string
  seller_id: string
  created_at: string
  listings: {
    id: string
    title: string
    listing_photos: { storage_path: string; display_order: number }[]
  } | null
  messages: {
    id: string
    content: string
    created_at: string
    sender_id: string
    is_read: boolean
  }[]
  buyer_profile: { id: string; display_name: string | null; avatar_url: string | null } | null
  seller_profile: { id: string; display_name: string | null; avatar_url: string | null } | null
}

export async function ConversationList({ userId }: { userId: string }) {
  const supabase = await createServerClient()

  const { data: raw } = await supabase
    .from('conversations')
    .select(`
      id, buyer_id, seller_id, created_at,
      listings ( id, title, listing_photos ( storage_path, display_order ) ),
      messages ( id, content, created_at, sender_id, is_read ),
      buyer_profile:profiles!buyer_id ( id, display_name, avatar_url ),
      seller_profile:profiles!seller_id ( id, display_name, avatar_url )
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  const conversations = (raw as unknown as RawConversation[]) ?? []

  // Sort each conversation's messages by time, pick last one
  const sorted = conversations
    .map((c) => {
      const msgs = [...(c.messages ?? [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      const lastMsg = msgs[0] ?? null
      const unread = msgs.filter((m) => !m.is_read && m.sender_id !== userId).length
      const isBuyer = c.buyer_id === userId
      const other = isBuyer ? c.seller_profile : c.buyer_profile
      const photo = c.listings?.listing_photos
        ?.slice()
        .sort((a, b) => a.display_order - b.display_order)[0]
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const photoUrl = photo
        ? `${supabaseUrl}/storage/v1/object/public/listing-photos/${photo.storage_path}`
        : null
      return { c, lastMsg, unread, other, photoUrl, lastTime: lastMsg?.created_at ?? c.created_at }
    })
    .sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime())

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm font-medium text-foreground">No conversations yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Message a seller to get started</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0.5 p-2">
      {sorted.map(({ c, lastMsg, unread, other, photoUrl }) => (
        <ConversationItem
          key={c.id}
          id={c.id}
          otherPersonName={other?.display_name ?? null}
          otherPersonAvatar={other?.avatar_url ?? null}
          listingTitle={c.listings?.title ?? 'Item'}
          listingPhotoUrl={photoUrl}
          lastMessage={lastMsg?.content ?? null}
          lastMessageTime={lastMsg?.created_at ?? null}
          unreadCount={unread}
        />
      ))}
    </div>
  )
}
