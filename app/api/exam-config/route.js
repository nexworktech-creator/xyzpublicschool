import { connectDB } from "@/lib/mongodb";
import ExamConfig from "@/models/ExamConfig";
import { requireRole } from "@/lib/auth";

// GET /api/exam-config?academicYear=&className=
export const GET = requireRole(["superadmin", "admin", "teacher"], async (req) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter = {};
  if (searchParams.get("academicYear")) filter.academicYear = searchParams.get("academicYear");
  if (searchParams.get("className")) filter.className = searchParams.get("className");

  const configs = await ExamConfig.find(filter).sort({ className: 1 });
  return Response.json({ examConfigs: configs });
});

// POST /api/exam-config  body: { academicYear, className, subjects: [{subject, isNonAcademic, components, gradingOptions}] }
// Defines mark distributions per subject (e.g. PA-1: 15, Notebook: 5,
// Half-Yearly: 80) and custom non-academic grading options (e.g. A+, B+, C+).
export const POST = requireRole(["superadmin", "admin"], async (req) => {
  try {
    const { academicYear, className, subjects } = await req.json();
    if (!academicYear || !className || !Array.isArray(subjects)) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    await connectDB();
    const config = await ExamConfig.findOneAndUpdate(
      { academicYear, className },
      { $set: { subjects } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return Response.json({ examConfig: config }, { status: 201 });
  } catch (err) {
    console.error("[exam-config:POST]", err);
    return Response.json({ error: "Could not save exam configuration" }, { status: 500 });
  }
});
