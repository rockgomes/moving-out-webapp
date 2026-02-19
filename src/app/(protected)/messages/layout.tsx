import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { ConversationList } from '@/components/messaging/ConversationList'

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left: conversation list */}
      <aside className="flex w-80 shrink-0 flex-col border-r bg-white">
        <div className="border-b px-4 py-4">
          <h1 className="text-lg font-bold text-foreground">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading…</div>}>
            <ConversationList userId={user.id} />
          </Suspense>
        </div>
      </aside>

      {/* Right: thread or empty state */}
      <main className="flex flex-1 flex-col overflow-hidden bg-muted/20">
        {children}
      </main>
    </div>
  )
}
