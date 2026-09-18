import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import TeacherAttendanceLog from "@/components/TeacherAttendanceLog";

export const metadata = { title: "Staff Attendance — XYZ Public School" };

export default function PrincipalStaffAttendancePage() {
  const token = cookies().get("school_session")?.value;
  const session = token ? verifyToken(token) : null;
  if (!session || session.role !== "principal") redirect("/principal/login");

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <Link href="/principal/dashboard" className="text-sm text-navy-400 hover:text-navy">&larr; Dashboard</Link>
      <h1 className="mt-2 font-display text-3xl text-navy">Staff Attendance</h1>
      <p className="mt-1 text-sm text-navy-600">Daily check-in/check-out logs for every teacher.</p>
      <div className="mt-8">
        <TeacherAttendanceLog />
      </div>
    </div>
  );
}
