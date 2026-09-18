import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import ResultsViewer from "@/components/ResultsViewer";

export const metadata = { title: "Results & Grading — XYZ Public School" };

export default function AdminResultsPage() {
  const token = cookies().get("school_session")?.value;
  const session = token ? verifyToken(token) : null;
  if (!session || !["superadmin", "admin"].includes(session.role)) redirect("/admin/login");

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <Link href="/admin/dashboard" className="text-sm text-navy-400 hover:text-navy">&larr; Dashboard</Link>
      <h1 className="mt-2 font-display text-3xl text-navy">Results &amp; Grading</h1>
      <p className="mt-1 text-sm text-navy-600">
        Search by class, section, exam and academic year. Ranks and grades are computed automatically
        as teachers enter marks.
      </p>
      <div className="mt-8">
        <ResultsViewer />
      </div>
    </div>
  );
}
