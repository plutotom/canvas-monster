# canvas-monster — plan

Custom UI over Canvas LMS data (Wheaton), mixed with your existing Notion PhD system. Personal tool, own use.

## Why no reverse-engineering needed

Canvas LMS (Instructure) has a fully documented, stable REST API — no scraping/network-sniffing required.

- Base: `https://wheaton.instructure.com/api/v1/`
- Auth: Personal Access Token (Account → Settings → "New Access Token" in the Canvas UI). Send as `Authorization: Bearer <token>`.
- Rate limit: ~700 req/hr/token by default, generous for one user.
- Pagination: `Link` header (rel="next"), standard REST pattern.
- Docs: canvas.instructure.com/doc/api/ (versioned, stable across Canvas instances since it's the same Instructure product Wheaton runs).

There's also a GraphQL endpoint (`/api/graphql`) Canvas's own frontend uses for some newer views, but REST v1 covers everything needed (courses, assignments, grades, modules, calendar) and is easier to work with.

Notion is the same story — official API, already connected, no reverse-engineering needed there either.

## Your current Notion setup (confirmed, not guessed)

Central hub: **"School Dashboard"** page. Key databases:

- **Assignments / Todos** (the important one) — schema: `Name` (title), `Type` (select: Reading / Paper / Exam / Todo), `Status` (Not started / Need to start / In progress / Done), `Due Date` (date, range-capable), `Areas` (relation → class pages), `Tag` (relation), `Requirements` (text — full verbatim syllabus instructions), `URL`, `Books` (relation), `📓 All Notes` (relation), `Blocked by`/`Blocking` (relation).
- **Areas** — one page per class (e.g. "Family Theory and Therapy (PSYC-738-1HY)"), used as the tag/filter backbone across the whole system.
- **All Notes** — class notes, linked to Areas.
- **Book List** — course reading list.
- **This week's Todos** — filtered view on the dashboard.

Current workflow: you paste syllabus text into an AI prompt that parses it and creates pages in Assignments/Todos with Status defaulted to "Not started," Type inferred, Due Date set (start = 1 week before end), and full instructions preserved verbatim under a "Paper Info" toggle. This is entirely manual today. Canvas already has this data structured via the API — that manual step is the main thing canvas-monster phase 2 can kill.

## Data model (what we pull from Canvas)

| Entity | Endpoint | Notes |
|---|---|---|
| Courses | `GET /courses?enrollment_state=active` | all active courses (v1 scope: everything, no per-course toggle) |
| Assignments | `GET /courses/:id/assignments` | due dates, points, submission status, description (HTML instructions) |
| Modules | `GET /courses/:id/modules?include[]=items` | course content structure — where most profs actually dump PDFs/videos/assignments |
| Announcements | `GET /courses/:id/discussion_topics?only_announcements=true` | |
| Calendar events | `GET /calendar_events?context_codes[]=course_X` | due dates + events merged |
| To-do | `GET /users/self/todo` | cross-course todo |
| Files | `GET /courses/:id/files` | for inline PDF preview |
| Grades | — | **skipped for v1** |

## Architecture

- **Next.js (App Router) + TypeScript + Tailwind + shadcn**, pnpm — matches `meta_v3` conventions.
- **Neon Postgres + Drizzle** — same combo as `meta_v3`. Needed in v1 (not deferred) because the Kanban board needs to persist which lane each item is in; also becomes the home for Notion sync-mapping state in phase 2.
- Canvas token server-side only (`.env` locally, Vercel env var in prod). Never shipped to client.
- Route Handlers (`/api/canvas/*`) proxy Canvas API server-side — reshape, cache, merge.
- Deploy target: **Vercel**, so it's usable from your phone, not just localhost.
- Mobile is a real requirement, not an afterthought — layouts need to actually work on a phone screen, especially the Kanban view.

## v1 scope decisions (from interview)

- **Pure mirror of Canvas content** — no editing/renaming/rescheduling of Canvas data itself in v1. The "fix professors' messy data" idea is v4, deliberately deferred.
- **Kanban board for Modules content** (PDFs/videos/assignments): lanes = To Read / Watch / Do / Done. Lane membership is the one piece of local state we persist (via Postgres) — this isn't editing Canvas truth, just tracking your progress through it.
  - **Done lane sync**: hybrid — assignments auto-move to Done when Canvas shows a submission; reading/video items (no submission signal) you move by hand.
- **Home view = Calendar/agenda grid** (week or month), not a kanban-first or list-first landing page.
- **File viewing**: inline preview when possible (PDFs render in-app, video embeds) rather than bouncing out to Canvas.
- **Announcements**: shown both mixed into the main timeline and available in their own section — not an either/or.
- **Grades**: not shown in v1.
- **Search**: not in v1.
- **Style**: clean/minimal, spacious — not a dense dashboard.

## Phase 2 — Notion integration

Two-directional, but writes are never silent:

1. **Read**: pull Assignments/Todos (and relevant Areas/Notes/Book List context) into canvas-monster's views, merged alongside Canvas data.
2. **Write, with approval**: when canvas-monster sees a new Canvas assignment that doesn't already have a matching Notion page, it builds a preview (Name, Type, Due Date, Requirements from Canvas's assignment description, URL) and shows you a diff/preview to approve — same shape as what the AI prompt does today, just automatic detection instead of manual paste.
3. **Dedup**: match by the Canvas assignment URL stored in Notion's `URL` property — if a page already has that URL, skip or update instead of duplicating. Canvas-imported pages also get a distinct tag (e.g. a `Source: Canvas` marker) so your hand-crafted entries (with the good verbatim Paper Info) stay visually distinguishable even if content later overlaps.
4. **Course ↔ Area mapping**: hybrid — attempt fuzzy auto-match (course code like `PSYC-738` against Area page titles) first, fall back to a one-time manual mapping screen in Settings for anything ambiguous. Mapping gets stored in Postgres so it's asked once per course, not every sync.

## Pages (v1)

1. **Dashboard / Calendar (home)** — week/month agenda grid, due dates + events across all courses.
2. **Kanban board** — To Read / Watch / Do / Done, populated from Modules content across courses.
3. **Course view** — single course: modules + assignments + announcements.
4. **Settings** — Canvas token, connection test, (phase 2) Notion connection + course↔Area mappings.

## Milestones

1. Scaffold Next.js + Tailwind + shadcn + Drizzle/Neon, pnpm install, deploy skeleton to Vercel.
2. Canvas API client lib (`lib/canvas.ts`) + route handlers; confirm real data flowing (debug JSON page).
3. Calendar/agenda home view.
4. Kanban board + Postgres-backed lane state + submission-based auto-move for assignments.
5. Course view page (modules/assignments/announcements, inline file preview).
6. Settings/token UI + error states (bad token, rate limit).
7. Phase 2a: Notion read (Assignments/Todos + Areas into canvas-monster views).
8. Phase 2b: Notion write-with-approval flow + dedup + course↔Area mapping UI.

## Still open

- Exact fuzzy-match rule for course↔Area mapping (course code substring? Levenshtein on title? worth prototyping against your real Area page titles once we're there).
- Whether "Requirements" text needs any cleanup/truncation when pulled from Canvas's HTML assignment descriptions, or verbatim HTML→text is good enough.
