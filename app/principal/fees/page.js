import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import FeeDefaultersList from "@/components/FeeDefaultersList";

export const metadata = { title: "Fee Defaulters — XYZ Public School" };

export default function PrincipalFeesPage() {
  const token = cookies().get("school_session")?.value;
  const session = token ? verifyToken(token) : null;
  if (!session || session.role !== "principal") redirect("/principal/login");

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <Link href="/principal/dashboard" className="text-sm text-navy-400 hover:text-navy">&larr; Dashboard</Link>
      <h1 className="mt-2 font-display text-3xl text-navy">Fee Defaulters</h1>
      <p className="mt-1 text-sm text-navy-600">Read-only, school-wide view — kept in sync with Accountant entries.</p>
      <div className="mt-8">
        <FeeDefaultersList />
      </div>
    </div>
  );
}
