import mongoose from "mongoose";

// Singleton document (there is only ever one). Holds the school's
// geofence center point + allowed radius for face-recognition attendance,
// set by Admin from the browser's location (navigator.geolocation).
const SchoolSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "school-settings", unique: true },
    latitude: { type: Number },
    longitude: { type: Number },
    // Allowed distance (meters) a teacher may be from `latitude/longitude`
    // and still be permitted to punch in/out. Admin-configurable, 100–1000m.
    radiusMeters: { type: Number, default: 200, min: 100, max: 1000 },
    address: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.SchoolSettings ||
  mongoose.model("SchoolSettings", SchoolSettingsSchema);
