import PDFDocument from "pdfkit";
import { connectDB } from "@/lib/mongodb";
import Result from "@/models/Result";
import Attendance from "@/models/Attendance";
import SchoolSettings from "@/models/SchoolSettings";
import ReportCardConfig from "@/models/ReportCardConfig";
import { requireRole } from "@/lib/auth";
import { getTemplate } from "@/lib/resultTemplates";

const PAGE_LEFT = 50;
const PAGE_RIGHT = 545; // A4 width (595) - 50 margin
const PAGE_WIDTH = PAGE_RIGHT - PAGE_LEFT;

// --- Header variants -------------------------------------------------------
// Each draws the school name/tagline/board/"OFFICIAL REPORT CARD" block and
// returns the y-position the rest of the card should continue from.
const HEADER_DRAWERS = {
  bordered(doc, school, style) {
    doc.rect(PAGE_LEFT, 40, PAGE_WIDTH, 90).strokeColor(style.accent).lineWidth(1.2).stroke();
    doc.fontSize(20).fillColor(style.accent).font(style.boldFont).text(school.schoolName, 0, 58, { align: "center" });
    doc.fontSize(9).fillColor(style.accentSoft).font(style.italicFont).text(school.tagline, 0, 82, { align: "center" });
    doc.fontSize(11).fillColor("#333").font(style.boldFont).text("OFFICIAL REPORT CARD", 0, 104, { align: "center" });
    return 150;
  },
  "double-border"(doc, school, style) {
    doc.rect(PAGE_LEFT, 40, PAGE_WIDTH, 96).strokeColor(style.accent).lineWidth(1.5).stroke();
    doc.rect(PAGE_LEFT + 5, 45, PAGE_WIDTH - 10, 86).strokeColor(style.accentSoft).lineWidth(0.6).stroke();
    doc.fontSize(19).fillColor(style.accent).font(style.boldFont).text(school.schoolName, 0, 58, { align: "center" });
    if (school.affiliation) {
      doc.fontSize(8).fillColor(style.accentSoft).font(style.font).text(school.affiliation, 0, 80, { align: "center" });
    }
    doc.fontSize(10).fillColor("#333").font(style.boldFont).text("OFFICIAL REPORT CARD", 0, 104, { align: "center" });
    return 154;
  },
  band(doc, school, style) {
    doc.rect(0, 0, 595, 78).fillColor(style.accent).fill();
    doc.fontSize(22).fillColor("#ffffff").font(style.boldFont).text(school.schoolName, 0, 22, { align: "center" });
    doc.fontSize(9).fillColor("#ffffff").font(style.italicFont).text(school.tagline, 0, 50, { align: "center" });
    doc.fontSize(10).fillColor("#333").font(style.boldFont).text("OFFICIAL REPORT CARD", 0, 92, { align: "center" });
    return 122;
  },
  plain(doc, school, style) {
    doc.fontSize(18).fillColor(style.accent).font(style.boldFont).text(school.schoolName, 0, 45, { align: "center" });
    doc.fontSize(9).fillColor(style.accentSoft).font(style.italicFont).text(school.tagline, 0, 68, { align: "center" });
    doc.moveTo(PAGE_LEFT, 90).lineTo(PAGE_RIGHT, 90).strokeColor(style.accent).lineWidth(1).stroke();
    doc.fontSize(10).fillColor("#333").font(style.boldFont).text("REPORT CARD", 0, 98, { align: "center" });
    return 128;
  },
};

