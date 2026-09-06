import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import DashboardCards from "@/components/DashboardCards";

export const metadata = { title: "Principal Dashboard — XYZ Public School" };

const MODULES = [
  { href: "/principal/copy-audit", title: "Unchecked Notebook Tracker", desc: "Select a class to inspect flagged unchecked notebooks, by Subject Teacher." },
  { href: "/principal/fees", title: "Fee Defaulters", desc: "School-wide overview of students with overdue installments." },
  { href: "/principal/staff-attendance", title: "Staff Attendance", desc: "Daily check-in/check-out logs for every teacher, with Excel export." },
  { href: "/principal/results", title: "Academic Performance", desc: "Class-wise results, ranks and grade distribution across the school." },
];

export default function PrincipalDashboardPage() {
  const token = cookies().get("school_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session || session.role !== "principal") {
    redirect("/principal/login");
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <p className="font-display text-sm italic text-brass-600">Welcome back, {session.name}</p>
      <h1 className="mt-1 font-display text-3xl text-navy">Principal Dashboard</h1>
      <p className="mt-1 text-sm text-navy-600">Complete visibility into school-wide analytics and audit reports.</p>

      <div className="mt-6">
        <DashboardCards />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="rounded-sm border border-navy-100 bg-white p-5 transition-colors hover:border-brass"
          >
            <h2 className="font-display text-lg text-navy">{m.title}</h2>
            <p className="mt-1.5 text-sm text-navy-600">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
