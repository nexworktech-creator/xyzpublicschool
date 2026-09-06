import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export async function hashPin(plainPin) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(String(plainPin), salt);
}

export async function verifyPin(plainPin, pinHash) {
  if (!pinHash) return false;
  return bcrypt.compare(String(plainPin), pinHash);
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Reads the session cookie from a Next.js Request object and returns the
 * decoded user, or null. Use inside API routes / server components.
 */
export function getSessionFromRequest(req) {
  const cookieHeader = req.headers.get ? req.headers.get("cookie") : req.headers.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/school_session=([^;]+)/);
  if (!match) return null;
  return verifyToken(decodeURIComponent(match[1]));
}

/**
 * Mark Lock Logic helper: is this user the Subject Teacher assigned to
 * teach `subject` in `className`? Admins/superadmins always pass.
 */
export function isSubjectTeacherFor(userDoc, subject, className) {
  if (!userDoc) return false;
  if (["superadmin", "admin"].includes(userDoc.role)) return true;
  return (userDoc.subjectAssignments || []).some(
    (a) => a.subject === subject && a.className === className
  );
}

/**
 * Is this user the Class Teacher for `className`? Admins/superadmins always
 * pass (they can view everything).
 */
export function isClassTeacherFor(userDoc, className) {
  if (!userDoc) return false;
  if (["superadmin", "admin"].includes(userDoc.role)) return true;
  return userDoc.classTeacherOf === className;
}

/**
 * Wraps an API route handler and enforces that the caller is authenticated
 * and holds one of the allowed roles: "superadmin" | "admin" | "teacher".
 */
export function requireRole(allowedRoles, handler) {
  return async (req, ctx) => {
    const session = getSessionFromRequest(req);
    if (!session || !allowedRoles.includes(session.role)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    return handler(req, ctx, session);
  };
}
