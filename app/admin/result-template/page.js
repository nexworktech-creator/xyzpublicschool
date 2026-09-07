import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import ResultTemplateGallery from "@/components/ResultTemplateGallery";

export const metadata = { title: "Result Template Selection — XYZ Public School" };

export default function AdminResultTemplatePage() {
  const token = cookies().get("school_session")?.value;
  const session = token ? verifyToken(token) : null;
  if (!session || !["superadmin", "admin"].includes(session.role)) redirect("/admin/login");

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <Link href="/admin/dashboard" className="text-sm text-navy-400 hover:text-navy">&larr; Dashboard</Link>
      <h1 className="mt-2 font-display text-3xl text-navy">Result Template Selection</h1>
      <p className="mt-1 text-sm text-navy-600">
        Set the school&apos;s branding and pick one of 10 report-card designs — it will be used for every
        student&apos;s printed/downloaded result (Teacher &rarr; Report Cards, Admin &rarr; Results).
      </p>
      <div className="mt-8">
        <ResultTemplateGallery />
      </div>
    </div>
  );
}
