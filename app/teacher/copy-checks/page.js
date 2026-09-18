import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import CopyCheckTracker from "@/components/CopyCheckTracker";

export const metadata = { title: "Copy Checking — XYZ Public School" };

export default function TeacherCopyChecksPage() {
  const token = cookies().get("school_session")?.value;
  const session = token ? verifyToken(token) : null;
  if (!session || session.role !== "teacher") redirect("/teacher/login");

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <Link href="/teacher/dashboard" className="text-sm text-navy-400 hover:text-navy">&larr; Dashboard</Link>
      <h1 className="mt-2 font-display text-3xl text-navy">Copy Checking</h1>
      <p className="mt-1 text-sm text-navy-600">
        Start a checking cycle for a class and subject, then tick off each student&apos;s notebook as
        you check it.
      </p>
      <div className="mt-8">
        <CopyCheckTracker />
      </div>
    </div>
  );
}
