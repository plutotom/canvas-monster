# canvas-monster

A cleaner, personal, **Linear-styled** UI over Wheaton's Canvas LMS. Next.js
(App Router) + TypeScript + Tailwind v4 + Geist. Dense, dark, keyboard-first.

- Design system & rules: [`docs/DESIGN.md`](./docs/DESIGN.md) — the living
  reference. Interactive source of truth is the frozen prototype at `/proto`.
- Product plan / roadmap: [`PLAN.md`](./PLAN.md).

## Setup

1. **Canvas token** — Canvas → **Account → Settings → New Access Token**.
2. Copy `.env.example` to `.env.local` and fill it in:
   ```
   CANVAS_TOKEN=your_token_here
   CANVAS_BASE_URL=https://wheaton.instructure.com/api/v1
   # optional — enables persistent Kanban lanes (Neon Postgres)
   DATABASE_URL=postgresql://...
   ```
3. Install and run:
   ```
   pnpm install
   pnpm dev          # http://localhost:4123
   ```

The token and DB URL are read **server-side only** and never shipped to the
browser.

### Kanban persistence (optional)

The Board's lane state is the one piece of local (non-Canvas) state. With a
`DATABASE_URL` set, push the schema once:

```
pnpm db:push        # drizzle-kit → creates the lane_overrides table
```

Without a database the app still runs — lanes show their auto-computed position
but drags won't persist (a banner explains this on the Board).

## Pages

- `/` — **Dashboard**: upcoming, unsubmitted work across all courses, grouped by
  Overdue / Today / Tomorrow / This week / Later. Multi-select rows for bulk
  actions.
- `/kanban` — **Board**: every module item across courses in To Read / Watch /
  Do / Done lanes. Drag (or use the per-card menu) to move; assignments with a
  Canvas submission auto-land in Done.
- `/calendar` — month grid of due dates with prev/next/today navigation.
- `/courses`, `/courses/[id]` — course list and detail (assignments, modules,
  announcements, current grade).
- `/settings` — live Canvas connection test + token instructions.
- `/debug` — raw Canvas JSON, to confirm data is flowing.
- `/proto` — frozen design reference (dummy data). Not part of the product.

### Keyboard

- **⌘K** — command palette (jump to any view or course, refresh Canvas).
- **`g` then `d` / `c` / `k` / `o` / `s`** — go to Dashboard / Calendar / Board /
  Courses / Settings.

## Architecture notes

### Data fetching & caching

All Canvas calls happen **server-side inside React Server Components** — the
browser never talks to Canvas directly, and there are no client-facing API
routes. Each read in `src/lib/canvas/client.ts` is wrapped in Next's
`unstable_cache` with a time-based TTL and a shared `"canvas"` tag:

| Data | Revalidate |
|---|---|
| Courses | 1 hr |
| Assignments / modules / announcements | 10 min |
| Grades | 5 min |
| To-do / dashboard | 3 min |

This protects the Canvas rate limit (~700 req/hr): repeated reloads and
navigations within the TTL reuse the cached response. Because the cache is keyed
by URL, the Dashboard, Board, and Calendar share the same per-course fetches.
The **Refresh** button in the header calls a server action
(`src/app/actions.ts`) that invalidates the `"canvas"` tag on demand.

Canvas list pagination (`Link` header) is followed automatically in
`canvasGetAll`, which warns to the server console if it hits its `maxPages` cap
rather than silently truncating.

### Design system

Tokens live as `--cm-*` CSS variables in `src/app/globals.css` (dark-only);
shadcn's core tokens are mapped onto them so `bg-card` / `border` / `text-muted-
foreground` all resolve to the Linear palette. Reusable primitives
(`priority-icon`, `status-icon`, `pill`, `avatar`, `progress-ring`, `skeleton`)
live in `src/components/ui/`. The app frame (collapsible sidebar + header) is
`src/components/app-shell.tsx`. See [`docs/DESIGN.md`](./docs/DESIGN.md) before
adding UI.

### Stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · Geist · Drizzle ORM + Neon
Postgres · lucide-react · pnpm. Runs on port **4123**.
