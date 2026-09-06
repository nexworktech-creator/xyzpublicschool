import mongoose from "mongoose";

const TopperSchema = new mongoose.Schema(
  {
    studentName: { type: String, required: true, trim: true },
    className: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true, trim: true }, // e.g. "2025-26"
    rank: { type: Number, required: true, min: 1 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    photoUrl: { type: String },
    photoPublicId: { type: String },
    featured: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

TopperSchema.index({ academicYear: 1, rank: 1 });

export default mongoose.models.Topper || mongoose.model("Topper", TopperSchema);
