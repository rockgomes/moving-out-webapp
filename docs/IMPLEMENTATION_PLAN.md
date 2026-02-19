# MoveOutSale — Implementation Plan

Peer-to-peer marketplace for people moving to sell their items locally.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14+ (App Router) | SSR for listing SEO, file-based routing, image optimization |
| Hosting | Vercel | Zero-config Next.js deploy, free tier, global CDN |
| Database | Supabase (PostgreSQL) | Auth + DB + Realtime + Storage in one platform |
| Auth | Supabase Auth (Facebook + Google OAuth) | No App Review needed for `email` + `public_profile` scopes |
| Realtime Messaging | Supabase Realtime | WebSocket-based, messages stored in PostgreSQL |
| File Storage | Supabase Storage | Integrated with auth + RLS, image transforms |
| Styling | Tailwind CSS + shadcn/ui | Matches design tokens, accessible, tree-shakeable |
| Validation | Zod + React Hook Form | Type-safe schema validation end-to-end |
| Icons | Lucide React | Same icon set used in the Pencil design |
| Maps | Leaflet + OpenStreetMap | Completely free, no API key required |
| Email | Resend | 3,000 emails/month free |
| Package Manager | pnpm | Faster installs, strict resolution, disk efficient |

---

## Free Tier Limits

| Service | Free Allowance | When Costs Start |
|---|---|---|
| Vercel | 100 GB bandwidth, unlimited deployments | ~100k+ page views/day |
| Supabase DB | 500 MB PostgreSQL | ~50k–100k listings |
| Supabase Storage | 1 GB | ~500–1,000 listings with 2 photos each |
| Supabase Auth | 50,000 MAU | Real scale |
| Supabase Realtime | 200 concurrent connections | Medium-large traffic |
| Resend | 3,000 emails/month | Easy to stay under early on |

**Estimated monthly cost at launch: $0** (domain ~$12/year optional)

---

## Database Schema

```sql
-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  avatar_url   TEXT,
  facebook_id  TEXT,
  city         TEXT,
  state        TEXT,
  zip_code     TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Moving sales (bundles listings from one seller's move)
CREATE TABLE moving_sales (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  move_date   DATE,
  city        TEXT,
  state       TEXT,
  zip_code    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Listings
CREATE TYPE listing_condition AS ENUM ('new', 'like_new', 'good', 'fair');
CREATE TYPE listing_status    AS ENUM ('active', 'reserved', 'sold');

CREATE TABLE listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  moving_sale_id  UUID REFERENCES moving_sales ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(10, 2) NOT NULL,
  condition       listing_condition NOT NULL DEFAULT 'good',
  category        TEXT NOT NULL,
  status          listing_status NOT NULL DEFAULT 'active',
  city            TEXT,
  state           TEXT,
  zip_code        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Listing photos (multiple per listing, ordered)
CREATE TABLE listing_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    UUID NOT NULL REFERENCES listings ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0
);

-- Conversations (one per buyer+listing pair)
CREATE TABLE conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings ON DELETE CASCADE,
  buyer_id   UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  seller_id  UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (listing_id, buyer_id)
);

-- Messages
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  content         TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Saved / loved listings
CREATE TABLE saved_listings (
  user_id    UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings ON DELETE CASCADE,
  saved_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);
```

---

## Row Level Security (RLS) — Key Policies

- **profiles**: Users can only update their own profile. Anyone can read public profiles.
- **listings**: Anyone can read active listings. Only the seller can insert/update/delete their own.
- **listing_photos**: Same as listings.
- **conversations**: Only the buyer or seller involved can read/insert.
- **messages**: Only the buyer or seller in the conversation can read/insert.
- **saved_listings**: Users can only read/modify their own saved listings.

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # Server-only, never expose to client

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend (email)
RESEND_API_KEY=
```

---

## Facebook App Setup

1. Go to [developers.facebook.com](https://developers.facebook.com) → Create App → **Consumer**
2. Add the **Facebook Login** product
3. In Facebook Login → Settings, add OAuth redirect URI:
   `https://<your-project>.supabase.co/auth/v1/callback`
4. Copy **App ID** and **App Secret**
5. In Supabase Dashboard → Authentication → Providers → Facebook → paste both
6. Required scopes: `email`, `public_profile` *(no App Review needed)*
7. A Privacy Policy page is required by Facebook (create a simple `/privacy` route)

---

## Implementation Phases

### Phase 1 — Foundation & Auth
- [x] Project scaffolding (Next.js + Tailwind + shadcn/ui + pnpm)
- [ ] Supabase project: schema, RLS policies, storage buckets
- [ ] Facebook OAuth + Google OAuth via Supabase Auth
- [ ] Login / Sign Up / Onboarding screens (wired)
- [ ] Auth middleware (protect routes)
- [ ] Base layout (NavBar, route groups)

### Phase 2 — Core Marketplace
- [ ] Create Listing form (photos + details + price + category)
- [ ] Photo upload to Supabase Storage
- [ ] Homepage (hero, category grid, listing cards)
- [ ] Item Detail page (SSR with `generateMetadata` for SEO)
- [ ] Browse / Search with filters (category, price, location)
- [ ] Moving Sale Bundle page
- [ ] Save / unsave listings

### Phase 3 — Messaging
- [ ] "Message Seller" → create or find existing conversation
- [ ] Conversation list page (`/messages`)
- [ ] Chat thread page with Supabase Realtime subscriptions
- [ ] Unread message count badge in NavBar
- [ ] Mark messages as read on open

### Phase 4 — Listing Lifecycle & Polish
- [ ] Reserve listing (seller action in conversation)
- [ ] Mark as Sold → trigger Sold! screen
- [ ] Pickup & Review submission
- [ ] Mobile responsive pass
- [ ] Error boundaries, loading skeletons, empty states
- [ ] SEO: `sitemap.xml`, `robots.txt`, Open Graph tags

### Phase 5 — Launch Prep
- [ ] Privacy Policy page (required for Facebook App)
- [ ] Vercel production deployment
- [ ] Custom domain setup
- [ ] Facebook App → switch to Live mode
- [ ] Performance audit (Lighthouse)
- [ ] Basic analytics (Vercel Analytics, free)

---

## Key URLs (fill in as setup progresses)

| Resource | URL |
|---|---|
| GitHub Repo | https://github.com/rockgomes/moving-out-webapp |
| Vercel Project | — |
| Supabase Project | — |
| Facebook App Dashboard | — |
| Production URL | — |
