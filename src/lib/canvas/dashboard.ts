import "server-only";

import { getActiveCourses, getCourseAssignments } from "./client";
import type { CanvasAssignment } from "./types";

/** A single upcoming piece of work, flattened across all courses. */
export interface UpcomingItem {
  assignmentId: number;
  courseId: number;
  courseName: string;
  courseCode: string;
  name: string;
  dueAt: string; // ISO — guaranteed non-null (filtered)
  pointsPossible: number | null;
  htmlUrl: string;
  submitted: boolean;
  graded: boolean;
  missing: boolean;
}

export interface DashboardData {
  generatedAt: string;
  courseCount: number;
  items: UpcomingItem[];
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
 * Fetch active courses, then their assignments in parallel, and flatten into a
 * single list of upcoming (future-due, not-yet-submitted) items sorted by due
 * date. This is the core "dashboard done right" merge.
 */
export async function getDashboard(now = new Date()): Promise<DashboardData> {
  const courses = await getActiveCourses();

  const perCourse = await Promise.all(
    courses.map(async (course) => {
      // A single failing course shouldn't blank the whole dashboard.
      let assignments: CanvasAssignment[] = [];
      try {
        assignments = await getCourseAssignments(course.id);
      } catch {
        assignments = [];
      }
      return assignments
        .filter((a) => a.due_at != null)
        .filter((a) => new Date(a.due_at as string) >= now)
        .filter((a) => !isSubmitted(a))
        .map<UpcomingItem>((a) => ({
          assignmentId: a.id,
          courseId: course.id,
          courseName: course.name,
          courseCode: course.course_code,
          name: a.name,
          dueAt: a.due_at as string,
          pointsPossible: a.points_possible,
          htmlUrl: a.html_url,
          submitted: isSubmitted(a),
          graded: a.submission?.workflow_state === "graded",
          missing: a.submission?.missing ?? false,
        }));
    }),
  );

  const items = perCourse.flat().sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  return {
    generatedAt: now.toISOString(),
    courseCount: courses.length,
    items,
  };
}
