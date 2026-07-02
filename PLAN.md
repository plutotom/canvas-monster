# canvas-monster — plan

Custom UI over Canvas LMS data (Wheaton), phase 2 mixes in Notion. Personal tool, own use.

## Why no reverse-engineering needed

Canvas LMS (Instructure) has a fully documented, stable REST API — no scraping/network-sniffing required.

- Base: `https://wheaton.instructure.com/api/v1/`
- Auth: Personal Access Token (Account → Settings → "New Access Token" in the Canvas UI). Send as `Authorization: Bearer <token>`.
- Rate limit: ~700 req/hr/token by default, generous for one user.
- Pagination: `Link` header (rel="next"), standard REST pattern.
- Docs: canvas.instructure.com/doc/api/ (versioned, stable across Canvas instances since it's the same Instructure product Wheaton runs).

There's also a GraphQL endpoint (`/api/graphql`) Canvas's own frontend uses for some newer views, but REST v1 covers everything we need (courses, assignments, grades, modules, calendar) and is easier to work with.

## Data model (what we pull from Canvas)

| Entity | Endpoint | Notes |
|---|---|---|
| Courses | `GET /courses?enrollment_state=active` | current term courses |
| Assignments | `GET /courses/:id/assignments` | due dates, points, submission status |
| Modules | `GET /courses/:id/modules?include[]=items` | course content structure |
| Announcements | `GET /courses/:id/discussion_topics?only_announcements=true` | |
| Grades | `GET /courses/:id/enrollments?user_id=self` | current grade/score |
| Calendar events | `GET /calendar_events?context_codes[]=course_X` | due dates + events merged |
| To-do | `GET /users/self/todo` | cross-course todo, good for dashboard |
| Files | `GET /courses/:id/files` | phase 2+ maybe |

## Architecture

- **Next.js (App Router) + TypeScript + Tailwind + shadcn**, pnpm — matches your `meta_v3` conventions so patterns transfer.
- Canvas token lives server-side only (`.env`, `CANVAS_TOKEN`). Never shipped to client.
- Next.js Route Handlers (`/api/canvas/*`) proxy Canvas API — client never talks to Canvas directly. Lets us cache, reshape, and merge data server-side.
- React Query (or Next's built-in fetch cache) on client for revalidation without full reloads.
- No DB needed for v1 — Canvas is source of truth, we just re-render it better. DB becomes relevant in phase 2 for storing Notion sync state / user prefs (pinned items, custom tags).

## Pages (v1)

1. **Dashboard** — today/this-week view merging todo + upcoming due dates across all courses (the thing Canvas dashboard does badly).
2. **Course view** — single course: modules + assignments + announcements, cleaner than Canvas's nested module UI.
3. **Calendar** — week/month grid of due dates + events.
4. **Settings** — paste Canvas token, test connection.

## Phase 2 — Notion mixing

- Notion has an official API too (already connected here) — no reverse-engineering there either.
- Direction: pull Notion pages/DB rows (e.g. your reading/task DB) and interleave with Canvas assignments on the dashboard — one merged timeline.
- Start read-only (Notion → dashboard). Two-way sync (push Canvas assignments into a Notion DB) is a stretch goal once read-only proves useful.
- Needs a mapping layer: Canvas assignment ⇄ Notion page (by date range + course tag, not exact match).

## Milestones

1. Scaffold Next.js + Tailwind + shadcn, pnpm install.
2. Canvas API client lib (`lib/canvas.ts`) + route handlers, get real data flowing to a plain JSON debug page.
3. Dashboard page (todo + upcoming merge).
4. Course view page.
5. Calendar page.
6. Settings/token UI + basic error states (bad token, rate limit).
7. Phase 2: Notion read integration.

## Open questions before build

- Multi-course scope: all active courses, or just a few you pick?
- Token storage: fine in local `.env` since this is single-user/local-only? (yes unless you want it deployed somewhere shared)
- Deploy target: local dev only, or Vercel like your other projects?
