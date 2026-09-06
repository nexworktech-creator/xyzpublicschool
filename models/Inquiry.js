import mongoose from "mongoose";

export const CLASS_OPTIONS = [
  "Nursery",
  "LKG",
  "UKG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

const InquirySchema = new mongoose.Schema(
  {
    studentOrParentName: { type: String, required: true, trim: true },
    classAppliedFor: { type: String, required: true, enum: CLASS_OPTIONS },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10}$/, "Enter a valid 10-digit mobile number"],
    },
    area: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["new", "contacted", "visited", "admitted", "closed"],
      default: "new",
    },
    notes: { type: String },
    source: { type: String, default: "website" },
  },
  { timestamps: true }
);

export default mongoose.models.Inquiry || mongoose.model("Inquiry", InquirySchema);
