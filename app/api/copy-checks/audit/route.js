import { connectDB } from "@/lib/mongodb";
import CopyCheck from "@/models/CopyCheck";
import { requireRole } from "@/lib/auth";

// GET /api/copy-checks/audit?className=
// Flattens every un-checked notebook entry across all copy-checking cycles
// for the given class, for the Admin "Copy Unchecked Audit" screen.
export const GET = requireRole(["superadmin", "admin", "principal"], async (req) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const className = searchParams.get("className");
  if (!className) {
    return Response.json({ error: "className is required" }, { status: 400 });
  }

  const cycles = await CopyCheck.find({ className })
    .populate("entries.student", "name rollNumber")
    .populate("teacher", "name teacherId")
    .sort({ assignedDate: -1 });

  const flagged = [];
  cycles.forEach((cycle) => {
    cycle.entries.forEach((entry) => {
      if (!entry.checked) {
        flagged.push({
          studentName: entry.student?.name || "Unknown",
          rollNumber: entry.student?.rollNumber ?? "-",
          subject: cycle.subject,
          reportingTeacher: cycle.teacher?.name || "Unknown",
          copyType: cycle.copyType,
          assignedDate: cycle.assignedDate,
          dueDate: cycle.dueDate,
          copyCheckId: cycle._id,
        });
      }
    });
  });

  return Response.json({ className, flagged });
});
