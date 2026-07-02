# canvas-monster — Design System

**The canonical, living reference for the app's look & feel.** The interactive
source of truth is the prototype at **`/proto`** (`src/app/proto/page.tsx`) —
when in doubt, open it and match it. This doc explains the _why_ and the exact
values so any agent can extend the app without drifting from the style.

The aesthetic is **Linear** (linear.app): a dev-first, dark, dense, calm,
keyboard-friendly UI. Near-black layered surfaces, hairline borders, one indigo
accent, restrained motion. Refined minimalism — elegance from precision, not
decoration. **Do not** add gradients-on-white, drop shadows for depth, chunky
borders, or generic AI-dashboard styling.

---

## 1. Color

All colors live as CSS variables in `src/app/globals.css` under `:root, .dark`
(the app is **dark-only** — there is no light theme). Use the tokens; never
hardcode hex in components.

### Surfaces (darkest → lightest — depth comes from subtle bg shifts, NOT shadows)

| Token                       | Hex                      | Use                                                          |
| --------------------------- | ------------------------ | ------------------------------------------------------------ |
| `--cm-sidebar`              | `#0f1113`                | Sidebar chrome (a hair darker than content)                  |
| `--cm-app` (`--background`) | `#131416`                | Main content background — the "soft" base everything sits on |
| `--cm-panel`                | `#0e0f11`                | Recessed wells (search box, inputs)                          |
| `--cm-column`               | `#17181b`                | Board column surface — lifted just enough to show bounds     |
| `--cm-card` (`--card`)      | `#1c1d20`                | Board cards — a shade above the column                       |
| `--cm-elevated`             | `#1a1b1e`                | Hover surface for rows / nav items / menus                   |
| `--cm-band`                 | `rgba(255,255,255,.025)` | Faint fill behind list group headers                         |

### Lines

| Token                          | Value                   | Use                                  |
| ------------------------------ | ----------------------- | ------------------------------------ |
| `--cm-line` (`--border`)       | `rgba(255,255,255,.06)` | Default hairline border/divider      |
| `--cm-line-strong` (`--input`) | `rgba(255,255,255,.10)` | Emphasis borders, checkboxes, inputs |

### Text

| Token                               | Hex       | Use                                                 |
| ----------------------------------- | --------- | --------------------------------------------------- |
| `--cm-text` (`--foreground`)        | `#eceef1` | Primary text, titles (bright, high-contrast)        |
| `--cm-muted` (`--muted-foreground`) | `#8a8f98` | Secondary text, meta, dates                         |
| `--cm-faint`                        | `#6b7079` | Tertiary — IDs, icons at rest, counts, placeholders |

### Accent (use sparingly — one accent, that's the point)

| Token                                 | Value                  | Use                                                               |
| ------------------------------------- | ---------------------- | ----------------------------------------------------------------- |
| `--cm-accent` (`--primary`, `--ring`) | `#5e6ad2`              | Brand indigo — primary buttons, focus rings, active nav, progress |
| `--cm-accent-hover`                   | `#6872e5`              | Accent hover                                                      |
| `--cm-accent-soft`                    | `rgba(94,106,210,.12)` | Selected-row / active-nav background                              |

### Semantic (status, priority, labels, course dots)

| Token                        | Hex       | Meaning                         |
| ---------------------------- | --------- | ------------------------------- |
| `--cm-red` (`--destructive`) | `#eb5757` | Overdue, urgent, exam, delete   |
| `--cm-orange`                | `#fc7840` | High priority                   |
| `--cm-amber`                 | `#e2b53d` | In-progress status, "this week" |
| `--cm-green`                 | `#4cb782` | Done, todo/discussion labels    |
| `--cm-blue`                  | `#4aa3df` | Reading label                   |
| `--cm-purple`                | `#a06bf5` | Paper label                     |

Tailwind utility aliases exist for the custom surfaces: `bg-app`, `bg-panel`,
`bg-elevated`, `bg-column`, `bg-band`, `bg-accent-soft`, `text-faint`,
`border-line`, `border-line-strong`, `text-brand`. Standard shadcn utilities
(`bg-card`, `bg-background`, `text-muted-foreground`, `border`, `bg-primary`)
resolve to the same system.

---

## 2. Typography

- **Font**: Geist (`var(--font-geist-sans)`), already loaded in `layout.tsx`.
  Geist Mono (`var(--font-geist-mono)`) for **IDs, counts, keyboard hints** only.
- **Base UI size is 13px.** This is the density that makes it feel like Linear.
  Meta/secondary text is 11–12px. Titles are 13px `font-medium` (not bold, not big).
- Weights: `font-medium` (500) for titles and active items; normal for body/meta.
- Line-height tight; titles `leading-snug`.

---

## 3. Space, radius, motion

- **Radius**: `--radius` = `0.5rem`. Rows/cards `rounded-lg` (8px), pills
  `rounded-full`, small controls `rounded-md` (6px), columns `rounded-xl`.
- **Density**: list rows `py-[7px]`; generous but not cramped. 4px spacing grid.
- **Insets**: list rows & group headers use `mx-2` so hover/selection reads as an
  **inset rounded card** (gap from the edges), never full-bleed.
- **Motion**: fast and subtle. `~100ms` on hover/opacity. List/board items get a
  staggered fade-up on mount:
  ```
  @keyframes protoUp { from { opacity:0; transform:translateY(3px) } to { opacity:1; transform:none } }
  animation: protoUp .26s cubic-bezier(.2,.7,.3,1) both;   /* animationDelay: i * 26ms */
  ```
  No bouncy/showy animation. Delight = speed + polish, not spectacle.

---

## 4. Signature components (the details that make it read as Linear)