// --- Table variants ---------------------------------------------------------
// Each draws the subjects table starting at doc.y and returns the y-position
// after it finishes.
const TABLE_DRAWERS = {
  ruled(doc, subjects, style) {
    const tableTop = doc.y;
    doc.font(style.boldFont).fontSize(11);
    doc.text("Subject", PAGE_LEFT, tableTop, { width: 220 });
    doc.text("Marks Obtained", PAGE_LEFT + 230, tableTop, { width: 120 });
    doc.text("Max Marks", PAGE_LEFT + 350, tableTop, { width: 90 });
    doc.text("Grade", PAGE_LEFT + 445, tableTop, { width: 50 });
    doc.moveTo(PAGE_LEFT, tableTop + 16).lineTo(PAGE_RIGHT, tableTop + 16).strokeColor(style.accent).lineWidth(0.8).stroke();
    doc.font(style.font).fontSize(11);
    doc.y = tableTop + 22;
    subjects.forEach((s) => {
      const y = doc.y;
      doc.text(s.subject, PAGE_LEFT, y, { width: 220 });
      doc.text(String(s.marksObtained), PAGE_LEFT + 230, y, { width: 120 });
      doc.text(String(s.maxMarks), PAGE_LEFT + 350, y, { width: 90 });
      doc.text(s.grade || "-", PAGE_LEFT + 445, y, { width: 50 });
      doc.moveDown(0.6);
    });
    return doc.y;
  },
  striped(doc, subjects, style) {
    const tableTop = doc.y;
    doc.font(style.boldFont).fontSize(10);
    doc.rect(PAGE_LEFT, tableTop, PAGE_WIDTH, 18).fillColor(style.accent).fill();
    doc.fillColor("#fff");
    doc.text("Subject", PAGE_LEFT + 6, tableTop + 5, { width: 220 });
    doc.text("Obtained", PAGE_LEFT + 236, tableTop + 5, { width: 110 });
    doc.text("Max", PAGE_LEFT + 350, tableTop + 5, { width: 80 });
    doc.text("Grade", PAGE_LEFT + 445, tableTop + 5, { width: 50 });
    let y = tableTop + 18;
    subjects.forEach((s, i) => {
      const rowH = 20;
      if (i % 2 === 0) doc.rect(PAGE_LEFT, y, PAGE_WIDTH, rowH).fillColor("#f1f5f9").fill();
      doc.fillColor("#111").font(style.font).fontSize(10);
      doc.text(s.subject, PAGE_LEFT + 6, y + 5, { width: 220 });
      doc.text(String(s.marksObtained), PAGE_LEFT + 236, y + 5, { width: 110 });
      doc.text(String(s.maxMarks), PAGE_LEFT + 350, y + 5, { width: 80 });
      doc.text(s.grade || "-", PAGE_LEFT + 445, y + 5, { width: 50 });
      y += rowH;
    });
    doc.y = y + 10;
    return doc.y;
  },
  minimal(doc, subjects, style) {
    const tableTop = doc.y;
    doc.font(style.boldFont).fontSize(10).fillColor(style.accentSoft);
    doc.text("SUBJECT", PAGE_LEFT, tableTop, { width: 220, characterSpacing: 0.5 });
    doc.text("OBTAINED", PAGE_LEFT + 230, tableTop, { width: 110 });
    doc.text("MAX", PAGE_LEFT + 350, tableTop, { width: 80 });
    doc.text("GRADE", PAGE_LEFT + 445, tableTop, { width: 50 });
    doc.y = tableTop + 18;
    doc.font(style.font).fontSize(10.5).fillColor("#111");
    subjects.forEach((s) => {
      const y = doc.y;
      doc.text(s.subject, PAGE_LEFT, y, { width: 220 });
      doc.text(String(s.marksObtained), PAGE_LEFT + 230, y, { width: 110 });
      doc.text(String(s.maxMarks), PAGE_LEFT + 350, y, { width: 80 });
      doc.text(s.grade || "-", PAGE_LEFT + 445, y, { width: 50 });
      doc.moveTo(PAGE_LEFT, y + 15).lineTo(PAGE_RIGHT, y + 15).strokeColor("#e5e7eb").lineWidth(0.5).stroke();
      doc.moveDown(0.9);
    });
    return doc.y;
  },
  panel(doc, subjects, style) {
    return TABLE_DRAWERS.ruled(doc, subjects, style);
  },
  grid(doc, subjects, style) {
    const cols = 2;
    const cellW = PAGE_WIDTH / cols - 8;
    const cellH = 46;
    let x = PAGE_LEFT;
    let y = doc.y;
    subjects.forEach((s, i) => {
      doc.rect(x, y, cellW, cellH).strokeColor(style.accent).lineWidth(0.8).stroke();
      doc.font(style.boldFont).fontSize(10).fillColor(style.accent).text(s.subject, x + 8, y + 6, { width: cellW - 16 });
      doc.font(style.font).fontSize(10).fillColor("#111")
        .text(`${s.marksObtained} / ${s.maxMarks}   Grade: ${s.grade || "-"}`, x + 8, y + 24, { width: cellW - 16 });
      if (i % cols === cols - 1) {
        x = PAGE_LEFT;
        y += cellH + 8;
      } else {
        x += cellW + 16;
      }
    });
    doc.y = y + (subjects.length % cols === 0 ? 0 : cellH + 8) + 10;
    return doc.y;
  },
  compact(doc, subjects, style) {
    const tableTop = doc.y;
    doc.font(style.boldFont).fontSize(9);
    doc.text("Subject", PAGE_LEFT, tableTop, { width: 240 });
    doc.text("Obt.", PAGE_LEFT + 250, tableTop, { width: 80 });
    doc.text("Max", PAGE_LEFT + 340, tableTop, { width: 70 });
    doc.text("Grade", PAGE_LEFT + 420, tableTop, { width: 60 });
    doc.y = tableTop + 13;
    doc.font(style.font).fontSize(9);
    subjects.forEach((s) => {
      const y = doc.y;
      doc.text(s.subject, PAGE_LEFT, y, { width: 240 });
      doc.text(String(s.marksObtained), PAGE_LEFT + 250, y, { width: 80 });
      doc.text(String(s.maxMarks), PAGE_LEFT + 340, y, { width: 70 });
      doc.text(s.grade || "-", PAGE_LEFT + 420, y, { width: 60 });
      doc.moveDown(0.4);
    });
    return doc.y;
  },
};

