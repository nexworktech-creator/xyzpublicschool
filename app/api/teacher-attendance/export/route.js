import ExcelJS from "exceljs";
import { connectDB } from "@/lib/mongodb";
import TeacherAttendance from "@/models/TeacherAttendance";
import { requireRole } from "@/lib/auth";

// GET /api/teacher-attendance/export?month=YYYY-MM
// Streams the whole school's monthly teacher check-in/check-out log as .xlsx.
export const GET = requireRole(["superadmin", "admin", "principal"], async (req) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const now = new Date();
  const [y, m] = month ? month.split("-").map(Number) : [now.getFullYear(), now.getMonth() + 1];
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 1);

  const logs = await TeacherAttendance.find({ date: { $gte: from, $lt: to } })
    .populate("teacher", "name teacherId roleType")
    .sort({ date: 1, "teacher.name": 1 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Attendance ${y}-${String(m).padStart(2, "0")}`);

  sheet.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Teacher ID", key: "teacherId", width: 12 },
    { header: "Name", key: "name", width: 26 },
    { header: "Role", key: "role", width: 14 },
    { header: "Check-In", key: "checkIn", width: 14 },
    { header: "Check-Out", key: "checkOut", width: 14 },
    { header: "Status", key: "status", width: 12 },
  ];
  sheet.getRow(1).font = { bold: true };

  logs.forEach((l) => {
    sheet.addRow({
      date: l.date.toISOString().slice(0, 10),
      teacherId: l.teacher?.teacherId || "-",
      name: l.teacher?.name || "-",
      role: l.teacher?.roleType || "-",
      checkIn: l.checkInAt ? l.checkInAt.toTimeString().slice(0, 5) : "-",
      checkOut: l.checkOutAt ? l.checkOutAt.toTimeString().slice(0, 5) : "-",
      status: l.status,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="teacher-attendance-${y}-${String(m).padStart(2, "0")}.xlsx"`,
    },
  });
});
