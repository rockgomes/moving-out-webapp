'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

type Status = 'active' | 'reserved' | 'sold'

const NEXT_STATUS: Record<Status, { label: string; next: Status }> = {
  active: { label: 'Mark Reserved', next: 'reserved' },
  reserved: { label: 'Mark Sold', next: 'sold' },
  sold: { label: 'Relist', next: 'active' },
}

export function StatusButton({ listingId, currentStatus }: { listingId: string; currentStatus: Status }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { label, next } = NEXT_STATUS[currentStatus]

  function handleClick() {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.from('listings').update({ status: next }).eq('id', listingId)
      router.refresh()
    })
  }

  return (
    <Button variant="secondary" size="sm" disabled={isPending} onClick={handleClick}>
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : label}
    </Button>
  )
}
