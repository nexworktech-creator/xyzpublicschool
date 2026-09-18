import ExcelJS from "exceljs";
import { connectDB } from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Student from "@/models/Student";
import { requireRole } from "@/lib/auth";

const STATUS_LETTER = { present: "P", absent: "A", late: "L", "half-day": "H", leave: "Lv" };
const GREEN = "FFC6EFCE";
const RED = "FFFFC7CE";

// GET /api/attendance/export/excel?className=&section=&month=YYYY-MM
// Streams the class's monthly attendance grid (green P / red A) as .xlsx —
// the "Download Excel" button on the Attendance Sheet Visualizer.
export const GET = requireRole(["superadmin", "admin", "teacher", "principal"], async (req) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const className = searchParams.get("className");
  const section = searchParams.get("section");
  const month = searchParams.get("month");

  if (!className || !section || !month) {
    return Response.json({ error: "className, section and month are required" }, { status: 400 });
  }

  const [y, m] = month.split("-").map(Number);
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 1);
  const daysInMonth = new Date(y, m, 0).getDate();

  const students = await Student.find({ className, section, active: true }).sort({ rollNumber: 1 });
  const rolls = await Attendance.find({ className, section, date: { $gte: from, $lt: to } });

  const grid = {};
  students.forEach((s) => (grid[s._id.toString()] = {}));
  rolls.forEach((roll) => {
    const day = roll.date.getDate();
    roll.entries.forEach((e) => {
      const sid = e.student.toString();
      if (grid[sid]) grid[sid][day] = e.status;
    });
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`${className}-${section} ${month}`);

  sheet.columns = [
    { header: "Roll No", key: "roll", width: 10 },
    { header: "Name", key: "name", width: 26 },
    ...Array.from({ length: daysInMonth }, (_, i) => ({ header: String(i + 1), key: `d${i + 1}`, width: 4 })),
    { header: "Present %", key: "pct", width: 12 },
  ];
  sheet.getRow(1).font = { bold: true };

  students.forEach((s) => {
    const row = { roll: s.rollNumber, name: s.name };
    let marked = 0;
    let present = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const status = grid[s._id.toString()][d];
      if (status) {
        marked += 1;
        if (["present", "late", "half-day"].includes(status)) present += 1;
        row[`d${d}`] = STATUS_LETTER[status] || "-";
      } else {
        row[`d${d}`] = "";
      }
    }
    row.pct = marked ? `${Math.round((present / marked) * 100)}%` : "-";
    const addedRow = sheet.addRow(row);

    for (let d = 1; d <= daysInMonth; d++) {
      const status = grid[s._id.toString()][d];
      const cell = addedRow.getCell(2 + d);
      if (status === "absent") {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: RED } };
      } else if (["present", "late", "half-day"].includes(status)) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
      }
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${className}-${section}-attendance-${month}.xlsx"`,
    },
  });
});
