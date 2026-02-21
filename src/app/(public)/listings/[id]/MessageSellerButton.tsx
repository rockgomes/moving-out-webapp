'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { MessageCircle, Loader2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { startConversation } from './actions'

interface MessageSellerButtonProps {
  listingId: string
  sellerId: string
  isOwner: boolean
}

export function MessageSellerButton({ listingId, sellerId, isOwner }: MessageSellerButtonProps) {
  const [isPending, startTransition] = useTransition()

  if (isOwner) {
    return (
      <Button asChild variant="outline" size="lg" className="w-full">
        <Link href={`/sell/edit/${listingId}`}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Listing
        </Link>
      </Button>
    )
  }

  return (
    <Button
      size="lg"
      className="w-full"
      disabled={isPending}
      onClick={() => startTransition(() => startConversation(listingId, sellerId))}
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <MessageCircle className="mr-2 h-4 w-4" />
      )}
      {isPending ? 'Opening chat…' : 'Message Seller'}
    </Button>
  )
}
