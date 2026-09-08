import { connectDB } from "@/lib/mongodb";
import Event from "@/models/Event";
import { requireRole } from "@/lib/auth";
import { deleteFromCloudinary } from "@/lib/cloudinary";

// DELETE /api/events/:id — admin only, removes an event/activity from the
// public Activities & Events gallery and cleans up its Cloudinary media.
export const DELETE = requireRole(["superadmin", "admin"], async (req, ctx) => {
  try {
    const { id } = ctx.params;
    await connectDB();

    const deleted = await Event.findByIdAndDelete(id);
    if (!deleted) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    const uploadedMedia = (deleted.media || []).filter((m) => m.publicId);
    if (uploadedMedia.length) {
      // Best-effort cleanup — a failed Cloudinary delete shouldn't block the
      // event record itself from being removed.
      await Promise.all(
        uploadedMedia.map((m) =>
          deleteFromCloudinary(m.publicId, m.type === "video" ? "video" : "image").catch((err) =>
            console.error("[events/:id DELETE] cloudinary cleanup failed", err)
          )
        )
      );
    }

    return Response.json({ deleted: true });
  } catch (err) {
    console.error("[events/:id DELETE]", err);
    return Response.json({ error: "Could not delete event" }, { status: 500 });
  }
});
