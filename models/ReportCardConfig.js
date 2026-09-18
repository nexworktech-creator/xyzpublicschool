import mongoose from "mongoose";

// Toggle set controlling what appears on the generated report-card PDF.
// One config per className ("default" applies to any class without its own
// override), so the layout can differ e.g. between Primary and Senior wings.
const ReportCardConfigSchema = new mongoose.Schema(
  {
    className: { type: String, required: true, default: "default" },
    showOverallAttendance: { type: Boolean, default: true },
    showRank: { type: Boolean, default: true },
    showRemarks: { type: Boolean, default: true },
    showGradeScaleKey: { type: Boolean, default: true },
    showCustomNotes: { type: Boolean, default: false },
    customNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

ReportCardConfigSchema.index({ className: 1 }, { unique: true });

export default mongoose.models.ReportCardConfig ||
  mongoose.model("ReportCardConfig", ReportCardConfigSchema);
