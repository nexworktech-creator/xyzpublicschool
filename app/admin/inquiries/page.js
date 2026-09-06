import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import InquiriesTable from "@/components/InquiriesTable";

export const metadata = { title: "Admission Inquiries — XYZ Public School" };

export default function InquiriesPage() {
  const token = cookies().get("school_session")?.value;
  const session = token ? verifyToken(token) : null;
  if (!session || !["superadmin", "admin"].includes(session.role)) redirect("/admin/login");

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <Link href="/admin/dashboard" className="text-sm text-navy-400 hover:text-navy">&larr; Dashboard</Link>
      <h1 className="mt-2 font-display text-3xl text-navy">Admission Inquiries</h1>
      <p className="mt-1 text-sm text-navy-600">Submissions from the public website&apos;s inquiry form.</p>
      <div className="mt-8">
        <InquiriesTable />
      </div>
    </div>
  );
}
