import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import CTStudentManager from "@/components/CTStudentManager";

export const metadata = { title: "Class Roster — XYZ Public School" };

export default function TeacherStudentsPage() {
  const token = cookies().get("school_session")?.value;
  const session = token ? verifyToken(token) : null;
  if (!session || session.role !== "teacher") redirect("/teacher/login");

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <Link href="/teacher/dashboard" className="text-sm text-navy-400 hover:text-navy">&larr; Dashboard</Link>
      <h1 className="mt-2 font-display text-3xl text-navy">Class Roster</h1>

      {!session.classTeacherOf ? (
        <p className="mt-4 text-sm text-navy-600">
          You are not currently assigned as a Class Teacher, so there&apos;s no roster to manage here.
          Ask an Admin to set your Class Teacher designation from Staff Accounts.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-navy-600">
            Add new students to your assigned class and view the complete roster.
          </p>
          <div className="mt-8">
            <CTStudentManager classTeacherOf={session.classTeacherOf} />
          </div>
        </>
      )}
    </div>
  );
}
