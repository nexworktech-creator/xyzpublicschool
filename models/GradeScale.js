import mongoose from "mongoose";

const GradeBandSchema = new mongoose.Schema(
  {
    grade: { type: String, required: true }, // e.g. "A1", "A2", "B1"...
    minPercent: { type: Number, required: true },
    maxPercent: { type: Number, required: true },
    gradePoint: { type: Number }, // optional, for CGPA-style boards
    remark: { type: String }, // e.g. "Excellent", "Needs Improvement"
  },
  { _id: false }
);

// A named grading scale (e.g. "CBSE 9-10", "Primary 1-5") so different class
// groups can use different bands, and results reference the scale by name.
const GradeScaleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    appliesToClasses: [{ type: String }],
    passPercent: { type: Number, default: 33 },
    bands: [GradeBandSchema],
  },
  { timestamps: true }
);

export default mongoose.models.GradeScale || mongoose.model("GradeScale", GradeScaleSchema);
