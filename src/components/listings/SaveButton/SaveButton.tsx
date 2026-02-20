'use client'

import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { toggleSave } from './actions'

interface SaveButtonProps {
  listingId: string
  isSaved: boolean
  className?: string
}

export function SaveButton({ listingId, isSaved: initialSaved, className = '' }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved)
  const [isPending, startTransition] = useTransition()

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const next = !saved
    setSaved(next) // optimistic
    startTransition(async () => {
      await toggleSave(listingId, saved)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={saved ? 'Remove from saved' : 'Save listing'}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 disabled:opacity-60 ${className}`}
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          saved ? 'fill-red-500 text-red-500' : 'text-foreground/60'
        }`}
      />
    </button>
  )
}
