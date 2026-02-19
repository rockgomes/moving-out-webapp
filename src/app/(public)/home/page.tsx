import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MoveOutSale — Local Moving Sales Near You',
}

// TODO (Phase 2): Replace with full homepage implementation
export default function HomePage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold">MoveOutSale</h1>
        <p className="mt-2 text-muted-foreground">Homepage coming in Phase 2</p>
      </div>
    </div>
  )
}
