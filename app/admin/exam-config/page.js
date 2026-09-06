import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import ExamConfigForm from "@/components/ExamConfigForm";
import GradeScaleSetup from "@/components/GradeScaleSetup";
import ReportCardBuilder from "@/components/ReportCardBuilder";

export const metadata = { title: "Exam Configuration & Grading — XYZ Public School" };

export default function AdminExamConfigPage() {
  const token = cookies().get("school_session")?.value;
  const session = token ? verifyToken(token) : null;
  if (!session || !["superadmin", "admin"].includes(session.role)) redirect("/admin/login");

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <Link href="/admin/dashboard" className="text-sm text-navy-400 hover:text-navy">&larr; Dashboard</Link>
      <h1 className="mt-2 font-display text-3xl text-navy">Exam Configuration &amp; Custom Grading</h1>
      <p className="mt-1 text-sm text-navy-600">
        Define mark distributions per subject, non-academic grading options, the admin grading
        scale, and the dynamic report-card layout.
      </p>

      <div className="mt-8 space-y-10">
        <section>
          <h2 className="font-display text-lg text-navy">Mark distribution &amp; non-academic grading</h2>
          <div className="mt-3"><ExamConfigForm /></div>
        </section>

        <section>
          <h2 className="font-display text-lg text-navy">Admin Grading Scale Setup</h2>
          <div className="mt-3"><GradeScaleSetup /></div>
        </section>

        <section>
          <h2 className="font-display text-lg text-navy">Report card layout builder</h2>
          <div className="mt-3"><ReportCardBuilder /></div>
        </section>
      </div>
    </div>
  );
}
