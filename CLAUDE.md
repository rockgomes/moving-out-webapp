# MoveOutSale — Claude Context

Peer-to-peer marketplace for people moving to sell items locally.
GitHub: https://github.com/rockgomes/moving-out-webapp
Design file: `movingout.pen` (Pencil design tool — use MCP tools to read/edit it).

---

## Key Docs (read these before working)

- **Implementation Plan**: [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md)
  - Tech stack, database schema, environment variables, implementation phases
- **Engineering Guidelines**: [`docs/ENGINEERING_GUIDELINES.md`](docs/ENGINEERING_GUIDELINES.md)
  - Branching strategy, commit format, component structure, testing, code review checklist

---

## Tech Stack

- **Next.js 14** (App Router, TypeScript, Tailwind CSS)
- **Supabase** — PostgreSQL + Auth (Facebook/Google OAuth) + Realtime + Storage
- **shadcn/ui** — UI primitives (in `src/components/ui/`)
- **Zod + React Hook Form** — validation
- **Lucide React** — icons (matches the Pencil design)
- **Vitest + Testing Library** — unit/integration tests
- **Playwright** — E2E tests
- **pnpm** — package manager

---

## Commands

```bash
pnpm dev            # Start dev server
pnpm build          # Production build
pnpm typecheck      # Type check (tsc --noEmit)
pnpm lint           # ESLint
pnpm test           # Unit tests (Vitest)
pnpm test:e2e       # E2E tests (Playwright)
pnpm supabase:types # Regenerate DB types
```

---

## Project Structure (src/)

```
app/
  (public)/      → homepage, browse, listing/[id], sale/[id]
  (auth)/        → login, signup, callback, onboarding
  (protected)/   → sell, my-listings, messages/[id], saved, profile
components/
  ui/            → shadcn/ui primitives (don't edit)
  common/        → NavBar, Footer, PageContainer
  listings/      → ListingCard, ListingGrid, ListingForm, PhotoUpload
  messaging/     → ConversationList, ChatThread, MessageBubble
  auth/          → SocialLoginButton
lib/
  supabase/      → client.ts (browser), server.ts (server), middleware.ts
  validations/   → Zod schemas
hooks/           → useUser, useListings, useMessages
types/           → database.ts (generated), index.ts
```

---

## Key Conventions

- **Server Components by default** — `'use client'` only when needed
- **Server Actions for mutations** — not API routes
- **Co-locate tests**: `ComponentName.test.tsx` next to `ComponentName.tsx`
- **Component folders**: `components/feature/ComponentName/index.ts` + `ComponentName.tsx` + `ComponentName.test.tsx`
- **No `any`** — strict TypeScript throughout
- **Conventional Commits**: `feat(scope): description`
- **Branch from `develop`**, never from `main`

---

## Database Tables

`profiles`, `listings`, `listing_photos`, `moving_sales`, `conversations`, `messages`, `saved_listings`
Full schema in [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md).

---

## Current Phase

See the checkbox progress in [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) under **Implementation Phases**.
