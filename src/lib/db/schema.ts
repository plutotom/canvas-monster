import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Local Kanban lane state — the one piece of app state that is NOT a pure
 * mirror of Canvas. A row exists here only when a module item's lane differs
 * from what the auto-heuristic would pick (i.e. the user dragged it, or an
 * assignment auto-moved to Done). Absence of a row = "use the computed lane".
 *
 * `itemKey` is `${courseId}:${moduleItemId}` — module item ids are unique per
 * Canvas instance, but we prefix with course id for readability and safety.
 */
export const laneOverrides = pgTable("lane_overrides", {
  itemKey: text("item_key").primaryKey(),
  courseId: text("course_id").notNull(),
  lane: text("lane").notNull(),
  // true when the user dragged it by hand — a manual override wins over the
  // submission-based auto-move-to-Done so we never yank a card back.
  manual: boolean("manual").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type LaneOverride = typeof laneOverrides.$inferSelect;
