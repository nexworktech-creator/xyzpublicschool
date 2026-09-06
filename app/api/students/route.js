import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import User from "@/models/User";
import { requireRole, isClassTeacherFor } from "@/lib/auth";

// GET /api/students?className=&section=&academicYear=
export const GET = requireRole(["superadmin", "admin", "teacher"], async (req) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter = { active: true };
  for (const key of ["className", "section", "academicYear"]) {
    const val = searchParams.get(key);
    if (val) filter[key] = val;
  }

  const students = await Student.find(filter).sort({ rollNumber: 1 });
  return Response.json({ students });
});

// POST /api/students — Admin can add to any class. A Class Teacher (CT) may
// also add new students, but only to the class they are the Class Teacher of.
export const POST = requireRole(["superadmin", "admin", "teacher"], async (req, _ctx, session) => {
  try {
    const body = await req.json();
    if (!body.admissionNumber || !body.name || !body.className || !body.academicYear) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDB();

    if (session.role === "teacher") {
      const actingUser = await User.findById(session.sub);
      if (!isClassTeacherFor(actingUser, body.className)) {
        return Response.json(
          { error: "You can only add students to the class you are the Class Teacher of." },
          { status: 403 }
        );
      }
    }

    const student = await Student.create(body);
    return Response.json({ student }, { status: 201 });
  } catch (err) {
    console.error("[students:POST]", err);
    return Response.json({ error: "Could not save student" }, { status: 500 });
  }
});
