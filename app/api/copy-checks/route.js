import { connectDB } from "@/lib/mongodb";
import CopyCheck from "@/models/CopyCheck";
import { requireRole } from "@/lib/auth";

// GET /api/copy-checks?className=&section=&subject=
export const GET = requireRole(["superadmin", "admin", "teacher"], async (req) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter = {};
  for (const key of ["className", "section", "subject", "status"]) {
    const val = searchParams.get(key);
    if (val) filter[key] = val;
  }

  const checks = await CopyCheck.find(filter)
    .populate("entries.student", "name rollNumber")
    .sort({ assignedDate: -1 });

  return Response.json({ copyChecks: checks });
});

// POST /api/copy-checks  — create a new checking cycle, or update an existing one's entries
export const POST = requireRole(["superadmin", "admin", "teacher"], async (req, _ctx, session) => {
  try {
    const { id, className, section, subject, copyType, assignedDate, dueDate, entries } =
      await req.json();

    await connectDB();

    if (id) {
      const status = entries?.every((e) => e.checked) ? "completed" : "in-progress";
      const updated = await CopyCheck.findByIdAndUpdate(
        id,
        { $set: { entries, status } },
        { new: true }
      );
      return Response.json({ copyCheck: updated });
    }

    if (!className || !section || !subject || !assignedDate) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const created = await CopyCheck.create({
      className,
      section,
      subject,
      copyType,
      assignedDate,
      dueDate,
      teacher: session.sub,
      entries: entries || [],
    });

    return Response.json({ copyCheck: created }, { status: 201 });
  } catch (err) {
    console.error("[copy-checks:POST]", err);
    return Response.json({ error: "Could not save copy-check record" }, { status: 500 });
  }
});
