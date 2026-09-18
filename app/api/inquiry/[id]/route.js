import { connectDB } from "@/lib/mongodb";
import Inquiry from "@/models/Inquiry";
import { requireRole } from "@/lib/auth";

const STATUS_OPTIONS = ["Pending", "Contacted", "Approved", "Rejected"];

// PATCH /api/inquiry/:id  body: { status }
// Admin-only, quick inline status update from the Admission Inquiries table —
// used by the row-level dropdown so the status can change without a full
// page reload/refresh.
export const PATCH = requireRole(["superadmin", "admin"], async (req, ctx) => {
  try {
    const { id } = ctx.params;
    const { status } = await req.json();

    if (!STATUS_OPTIONS.includes(status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    await connectDB();
    const inquiry = await Inquiry.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    if (!inquiry) {
      return Response.json({ error: "Inquiry not found" }, { status: 404 });
    }

    return Response.json({ inquiry });
  } catch (err) {
    console.error("[inquiry/:id PATCH]", err);
    return Response.json({ error: "Could not update status" }, { status: 500 });
  }
});
