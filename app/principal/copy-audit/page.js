import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import CopyAuditView from "@/components/CopyAuditView";

export const metadata = { title: "Unchecked Notebook Tracker — XYZ Public School" };

export default function PrincipalCopyAuditPage() {
  const token = cookies().get("school_session")?.value;
  const session = token ? verifyToken(token) : null;
  if (!session || session.role !== "principal") redirect("/principal/login");

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <Link href="/principal/dashboard" className="text-sm text-navy-400 hover:text-navy">&larr; Dashboard</Link>
      <h1 className="mt-2 font-display text-3xl text-navy">Unchecked Notebook Tracker</h1>
      <p className="mt-1 text-sm text-navy-600">
        Select a class to see every notebook still flagged as unchecked — student, roll number,
        subject and the reporting Subject Teacher.
      </p>
      <div className="mt-8">
        <CopyAuditView />
      </div>
    </div>
  );
}
