import mongoose from "mongoose";

// A single mark-distribution component, e.g. { name: "PA-1", maxMarks: 15 }
const ComponentSchema = new mongoose.Schema(
  { name: { type: String, required: true }, maxMarks: { type: Number, required: true } },
  { _id: false }
);

// One subject's exam configuration for a class: either academic (marks add
// up across components to the subject total) or non-academic (graded with a
// fixed set of grading options instead of marks, e.g. "A+", "B+", "C+").
const SubjectConfigSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    isNonAcademic: { type: Boolean, default: false },
    components: [ComponentSchema], // used when isNonAcademic === false
    gradingOptions: [{ type: String }], // used when isNonAcademic === true
  },
  { _id: false }
);

const ExamConfigSchema = new mongoose.Schema(
  {
    academicYear: { type: String, required: true },
    className: { type: String, required: true },
    subjects: [SubjectConfigSchema],
  },
  { timestamps: true }
);

ExamConfigSchema.index({ academicYear: 1, className: 1 }, { unique: true });

export default mongoose.models.ExamConfig || mongoose.model("ExamConfig", ExamConfigSchema);
