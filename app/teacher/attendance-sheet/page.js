import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import AttendanceSheetVisualizer from "@/components/AttendanceSheetVisualizer";

export const metadata = { title: "Attendance Sheet — XYZ Public School" };

export default function TeacherAttendanceSheetPage() {
  const token = cookies().get("school_session")?.value;
  const session = token ? verifyToken(token) : null;
  if (!session || session.role !== "teacher") redirect("/teacher/login");

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <Link href="/teacher/dashboard" className="text-sm text-navy-400 hover:text-navy">&larr; Dashboard</Link>
      <h1 className="mt-2 font-display text-3xl text-navy">Attendance Sheet</h1>
      <p className="mt-1 text-sm text-navy-600">
        Green <span className="text-sage">P</span> for Present, red <span className="text-maroon">A</span> for
        Absent — pick a month to see the whole class at a glance, or download it as Excel.
      </p>
      <div className="mt-8">
        <AttendanceSheetVisualizer defaultClassName={session.classTeacherOf || ""} />
      </div>
    </div>
  );
}
