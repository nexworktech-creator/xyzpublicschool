import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";

export const metadata = { title: "Teacher Dashboard — XYZ Public School" };

const MODULES = [
  { href: "/teacher/punch", title: "Punch In / Out", desc: "Face + location verified daily attendance, from inside school." },
  { href: "/teacher/attendance", title: "Mark Attendance", desc: "Take daily attendance for your assigned class and section." },
  { href: "/teacher/results", title: "Enter Results", desc: "Enter subject-wise marks; grade and rank are calculated automatically." },
  { href: "/teacher/copy-checks", title: "Copy Checking", desc: "Track notebook and answer-copy checking cycles for your subject." },
];

// Shown only to teachers who are designated as a Class Teacher (CT).
const CT_MODULES = [
  { href: "/teacher/students", title: "Class Roster", desc: "Add new students to your class and view the complete roster." },
  { href: "/teacher/attendance-sheet", title: "Attendance Sheet", desc: "Monthly P/A grid for your class, with a Download Excel button." },
  { href: "/teacher/report-cards", title: "Make Result / Report Cards", desc: "See every subject for your whole class in one sheet, fill in your own subject, then generate each student's Report Card PDF." },
];

export default function TeacherDashboardPage() {
  const token = cookies().get("school_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session || session.role !== "teacher") {
    redirect("/teacher/login");
  }

  const modules = session.classTeacherOf ? [...MODULES, ...CT_MODULES] : MODULES;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <p className="font-display text-sm italic text-brass-600">Welcome back, {session.name}</p>
      <h1 className="mt-1 font-display text-3xl text-navy">Teacher Dashboard</h1>
      {session.classTeacherOf && (
        <p className="mt-1 text-sm text-navy-600">Class Teacher of {session.classTeacherOf}</p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="rounded-sm border border-navy-100 bg-white p-5 transition-colors hover:border-brass"
          >
            <h2 className="font-display text-lg text-navy">{m.title}</h2>
            <p className="mt-1.5 text-sm text-navy-600">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
