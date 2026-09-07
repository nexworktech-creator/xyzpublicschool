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
    // --- Branding used on printed/downloaded result report cards ---------
    schoolName: { type: String, default: "XYZ Public School" },
    phone: { type: String },
    affiliation: { type: String }, // e.g. "CBSE Affiliation No. 123456"
    logoUrl: { type: String },
    logoPublicId: { type: String },
    // Which of the 10 built-in report-card designs (see lib/resultTemplates.js)
    // Admin has chosen as the one used for every printed/downloaded result.
    selectedTemplateId: { type: String, default: "classic-navy" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.SchoolSettings ||
  mongoose.model("SchoolSettings", SchoolSettingsSchema);
