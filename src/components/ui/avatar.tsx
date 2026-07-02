/**
 * 18px avatar — initials on an indigo→purple gradient, or a dashed empty
 * circle when unassigned. See docs/DESIGN.md §4.
 */
export function Avatar({ initials }: { initials?: string }) {
  if (!initials) {
    return (
      <span className="grid h-[18px] w-[18px] place-items-center rounded-full border border-dashed border-line-strong text-[9px] text-faint">
        ?
      </span>
    );
  }
  return (
    <span
      className="grid h-[18px] w-[18px] place-items-center rounded-full text-[9px] font-semibold text-white"
      style={{ background: "linear-gradient(140deg,#6b7bd6,#a06bf5)" }}
    >
      {initials}
    </span>
  );
}
