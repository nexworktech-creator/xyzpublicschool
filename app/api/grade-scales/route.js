import { connectDB } from "@/lib/mongodb";
import GradeScale from "@/models/GradeScale";
import { requireRole } from "@/lib/auth";

export const GET = requireRole(["superadmin", "admin", "teacher"], async () => {
  await connectDB();
  const scales = await GradeScale.find({});
  return Response.json({ gradeScales: scales });
});

export const POST = requireRole(["superadmin", "admin"], async (req) => {
  try {
    const body = await req.json();
    if (!body.name || !Array.isArray(body.bands) || !body.bands.length) {
      return Response.json({ error: "Name and at least one grade band are required" }, { status: 400 });
    }
    await connectDB();
    const scale = await GradeScale.create(body);
    return Response.json({ gradeScale: scale }, { status: 201 });
  } catch (err) {
    console.error("[grade-scales:POST]", err);
    return Response.json({ error: "Could not save grade scale" }, { status: 500 });
  }
});
