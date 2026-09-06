import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import CopyAuditView from "@/components/CopyAuditView";

export const metadata = { title: "Copy Unchecked Audit — XYZ Public School" };

export default function AdminCopyAuditPage() {
  const token = cookies().get("school_session")?.value;
  const session = token ? verifyToken(token) : null;
  if (!session || !["superadmin", "admin"].includes(session.role)) redirect("/admin/login");

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <Link href="/admin/dashboard" className="text-sm text-navy-400 hover:text-navy">&larr; Dashboard</Link>
      <h1 className="mt-2 font-display text-3xl text-navy">Copy Unchecked Audit</h1>
      <p className="mt-1 text-sm text-navy-600">
        Select a class to view notebooks flagged as unchecked by subject teachers.
      </p>
      <div className="mt-8">
        <CopyAuditView />
      </div>
    </div>
  );
}
