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
  getActiveCourses,
  getCourseAssignments,
  isSubmitted,
} from "./lib/canvas";
import { BUCKET_ORDER, bucketFor, formatDue, type Bucket } from "./lib/dates";

interface UpcomingItem {
  id: number;
  name: string;
  courseCode: string;
  dueAt: string;
  points: number | null;
  url: string;
}

async function loadUpcoming(): Promise<UpcomingItem[]> {
  const now = new Date();
  const courses = await getActiveCourses();
  const perCourse = await Promise.all(
    courses.map(async (course) => {
      let assignments;
      try {
        assignments = await getCourseAssignments(course.id);
      } catch {
        return [];
      }
      return assignments
        .filter((a) => a.due_at != null)
        .filter((a) => new Date(a.due_at as string) >= now)
        .filter((a) => !isSubmitted(a))
        .map<UpcomingItem>((a) => ({
          id: a.id,
          name: a.name,
          courseCode: course.course_code,
          dueAt: a.due_at as string,
          points: a.points_possible,
          url: a.html_url,
        }));
    }),
  );
  return perCourse.flat().sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

const BUCKET_COLOR: Record<Bucket, Color> = {
  Overdue: Color.Red,
  Today: Color.Orange,
  Tomorrow: Color.Green,
  "This week": Color.Blue,
  Later: Color.SecondaryText,
};

export default function Command() {
  const { data, isLoading, error, revalidate } = useCachedPromise(
    loadUpcoming,
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

  const now = new Date();
  const items = data ?? [];

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filter upcoming work…">
      <List.EmptyView
        icon={Icon.CheckCircle}
        title={isLoading ? "Loading…" : "Nothing due"}
        description={isLoading ? undefined : "You're all caught up. 🎉"}
      />
      {BUCKET_ORDER.map((bucket) => {
        const inBucket = items.filter(
          (it) => bucketFor(it.dueAt, now) === bucket,
        );
        if (inBucket.length === 0) return null;
        return (
          <List.Section
            key={bucket}
            title={bucket}
            subtitle={`${inBucket.length}`}
          >
            {inBucket.map((it) => (
              <List.Item
                key={it.id}
                icon={{ source: Icon.Circle, tintColor: BUCKET_COLOR[bucket] }}
                title={it.name}
                subtitle={it.courseCode}
                accessories={[
                  {
                    text: formatDue(it.dueAt),
                    ...(it.points != null
                      ? { tooltip: `${it.points} pts` }
                      : {}),
                  },
                ]}
                actions={
                  <ActionPanel>
                    <Action.OpenInBrowser url={it.url} title="Open in Canvas" />
                    <Action.CopyToClipboard
                      content={it.url}
                      title="Copy Link"
                    />
                    <Action
                      title="Refresh"
                      icon={Icon.ArrowClockwise}
                      shortcut={{ modifiers: ["cmd"], key: "r" }}
                      onAction={revalidate}
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
          </List.Section>
        );
      })}
    </List>
  );
}
