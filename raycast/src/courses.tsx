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
              <Action.OpenInBrowser
                url={courseWebUrl(course.id)}
                title="Open Course in Canvas"
              />
              <Action.Push
                title="Show Assignments"
                icon={Icon.List}
                target={<Assignments course={course} />}
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

function Assignments({ course }: { course: CanvasCourse }) {
  const { data, isLoading } = useCachedPromise(
    getCourseAssignments,
    [course.id],
    { keepPreviousData: true },
  );

  const assignments = (data ?? [])
    .slice()
    .sort((a, b) => (b.due_at ?? "").localeCompare(a.due_at ?? ""));

  return (
    <List
      isLoading={isLoading}
      navigationTitle={course.course_code}
      searchBarPlaceholder="Search assignments…"
    >
      <List.EmptyView
        icon={Icon.Document}
        title={isLoading ? "Loading…" : "No assignments"}
      />
      {assignments.map((a) => (
        <List.Item
          key={a.id}
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
              <Action.CopyToClipboard content={a.html_url} title="Copy Link" />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
