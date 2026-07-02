# canvas-monster — Raycast extension plan

A standalone Raycast extension to check Canvas from the launcher, no browser
needed. Talks directly to the Canvas REST API (token in Raycast secure prefs),
so it runs independently of the web app.

## Scope (v1)

Two commands, both `view` mode:

1. **Upcoming** — searchable list of upcoming, unsubmitted assignments across all
   active courses, grouped by due bucket (Overdue / Today / Tomorrow / This week /
   Later). The core "what do I need to do" command.
2. **Search Courses** — list active courses; Enter opens the course in Canvas.
   Drill-in action shows that course's assignments (searchable), each openable.

Explicitly **out of v1** (easy to add later, noted so we don't design them out):
- Menu-bar "due today" badge (background-refresh count).
- Grades at a glance.

## Why standalone (not via the web app)

The extension calls Canvas directly with its own token from
`getPreferenceValues()`. It does **not** depend on `pnpm dev` running. Trade-off:
Canvas client logic is duplicated (ported, not imported) from the Next app —
acceptable, since the two run in different environments and the client is small.

## Store-worthiness

`canvasBaseUrl` is a preference (default Wheaton). Because any Instructure/Canvas
school works by changing that one value, this is a generic tool, not a
Wheaton-only one — which is exactly what makes it publishable to the Raycast
store.

## Structure

New folder in this repo, its own package (own `node_modules`, own manifest):

```
raycast/
  package.json        # Raycast manifest: commands, preferences, deps
  tsconfig.json
  assets/
    icon.png          # 512x512, light+dark safe
  src/
    lib/
      canvas.ts       # fetch + Bearer auth + Link-header pagination; reads prefs
      types.ts        # narrow Canvas types (port subset from web app)
      dates.ts        # bucketFor / formatDue (port from web app)
    upcoming.tsx      # Command 1
    courses.tsx       # Command 2
  metadata/           # store screenshots
  README.md
  CHANGELOG.md
```

## Tech

- `@raycast/api` (List, ActionPanel, Action, Detail, Icon, showToast, Toast,
  getPreferenceValues, openExtensionPreferences).
- `@raycast/utils` `useCachedPromise` — built-in caching + revalidation +
  keepPreviousData. This is the rate-limit / perf story on the Raycast side:
  results cache across launches, show stale instantly, refetch in background.
- TypeScript + React (Raycast renders React to its UI).

## Preferences (manifest)

| Name | Type | Notes |
|---|---|---|
| `canvasToken` | password (required) | Canvas → Account → Settings → New Access Token |
| `canvasBaseUrl` | text | default `https://wheaton.instructure.com/api/v1` |

## Canvas client (`src/lib/canvas.ts`)

- `getConfig()` — pull token + baseUrl from `getPreferenceValues`.
- `canvasGet` / `canvasGetAll` — same shape as web app: Bearer header, follow
  `Link` rel="next", `maxPages` cap with a console warn on truncation.
- Wrappers: `getActiveCourses`, `getCourseAssignments(id)`.
- Errors throw a typed `CanvasError { status }` so commands can map 401 → "check
  your token" and offer `openExtensionPreferences()`.

## Command behavior

**Upcoming** (`upcoming.tsx`)
- `useCachedPromise` → fetch active courses, then assignments per course in
  parallel; flatten to upcoming + unsubmitted; sort by due; bucket.
- `List` with `List.Section` per bucket. `List.Item`: title = assignment name,
  subtitle = course code, accessory = formatted due date.
- Actions: **Open in Canvas** (`html_url`), **Copy Link**, **Refresh**
  (`revalidate`), **Open Preferences**.
- States: `isLoading` spinner; empty view "🎉 Nothing due"; on error a Failure
  toast + empty view with a "Open Preferences" action.

**Search Courses** (`courses.tsx`)
- `useCachedPromise` → active courses. `List` filtered by Raycast's built-in
  search.
- Item actions: **Open Course in Canvas**; **Show Assignments** → `push` a second
  `List` of that course's assignments (searchable), each **Open in Canvas**.

## Milestones

1. Scaffold `raycast/` (manifest, two command stubs, prefs, placeholder icon);
   `ray develop` loads it in Raycast.
2. Canvas client + types + dates ported and unit-sane against real token.
3. **Upcoming** command: list, buckets, actions, loading/empty/error states.
4. **Search Courses** command: list + drill-in to assignments.
5. Caching via `useCachedPromise`; error→toast + preferences deep-link (401).
6. Polish: real icon, README, CHANGELOG, store screenshots; `ray lint` +
   `ray build` clean.
7. (optional) Publish: `npm run publish` → PR to `raycast/extensions`, store
   review.

## Open questions

- **Location**: `raycast/` subfolder in this repo (recommended) vs its own repo?
- **Icon art**: do you have art, or want one generated? (placeholder for now)
- **Search Courses depth**: courses → drill to assignments (recommended), or a
  single flat search over courses + assignments?
- **Confirm** menu-bar badge + grades stay out of v1?
