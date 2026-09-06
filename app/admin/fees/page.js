import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import FeeDefaultersList from "@/components/FeeDefaultersList";

export const metadata = { title: "Fee Defaults — XYZ Public School" };

export default function AdminFeesPage() {
  const token = cookies().get("school_session")?.value;
  const session = token ? verifyToken(token) : null;
  if (!session || !["superadmin", "admin"].includes(session.role)) redirect("/admin/login");

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <Link href="/admin/dashboard" className="text-sm text-navy-400 hover:text-navy">&larr; Dashboard</Link>
      <h1 className="mt-2 font-display text-3xl text-navy">Fee Defaults</h1>
      <p className="mt-1 text-sm text-navy-600">
        Students with an overdue, unpaid installment across any class. Fee records are added via the
        <code className="mx-1 rounded bg-navy-50 px-1.5 py-0.5 text-xs">/api/fees</code> API — connect a
        bulk-import screen here when the finance workflow is finalized.
      </p>
      <div className="mt-8">
        <FeeDefaultersList />
      </div>
    </div>
  );
}
