import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import FaceCheckIn from "@/components/FaceCheckIn";

export const metadata = { title: "Punch In / Out — XYZ Public School" };

export default function TeacherPunchPage() {
  const token = cookies().get("school_session")?.value;
  const session = token ? verifyToken(token) : null;
  if (!session || session.role !== "teacher") redirect("/teacher/login");

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/teacher/dashboard" className="text-sm text-navy-400 hover:text-navy">
        &larr; Dashboard
      </Link>
      <h1 className="mt-2 font-display text-3xl text-navy">Punch In / Out</h1>
      <p className="mt-1 text-sm text-navy-600">
        Your daily attendance, verified by face and school location.
      </p>
      <div className="mt-8">
        <FaceCheckIn />
      </div>
    </div>
  );
}
