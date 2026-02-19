# MoveOutSale — Engineering Guidelines

This document defines how we work as a team. Follow these standards on every PR.

---

## Git Workflow

### Branch Strategy

```
main          ← production only. Never commit directly.
develop       ← integration branch. All features merge here first.
feature/xxx   ← new features  (e.g. feature/listing-create)
fix/xxx       ← bug fixes     (e.g. fix/message-unread-count)
chore/xxx     ← maintenance   (e.g. chore/upgrade-supabase-client)
docs/xxx      ← documentation (e.g. docs/update-readme)
```

### Commit Message Format (Conventional Commits)

```
type(scope): short description

feat(listings): add photo upload with drag-and-drop reordering
fix(auth): handle Facebook login token expiry
chore(deps): upgrade Next.js to 14.2
docs(readme): add local setup instructions
test(messaging): add unit tests for useConversation hook
refactor(listings): extract ListingCard into shared component
```

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`, `perf`

### Pull Request Process

1. Branch from `develop`, never from `main`
2. PR title follows the same Conventional Commits format
3. Every PR must include:
   - Description of what changed and why
   - Test plan (what was manually tested)
   - Screenshots/recordings for UI changes
4. At least one review before merging
5. Squash merge into `develop`
6. `develop` → `main` only for production releases (via PR)

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Publicly accessible routes
│   │   ├── page.tsx              # Homepage
│   │   ├── browse/
│   │   ├── listing/[id]/
│   │   └── sale/[id]/
│   ├── (auth)/                   # Auth flow (no layout chrome)
│   │   ├── login/
│   │   ├── signup/
│   │   ├── callback/             # OAuth redirect handler
│   │   └── onboarding/
│   ├── (protected)/              # Requires authentication
│   │   ├── sell/
│   │   ├── my-listings/
│   │   ├── messages/
│   │   │   └── [id]/
│   │   ├── saved/
│   │   └── profile/
│   ├── layout.tsx                # Root layout
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/ui primitives (auto-generated, don't edit)
│   ├── common/                   # App-wide shared components
│   │   ├── NavBar/
│   │   ├── Footer/
│   │   └── PageContainer/
│   ├── listings/                 # Listing-specific components
│   │   ├── ListingCard/
│   │   ├── ListingGrid/
│   │   ├── ListingForm/
│   │   └── PhotoUpload/
│   ├── messaging/                # Chat components
│   │   ├── ConversationList/
│   │   ├── ChatThread/
│   │   └── MessageBubble/
│   └── auth/                     # Auth-specific components
│       └── SocialLoginButton/
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client (singleton)
│   │   ├── server.ts             # Server Supabase client (per-request)
│   │   └── middleware.ts         # Auth session refresh
│   ├── validations/              # Zod schemas (shared client+server)
│   │   ├── listing.ts
│   │   └── profile.ts
│   └── utils.ts                  # Pure utility functions
├── hooks/                        # Custom React hooks
│   ├── useUser.ts
│   ├── useListings.ts
│   └── useMessages.ts
└── types/                        # TypeScript types & interfaces
    ├── database.ts               # Generated from Supabase (supabase gen types)
    └── index.ts                  # App-level types
```

---

## TypeScript Standards

- **Strict mode on.** No `any`. Use `unknown` + type narrowing when type is truly unknown.
- **No type assertions** (`as Foo`) unless there's no other option — add a comment explaining why.
- **Generate Supabase types** after every schema change:
  ```bash
  pnpm supabase:types
  ```
  This runs: `supabase gen types typescript --project-id <id> > src/types/database.ts`
- **Co-locate types** with the feature they belong to. Put shared types in `src/types/`.
- **Name interfaces clearly**: `ListingCardProps`, `CreateListingFormData`, not `Props` or `Data`.

---

## Component Standards

### Structure
Every non-trivial component lives in its own folder:
```
components/listings/ListingCard/
├── ListingCard.tsx       # Component
├── ListingCard.test.tsx  # Unit test (co-located)
└── index.ts              # Re-export
```

