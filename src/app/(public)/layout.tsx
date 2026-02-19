import { NavBar } from '@/components/common/NavBar'
import { createServerClient } from '@/lib/supabase/server'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <>
      <NavBar user={profile} />
      <main>{children}</main>
    </>
  )
}
