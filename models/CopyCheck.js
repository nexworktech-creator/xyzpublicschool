import mongoose from "mongoose";

// Tracks a single round of a teacher checking a class's notebooks/answer
// copies for a subject, and which students' copies have been checked/returned.
const CopyCheckEntrySchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    checked: { type: Boolean, default: false },
    checkedOn: { type: Date },
    marksOrGrade: { type: String }, // free text: "9/10", "A", "Good", etc.
    remarks: { type: String },
  },
  { _id: false }
);

const CopyCheckSchema = new mongoose.Schema(
  {
    className: { type: String, required: true },
    section: { type: String, required: true },
    subject: { type: String, required: true },
    copyType: { type: String, enum: ["classwork", "homework", "test", "assignment"], default: "homework" },
    assignedDate: { type: Date, required: true },
    dueDate: { type: Date },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    entries: [CopyCheckEntrySchema],
    status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
  },
  { timestamps: true }
);

CopyCheckSchema.index({ className: 1, section: 1, subject: 1, assignedDate: -1 });

export default mongoose.models.CopyCheck || mongoose.model("CopyCheck", CopyCheckSchema);
