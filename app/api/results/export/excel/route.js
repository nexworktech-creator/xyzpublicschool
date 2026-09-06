import ExcelJS from "exceljs";
import { connectDB } from "@/lib/mongodb";
import Result from "@/models/Result";
import { requireRole } from "@/lib/auth";

// GET /api/results/export/excel?className=&section=&examName=&academicYear=
// Streams an .xlsx mark-sheet for the whole class/section/exam.
export const GET = requireRole(["superadmin", "admin", "teacher", "principal"], async (req) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const className = searchParams.get("className");
  const section = searchParams.get("section");
  const examName = searchParams.get("examName");
  const academicYear = searchParams.get("academicYear");

  const results = await Result.find({ className, section, examName, academicYear })
    .populate("student", "name rollNumber admissionNumber")
    .sort({ rankInClass: 1 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`${className}-${section} ${examName}`);

  const subjectNames = results[0]?.subjects.map((s) => s.subject) || [];

  sheet.columns = [
    { header: "Rank", key: "rank", width: 8 },
    { header: "Roll No", key: "roll", width: 10 },
    { header: "Name", key: "name", width: 26 },
    ...subjectNames.map((s) => ({ header: s, key: s, width: 12 })),
    { header: "Total", key: "total", width: 10 },
    { header: "%", key: "pct", width: 8 },
    { header: "Grade", key: "grade", width: 8 },
    { header: "Result", key: "result", width: 10 },
  ];
  sheet.getRow(1).font = { bold: true };

  results.forEach((r) => {
    const row = {
      rank: r.rankInClass,
      roll: r.student?.rollNumber,
      name: r.student?.name,
      total: `${r.totalObtained}/${r.totalMax}`,
      pct: r.percentage,
      grade: r.overallGrade,
      result: r.result,
    };
    r.subjects.forEach((s) => (row[s.subject] = s.marksObtained));
    sheet.addRow(row);
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${className}-${section}-${examName}-results.xlsx"`,
    },
  });
});
