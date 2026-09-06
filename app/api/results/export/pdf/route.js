import PDFDocument from "pdfkit";
import { connectDB } from "@/lib/mongodb";
import Result from "@/models/Result";
import Attendance from "@/models/Attendance";
import { requireRole } from "@/lib/auth";

// GET /api/results/export/pdf?resultId=...
// Streams a single-page report card PDF for one student's result, including
// their overall attendance percentage and basic school branding.
export const GET = requireRole(["superadmin", "admin", "teacher", "principal"], async (req) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const resultId = searchParams.get("resultId");
  if (!resultId) {
    return Response.json({ error: "resultId is required" }, { status: 400 });
  }

  const result = await Result.findById(resultId).populate(
    "student",
    "name rollNumber admissionNumber className section"
  );
  if (!result) {
    return Response.json({ error: "Result not found" }, { status: 404 });
  }

  // Attendance percentage: every daily roll for this student's class/section
  // where they were marked, present/late/half-day counts as "present".
  const rolls = await Attendance.find({
    className: result.className,
    section: result.section,
    "entries.student": result.student?._id,
  });
  let totalMarked = 0;
  let totalPresent = 0;
  rolls.forEach((roll) => {
    const entry = roll.entries.find((e) => String(e.student) === String(result.student?._id));
    if (entry) {
      totalMarked += 1;
      if (["present", "late", "half-day"].includes(entry.status)) totalPresent += 1;
    }
  });
  const attendancePct = totalMarked ? Math.round((totalPresent / totalMarked) * 100) : null;

  const chunks = [];
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.on("data", (c) => chunks.push(c));

  const done = new Promise((resolve) => doc.on("end", resolve));

  // --- School branding header --------------------------------------------
  doc.rect(50, 40, 495, 90).strokeColor("#1b2a4a").lineWidth(1.2).stroke();
  doc.fontSize(20).fillColor("#1b2a4a").font("Helvetica-Bold").text("XYZ Public School", 0, 58, { align: "center" });
  doc.fontSize(9).fillColor("#8a6d3b").font("Helvetica-Oblique").text("Excellence in Education, Character and Community", 0, 82, { align: "center" });
  doc.fontSize(11).fillColor("#333").font("Helvetica-Bold").text("OFFICIAL REPORT CARD", 0, 104, { align: "center" });
  doc.y = 150;
  doc.fillColor("#000").font("Helvetica").fontSize(11);

  doc.text(`Student: ${result.student?.name}`);
  doc.text(`Class: ${result.className} - ${result.section}`);
  doc.text(`Roll No: ${result.student?.rollNumber || "-"}`);
  doc.text(`Admission No: ${result.student?.admissionNumber || "-"}`);
  doc.text(`Exam: ${result.examName}   Academic Year: ${result.academicYear}`);
  doc.text(`Overall Attendance: ${attendancePct != null ? `${attendancePct}%` : "No attendance on record"}`);
  doc.moveDown();

  const tableTop = doc.y;
  doc.font("Helvetica-Bold");
  doc.text("Subject", 50, tableTop, { width: 220 });
  doc.text("Marks Obtained", 280, tableTop, { width: 120 });
  doc.text("Max Marks", 400, tableTop, { width: 90 });
  doc.text("Grade", 500, tableTop, { width: 60 });
  doc.font("Helvetica");
  doc.moveDown(0.5);

  result.subjects.forEach((s) => {
    const y = doc.y;
    doc.text(s.subject, 50, y, { width: 220 });
    doc.text(String(s.marksObtained), 280, y, { width: 120 });
    doc.text(String(s.maxMarks), 400, y, { width: 90 });
    doc.text(s.grade || "-", 500, y, { width: 60 });
    doc.moveDown(0.5);
  });

  doc.moveDown();
  doc.font("Helvetica-Bold");
  doc.text(`Total: ${result.totalObtained} / ${result.totalMax}`);
  doc.text(`Percentage: ${result.percentage}%`);
  doc.text(`Overall Grade: ${result.overallGrade}`);
  doc.text(`Rank in Class: ${result.rankInClass || "-"}`);
  doc.text(`Result: ${result.result.toUpperCase()}`);
  doc.font("Helvetica");

  if (result.remarks) {
    doc.moveDown();
    doc.text(`Remarks: ${result.remarks}`);
  }

  doc.end();
  await done;

  const buffer = Buffer.concat(chunks);
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.student?.name}-report-card.pdf"`,
    },
  });
});
