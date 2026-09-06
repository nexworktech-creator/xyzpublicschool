import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import ResultEntryForm from "@/components/ResultEntryForm";

export const metadata = { title: "Enter Results — XYZ Public School" };

export default function TeacherResultsPage() {
  const token = cookies().get("school_session")?.value;
  const session = token ? verifyToken(token) : null;
  if (!session || session.role !== "teacher") redirect("/teacher/login");

  const subjectAssignments = session.subjectAssignments || [];

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <Link href="/teacher/dashboard" className="text-sm text-navy-400 hover:text-navy">&larr; Dashboard</Link>
      <h1 className="mt-2 font-display text-3xl text-navy">Enter Results</h1>
      <p className="mt-1 text-sm text-navy-600">
        Select your class and subject, then fill in marks for the whole class at once — columns
        match whatever mark distribution Admin set up in Exam Config. Already-entered marks can
        be edited any time.
      </p>

      {!subjectAssignments.length ? (
        <p className="mt-4 text-sm text-navy-600">
          You are not currently assigned as a Subject Teacher for any class, so there&apos;s
          nothing to enter here yet. Ask an Admin to set your Subject-Teacher assignment from
          Staff Accounts, then log out and back in.
        </p>
      ) : (
        <div className="mt-8">
          <ResultEntryForm subjectAssignments={subjectAssignments} />
        </div>
      )}
    </div>
  );
}
