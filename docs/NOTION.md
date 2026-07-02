# Phase 2 — Notion integration (design)

Two-directional sync between Canvas and your Notion PhD system, **where writes
are never silent** — canvas-monster proposes, you approve. This doc is the plan
and the setup walkthrough. Nothing here is built yet.

Related: product context in [`PLAN.md`](../PLAN.md); UI rules in
[`DESIGN.md`](./DESIGN.md).

---

## 0. Prerequisites (one-time setup)

You need an **internal integration token** and your databases shared with it.

1. Go to **notion.so/my-integrations** → **New integration** (internal). Name it
   `canvas-monster`. Copy the **Internal Integration Secret** (starts `ntn_…`).
2. Add it to `.env.local` (server-only, never shipped to the browser):
   ```
   NOTION_TOKEN=ntn_...
   ```
3. **Share** each database with the integration: open the database in Notion →
   `•••` menu → **Connections** → add `canvas-monster`. Do this for at least
   **Assignments/Todos** and **Areas** (add Notes / Book List later).
4. **Grab each database ID**: open the database as a full page; the ID is the
   32-char hex in the URL:
   `notion.so/<workspace>/<DATABASE_ID>?v=<view_id>`. Put them in `.env.local`:
   ```
   NOTION_DB_ASSIGNMENTS=...
   NOTION_DB_AREAS=...
   ```

> Notion API rate limit is ~3 requests/sec/integration. Reads are cached (below)
> so this is comfortable for one user.

---

## 1. Notion schema (confirmed, from PLAN.md)

**Assignments / Todos** — the important one:

| Property                                                | Type                 | Use                                              |
| ------------------------------------------------------- | -------------------- | ------------------------------------------------ |
| `Name`                                                  | title                | Assignment name                                  |
| `Type`                                                  | select               | Reading / Paper / Exam / Todo                    |
| `Status`                                                | select               | Not started / Need to start / In progress / Done |
| `Due Date`                                              | date (range-capable) | Start defaults to 1 week before end              |
| `Areas`                                                 | relation → Areas     | The class this belongs to                        |
| `Requirements`                                          | text                 | Full verbatim syllabus/assignment instructions   |
| `URL`                                                   | url                  | **Dedup key** — the Canvas assignment `html_url` |
| `Tag`, `Books`, `📓 All Notes`, `Blocked by`/`Blocking` | relation             | Untouched by sync                                |

**Areas** — one page per class (e.g. `Family Theory and Therapy (PSYC-738-1HY)`).
The relation backbone. We map Canvas courses → Area pages.

The Status → our list `StatusIcon` mapping (finally gives us a real
"in-progress" state, which Canvas alone can't): `Not started`/`Need to start` →
`todo`, `In progress` → `progress`, `Done` → `done`.

---

## 2. Code shape

```
src/lib/notion/
  client.ts     # server-only Notion SDK client + config guard (like canvas/client.ts)
  types.ts      # narrow types for the properties we read/write
  assignments.ts# read Assignments/Todos → normalized shape
  areas.ts      # read Areas
  write.ts      # 2b: build page payload from a Canvas assignment; create/update
src/lib/db/schema.ts   # + course_area_map table (new)
```

- **Client guard**: if `NOTION_TOKEN` is unset, Notion features no-op and the UI
  shows a "connect Notion" state — mirrors how `db/client.ts` degrades. The rest
  of the app keeps working.
- **Caching**: wrap reads in `unstable_cache` with a `"notion"` tag + short TTL
  (~3 min), same pattern as Canvas. A `refreshNotion` server action mirrors
  `refreshCanvas`.
- **Dependency**: `@notionhq/client` (official SDK).

---

## 3. Phase 2a — Read (safe, build first)

Pull Assignments/Todos (+ Areas context) into canvas-monster. **No writes.**

- `getNotionAssignments()` → normalized `NotionItem[]` (name, type, status,
  dueStart/dueEnd, areaId, requirements, canvasUrl).
- Surface (per interview: "shown both"): merge into the **Dashboard** list
  tagged by source, **and** offer a dedicated view. Source shown via a small
  pill/dot so Canvas vs Notion items are always distinguishable.
- Unify the list item model so Canvas `UpcomingItem` and `NotionItem` render
  through the **same row component** — differ only by a `source` field and which
  fields exist. This is the main refactor 2a introduces.

**Done when:** your real Notion todos appear alongside Canvas work, correctly
grouped by due date, visually tagged, read-only.

---

## 4. Phase 2b — Write with approval

When canvas-monster sees a Canvas assignment with **no matching Notion page**, it
proposes creating one — you approve first.

1. **Detect**: for each Canvas assignment, check if any Notion page's `URL`
   equals the assignment `html_url` (the dedup key). No match → candidate.
2. **Preview**: build the proposed page and show a **diff/preview card** —
   `Name`, `Type` (inferred from Canvas), `Due Date` (end = Canvas due, start =
   1 week before, matching your manual workflow), `Requirements` (from Canvas
   HTML description → text), `URL`, `Areas` (from course↔Area map), and a
   `Source: Canvas` marker.
3. **Approve** → `write.ts` creates the page. **Reject** → remember the skip so
   it doesn't nag next sync.
4. **Update path**: if a page with that URL exists, offer to update changed
   fields instead of duplicating (never overwrite your verbatim `Requirements` /
   Paper Info without showing the diff).

**Approval UI**: a "Sync to Notion" surface (Settings or a dedicated page)
listing candidate diffs with per-item Approve / Skip and a batch approve. Toasts
confirm writes.

---

## 5. Course ↔ Area mapping

Needed to set the `Areas` relation on created pages.

- **New Postgres table** `course_area_map`: `courseId` (Canvas) → `areaPageId`
  (Notion), so it's asked **once per course**, not every sync.
- **Auto-match**: extract the course code (`PSYC-738`) and fuzzy-match against
  Area page titles; auto-accept high-confidence matches.
- **Manual fallback**: a one-time mapping screen in **Settings** for anything
  ambiguous or unmatched.
- Exact fuzzy rule (substring vs Levenshtein) — decide by prototyping against
  your real Area titles once reads work (still-open item in PLAN.md).

---

## 6. Open questions (resolve during build)

- Fuzzy-match rule for course↔Area (prototype against real Area titles).
- `Requirements`: is Canvas HTML → plain text good enough, or does it need
  cleanup/structure to match your hand-authored "Paper Info"?
- `Type` inference rules from Canvas (submission types / name heuristics →
  Reading / Paper / Exam / Todo).
- Which extra context to pull in 2a beyond Assignments/Areas (Notes, Book List).

---

## 7. Build order

1. Setup (§0) + `lib/notion/client.ts` + connection test in Settings.
2. **2a**: `getNotionAssignments` + unify the list row + merge into Dashboard +
   dedicated view.
3. `course_area_map` table + Settings mapping UI (auto + manual).
4. **2b**: candidate detection + preview/diff + approve → create; then update
   path + skip memory.
