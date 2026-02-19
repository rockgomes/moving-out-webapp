'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Send, Loader2, Package } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/types'

interface OtherPerson {
  id: string
  display_name: string | null
  avatar_url: string | null
}

interface ListingSnippet {
  id: string
  title: string
  price: number
  photoUrl: string | null
}

interface ChatThreadProps {
  conversationId: string
  currentUserId: string
  otherPerson: OtherPerson
  listing: ListingSnippet
  initialMessages: Message[]
}

export function ChatThread({
  conversationId,
  currentUserId,
  otherPerson,
  listing,
  initialMessages,
}: ChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isSending, startSending] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark messages as read on open
  useEffect(() => {
    supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', currentUserId)
      .eq('is_read', false)
      .then(() => {})
  }, [conversationId, currentUserId, supabase])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            // avoid duplicates (optimistic update may already have it)
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          // mark incoming messages as read immediately
          if (newMsg.sender_id !== currentUserId) {
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMsg.id)
              .then(() => {})
          }
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, currentUserId, supabase])

  async function handleSend() {
    const content = input.trim()
    if (!content) return
    setInput('')

    startSending(async () => {
      const { data: msg } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: currentUserId, content })
        .select()
        .single()

      // Optimistic: add if Realtime doesn't fire fast enough
      if (msg) {
        setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg])
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const otherInitials = otherPerson.display_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  // Group messages by date
  const grouped: { date: string; msgs: Message[] }[] = []
  for (const msg of messages) {
    const date = new Date(msg.created_at).toLocaleDateString('en', {
      weekday: 'long', month: 'short', day: 'numeric',
    })
    const last = grouped[grouped.length - 1]
    if (last?.date === date) {
      last.msgs.push(msg)
    } else {
      grouped.push({ date, msgs: [msg] })
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={otherPerson.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              {otherInitials ?? '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">{otherPerson.display_name ?? 'User'}</p>
            <p className="text-xs text-muted-foreground">Active now</p>
          </div>
        </div>

        {/* Listing chip */}
        <Link
          href={`/listings/${listing.id}`}
          className="flex items-center gap-2 rounded-xl border bg-muted/50 px-3 py-1.5 transition-colors hover:bg-muted"
        >
          {listing.photoUrl ? (
            <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-muted">
              <Image src={listing.photoUrl} alt={listing.title} fill className="object-cover" sizes="32px" />
            </div>
          ) : (
            <Package className="h-5 w-5 text-muted-foreground" />
          )}
          <div className="hidden sm:block">
            <p className="max-w-[140px] truncate text-xs font-medium text-foreground">{listing.title}</p>
            <p className="text-xs text-primary font-semibold">
              {listing.price === 0 ? 'Free' : `$${listing.price}`}
            </p>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hi to {otherPerson.display_name?.split(' ')[0] ?? 'the seller'}!
            </p>
          </div>
        ) : (
          grouped.map(({ date, msgs }) => (
            <div key={date}>
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">{date}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="flex flex-col gap-2">
                {msgs.map((msg) => {
                  const isMine = msg.sender_id === currentUserId
                  const time = new Date(msg.created_at).toLocaleTimeString('en', {
                    hour: 'numeric', minute: '2-digit',
                  })
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      {!isMine && (
                        <Avatar className="mr-2 mt-auto h-6 w-6 shrink-0">
                          <AvatarImage src={otherPerson.avatar_url ?? undefined} />
                          <AvatarFallback className="text-[9px]">{otherInitials}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`group flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`max-w-[340px] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            isMine
                              ? 'rounded-br-sm bg-primary text-primary-foreground'
                              : 'rounded-bl-sm bg-muted text-foreground'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                          {time}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-input bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          <Button
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl"
            disabled={!input.trim() || isSending}
            onClick={handleSend}
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
