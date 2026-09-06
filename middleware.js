import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Runs on the Edge runtime, so we use `jose` (not jsonwebtoken) to verify
// the token here. This is a fast first line of defense; every protected
// page also re-checks the session server-side before rendering.
async function verify(token) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("school_session")?.value;
  const session = token ? await verify(token) : null;

  const isAdminArea = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isTeacherArea = pathname.startsWith("/teacher") && !pathname.startsWith("/teacher/login");
  const isAccountantArea = pathname.startsWith("/accountant") && !pathname.startsWith("/accountant/login");
  const isPrincipalArea = pathname.startsWith("/principal") && !pathname.startsWith("/principal/login");

  if (isAdminArea && (!session || !["superadmin", "admin"].includes(session.role))) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  if (isTeacherArea && (!session || session.role !== "teacher")) {
    return NextResponse.redirect(new URL("/teacher/login", req.url));
  }
  if (isAccountantArea && (!session || session.role !== "accountant")) {
    return NextResponse.redirect(new URL("/accountant/login", req.url));
  }
  if (isPrincipalArea && (!session || session.role !== "principal")) {
    return NextResponse.redirect(new URL("/principal/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*", "/accountant/:path*", "/principal/:path*"],
};
