import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import User from "@/models/User";
import { requireRole, isClassTeacherFor } from "@/lib/auth";

const EDITABLE_FIELDS = [
  "admissionNumber",
  "name",
  "fatherName",
  "motherName",
  "className",
  "section",
  "rollNumber",
  "dob",
  "gender",
  "guardianMobile",
  "address",
  "academicYear",
];

// PATCH /api/students/:id — Admin can edit any student. A Class Teacher (CT)
// may edit students in the class they are the Class Teacher of; they may
// not move a student into a different class than the one they teach.
export const PATCH = requireRole(["superadmin", "admin", "teacher"], async (req, ctx, session) => {
  try {
    const { id } = ctx.params;
    const body = await req.json();

    await connectDB();

    const student = await Student.findById(id);
    if (!student) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }

    if (session.role === "teacher") {
      const actingUser = await User.findById(session.sub);
      if (!isClassTeacherFor(actingUser, student.className)) {
        return Response.json(
          { error: "You can only edit students in the class you are the Class Teacher of." },
          { status: 403 }
        );
      }
      if (body.className && body.className !== student.className) {
        return Response.json(
          { error: "You cannot move a student to a different class." },
          { status: 403 }
        );
      }
    }

    for (const key of EDITABLE_FIELDS) {
      if (key in body) {
        student[key] = body[key] === "" ? undefined : body[key];
      }
    }
    if ("rollNumber" in body) {
      student.rollNumber = body.rollNumber === "" || body.rollNumber == null ? undefined : Number(body.rollNumber);
    }

    await student.save();
    return Response.json({ student });
  } catch (err) {
    console.error("[students/:id PATCH]", err);
    return Response.json({ error: "Could not update student" }, { status: 500 });
  }
});

// DELETE /api/students/:id — soft-delete (active: false) so existing results,
// attendance and copy-check history tied to this student stay intact. The
// student then simply disappears from every roster/listing, which already
// filters on `active: true`.
export const DELETE = requireRole(["superadmin", "admin", "teacher"], async (req, ctx, session) => {
  try {
    const { id } = ctx.params;
    await connectDB();

    const student = await Student.findById(id);
    if (!student) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }

    if (session.role === "teacher") {
      const actingUser = await User.findById(session.sub);
      if (!isClassTeacherFor(actingUser, student.className)) {
        return Response.json(
          { error: "You can only remove students in the class you are the Class Teacher of." },
          { status: 403 }
        );
      }
    }

    student.active = false;
    await student.save();
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[students/:id DELETE]", err);
    return Response.json({ error: "Could not remove student" }, { status: 500 });
  }
});
