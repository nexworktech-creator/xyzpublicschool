import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import CTReportCards from "@/components/CTReportCards";

export const metadata = { title: "Report Cards — XYZ Public School" };

export default function TeacherReportCardsPage() {
  const token = cookies().get("school_session")?.value;
  const session = token ? verifyToken(token) : null;
  if (!session || session.role !== "teacher") redirect("/teacher/login");

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <Link href="/teacher/dashboard" className="text-sm text-navy-400 hover:text-navy">&larr; Dashboard</Link>
      <h1 className="mt-2 font-display text-3xl text-navy">Report Cards</h1>

      {!session.classTeacherOf ? (
        <p className="mt-4 text-sm text-navy-600">
          You are not currently assigned as a Class Teacher, so there&apos;s no roster to generate report
          cards for here. Ask an Admin to set your Class Teacher designation from Staff Accounts.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-navy-600">
            See every subject for every student in {session.classTeacherOf} in one sheet — roll no, name,
            each subject&apos;s marks (theory/practical/notebook, or grade for non-academic subjects like
            Drawing). Columns for your own subject(s) are editable; every other subject is read-only,
            filled in by the respective Subject Teacher. Once everything is filled in, generate the
            official report card PDF from a student&apos;s row.
          </p>
          <div className="mt-8">
            <CTReportCards classTeacherOf={session.classTeacherOf} subjectAssignments={session.subjectAssignments || []} />
          </div>
        </>
      )}
    </div>
  );
}
