import {
  Action,
  ActionPanel,
  Color,
  Icon,
  List,
  openExtensionPreferences,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import {
  courseWebUrl,
  getActiveCourses,
  getCourseAnnouncements,
  getCourseAssignments,
  isSubmitted,
} from "./lib/canvas";
import { formatDue } from "./lib/dates";
import type { CanvasCourse } from "./lib/types";

export default function Command() {
  const { data, isLoading, error, revalidate } = useCachedPromise(
    getActiveCourses,
    [],
    { keepPreviousData: true },
  );

  if (error) {
    return (
      <List>
        <List.EmptyView
          icon={{ source: Icon.ExclamationMark, tintColor: Color.Red }}
          title="Couldn't reach Canvas"
          description={
            "status" in error && (error as { status?: number }).status === 401
              ? "Your token looks invalid — open preferences to fix it."
              : error.message
          }
          actions={
            <ActionPanel>
              <Action
                title="Open Extension Preferences"
                icon={Icon.Gear}
                onAction={openExtensionPreferences}
              />
              <Action
                title="Retry"
                icon={Icon.ArrowClockwise}
                onAction={revalidate}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  const courses = data ?? [];

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search your courses…">
      <List.EmptyView
        icon={Icon.Book}
        title={isLoading ? "Loading…" : "No active courses"}
      />
      {courses.map((course) => (
        <List.Item
          key={course.id}
          icon={Icon.Book}
          title={course.name}
          subtitle={course.course_code}
          actions={
            <ActionPanel>
              <Action.Push
                title="View Course"
                icon={Icon.Sidebar}
                target={<CourseDetail course={course} />}
              />
              <Action.OpenInBrowser
                url={courseWebUrl(course.id)}
                title="Open Course in Canvas"
              />
              <Action
                title="Open Extension Preferences"
                icon={Icon.Gear}
                onAction={openExtensionPreferences}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

function CourseDetail({ course }: { course: CanvasCourse }) {
  const announcements = useCachedPromise(getCourseAnnouncements, [course.id], {
    keepPreviousData: true,
  });
  const assignments = useCachedPromise(getCourseAssignments, [course.id], {
    keepPreviousData: true,
  });

  const anns = announcements.data ?? [];
  const asgs = (assignments.data ?? [])
    .slice()
    .sort((a, b) => (b.due_at ?? "").localeCompare(a.due_at ?? ""));

  return (
    <List
      isLoading={announcements.isLoading || assignments.isLoading}
      navigationTitle={course.course_code}
      searchBarPlaceholder="Search this course…"
    >
      <List.EmptyView icon={Icon.Book} title="Nothing here yet" />

      <List.Section title="Announcements" subtitle={`${anns.length}`}>
        {anns.map((a) => (
          <List.Item
            key={`ann-${a.id}`}
            icon={{ source: Icon.Bell, tintColor: Color.Yellow }}
            title={a.title}
            accessories={
              a.posted_at ? [{ text: formatDue(a.posted_at) }] : undefined
            }
            actions={
              <ActionPanel>
                <Action.OpenInBrowser url={a.html_url} title="Open in Canvas" />
                <Action.CopyToClipboard
                  content={a.html_url}
                  title="Copy Link"
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>

      <List.Section title="Assignments" subtitle={`${asgs.length}`}>
        {asgs.map((a) => (
          <List.Item
            key={`asg-${a.id}`}
            icon={{
              source: isSubmitted(a) ? Icon.CheckCircle : Icon.Circle,
              tintColor: isSubmitted(a) ? Color.Green : Color.SecondaryText,
            }}
            title={a.name}
            accessories={[
              { text: a.due_at ? formatDue(a.due_at) : "No due date" },
            ]}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser url={a.html_url} title="Open in Canvas" />
                <Action.CopyToClipboard
                  content={a.html_url}
                  title="Copy Link"
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
