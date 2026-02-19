import { NavBar } from '@/components/common/NavBar'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <NavBar />
      <main>{children}</main>
    </>
  )
}
