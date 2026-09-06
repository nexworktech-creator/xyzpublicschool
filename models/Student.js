import mongoose from "mongoose";
import { CLASS_OPTIONS } from "./Inquiry";

const StudentSchema = new mongoose.Schema(
  {
    admissionNumber: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    fatherName: { type: String },
    motherName: { type: String },
    className: { type: String, required: true, enum: CLASS_OPTIONS },
    section: { type: String, default: "A" },
    rollNumber: { type: Number },
    dob: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    photoUrl: { type: String },
    photoPublicId: { type: String },
    guardianMobile: { type: String },
    address: { type: String },
    academicYear: { type: String, required: true }, // e.g. "2025-26"
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

StudentSchema.index({ className: 1, section: 1, rollNumber: 1 });

export default mongoose.models.Student || mongoose.model("Student", StudentSchema);
