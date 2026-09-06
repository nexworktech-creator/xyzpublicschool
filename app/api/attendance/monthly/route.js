import { connectDB } from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Student from "@/models/Student";
import { requireRole } from "@/lib/auth";

const STATUS_LETTER = { present: "P", absent: "A", late: "L", "half-day": "H", leave: "Lv" };

// GET /api/attendance/monthly?className=&section=&month=YYYY-MM
// Returns every student in the class/section plus a day-by-day status grid
// for that month, for the "Attendance Sheet Visualizer" screen.
export const GET = requireRole(["superadmin", "admin", "teacher", "principal"], async (req) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const className = searchParams.get("className");
  const section = searchParams.get("section");
  const month = searchParams.get("month"); // "2026-09"

  if (!className || !section || !month) {
    return Response.json({ error: "className, section and month are required" }, { status: 400 });
  }

  const [y, m] = month.split("-").map(Number);
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const dates = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(y, m - 1, i + 1);
    return d.toISOString().slice(0, 10);
  });

  const students = await Student.find({ className, section, active: true }).sort({ rollNumber: 1 });
  const rolls = await Attendance.find({ className, section, date: { $gte: from, $lt: to } });

  const grid = {};
  students.forEach((s) => (grid[s._id.toString()] = {}));

  rolls.forEach((roll) => {
    const dateKey = roll.date.toISOString().slice(0, 10);
    roll.entries.forEach((e) => {
      const sid = e.student.toString();
      if (grid[sid]) grid[sid][dateKey] = e.status;
    });
  });

  return Response.json({
    className,
    section,
    month,
    dates,
    students: students.map((s) => ({ _id: s._id, name: s.name, rollNumber: s.rollNumber })),
    grid,
    statusLetter: STATUS_LETTER,
  });
});