// GET /api/results/export/pdf?resultId=...
// Streams a single-page report card PDF for one student's result, laid out
// with the school's branding and the report-card design Admin selected from
// Admin → Result Template Selection (10 built-in designs, see
// lib/resultTemplates.js), respecting the show/hide toggles from
// Admin → Exam Configuration → Report card layout builder.
export const GET = requireRole(["superadmin", "admin", "teacher", "principal"], async (req) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const resultId = searchParams.get("resultId");
  if (!resultId) {
    return Response.json({ error: "resultId is required" }, { status: 400 });
  }

  const result = await Result.findById(resultId).populate(
    "student",
    "name rollNumber admissionNumber fatherName className section"
  );
  if (!result) {
    return Response.json({ error: "Result not found" }, { status: 404 });
  }

  const [settings, config] = await Promise.all([
    SchoolSettings.findOne({ key: "school-settings" }),
    ReportCardConfig.findOne({ className: result.className }).then(
      (c) => c || ReportCardConfig.findOne({ className: "default" })
    ),
  ]);

  const school = {
    schoolName: settings?.schoolName || "XYZ Public School",
    tagline: settings?.affiliation
      ? settings.affiliation
      : "Excellence in Education, Character and Community",
    affiliation: settings?.affiliation || "",
    address: settings?.address || "",
    phone: settings?.phone || "",
    logoUrl: settings?.logoUrl || "",
  };
  const cfg = {
    showOverallAttendance: config?.showOverallAttendance ?? true,
    showRank: config?.showRank ?? true,
    showRemarks: config?.showRemarks ?? true,
    showCustomNotes: config?.showCustomNotes ?? false,
    customNotes: config?.customNotes || "",
  };

  const template = getTemplate(settings?.selectedTemplateId);
  const style = {
    accent: template.accent,
    accentSoft: template.accentSoft,
    font: template.font,
    boldFont: template.font.includes("Bold")
      ? template.font
      : template.font === "Times-Roman"
      ? "Times-Bold"
      : template.font === "Courier"
      ? "Courier-Bold"
      : "Helvetica-Bold",
    italicFont:
      template.font === "Times-Roman" ? "Times-Italic" : template.font === "Courier" ? "Courier-Oblique" : "Helvetica-Oblique",
  };

  // Attendance percentage: every daily roll for this student's class/section
  // where they were marked, present/late/half-day counts as "present".
  let attendancePct = null;
  if (cfg.showOverallAttendance) {
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
    attendancePct = totalMarked ? Math.round((totalPresent / totalMarked) * 100) : null;
  }

  const chunks = [];
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on("end", resolve));

  // --- Header (varies by template) ---------------------------------------
  const headerDraw = HEADER_DRAWERS[template.headerStyle] || HEADER_DRAWERS.bordered;
  const bodyStartY = headerDraw(doc, school, style);
  doc.y = bodyStartY;
  doc.fillColor("#000").font(style.font).fontSize(11);

  if (template.showRibbon && (result.rankInClass || result.overallGrade)) {
    doc.save();
    doc.rect(PAGE_RIGHT - 110, bodyStartY - 6, 110, 26).fillColor(style.accent).fill();
    doc.fillColor("#fff").font(style.boldFont).fontSize(10)
      .text(`Rank ${result.rankInClass || "-"}  |  ${result.overallGrade || "-"}`, PAGE_RIGHT - 106, bodyStartY, { width: 102 });
    doc.restore();
    doc.fillColor("#000").font(style.font).fontSize(11);
  }

  doc.text(`Student: ${result.student?.name}`);
  if (result.student?.fatherName) doc.text(`Father's Name: ${result.student.fatherName}`);
  doc.text(`Class: ${result.className} - ${result.section}`);
  doc.text(`Roll No: ${result.student?.rollNumber || "-"}`);
  doc.text(`Admission No: ${result.student?.admissionNumber || "-"}`);
  doc.text(`Exam: ${result.examName}   Academic Year: ${result.academicYear}`);
  if (cfg.showOverallAttendance) {
    doc.text(`Overall Attendance: ${attendancePct != null ? `${attendancePct}%` : "No attendance on record"}`);
  }
  doc.moveDown();

  // --- Marks table (varies by template) -----------------------------------
  const tableDraw = TABLE_DRAWERS[template.tableStyle] || TABLE_DRAWERS.ruled;
  tableDraw(doc, result.subjects, style);

  doc.moveDown();
  doc.font(style.boldFont).fillColor(style.accent);
  doc.text(`Total: ${result.totalObtained} / ${result.totalMax}`);
  doc.text(`Percentage: ${result.percentage}%`);
  doc.text(`Overall Grade: ${result.overallGrade}`);
  if (cfg.showRank) doc.text(`Rank in Class: ${result.rankInClass || "-"}`);
  doc.text(`Result: ${result.result.toUpperCase()}`);
  doc.font(style.font).fillColor("#000");

  if (cfg.showRemarks && result.remarks) {
    doc.moveDown();
    doc.text(`Remarks: ${result.remarks}`);
  }
  if (cfg.showCustomNotes && cfg.customNotes) {
    doc.moveDown();
    doc.fontSize(9).fillColor(style.accentSoft).text(cfg.customNotes);
  }

  if (template.showSignatureBox) {
    const boxY = 740;
    doc.fontSize(10).fillColor("#000");
    doc.moveTo(PAGE_LEFT, boxY).lineTo(PAGE_LEFT + 140, boxY).strokeColor("#000").lineWidth(0.8).stroke();
    doc.text("Class Teacher", PAGE_LEFT, boxY + 4);
    doc.moveTo(PAGE_RIGHT - 140, boxY).lineTo(PAGE_RIGHT, boxY).strokeColor("#000").lineWidth(0.8).stroke();
    doc.text("Principal", PAGE_RIGHT - 140, boxY + 4);
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
