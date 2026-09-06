import { connectDB } from "@/lib/mongodb";
import SchoolSettings from "@/models/SchoolSettings";
import { requireRole } from "@/lib/auth";

// GET — any logged-in staff member can read the geofence (teachers need
// radiusMeters/lat/lng client-side to show distance-to-school feedback
// before they attempt to punch in).
export const GET = requireRole(
  ["superadmin", "admin", "teacher", "principal", "accountant"],
  async () => {
    await connectDB();
    const settings = await SchoolSettings.findOne({ key: "school-settings" });
    return Response.json({ settings: settings || null });
  }
);

// PUT — Admin/Superadmin only. Body: { latitude, longitude, radiusMeters, address? }
export const PUT = requireRole(["superadmin", "admin"], async (req, _ctx, session) => {
  try {
    const { latitude, longitude, radiusMeters, address } = await req.json();

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return Response.json(
        { error: "latitude and longitude are required numbers" },
        { status: 400 }
      );
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return Response.json({ error: "Invalid coordinates" }, { status: 400 });
    }
    const radius = Number(radiusMeters) || 200;
    if (radius < 100 || radius > 1000) {
      return Response.json(
        { error: "radiusMeters must be between 100 and 1000" },
        { status: 400 }
      );
    }

    await connectDB();
    const settings = await SchoolSettings.findOneAndUpdate(
      { key: "school-settings" },
      {
        $set: {
          latitude,
          longitude,
          radiusMeters: radius,
          address: address || undefined,
          updatedBy: session.sub,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return Response.json({ settings }, { status: 200 });
  } catch (err) {
    console.error("[school-settings:PUT]", err);
    return Response.json({ error: "Could not save school location" }, { status: 500 });
  }
});
