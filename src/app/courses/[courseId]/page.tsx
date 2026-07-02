import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getCourse,
  getCourseAnnouncements,
  getCourseAssignments,
  getCourseModules,
  getSelfEnrollments,
} from "@/lib/canvas/client";
import { ErrorBox, toLoadError, type LoadError } from "@/components/error-box";
import { formatDue } from "@/lib/dates";
import { StatusIcon } from "@/components/ui/status-icon";
import { Pill } from "@/components/ui/pill";
import type {
  CanvasAnnouncement,
  CanvasAssignment,
  CanvasEnrollment,
  CanvasModule,
} from "@/lib/canvas/types";

export const dynamic = "force-dynamic";

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function submission(a: CanvasAssignment): {
  done: boolean;
  text: string;
  color: string;
} {
  const s = a.submission;
  if (s?.workflow_state === "graded") {
    const score = s.score != null ? `${s.score}` : "";
    const out = a.points_possible != null ? `/${a.points_possible}` : "";
    return {
      done: true,
      text: `Graded ${score}${out}`.trim(),
      color: "var(--cm-green)",
    };
  }
  if (s?.submitted_at || s?.workflow_state === "submitted") {
    return { done: true, text: "Submitted", color: "var(--cm-blue)" };
  }
  if (s?.missing)
    return { done: false, text: "Missing", color: "var(--cm-red)" };
  if (a.due_at && new Date(a.due_at) < new Date()) {
    return { done: false, text: "Overdue", color: "var(--cm-red)" };
  }
  return { done: false, text: "Not submitted", color: "var(--cm-faint)" };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const id = Number(courseId);
  const hasToken = !!process.env.CANVAS_TOKEN;

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
      <div className="px-4 py-6">
        <ErrorBox error={fatal} />
      </div>
    );
  }

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
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1 text-[12px] text-faint hover:text-muted-foreground"
          >
            <ArrowLeft size={13} /> Courses
          </Link>
          <h1 className="mt-1 text-xl font-semibold">{courseName}</h1>
          <p className="font-mono text-[12px] text-faint">{courseCode}</p>
        </div>
        {grade && grade.current_score != null && (
          <div className="shrink-0 rounded-lg border border-line bg-card px-4 py-2 text-right">
            <p className="text-[11px] text-faint">Current grade</p>
            <p className="text-lg font-semibold">
              {grade.current_grade ?? `${grade.current_score}%`}
            </p>
          </div>
        )}
      </header>

      <Section title="Assignments" count={dated.length}>
        {dated.length === 0 ? (
          <Empty>No dated assignments.</Empty>
        ) : (
          <div className="-mx-2">
            {dated.map((a) => {
              const s = submission(a);
              return (
                <a
                  key={a.id}
                  href={a.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-elevated"
                >
                  <StatusIcon status={s.done ? "done" : "todo"} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium group-hover:text-brand">
                      {a.name}
                    </p>
                    <p className="text-[11px] text-faint">
                      {a.due_at ? formatDue(a.due_at) : "No due date"}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-[12px]"
                    style={{ color: s.color }}
                  >
                    {s.text}
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
                <p className="mb-1.5 text-[13px] font-medium text-muted-foreground">
                  {m.name}
                </p>
                <ul className="space-y-0.5 border-l border-line pl-3">
                  {(m.items ?? []).map((it) => (
                    <li key={it.id}>
                      <a
                        href={it.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-md px-1.5 py-1 text-[13px] text-muted-foreground hover:bg-elevated hover:text-foreground"
                      >
                        <span className="font-mono text-[10px] text-faint">
                          {it.type}
                        </span>
                        <span className="truncate">{it.title}</span>
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
                className="block rounded-lg border border-line bg-card px-4 py-3 hover:border-line-strong"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <p className="truncate text-[13px] font-medium">{an.title}</p>
                  {an.posted_at && (
                    <span className="shrink-0 text-[11px] text-faint">
                      {formatDue(an.posted_at)}
                    </span>
                  )}
                </div>
                {an.message && (
                  <p className="mt-1 line-clamp-2 text-[12px] text-faint">
                    {stripHtml(an.message)}
                  </p>
                )}
              </a>
            ))}
          </div>
        )}
      </Section>
    </div>
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
      <h2 className="mb-2 flex items-center gap-2 text-[13px] font-semibold">
        {title}
        <Pill className="px-1.5 py-0 text-[11px]">{count}</Pill>
      </h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-line bg-panel px-4 py-3 text-[13px] text-faint">
      {children}
    </p>
  );
}
