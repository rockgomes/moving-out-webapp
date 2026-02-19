import { MessageSquare } from 'lucide-react'

export const metadata = { title: 'Messages | MoveOutSale' }

export default function MessagesIndexPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground/30" />
      <p className="text-base font-semibold text-foreground">Your messages</p>
      <p className="mt-1 text-sm text-muted-foreground">Select a conversation to start chatting</p>
    </div>
  )
}
