import { describe, expect, it } from "vitest";

import { bucketFor, priorityForBucket } from "@/lib/dates";

describe("bucketFor", () => {
  const now = new Date("2026-07-02T12:00:00");

  it("labels same-day due dates as Today", () => {
    expect(bucketFor("2026-07-02T23:59:00", now)).toBe("Today");
  });

  it("labels next-day due dates as Tomorrow", () => {
    expect(bucketFor("2026-07-03T09:00:00", now)).toBe("Tomorrow");
  });

  it("labels past due dates as Overdue", () => {
    expect(bucketFor("2026-07-01T09:00:00", now)).toBe("Overdue");
  });
});

describe("priorityForBucket", () => {
  it("maps urgent buckets to high priority", () => {
    expect(priorityForBucket("Overdue")).toBe(3);
    expect(priorityForBucket("Today")).toBe(3);
    expect(priorityForBucket("Later")).toBe(0);
  });
});
