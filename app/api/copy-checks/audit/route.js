import { connectDB } from "@/lib/mongodb";
import CopyCheck from "@/models/CopyCheck";
import { requireRole } from "@/lib/auth";

// GET /api/copy-checks/audit?className=&subject=&subjectsOnly=true
// subjectsOnly=true returns just the distinct subjects that have any
// copy-checking cycles recorded for that class — used to populate the
// dependent "Select Subject" dropdown so it only ever lists subjects that
// actually apply to the chosen class.
export const GET = requireRole(["superadmin", "admin", "principal"], async (req) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const className = searchParams.get("className");
  const subject = searchParams.get("subject");
  if (!className) {
    return Response.json({ error: "className is required" }, { status: 400 });
  }

  if (searchParams.get("subjectsOnly") === "true") {
    const subjects = await CopyCheck.distinct("subject", { className });
    return Response.json({ className, subjects: subjects.sort() });
  }

  const filter = { className };
  if (subject) filter.subject = subject;

  const cycles = await CopyCheck.find(filter)
    .populate("entries.student", "name rollNumber")
    .populate("teacher", "name teacherId")
    .sort({ assignedDate: -1 });

  const flagged = [];
  cycles.forEach((cycle) => {
    cycle.entries.forEach((entry) => {
      // Flag anything not yet marked "complete" — still pending, marked
      // incomplete, or the student was absent — so Admin/Principal can see
      // who still needs following up on.
      if (entry.status !== "complete") {
        flagged.push({
          studentName: entry.student?.name || "Unknown",
          rollNumber: entry.student?.rollNumber ?? "-",
          subject: cycle.subject,
          reportingTeacher: cycle.teacher?.name || "Unknown",
          copyType: cycle.copyType,
          status: entry.status || "pending",
          lastUpdated: entry.checkedOn || null,
          assignedDate: cycle.assignedDate,
          dueDate: cycle.dueDate,
          copyCheckId: cycle._id,
        });
      }
    });
  });

  return Response.json({ className, subject: subject || null, flagged });
});
