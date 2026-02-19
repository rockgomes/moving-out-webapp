// Auth pages have their own branding layout (no app NavBar)
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
