import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { requireRole, hashPassword, hashPin } from "@/lib/auth";

// PATCH /api/staff/:id — edit a teacher/admin record
export const PATCH = requireRole(["superadmin", "admin"], async (req, ctx) => {
  try {
    const { id } = ctx.params;
    const body = await req.json();
    await connectDB();

    const update = {};
    for (const key of ["name", "phone", "roleType", "classTeacherOf", "subjectAssignments", "faceCaptured", "faceImageUrl", "faceDescriptor", "active"]) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    if (body.password) update.passwordHash = await hashPassword(body.password);
    if (body.pin) update.pinHash = await hashPin(body.pin);
    if (body.teacherId) update.teacherId = body.teacherId.trim();

    const updated = await User.findByIdAndUpdate(id, { $set: update }, { new: true })
      .select("-passwordHash -pinHash -faceDescriptor");

    if (!updated) return Response.json({ error: "Staff record not found" }, { status: 404 });
    return Response.json({ user: updated });
  } catch (err) {
    console.error("[staff/:id PATCH]", err);
    return Response.json({ error: "Could not update account" }, { status: 500 });
  }
});

// DELETE /api/staff/:id?hard=true — soft-delete (default) or hard-delete a record
export const DELETE = requireRole(["superadmin", "admin"], async (req, ctx) => {
  try {
    const { id } = ctx.params;
    const { searchParams } = new URL(req.url);
    const hard = searchParams.get("hard") === "true";
    await connectDB();

    if (hard) {
      const deleted = await User.findByIdAndDelete(id);
      if (!deleted) return Response.json({ error: "Staff record not found" }, { status: 404 });
      return Response.json({ deleted: true, mode: "hard" });
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: { active: false, deletedAt: new Date() } },
      { new: true }
    );
    if (!updated) return Response.json({ error: "Staff record not found" }, { status: 404 });
    return Response.json({ deleted: true, mode: "soft", user: updated });
  } catch (err) {
    console.error("[staff/:id DELETE]", err);
    return Response.json({ error: "Could not delete account" }, { status: 500 });
  }
});
