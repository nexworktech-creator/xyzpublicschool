import { connectDB } from "@/lib/mongodb";
import ReportCardConfig from "@/models/ReportCardConfig";
import { requireRole } from "@/lib/auth";

// GET /api/report-card-config?className=default
export const GET = requireRole(["superadmin", "admin", "teacher"], async (req) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const className = searchParams.get("className") || "default";
  const config =
    (await ReportCardConfig.findOne({ className })) ||
    (await ReportCardConfig.findOne({ className: "default" }));
  return Response.json({ reportCardConfig: config || null });
});

// POST /api/report-card-config
// Dynamic report card layout builder: toggle which fields appear on the final PDFs.
export const POST = requireRole(["superadmin", "admin"], async (req) => {
  try {
    const body = await req.json();
    const className = body.className || "default";
    await connectDB();
    const config = await ReportCardConfig.findOneAndUpdate(
      { className },
      { $set: { ...body, className } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return Response.json({ reportCardConfig: config }, { status: 201 });
  } catch (err) {
    console.error("[report-card-config:POST]", err);
    return Response.json({ error: "Could not save report card layout" }, { status: 500 });
  }
});
