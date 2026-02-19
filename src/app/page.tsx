// Redirect root to the public homepage inside (public) route group
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/home')
}
