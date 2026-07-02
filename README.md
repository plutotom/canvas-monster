# canvas-monster

A cleaner, personal UI over Wheaton's Canvas LMS. Next.js (App Router) +
TypeScript + Tailwind + shadcn. See [`PLAN.md`](./PLAN.md) for the full design.

## Setup

1. Create a Canvas token: **Account → Settings → New Access Token**.
2. Copy `.env.example` to `.env.local` and fill it in:
   ```
   CANVAS_TOKEN=your_token_here
   CANVAS_BASE_URL=https://wheaton.instructure.com/api/v1
   ```
3. Install and run:
   ```
   pnpm install
   pnpm dev
   ```
4. Open http://localhost:4123 (the app runs on port **4123**).

The token is read server-side only and never shipped to the browser.

## Pages

- `/` — Dashboard: upcoming, unsubmitted work across all courses, bucketed by
  Overdue / Today / Tomorrow / This week / Later.
- `/courses`, `/courses/[id]` — course list and detail (assignments, modules,
  announcements, current grade).
- `/calendar` — month grid of due dates with prev/next/today navigation.
- `/settings` — live connection test + token instructions.
- `/debug` — raw Canvas JSON, to confirm data is flowing.

## Architecture notes

### Data fetching & caching

All Canvas calls happen **server-side** inside React Server Components — the
browser never talks to Canvas directly. Each read in `src/lib/canvas/client.ts`
is wrapped in Next's `unstable_cache` with a time-based TTL and a shared
`"canvas"` tag:

| Data | Revalidate |
|---|---|
| Courses | 1 hr |
| Assignments / modules / announcements | 10 min |
| Grades | 5 min |
| To-do / dashboard | 3 min |

This is what protects the Canvas rate limit (~700 req/hr): repeated reloads and
navigations within the TTL window reuse the cached response instead of re-hitting
Canvas. Because the cache is keyed by URL, the dashboard and calendar share the
same per-course assignment fetches. The **↻ Refresh** button in the nav calls a
server action that invalidates the `"canvas"` tag for an on-demand refresh.

Canvas list pagination (`Link` header) is followed automatically in
`canvasGetAll`, which warns to the server console if it hits its `maxPages` cap
rather than silently truncating.

### TODO: React Query (deferred — see below)

We deliberately did **not** add React Query. In the current server-component
architecture it would **not** reduce Canvas API calls — it's a client-side cache
and would only cache the browser → route-handler hop, not the route-handler →
Canvas hop that the rate limit counts. Server-side revalidation (above) is the
correct tool for protecting the rate limit.

React Query becomes worth adding **only when we want live/interactive UX**:
background refetch on window focus, polling the dashboard without full reloads,
or mutations (e.g. marking a todo done, or pinning items in the phase-2 Notion
work). At that point the right shape is **React Query on the client sitting on
top of the already-server-cached route handlers** — the client gets snappy
refresh while Canvas is still only hit on the TTL. Order matters: server caching
first, React Query second. Until we want that UX, it's unnecessary complexity.
