import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyPassword, verifyPin, signToken } from "@/lib/auth";

// POST /api/auth/login
//   body (password login): { email, password, portal: "admin" | "teacher" }
//   body (PIN login, admin or teacher portal): { pin, portal: "admin" | "teacher" }
// `portal` restricts which role is allowed to sign in from that login page,
// so a teacher account can't be used on the Admin Login screen and vice versa.
//
// Default credentials: on first seed, the Admin/Principal account's PIN and
// password are both "12345" — see scripts/seed.js. Teachers get their own
// PIN (set by Admin from Staff Accounts) for quick sign-in the same way.
export async function POST(req) {
  try {
    const { email, password, pin, portal } = await req.json();

    if (!portal) {
      return Response.json({ error: "Portal is required" }, { status: 400 });
    }

    await connectDB();

    // --- PIN login (admin or teacher portal) ----------------------------
    if (pin) {
      const pinRoles =
        portal === "admin" ? ["superadmin", "admin"] : portal === "teacher" ? ["teacher"] : null;
      if (!pinRoles) {
        return Response.json({ error: "PIN login is only available for the Admin and Teacher portals" }, { status: 403 });
      }
      const candidates = await User.find({
        active: true,
        deletedAt: null,
        role: { $in: pinRoles },
        pinHash: { $exists: true, $ne: null },
      });
      let matched = null;
      for (const c of candidates) {
        // eslint-disable-next-line no-await-in-loop
        if (await verifyPin(pin, c.pinHash)) {
          matched = c;
          break;
        }
      }
      if (!matched) {
        return Response.json({ error: "Invalid PIN" }, { status: 401 });
      }
      matched.lastLoginAt = new Date();
      await matched.save();
      const token = signToken({
        sub: matched._id.toString(),
        role: matched.role,
        name: matched.name,
        // Same as the password-login path below — needed so CT / Subject
        // Teacher-only screens still unlock correctly after a PIN sign-in.
        classTeacherOf: matched.classTeacherOf || null,
        subjectAssignments: matched.subjectAssignments || [],
      });
      const res = Response.json({
        user: { id: matched._id, name: matched.name, email: matched.email, role: matched.role },
      });
      res.headers.set(
        "Set-Cookie",
        `school_session=${token}; HttpOnly; Path=/; Max-Age=28800; SameSite=Lax${
          process.env.NODE_ENV === "production" ? "; Secure" : ""
        }`
      );
      return res;
    }

    // --- Email + password login -----------------------------------------
    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim(), active: true, deletedAt: null });

    if (!user) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const allowedRoles =
      portal === "admin"
        ? ["superadmin", "admin"]
        : portal === "accountant"
        ? ["accountant"]
        : portal === "principal"
        ? ["principal"]
        : ["teacher"];

    if (!allowedRoles.includes(user.role)) {
      return Response.json(
        { error: `This account is not registered for the ${portal} portal` },
        { status: 403 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken({
      sub: user._id.toString(),
      role: user.role,
      name: user.name,
      // Carried on the token so pages can gate Class-Teacher-only screens
      // (Add Student, Attendance Sheet, Report Cards) without an extra DB call.
      classTeacherOf: user.classTeacherOf || null,
      // Same idea for Subject-Teacher screens (Enter Results): which
      // subject(s) this person teaches in which class(es).
      subjectAssignments: user.subjectAssignments || [],
    });

    const res = Response.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });

    res.headers.set(
      "Set-Cookie",
      `school_session=${token}; HttpOnly; Path=/; Max-Age=28800; SameSite=Lax${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`
    );

    return res;
  } catch (err) {
    console.error("[auth/login]", err);
    return Response.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