### Rules
- **One component per file.** No dumping multiple exports in one file.
- **Props interface always named** `<ComponentName>Props`.
- **Server Components by default.** Add `'use client'` only when you need interactivity, browser APIs, or hooks.
- **No inline styles.** Tailwind classes only.
- **shadcn/ui for all primitives** (Button, Input, Dialog, etc.). Don't rebuild what's already there.
- **Accessible by default**: use semantic HTML, `aria-*` attributes, keyboard navigation.

### Example
```tsx
// components/listings/ListingCard/ListingCard.tsx
import { Badge } from '@/components/ui/badge'
import type { Listing } from '@/types'

interface ListingCardProps {
  listing: Listing
  showSellerInfo?: boolean
}

export function ListingCard({ listing, showSellerInfo = false }: ListingCardProps) {
  // ...
}
```

---

## Testing Strategy

### Three Levels

| Level | Tool | What to Test | Where |
|---|---|---|---|
| Unit | Vitest + Testing Library | Pure functions, hooks, individual components | `*.test.tsx` co-located |
| Integration | Vitest + MSW | Component trees, form flows, API interactions | `src/__tests__/` |
| E2E | Playwright | Critical user flows (login, create listing, send message) | `e2e/` |

### Commands
```bash
pnpm test          # Run all unit + integration tests
pnpm test:watch    # Watch mode
pnpm test:e2e      # Run Playwright E2E tests
pnpm test:coverage # Coverage report
```

### Rules
- Every new component must have a basic render test.
- Every util function must have unit tests covering edge cases.
- E2E tests cover the 3 critical paths: Auth flow, Create Listing flow, Message Seller flow.
- CI blocks merges if tests fail or coverage drops below 70%.

---

## Data Fetching Patterns

- **Server Components fetch data directly** using the server Supabase client. No `useEffect` for initial data.
- **Client Components use custom hooks** (`useListings`, `useMessages`) for interactive/realtime data.
- **Mutations use Server Actions** (`'use server'`) — not API routes — for form submissions.
- **Realtime subscriptions** are set up in client components using `useEffect` + cleanup.

```tsx
// ✅ Server Component — fetch directly
export default async function ListingPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: listing } = await supabase
    .from('listings')
    .select('*, profiles(*), listing_photos(*)')
    .eq('id', params.id)
    .single()
  return <ListingDetail listing={listing} />
}

// ✅ Server Action — mutations
'use server'
export async function createListing(formData: CreateListingFormData) {
  const supabase = createServerClient()
  // validate with zod, insert, revalidatePath
}
```

---

## Error Handling

- **Server Actions**: return `{ error: string } | { data: T }` — never throw to the client.
- **Route handlers**: always return typed error responses with correct HTTP status codes.
- **Client components**: wrap async operations in try/catch, show user-facing toast messages.
- **Error boundaries**: one at the route group level (`error.tsx`), one at the page level for critical sections.

---

## Code Review Checklist

Before requesting a review, self-check:

- [ ] TypeScript has no errors (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Tests pass (`pnpm test`)
- [ ] No `console.log` left in production code
- [ ] No hardcoded strings — user-visible text uses the correct variable
- [ ] New components have at least a render test
- [ ] Server Components used where possible (no unnecessary `'use client'`)
- [ ] Supabase queries use RLS (no service role key on the client)
- [ ] No secrets or API keys committed

---

## Local Development Setup

```bash
# 1. Clone repo and install dependencies
git clone <repo-url>
cd moving-out-webapp
pnpm install

# 2. Copy env template
cp .env.example .env.local
# Fill in Supabase URL, anon key, etc.

# 3. Run dev server
pnpm dev

# 4. Run tests
pnpm test
```

---

## Useful Commands

```bash
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Production build
pnpm typecheck        # tsc --noEmit
pnpm lint             # ESLint
pnpm lint:fix         # ESLint with auto-fix
pnpm test             # Vitest unit tests
pnpm test:e2e         # Playwright E2E
pnpm supabase:types   # Regenerate DB types from Supabase schema
```
