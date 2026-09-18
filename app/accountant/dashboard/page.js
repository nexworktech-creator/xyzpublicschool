import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";

export const metadata = { title: "Accountant Dashboard — XYZ Public School" };

const MODULES = [
  { href: "/accountant/fees", title: "Fee Status & Records", desc: "View class-wise fee status, mark payments, and flag defaulters." },
];

export default function AccountantDashboardPage() {
  const token = cookies().get("school_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session || session.role !== "accountant") {
    redirect("/accountant/login");
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <p className="font-display text-sm italic text-brass-600">Welcome back, {session.name}</p>
      <h1 className="mt-1 font-display text-3xl text-navy">Accountant Dashboard</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
