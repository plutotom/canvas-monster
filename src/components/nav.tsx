"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/courses", label: "Courses" },
  { href: "/settings", label: "Settings" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-6 px-6 py-3">
        <Link href="/" className="font-semibold text-zinc-100">
          canvas<span className="text-emerald-400">monster</span>
        </Link>
        <div className="flex gap-4 text-sm">
          {LINKS.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  active
                    ? "text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
