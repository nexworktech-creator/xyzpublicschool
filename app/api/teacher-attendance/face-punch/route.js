import { connectDB } from "@/lib/mongodb";
import TeacherAttendance from "@/models/TeacherAttendance";
import SchoolSettings from "@/models/SchoolSettings";
import User from "@/models/User";
import { requireRole } from "@/lib/auth";
import { distanceMeters, descriptorDistance } from "@/lib/geo";

function startOfDay(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Below this face-descriptor distance, the live capture is considered a
// match against the teacher's registered face (face-api.js convention).
const FACE_MATCH_THRESHOLD = 0.6;

// POST /api/teacher-attendance/face-punch
// body: { action: "check-in" | "check-out", latitude, longitude, descriptor?: number[128] }
// Punch IN is verified by BOTH the geofence and the face match — the client
// is never trusted to self-report a match. Punch OUT only needs to be
// inside the geofence; no face descriptor is required or checked for it.
export const POST = requireRole(["teacher"], async (req, _ctx, session) => {
  try {
    const { action, latitude, longitude, descriptor } = await req.json();

    if (!["check-in", "check-out"].includes(action)) {
      return Response.json({ error: "action must be check-in or check-out" }, { status: 400 });
    }
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return Response.json(
        { error: "Could not read your device location. Enable location access and try again." },
        { status: 400 }
      );
    }
    const requiresFace = action === "check-in";
    if (requiresFace && (!Array.isArray(descriptor) || descriptor.length < 64)) {
      return Response.json(
        { error: "Could not read your face clearly. Face the camera in good light and try again." },
        { status: 400 }
      );
    }

    await connectDB();

    const settings = await SchoolSettings.findOne({ key: "school-settings" });
    if (!settings || typeof settings.latitude !== "number") {
      return Response.json(
        { error: "School location has not been configured yet. Ask Admin to set it in Settings." },
        { status: 409 }
      );
    }

    const dist = distanceMeters(latitude, longitude, settings.latitude, settings.longitude);
    if (dist > settings.radiusMeters) {
      return Response.json(
        {
          error: `You are ${Math.round(dist)}m from school — outside the allowed ${settings.radiusMeters}m range. Move closer and try again.`,
          distanceMeters: Math.round(dist),
          allowedRadiusMeters: settings.radiusMeters,
        },
        { status: 403 }
      );
    }

    const staffMember = await User.findById(session.sub);
    if (!staffMember) return Response.json({ error: "Staff record not found" }, { status: 404 });

    if (requiresFace) {
      if (!staffMember.faceCaptured || !staffMember.faceDescriptor?.length) {
        return Response.json(
          { error: "Your face is not registered yet. Ask Admin to capture it in Staff Accounts." },
          { status: 409 }
        );
      }

      const faceDist = descriptorDistance(descriptor, staffMember.faceDescriptor);
      if (faceDist > FACE_MATCH_THRESHOLD) {
        return Response.json(
          { error: "Face not recognized. Make sure it's you, facing the camera in good light." },
          { status: 401 }
        );
      }
    }

    const today = startOfDay(new Date());
    const field = action === "check-in" ? "checkInAt" : "checkOutAt";
    const locationField = action === "check-in" ? "checkInLocation" : "checkOutLocation";

    // `source` describes how the day's record was verified. Punch IN is
    // always face + location, so it's safe to (re)set it to "face". Punch
    // OUT is location-only, so we leave `source` as whatever check-in set
    // it to rather than introduce a value outside the schema's enum.
    const setFields = {
      [field]: new Date(),
      [locationField]: { lat: latitude, lng: longitude, distanceMeters: Math.round(dist) },
    };
    if (requiresFace) setFields.source = "face";

    const log = await TeacherAttendance.findOneAndUpdate(
      { teacher: session.sub, date: today },
      {
        $set: setFields,
        $setOnInsert: { status: "present" },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return Response.json({ log, distanceMeters: Math.round(dist) }, { status: 201 });
  } catch (err) {
    console.error("[teacher-attendance/face-punch:POST]", err);
    return Response.json({ error: "Could not record attendance" }, { status: 500 });
  }
});
