import Link from "next/link";
import {
  getCourse,
  getCourseAnnouncements,
  getCourseAssignments,
  getCourseModules,
  getSelfEnrollments,
} from "@/lib/canvas/client";
import { ErrorBox, toLoadError, type LoadError } from "@/components/error-box";
import { formatDue } from "@/lib/dates";
import type {
  CanvasAnnouncement,
  CanvasAssignment,
  CanvasEnrollment,
  CanvasModule,
} from "@/lib/canvas/types";

export const dynamic = "force-dynamic";

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function submissionLabel(a: CanvasAssignment): {
  text: string;
  cls: string;
} {
  const s = a.submission;
  if (s?.workflow_state === "graded") {
    const score = s.score != null ? `${s.score}` : "";
    const out = a.points_possible != null ? `/${a.points_possible}` : "";
    return { text: `Graded ${score}${out}`.trim(), cls: "text-emerald-400" };
  }
  if (s?.submitted_at || s?.workflow_state === "submitted") {
    return { text: "Submitted", cls: "text-sky-400" };
  }
  if (s?.missing) return { text: "Missing", cls: "text-red-400" };
  if (a.due_at && new Date(a.due_at) < new Date()) {
    return { text: "Overdue", cls: "text-red-400" };
  }
  return { text: "Not submitted", cls: "text-zinc-500" };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const id = Number(courseId);
  const hasToken = !!process.env.CANVAS_TOKEN;

  // Fetch the course first; if that fails the page can't render.
  let courseName = `Course ${id}`;
  let courseCode = "";
  let fatal: LoadError | null = null;
  try {
    const course = await getCourse(id);
    courseName = course.name;
    courseCode = course.course_code;
  } catch (err) {
    fatal = toLoadError(err, hasToken);
  }

  if (fatal) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <ErrorBox error={fatal} />
      </main>
    );
  }

  // Everything else degrades gracefully — a failed section just renders empty.
  const [assignmentsR, modulesR, announcementsR, enrollmentsR] =
    await Promise.allSettled([
      getCourseAssignments(id),
      getCourseModules(id),
      getCourseAnnouncements(id),
      getSelfEnrollments(id),
    ]);

  const assignments: CanvasAssignment[] =
    assignmentsR.status === "fulfilled" ? assignmentsR.value : [];
  const modules: CanvasModule[] =
    modulesR.status === "fulfilled" ? modulesR.value : [];
  const announcements: CanvasAnnouncement[] =
    announcementsR.status === "fulfilled" ? announcementsR.value : [];
  const enrollments: CanvasEnrollment[] =
    enrollmentsR.status === "fulfilled" ? enrollmentsR.value : [];

  const grade = enrollments.find((e) => e.grades)?.grades;
  const dated = assignments
    .filter((a) => a.due_at)
    .sort((a, b) => (a.due_at as string).localeCompare(b.due_at as string));

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-6 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link href="/courses" className="text-xs text-zinc-500 hover:text-zinc-300">
            ← Courses
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-zinc-100">{courseName}</h1>
          <p className="text-sm text-zinc-500">{courseCode}</p>
        </div>
        {grade && grade.current_score != null && (
          <div className="shrink-0 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-right">
            <p className="text-xs text-zinc-500">Current grade</p>
            <p className="text-xl font-semibold text-zinc-100">
              {grade.current_grade ?? `${grade.current_score}%`}
            </p>
          </div>
        )}
      </header>

      <Section title="Assignments" count={dated.length}>
        {dated.length === 0 ? (
          <Empty>No dated assignments.</Empty>
        ) : (
          <div className="space-y-2">
            {dated.map((a) => {
              const label = submissionLabel(a);
              return (
                <a
                  key={a.id}
                  href={a.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-baseline justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 hover:border-zinc-700"
                >
                  <div className="min-w-0">
                    <p className="truncate text-zinc-100">{a.name}</p>
                    <p className="text-xs text-zinc-500">
                      {a.due_at ? formatDue(a.due_at) : "No due date"}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs ${label.cls}`}>
                    {label.text}
                  </span>
                </a>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Modules" count={modules.length}>
        {modules.length === 0 ? (
          <Empty>No modules.</Empty>
        ) : (
          <div className="space-y-4">
            {modules.map((m) => (
              <div key={m.id}>
                <p className="mb-1 text-sm font-medium text-zinc-300">{m.name}</p>
                <ul className="space-y-1 border-l border-zinc-800 pl-3">
                  {(m.items ?? []).map((it) => (
                    <li key={it.id} className="text-sm">
                      <a
                        href={it.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-400 hover:text-zinc-200"
                      >
                        <span className="mr-2 text-xs text-zinc-600">
                          {it.type}
                        </span>
                        {it.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Announcements" count={announcements.length}>
        {announcements.length === 0 ? (
          <Empty>No announcements.</Empty>
        ) : (
          <div className="space-y-2">
            {announcements.map((an) => (
              <a
                key={an.id}
                href={an.html_url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 hover:border-zinc-700"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <p className="truncate font-medium text-zinc-100">
                    {an.title}
                  </p>
                  {an.posted_at && (
                    <span className="shrink-0 text-xs text-zinc-500">
                      {formatDue(an.posted_at)}
                    </span>
                  )}
                </div>
                {an.message && (
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                    {stripHtml(an.message)}
                  </p>
                )}
              </a>
            ))}
          </div>
        )}
      </Section>
    </main>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        {title}
        <span className="ml-2 text-zinc-600">{count}</span>
      </h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-500">
      {children}
    </p>
  );
}
