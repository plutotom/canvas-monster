import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell, type ShellCourse } from "@/components/app-shell";
import { getActiveCourses } from "@/lib/canvas/client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "canvas-monster",
  description: "A cleaner UI over Wheaton's Canvas LMS.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Sidebar course list. Cached (1hr TTL); degrades to empty if Canvas/token
  // isn't configured so the shell still renders.
  let courses: ShellCourse[] = [];
  try {
    courses = (await getActiveCourses()).map((c) => ({
      id: c.id,
      name: c.name,
      course_code: c.course_code,
    }));
  } catch {
    courses = [];
  }

  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-background text-foreground">
        <AppShell courses={courses}>{children}</AppShell>
      </body>
    </html>
  );
}
