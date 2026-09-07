import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import DashboardCards from "@/components/DashboardCards";

export const metadata = { title: "Admin Dashboard — XYZ Public School" };

const MODULES = [
  { href: "/admin/inquiries", title: "Admission Inquiries", desc: "Follow up on inquiries submitted from the public website." },
  { href: "/admin/toppers", title: "Topper's Corner", desc: "Add or update the students featured on the public homepage." },
  { href: "/admin/events", title: "Activities & Events", desc: "Publish photos, videos and write-ups for the events gallery." },
  { href: "/admin/students", title: "Students & Attendance", desc: "Class-wise student list with live daily attendance status." },
  { href: "/admin/results", title: "Results & Grading", desc: "Review class-wise results, ranks and grade scales." },
  { href: "/admin/exam-config", title: "Exam Configuration & Grading", desc: "Mark distributions, custom grading scale and report-card layout." },
  { href: "/admin/result-template", title: "Result Template Selection", desc: "Pick one of 10 report-card designs and set the school's name, logo and board." },
  { href: "/admin/fees", title: "Fee Defaults", desc: "See students with overdue installments across the school." },
  { href: "/admin/copy-audit", title: "Copy Unchecked Audit", desc: "Flag notebooks that haven't been checked yet, by class." },
  { href: "/admin/teacher-attendance", title: "Teacher Attendance & Logs", desc: "Daily check-in/check-out logs, with monthly Excel export." },
  { href: "/admin/staff", title: "Staff Accounts", desc: "Create and manage Teacher, Accountant and Principal logins." },
  { href: "/admin/settings", title: "Settings", desc: "Set the school's location & radius for face-recognition attendance." },
];

export default function AdminDashboardPage() {
  const token = cookies().get("school_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session || !["superadmin", "admin"].includes(session.role)) {
    redirect("/admin/login");
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <p className="font-display text-sm italic text-brass-600">Welcome back, {session.name}</p>
      <h1 className="mt-1 font-display text-3xl text-navy">Admin Dashboard</h1>

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
