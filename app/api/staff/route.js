import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { requireRole, hashPassword, hashPin } from "@/lib/auth";

// GET /api/staff?includeDeleted=true — list staff accounts (passwords never returned)
export const GET = requireRole(["superadmin", "admin"], async (req) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("includeDeleted") === "true" ? {} : { deletedAt: null };
  const staff = await User.find(filter).select("-passwordHash -pinHash -faceDescriptor").sort({ createdAt: -1 });
  return Response.json({ staff });
});

// Auto-generates the next sequential teacher_id, e.g. "T-0001", "T-0002"...
async function nextTeacherId() {
  const last = await User.findOne({ teacherId: { $exists: true, $ne: null } })
    .sort({ teacherId: -1 })
    .select("teacherId");
  const lastNum = last?.teacherId?.match(/(\d+)$/)?.[1];
  const next = (lastNum ? parseInt(lastNum, 10) : 0) + 1;
  return `T-${String(next).padStart(4, "0")}`;
}

// POST /api/staff  body: { name, email, password, role, roleType, classTeacherOf,
//   subjectAssignments: [{subject, className}], teacherId?, pin?, phone?,
//   faceCaptured?, faceImageUrl? }
export const POST = requireRole(["superadmin", "admin"], async (req) => {
  try {
    const {
      name,
      email,
      password,
      pin,
      role,
      roleType,
      classTeacherOf,
      subjectAssignments,
      teacherId,
      phone,
      faceCaptured,
      faceImageUrl,
      faceDescriptor,
    } = await req.json();

    if (!name || !email || !password || !role) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!["admin", "teacher", "accountant", "principal"].includes(role)) {
      return Response.json({ error: "Role must be admin, teacher, accountant or principal" }, { status: 400 });
    }
    if (roleType && !["Teacher", "Accountant", "Principal"].includes(roleType)) {
      return Response.json({ error: "Invalid role type" }, { status: 400 });
    }

    await connectDB();
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const finalTeacherId = teacherId?.trim() || (await nextTeacherId());
    const existingId = await User.findOne({ teacherId: finalTeacherId });
    if (existingId) {
      return Response.json({ error: "That teacher ID is already in use" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const pinHash = pin ? await hashPin(pin) : undefined;

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      pinHash,
      role,
      roleType: roleType || "Teacher",
      teacherId: finalTeacherId,
      classTeacherOf: classTeacherOf || null,
      subjectAssignments: Array.isArray(subjectAssignments) ? subjectAssignments : [],
      // keep legacy fields in sync so existing attendance/copy-check screens
      // (which read `assignedClasses`/`subject`) keep working
      assignedClasses: [
        ...(classTeacherOf ? [classTeacherOf] : []),
        ...((subjectAssignments || []).map((a) => a.className)),
      ].filter((v, i, arr) => arr.indexOf(v) === i),
      subject: (subjectAssignments || [])[0]?.subject,
      phone,
      faceCaptured: !!faceCaptured,
      faceImageUrl: faceImageUrl || undefined,
      faceDescriptor: Array.isArray(faceDescriptor) && faceDescriptor.length ? faceDescriptor : undefined,
    });

    const { passwordHash: _p, pinHash: _pin, faceDescriptor: _fd, ...safeUser } = user.toObject();
    return Response.json({ user: safeUser }, { status: 201 });
  } catch (err) {
    console.error("[staff:POST]", err);
    return Response.json({ error: "Could not create account" }, { status: 500 });
  }
});
