'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ConversationItemProps {
  id: string
  otherPersonName: string | null
  otherPersonAvatar: string | null
  listingTitle: string
  listingPhotoUrl: string | null
  lastMessage: string | null
  lastMessageTime: string | null
  unreadCount: number
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export function ConversationItem({
  id,
  otherPersonName,
  otherPersonAvatar,
  listingTitle,
  listingPhotoUrl,
  lastMessage,
  lastMessageTime,
  unreadCount,
}: ConversationItemProps) {
  const pathname = usePathname()
  const isActive = pathname === `/messages/${id}`
  const initials = otherPersonName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <Link
      href={`/messages/${id}`}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${
        isActive ? 'bg-primary/10' : 'hover:bg-muted'
      }`}
    >
      {/* Avatar */}
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={otherPersonAvatar ?? undefined} />
        <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
          {initials ?? '?'}
        </AvatarFallback>
      </Avatar>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className={`truncate text-sm font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
            {otherPersonName ?? 'Unknown'}
          </span>
          {lastMessageTime && (
            <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(lastMessageTime)}</span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">Re: {listingTitle}</p>
        {lastMessage && (
          <p className={`truncate text-xs ${unreadCount > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
            {lastMessage}
          </p>
        )}
      </div>

      {/* Listing thumbnail */}
      {listingPhotoUrl ? (
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
          <Image src={listingPhotoUrl} alt={listingTitle} fill className="object-cover" sizes="40px" />
        </div>
      ) : null}

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {unreadCount}
        </span>
      )}
    </Link>
  )
}
