import { NavBar } from '@/components/common/NavBar'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: profile }, { data: convRows }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('conversations').select('id').or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`),
  ])

  const convIds = convRows?.map((c) => c.id) ?? []
  let unreadCount = 0
  if (convIds.length > 0) {
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)
      .neq('sender_id', user.id)
      .in('conversation_id', convIds)
    unreadCount = count ?? 0
  }

  return (
    <>
      <NavBar user={profile} unreadCount={unreadCount ?? 0} />
      <main>{children}</main>
    </>
  )
}
