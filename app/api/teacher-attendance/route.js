import { connectDB } from "@/lib/mongodb";
import TeacherAttendance from "@/models/TeacherAttendance";
import User from "@/models/User";
import { requireRole } from "@/lib/auth";

function startOfDay(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

// GET /api/teacher-attendance?month=YYYY-MM&teacher=<id>
// Returns daily check-in/check-out logs, defaulting to the current month.
export const GET = requireRole(["superadmin", "admin", "teacher", "principal"], async (req, _ctx, session) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "2026-09"
  const teacherId = searchParams.get("teacher");

  const now = new Date();
  const [y, m] = month ? month.split("-").map(Number) : [now.getFullYear(), now.getMonth() + 1];
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 1);

  const filter = { date: { $gte: from, $lt: to } };
  // Teachers can only see their own logs; admins can see anyone's (or all).
  if (session.role === "teacher") filter.teacher = session.sub;
  else if (teacherId) filter.teacher = teacherId;

  const logs = await TeacherAttendance.find(filter)
    .populate("teacher", "name teacherId roleType")
    .sort({ date: 1 });

  return Response.json({ logs });
});

// POST /api/teacher-attendance  body: { action: "check-in" | "check-out", teacher? (admin only), source? }
// Synchronizes today's check-in/check-out timestamp for the caller (or, if
// an admin supplies `teacher`, for that staff member).
export const POST = requireRole(["superadmin", "admin", "teacher"], async (req, _ctx, session) => {
  try {
    const { action, teacher, source } = await req.json();
    if (!["check-in", "check-out"].includes(action)) {
      return Response.json({ error: "action must be check-in or check-out" }, { status: 400 });
    }

    const teacherId =
      session.role === "teacher" ? session.sub : teacher || session.sub;

    await connectDB();
    const staffMember = await User.findById(teacherId);
    if (!staffMember) return Response.json({ error: "Staff record not found" }, { status: 404 });

    const today = startOfDay(new Date());
    const field = action === "check-in" ? "checkInAt" : "checkOutAt";

    const log = await TeacherAttendance.findOneAndUpdate(
      { teacher: teacherId, date: today },
      { $set: { [field]: new Date(), source: source || "manual" }, $setOnInsert: { status: "present" } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return Response.json({ log }, { status: 201 });
  } catch (err) {
    console.error("[teacher-attendance:POST]", err);
    return Response.json({ error: "Could not sync attendance" }, { status: 500 });
  }
});
