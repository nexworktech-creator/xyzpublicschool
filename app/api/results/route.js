import { connectDB } from "@/lib/mongodb";
import Result from "@/models/Result";
import GradeScale from "@/models/GradeScale";
import User from "@/models/User";
import { requireRole, isSubjectTeacherFor } from "@/lib/auth";
import { computeResult, assignRanks } from "@/lib/grading";

// GET /api/results?className=&section=&examName=&academicYear=
export const GET = requireRole(["superadmin", "admin", "teacher", "principal"], async (req) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter = {};
  for (const key of ["className", "section", "examName", "academicYear"]) {
    const val = searchParams.get(key);
    if (val) filter[key] = val;
  }

  const results = await Result.find(filter)
    .populate("student", "name rollNumber admissionNumber")
    .populate("subjects.enteredBy", "name teacherId")
    .sort({ percentage: -1 });

  return Response.json({ results });
});

// POST /api/results  body: { student, className, section, academicYear, examName, gradeScaleId, subjects, remarks }
//
// Mark Lock Logic: a Subject Teacher can only submit marks for subjects they
// are assigned to teach in that class. Once a subject's marks are saved,
// that subject entry is `locked` to its `enteredBy` teacher (and admins) —
// anyone else's attempt to change that particular subject is silently
// ignored (their submission for OTHER, unlocked subjects still goes
// through). A Class Teacher therefore always sees the full sheet via GET,
// but can never overwrite a Subject Teacher's entry.
export const POST = requireRole(["superadmin", "admin", "teacher"], async (req, _ctx, session) => {
  try {
    const { student, className, section, academicYear, examName, gradeScaleId, subjects, remarks } =
      await req.json();

    if (!student || !className || !section || !academicYear || !examName || !Array.isArray(subjects)) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDB();

    const isAdmin = ["superadmin", "admin"].includes(session.role);
    const actingUser = isAdmin ? null : await User.findById(session.sub);

    const existing = await Result.findOne({ student, academicYear, examName });
    const existingSubjects = existing?.subjects || [];

    const mergedSubjects = [...existingSubjects];
    const rejectedSubjects = [];

    for (const incoming of subjects) {
      const idx = mergedSubjects.findIndex((s) => s.subject === incoming.subject);
      const current = idx >= 0 ? mergedSubjects[idx] : null;

      // Permission: teachers may only write subjects they're assigned to teach
      // in this class; admins may write anything.
      if (!isAdmin && !isSubjectTeacherFor(actingUser, incoming.subject, className)) {
        rejectedSubjects.push({ subject: incoming.subject, reason: "not-your-subject" });
        continue;
      }

      // Lock: if already locked by a *different* teacher, refuse to overwrite.
      if (current?.locked && String(current.enteredBy) !== String(session.sub) && !isAdmin) {
        rejectedSubjects.push({ subject: incoming.subject, reason: "locked" });
        continue;
      }

      // If the subject was submitted with a component-wise breakdown (the
      // 80/20/5-style distribution Admin set up in Exam Config), trust the
      // component numbers and derive maxMarks/marksObtained from them
      // server-side rather than whatever totals the client sent.
      const hasComponents = Array.isArray(incoming.components) && incoming.components.length > 0;
      const components = hasComponents
        ? incoming.components.map((c) => ({
            name: c.name,
            maxMarks: Number(c.maxMarks) || 0,
            obtained: Number(c.obtained) || 0,
          }))
        : undefined;

      const entry = {
        subject: incoming.subject,
        maxMarks: hasComponents
          ? components.reduce((sum, c) => sum + c.maxMarks, 0)
          : Number(incoming.maxMarks) || 0,
        marksObtained: hasComponents
          ? components.reduce((sum, c) => sum + c.obtained, 0)
          : Number(incoming.marksObtained) || 0,
        components,
        gradeOnly: incoming.gradeOnly || undefined,
        enteredBy: session.sub,
        locked: true,
      };
      if (idx >= 0) mergedSubjects[idx] = entry;
      else mergedSubjects.push(entry);
    }

    const gradeScale = gradeScaleId
      ? await GradeScale.findById(gradeScaleId)
      : existing?.gradeScale
      ? await GradeScale.findById(existing.gradeScale)
      : null;
    const computed = computeResult(mergedSubjects, gradeScale);
    // computeResult returns fresh subject objects without enteredBy/locked —
    // re-attach them from mergedSubjects (matched by subject name).
    computed.subjects = computed.subjects.map((s) => {
      const src = mergedSubjects.find((m) => m.subject === s.subject);
      return { ...s, enteredBy: src?.enteredBy, locked: src?.locked };
    });

    const saved = await Result.findOneAndUpdate(
      { student, academicYear, examName },
      {
        $set: {
          className,
          section,
          academicYear,
          examName,
          gradeScale: gradeScale?._id,
          remarks: remarks ?? existing?.remarks,
          enteredBy: existing?.enteredBy || session.sub,
          ...computed,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Recompute ranks across the whole class/section/exam cohort.
    const cohort = await Result.find({ className, section, academicYear, examName });
    const ranked = assignRanks(cohort.map((r) => ({ _id: r._id, percentage: r.percentage })));
    await Promise.all(
      ranked.map((r) => Result.updateOne({ _id: r._id }, { $set: { rankInClass: r.rankInClass } }))
    );

    return Response.json({ result: saved, rejectedSubjects }, { status: 201 });
  } catch (err) {
    console.error("[results:POST]", err);
    return Response.json({ error: "Could not save result" }, { status: 500 });
  }
});
