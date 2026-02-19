import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Data Deletion | MoveOutSale',
}

export default function DataDeletionPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8 text-center">
      <h1 className="mb-4 text-3xl font-bold tracking-tight">Delete Your Data</h1>
      <p className="mb-6 text-muted-foreground leading-relaxed">
        To request deletion of your MoveOutSale account and all associated data (listings, messages,
        profile information), send an email to the address below. We will process your request
        within 30 days.
      </p>
      <a
        href="mailto:privacy@moveoutsale.com?subject=Data Deletion Request"
        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
      >
        Request Data Deletion
      </a>
      <p className="mt-6 text-xs text-muted-foreground">
        Email: privacy@moveoutsale.com
      </p>
    </div>
  )
}
