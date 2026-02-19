import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | MoveOutSale',
}

export default function PrivacyPage() {
  const lastUpdated = 'February 20, 2026'
  const contactEmail = 'privacy@moveoutsale.com'
  const appName = 'MoveOutSale'

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mb-8 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

      <div className="prose prose-sm max-w-none text-foreground [&>h2]:mb-3 [&>h2]:mt-8 [&>h2]:text-xl [&>h2]:font-semibold [&>p]:mb-4 [&>p]:leading-relaxed [&>ul]:mb-4 [&>ul]:list-disc [&>ul]:pl-6 [&>ul>li]:mb-1">

        <p>
          {appName} (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is a peer-to-peer
          marketplace that helps people selling items when moving. This Privacy Policy explains how
          we collect, use, and protect your personal information when you use our service at{' '}
          <a href="https://moveoutsale.com" className="text-primary underline">moveoutsale.com</a>.
        </p>

        <h2>1. Information We Collect</h2>
        <p>
          When you sign in with Facebook or Google, we receive the following information from those
          services:
        </p>
        <ul>
          <li>Your name and profile picture</li>
          <li>Your email address</li>
          <li>A unique identifier from the OAuth provider</li>
        </ul>
        <p>
          When you use {appName}, we also collect:
        </p>
        <ul>
          <li>Listings you create (title, description, photos, price, location)</li>
          <li>Messages you send to other users</li>
          <li>Your approximate location (country, city) for listing visibility</li>
          <li>Items you save/favorite</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Create and manage your account</li>
          <li>Display your listings to potential buyers</li>
          <li>Facilitate messaging between buyers and sellers</li>
          <li>Show you relevant listings near your location</li>
          <li>Send notifications about your listings and messages</li>
          <li>Improve the platform and prevent fraud</li>
        </ul>

        <h2>3. Sharing Your Information</h2>
        <p>
          We do not sell your personal information. We share information only in these circumstances:
        </p>
        <ul>
          <li>
            <strong>With other users:</strong> Your display name and profile picture are visible to
            other users when you create listings or send messages.
          </li>
          <li>
            <strong>Service providers:</strong> We use Supabase for database and authentication
            infrastructure, and Vercel for hosting.
          </li>
          <li>
            <strong>Legal requirements:</strong> If required by law or to protect our rights.
          </li>
        </ul>

        <h2>4. Data from Facebook Login</h2>
        <p>
          When you log in with Facebook, we receive your name, email, and profile picture via
          Facebook&rsquo;s OAuth service. We only request the minimum permissions needed (
          <code>email</code> and <code>public_profile</code>). We do not post to your Facebook
          timeline, access your friends list, or read your messages.
        </p>
        <p>
          Your Facebook data is stored securely in our database and is used solely to create and
          maintain your {appName} account.
        </p>

        <h2>5. Data Retention</h2>
        <p>
          We keep your data for as long as your account is active. You can request deletion of your
          account and associated data at any time by contacting us (see below). Listings and messages
          may be retained in anonymized form for platform integrity purposes.
        </p>

        <h2>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Withdraw consent for data processing</li>
          <li>Export your data in a portable format</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at{' '}
          <a href={`mailto:${contactEmail}`} className="text-primary underline">{contactEmail}</a>.
        </p>

        <h2>7. Cookies and Analytics</h2>
        <p>
          {appName} uses cookies that are strictly necessary for authentication and session
          management. We do not currently use advertising cookies or third-party tracking services.
        </p>

        <h2>8. Security</h2>
        <p>
          We use industry-standard security measures including HTTPS encryption, Row Level Security
          on our database, and OAuth 2.0 for authentication. However, no system is completely
          secure. Please report any security concerns to{' '}
          <a href={`mailto:${contactEmail}`} className="text-primary underline">{contactEmail}</a>.
        </p>

        <h2>9. Children&rsquo;s Privacy</h2>
        <p>
          {appName} is not directed at children under 13. We do not knowingly collect personal
          information from children.
        </p>

        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of significant
          changes by posting the new policy on this page and updating the &ldquo;Last updated&rdquo;
          date.
        </p>

        <h2>11. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy or want to make a data request,
          please contact us at:{' '}
          <a href={`mailto:${contactEmail}`} className="text-primary underline">{contactEmail}</a>
        </p>

      </div>
    </div>
  )
}
