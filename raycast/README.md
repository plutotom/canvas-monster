# Canvas Monster

Check your Canvas assignments and jump to your courses from Raycast — no browser
tab needed. Works with any Canvas / Instructure school by setting the API base
URL.

## Commands

- **Upcoming** — upcoming, unsubmitted assignments across all your active
  courses, grouped by Overdue / Today / Tomorrow / This week / Later. Enter opens
  the assignment in Canvas.
- **Search Courses** — search active courses and open them in Canvas; drill in to
  browse a course's assignments.

## Setup

1. In Canvas, create a token: **Account → Settings → New Access Token**.
2. On first run, paste it into the extension's **Canvas Access Token** preference.
3. If your school isn't Wheaton, set **Canvas API Base URL** to your school's
   value, e.g. `https://<school>.instructure.com/api/v1`.

Your token is stored in Raycast's secure preferences and is only sent to your
Canvas instance.

## Notes

Data is cached between launches (via `useCachedPromise`) and refetched in the
background, keeping well under Canvas's per-token rate limit.
