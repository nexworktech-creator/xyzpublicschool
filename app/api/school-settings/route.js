import { connectDB } from "@/lib/mongodb";
import SchoolSettings from "@/models/SchoolSettings";
import { requireRole } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { TEMPLATE_IDS } from "@/lib/resultTemplates";

// GET — any logged-in staff member can read settings (teachers need
// radiusMeters/lat/lng for punch-in, and the branding fields are used when
// printing report cards from the Teacher panel too).
export const GET = requireRole(
  ["superadmin", "admin", "teacher", "principal", "accountant"],
  async () => {
    await connectDB();
    const settings = await SchoolSettings.findOne({ key: "school-settings" });
    return Response.json({ settings: settings || null });
  }
);

// PUT — Admin/Superadmin only.
// Body may include any subset of:
//   { latitude, longitude, radiusMeters, address,
//     schoolName, phone, affiliation, selectedTemplateId,
//     logoDataUri }  // new logo upload (base64 data URI), optional
// Geofence fields (latitude/longitude) are only required together, so this
// also doubles as the plain "Save school info / template" endpoint used by
// the Result Template screen, which never touches location at all.
export const PUT = requireRole(["superadmin", "admin"], async (req, _ctx, session) => {
  try {
    const body = await req.json();
    const {
      latitude,
      longitude,
      radiusMeters,
      address,
      schoolName,
      phone,
      affiliation,
      selectedTemplateId,
      logoDataUri,
    } = body;

    const set = { updatedBy: session.sub };

    if (latitude !== undefined || longitude !== undefined) {
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return Response.json(
          { error: "latitude and longitude are required numbers" },
          { status: 400 }
        );
      }
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return Response.json({ error: "Invalid coordinates" }, { status: 400 });
      }
      set.latitude = latitude;
      set.longitude = longitude;
      const r = Number(radiusMeters) || 200;
      set.radiusMeters = r < 100 || r > 1000 ? 200 : r;
    }
    if (address !== undefined) set.address = address;
    if (schoolName !== undefined) set.schoolName = schoolName;
    if (phone !== undefined) set.phone = phone;
    if (affiliation !== undefined) set.affiliation = affiliation;
    if (selectedTemplateId !== undefined) {
      if (!TEMPLATE_IDS.includes(selectedTemplateId)) {
        return Response.json({ error: "Unknown template id" }, { status: 400 });
      }
      set.selectedTemplateId = selectedTemplateId;
    }

    await connectDB();

    if (logoDataUri) {
      const uploaded = await uploadToCloudinary(logoDataUri, "school-branding");
      set.logoUrl = uploaded.url;
      set.logoPublicId = uploaded.publicId;
    }

    const settings = await SchoolSettings.findOneAndUpdate(
      { key: "school-settings" },
      { $set: set },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return Response.json({ settings }, { status: 200 });
  } catch (err) {
    console.error("[school-settings:PUT]", err);
    return Response.json({ error: "Could not save school settings" }, { status: 500 });
  }
});
