import mongoose from "mongoose";

// One document per teacher per calendar day, holding the synced check-in and
// check-out timestamps. Kept separate from the student `Attendance` model
// because the shape (single person, two timestamps) is different.
const TeacherAttendanceSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true }, // normalized to midnight, local school day
    checkInAt: { type: Date },
    checkOutAt: { type: Date },
    source: { type: String, enum: ["manual", "face", "admin"], default: "manual" },
    // Recorded only when source === "face" — the coordinates the teacher's
    // device reported at the moment of punch, and their computed distance
    // from the school's configured geofence center. Kept for audit/dispute
    // purposes even though the punch is already rejected server-side if
    // it falls outside the allowed radius.
    checkInLocation: {
      lat: Number,
      lng: Number,
      distanceMeters: Number,
    },
    checkOutLocation: {
      lat: Number,
      lng: Number,
      distanceMeters: Number,
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "half-day", "leave"],
      default: "present",
    },
  },
  { timestamps: true }
);

TeacherAttendanceSchema.index({ teacher: 1, date: 1 }, { unique: true });

export default mongoose.models.TeacherAttendance ||
  mongoose.model("TeacherAttendance", TeacherAttendanceSchema);
