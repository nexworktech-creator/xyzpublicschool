import mongoose from "mongoose";

// A single "default" monthly fee amount for a class — e.g. Class 3, April,
// ₹1500. Set in bulk from Admin → Fee Defaults (Multi-Month & Class
// Selection) so several classes and months can be configured together
// instead of one at a time. These defaults are then used to seed/patch the
// matching installment on every existing FeeRecord in that class, and can
// be reused whenever a new student's FeeRecord is created for that class.
const FeeDefaultSchema = new mongoose.Schema(
  {
    academicYear: { type: String, required: true }, // e.g. "2026-27"
    className: { type: String, required: true },
    month: { type: String, required: true }, // e.g. "April"
    amount: { type: Number, required: true },
  },
  { timestamps: true }
);

FeeDefaultSchema.index({ academicYear: 1, className: 1, month: 1 }, { unique: true });

export default mongoose.models.FeeDefault || mongoose.model("FeeDefault", FeeDefaultSchema);