Extracted as reusable primitives in `src/components/ui/`:

- **`PriorityIcon`** — three signal bars (▁▃▅), `level` 0–3 fills N bars in
  `--cm-muted`; unfilled bars in `--cm-line-strong`. `level 0` = `···` (faint
  `MoreHorizontal`). NOT colored dots.
- **`StatusIcon`** — a circle: `todo` = empty faint ring, `progress` =
  half-filled amber pie, `done` = filled green circle with a check. Appears in
  group headers, before row/card titles, and in board column headers.
- **`Pill`** — `rounded-full` chip, `border-line`, `bg-white/[0.02]`,
  `text-muted-foreground`, `text-[11.5px]`. Used for labels (leading colored
  dot), projects/courses (leading `Box` icon), and progress (leading ring +
  `n/total`).
- **`ProgressRing`** — tiny SVG donut, filled portion in `--cm-accent`.
- **`Avatar`** — 18px circle; initials on an indigo→purple gradient, or a
  dashed empty circle when unassigned.

### Layout anatomy

- **Sidebar** (`w-236px`, collapsible, animated width): workspace switcher,
  search stub with `⌘K` kbd, primary nav (icon + label, active item uses
  `bg-accent-soft` + accent icon), a `COURSES` section (colored dot + name),
  Settings pinned bottom. Chrome color `--cm-sidebar`.
- **Content header** (`h-11`): breadcrumb (`Page / Subview`), right-aligned
  Filter + view switcher (List / Board segmented control). A sidebar toggle
  (`PanelLeft`) appears at the far left when the sidebar is collapsed.
- **List view**: sticky group headers (caret + StatusIcon + label + count +
  right `+`) with a `--cm-band` fill; rows indented so the priority icon aligns
  under the group's status circle. Row = PriorityIcon · mono ID · StatusIcon ·
  title · [parent breadcrumb] · [progress] · (right) label pills · course pill ·
  Avatar · due date.
- **Board view**: borderless columns each on a `--cm-column` surface
  (`rounded-xl`); header = StatusIcon + label + count + `···`/`+`; cards on
  `--cm-card` show ID + Avatar (top), StatusIcon + title, a wrapping meta row
  (priority, course pill, label pills, progress), and a "Due …" footer. `+ Add`
  ghost button reveals on **column hover** only.

---

## 5. Interaction patterns

- **Selection is multi-select**, not checkboxes. Click a row to toggle it into
  the selection; selected rows get `bg-accent-soft` + a faint inset accent ring.
  When ≥1 selected, a floating **bulk-action bar** rises from the bottom center
  (count + actions + Clear). `Esc` clears.
- **Hover**: rows/nav/cards shift to `--cm-elevated`; cards also brighten their
  border to `--cm-line-strong`. Reveal-on-hover for secondary affordances
  (sidebar collapse button, board `+ Add`).
- **Rows/cards are clickable**; titles that link out use the accent on hover.
- Everything should feel **instant** and keyboard-reachable.

### Global interaction layer

- **⌘K command palette** (`command-palette.tsx`) — fuzzy search over views,
  every course, and actions (Refresh). Arrow/Enter/Esc navigation, hover syncs
  the active row. Opened by `⌘K`, the sidebar search field, or the header `⌘K`
  button. Register new navigable surfaces here.
- **Keyboard shortcuts** — `g` then `d`/`c`/`k`/`o`/`s` jumps to
  Dashboard/Calendar/Board/Courses/Settings. Suppressed while typing in an
  input/textarea. Add go-to targets in the palette's `GOTO` map.
- **Toasts** (`toast.tsx`) — `useToast()(msg, "success" | "error" | "default")`.
  Use for the result of a mutation (e.g. a lane move), not for navigation.
  Bottom-right, auto-dismiss ~2.6s. Available to any client component under
  `AppShell`.
- **Loading skeletons** — every data route has a `loading.tsx` built from
  `Skeleton` / `ListSkeleton` that mirrors the real layout's shape. New routes
  ship one.
- **Focus rings** — keyboard-only `:focus-visible` accent outline is applied
  globally in `globals.css`; don't strip focus outlines on interactive elements.

---

## 6. Implementation map

Where the system lives, so you extend the right file:

| Concern                                             | File                                                                                   |
| --------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Frozen visual reference (dummy data)                | `src/app/proto/page.tsx`                                                               |
| Tokens (`--cm-*`), shadcn mapping, `.cm-row`, focus | `src/app/globals.css`                                                                  |
| App frame: sidebar + header + mobile drawer         | `src/components/app-shell.tsx`                                                         |
| Command palette + `g`-shortcuts                     | `src/components/command-palette.tsx`                                                   |
| Toasts                                              | `src/components/toast.tsx`                                                             |
| Primitives                                          | `src/components/ui/{priority-icon,status-icon,pill,progress-ring,avatar,skeleton}.tsx` |
| List view (multi-select + bulk bar)                 | `src/components/dashboard-list.tsx`                                                    |
| Board view                                          | `src/app/kanban/board.tsx`                                                             |
| Date / bucket / priority helpers                    | `src/lib/dates.ts`                                                                     |

---

## 7. Rules for future work

1. **Match `/proto`.** It is the reference implementation. New surfaces reuse the
   primitives and tokens above.
2. **Tokens only** — no hardcoded hex in components. Add a `--cm-*` var if a new
   value is truly needed, and document it here.
3. **One accent.** Indigo is the only brand color; semantic colors are for
   status/priority/labels, used as small dots/icons, not fills.
4. **Depth via surface + hairline**, never shadows or heavy borders.
5. **Dense + calm.** 13px base, tight spacing, subtle fast motion.
6. Keep it **dark-only**. Do not introduce a light theme without a redesign pass.
