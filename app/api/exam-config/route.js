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

// POST /api/exam-config  body: { academicYear, className, subjects } OR { academicYear, classNames: [...], subjects }
// Defines mark distributions per subject (e.g. PA-1: 15, Notebook: 5,
// Half-Yearly: 80) and custom non-academic grading options (e.g. A+, B+, C+).
// Passing `classNames` (array) applies the same `subjects` config to every
// class in the list in one go, so admins don't have to repeat the same
// subject/marks setup class by class when several classes share it.
export const POST = requireRole(["superadmin", "admin"], async (req) => {
  try {
    const { academicYear, className, classNames, subjects } = await req.json();
    const targetClasses = Array.isArray(classNames) && classNames.length ? classNames : (className ? [className] : []);

    if (!academicYear || !targetClasses.length || !Array.isArray(subjects)) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    await connectDB();

    const configs = await Promise.all(
      targetClasses.map((cls) =>
        ExamConfig.findOneAndUpdate(
          { academicYear, className: cls },
          { $set: { subjects } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      )
    );

    return Response.json(
      { examConfigs: configs, examConfig: configs[0] },
      { status: 201 }
    );
  } catch (err) {
    console.error("[exam-config:POST]", err);
    return Response.json({ error: "Could not save exam configuration" }, { status: 500 });
  }
});
