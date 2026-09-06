import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import AccountantFeeManager from "@/components/AccountantFeeManager";
import FeeDefaultersList from "@/components/FeeDefaultersList";

export const metadata = { title: "Fee Status & Records — XYZ Public School" };

export default function AccountantFeesPage() {
  const token = cookies().get("school_session")?.value;
  const session = token ? verifyToken(token) : null;
  if (!session || session.role !== "accountant") redirect("/accountant/login");

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <Link href="/accountant/dashboard" className="text-sm text-navy-400 hover:text-navy">&larr; Dashboard</Link>
      <h1 className="mt-2 font-display text-3xl text-navy">Fee Status &amp; Records</h1>
      <p className="mt-1 text-sm text-navy-600">
        Pick a class to view each student&apos;s fee status and mark a month or term Paid / Unpaid.
      </p>
      <div className="mt-8">
        <AccountantFeeManager />
      </div>

      <h2 className="mt-12 font-display text-xl text-navy">Fee Defaulters (all classes)</h2>
      <p className="mt-1 text-sm text-navy-600">
        Updates here reflect immediately across the Admin and Principal dashboards.
      </p>
      <div className="mt-4">
        <FeeDefaultersList />
      </div>
    </div>
  );
}
