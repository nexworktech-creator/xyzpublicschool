import { connectDB } from "@/lib/mongodb";
import Topper from "@/models/Topper";
import { requireRole } from "@/lib/auth";
import { deleteFromCloudinary } from "@/lib/cloudinary";

// DELETE /api/toppers/:id — admin only, removes a topper from the
// "Topper's Corner" grid and cleans up their Cloudinary photo (if any).
export const DELETE = requireRole(["superadmin", "admin"], async (req, ctx) => {
  try {
    const { id } = ctx.params;
    await connectDB();

    const deleted = await Topper.findByIdAndDelete(id);
    if (!deleted) {
      return Response.json({ error: "Topper not found" }, { status: 404 });
    }

    if (deleted.photoPublicId) {
      // Best-effort cleanup — a failed Cloudinary delete shouldn't block the
      // topper record itself from being removed.
      try {
        await deleteFromCloudinary(deleted.photoPublicId);
      } catch (err) {
        console.error("[toppers/:id DELETE] cloudinary cleanup failed", err);
      }
    }

    return Response.json({ deleted: true });
  } catch (err) {
    console.error("[toppers/:id DELETE]", err);
    return Response.json({ error: "Could not delete topper" }, { status: 500 });
  }
});
