import { getDashboard, type DashboardData } from "@/lib/canvas/dashboard";
import { ErrorBox, toLoadError, type LoadError } from "@/components/error-box";
import { DashboardList } from "@/components/dashboard-list";

export const dynamic = "force-dynamic";

export default async function Home() {
  let data: DashboardData | undefined;
  let error: LoadError | null = null;
  try {
    data = await getDashboard();
  } catch (err) {
    error = toLoadError(err, !!process.env.CANVAS_TOKEN);
  }

  return (
    <div className="py-2">
      <div className="mb-1 flex items-baseline justify-between px-4 pt-1">
        <h1 className="text-[15px] font-semibold">My Work</h1>
        <p className="text-[12px] text-faint">
          {data
            ? `${data.items.length} upcoming · ${data.courseCount} courses`
            : "Upcoming work across all courses"}
        </p>
      </div>

      {error ? (
        <div className="px-4 py-4">
          <ErrorBox error={error} />
        </div>
      ) : data && data.items.length === 0 ? (
        <p className="mx-4 mt-6 rounded-lg border border-line bg-panel p-8 text-center text-muted-foreground">
          🎉 Nothing due. You&apos;re all caught up.
        </p>
      ) : (
        <DashboardList items={data?.items ?? []} generatedAt={data?.generatedAt ?? new Date().toISOString()} />
      )}
    </div>
  );
}
