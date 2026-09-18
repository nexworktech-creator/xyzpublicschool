import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return Response.json({ user: null }, { status: 200 });
  }
  return Response.json({ user: { id: session.sub, name: session.name, role: session.role } });
}
