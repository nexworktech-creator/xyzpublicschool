import mongoose from "mongoose";

const AttendanceEntrySchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    status: {
      type: String,
      enum: ["present", "absent", "late", "half-day", "leave"],
      required: true,
    },
    remarks: { type: String },
  },
  { _id: false }
);

// One document per class+section+date, holding every student's status for that day.
// This keeps a day's attendance atomic and makes "mark attendance" a single write,
// while still being easy to query per-student for monthly summaries/exports.
const AttendanceSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    className: { type: String, required: true },
    section: { type: String, required: true },
    takenBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    entries: [AttendanceEntrySchema],
  },
  { timestamps: true }
);

AttendanceSchema.index({ date: 1, className: 1, section: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);
