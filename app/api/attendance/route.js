import { connectDB } from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import { requireRole } from "@/lib/auth";

// GET /api/attendance?className=&section=&date=YYYY-MM-DD
export const GET = requireRole(["superadmin", "admin", "teacher"], async (req) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const className = searchParams.get("className");
  const section = searchParams.get("section");
  const date = searchParams.get("date");

  if (!className || !section || !date) {
    return Response.json({ error: "className, section and date are required" }, { status: 400 });
  }

  const record = await Attendance.findOne({
    className,
    section,
    date: new Date(date),
  }).populate("entries.student", "name rollNumber");

  return Response.json({ attendance: record || null });
});

// POST /api/attendance  body: { date, className, section, entries: [{ student, status, remarks }] }
// Upserts the whole day's roll — a teacher marks attendance once per class per day.
export const POST = requireRole(["superadmin", "admin", "teacher"], async (req, _ctx, session) => {
  try {
    const { date, className, section, entries } = await req.json();

    if (!date || !className || !section || !Array.isArray(entries)) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDB();
    const record = await Attendance.findOneAndUpdate(
      { date: new Date(date), className, section },
      { $set: { entries, takenBy: session.sub } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return Response.json({ attendance: record }, { status: 201 });
  } catch (err) {
    console.error("[attendance:POST]", err);
    return Response.json({ error: "Could not save attendance" }, { status: 500 });
  }
});
