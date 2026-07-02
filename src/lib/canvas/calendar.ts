import "server-only";

import { getActiveCourses, getCourseAssignments } from "./client";
import type { CanvasAssignment } from "./types";

/** A due-dated item placed on the calendar. */
export interface CalendarItem {
  assignmentId: number;
  courseId: number;
  courseCode: string;
  name: string;
  dueAt: string; // ISO
  htmlUrl: string;
  submitted: boolean;
}

export interface CalendarData {
  generatedAt: string;
  items: CalendarItem[];
}

function isSubmitted(a: CanvasAssignment): boolean {
  const s = a.submission;
  if (!s) return false;
  return (
    s.workflow_state === "submitted" ||
    s.workflow_state === "graded" ||
    s.submitted_at != null
  );
}

/**
 * Every assignment with a due date across all active courses. The calendar
 * page filters to the visible month client-side; fetching all keeps month
 * navigation instant without refetching.
 */
export async function getCalendar(now = new Date()): Promise<CalendarData> {
  const courses = await getActiveCourses();

  const perCourse = await Promise.all(
    courses.map(async (course) => {
      let assignments: CanvasAssignment[] = [];
      try {
        assignments = await getCourseAssignments(course.id);
      } catch {
        assignments = [];
      }
      return assignments
        .filter((a) => a.due_at != null)
        .map<CalendarItem>((a) => ({
          assignmentId: a.id,
          courseId: course.id,
          courseCode: course.course_code,
          name: a.name,
          dueAt: a.due_at as string,
          htmlUrl: a.html_url,
          submitted: isSubmitted(a),
        }));
    }),
  );

  return {
    generatedAt: now.toISOString(),
    items: perCourse.flat().sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
  };
}
