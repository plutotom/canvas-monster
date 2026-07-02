import "server-only";

import {
  getActiveCourses,
  getCourseAssignments,
  getCourseModules,
} from "@/lib/canvas/client";
import { db } from "@/lib/db/client";
import { laneOverrides } from "@/lib/db/schema";
import {
  defaultLane,
  itemKey,
  SKIP_TYPES,
  type KanbanCard,
  type Lane,
} from "@/lib/kanban";

/**
 * Build the whole board: every module item across active courses, placed into
 * a lane. Precedence: manual override > submission-based auto-Done > type
 * heuristic. Canvas reads are cached (see client.ts); the DB read is one query.
 */
export async function buildBoard(): Promise<KanbanCard[]> {
  const courses = await getActiveCourses();

  // One row per item the user (or auto-move) has placed off its default lane.
  const overrideRows = db ? await db.select().from(laneOverrides) : [];
  const overrides = new Map(overrideRows.map((r) => [r.itemKey, r]));

  const perCourse = await Promise.all(
    courses.map(async (course) => {
      const [modules, assignments] = await Promise.all([
        getCourseModules(course.id),
        getCourseAssignments(course.id),
      ]);

      // assignment id -> has a submission (submitted/graded)
      const submitted = new Set(
        assignments
          .filter((a) => {
            const s = a.submission?.workflow_state;
            return (
              a.has_submitted_submissions || s === "submitted" || s === "graded"
            );
          })
          .map((a) => a.id),
      );

      const cards: KanbanCard[] = [];
      for (const mod of modules) {
        for (const item of mod.items ?? []) {
          if (SKIP_TYPES.has(item.type)) continue;
          const key = itemKey(course.id, item.id);
          const override = overrides.get(key);
          const isSubmitted =
            item.type === "Assignment" &&
            item.content_id != null &&
            submitted.has(item.content_id);

          let lane: Lane;
          let manual = false;
          if (override) {
            lane = override.lane as Lane;
            manual = override.manual;
          } else if (isSubmitted) {
            lane = "done";
          } else {
            lane = defaultLane(item);
          }

          cards.push({
            itemKey: key,
            courseId: course.id,
            courseCode: course.course_code,
            title: item.title,
            type: item.type,
            url: item.html_url,
            lane,
            submitted: isSubmitted,
            manual,
          });
        }
      }
      return cards;
    }),
  );

  return perCourse.flat();
}
