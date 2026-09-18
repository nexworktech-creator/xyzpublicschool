import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import FeeDefaultsForm from "@/components/FeeDefaultsForm";
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
        Set a default fee structure across several classes and months at once, and see which
        students currently have an overdue, unpaid installment.
      </p>

      <div className="mt-8">
        <FeeDefaultsForm />
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg text-navy">Fee Defaulters</h2>
        <div className="mt-3">
          <FeeDefaultersList />
        </div>
      </div>
    </div>
  );
}
