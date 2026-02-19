'use client'

import { useTransition } from 'react'
import { MessageCircle, Loader2 } from 'lucide-react'
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
      <Button variant="outline" size="lg" className="w-full" disabled>
        This is your listing
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
