import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import ResultsViewer from "@/components/ResultsViewer";

export const metadata = { title: "Academic Performance — XYZ Public School" };

export default function PrincipalResultsPage() {
  const token = cookies().get("school_session")?.value;
  const session = token ? verifyToken(token) : null;
  if (!session || session.role !== "principal") redirect("/principal/login");

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <Link href="/principal/dashboard" className="text-sm text-navy-400 hover:text-navy">&larr; Dashboard</Link>
      <h1 className="mt-2 font-display text-3xl text-navy">Academic Performance</h1>
      <p className="mt-1 text-sm text-navy-600">Search by class, section, exam and academic year across the whole school.</p>
      <div className="mt-8">
        <ResultsViewer />
      </div>
    </div>
  );
}
