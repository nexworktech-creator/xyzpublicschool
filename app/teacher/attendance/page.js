import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import AttendanceForm from "@/components/AttendanceForm";

export const metadata = { title: "Mark Attendance — XYZ Public School" };

export default function AttendancePage() {
  const token = cookies().get("school_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session || session.role !== "teacher") {
    redirect("/teacher/login");
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/teacher/dashboard" className="text-sm text-navy-400 hover:text-navy">
        &larr; Dashboard
      </Link>
      <h1 className="mt-2 font-display text-3xl text-navy">Mark Attendance</h1>
      <p className="mt-1 text-sm text-navy-600">
        Select a class, section and date, then mark each student before saving.
      </p>

      <div className="mt-8">
        <AttendanceForm />
      </div>
    </div>
  );
}
