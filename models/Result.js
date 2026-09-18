import mongoose from "mongoose";

// One line-item of a subject's mark distribution as configured by Admin in
// ExamConfig (e.g. { name: "PA-1", maxMarks: 15, obtained: 12 }). Stored so
// the teacher's entry screen can show/edit the same 80/20/5-style columns
// Admin set up, instead of only a single combined total.
const SubjectComponentMarkSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    maxMarks: { type: Number, required: true },
    obtained: { type: Number, default: 0 },
  },
  { _id: false }
);

const SubjectMarkSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    maxMarks: { type: Number, required: true, default: 100 },
    marksObtained: { type: Number, required: true, min: 0 },
    // Present when the subject uses a component-wise mark distribution
    // (Admin's exam-config format). maxMarks/marksObtained above are always
    // kept as the sum of these, so grade/percentage math keeps working
    // unchanged.
    components: { type: [SubjectComponentMarkSchema], default: undefined },
    // Present instead of marks when the subject is non-academic (grade-only,
    // e.g. "A+", "B+", "C+" as configured by Admin).
    gradeOnly: { type: String },
    grade: { type: String }, // filled in by grading-scale computation
    // Mark Lock Logic: the Subject Teacher who entered/saved this subject's
    // marks. Once set, only that same teacher (or an admin) may edit this
    // subject's entry — a Class Teacher can view it on the report-card sheet
    // but cannot overwrite it.
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    locked: { type: Boolean, default: false },
  },
  { _id: false }
);

const ResultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    className: { type: String, required: true },
    section: { type: String, required: true },
    academicYear: { type: String, required: true },
    examName: { type: String, required: true }, // e.g. "Half-Yearly", "Final Term"
    gradeScale: { type: mongoose.Schema.Types.ObjectId, ref: "GradeScale" },
    subjects: [SubjectMarkSchema],
    totalMax: { type: Number, required: true },
    totalObtained: { type: Number, required: true },
    percentage: { type: Number, required: true },
    overallGrade: { type: String },
    result: { type: String, enum: ["pass", "fail", "compartment"], default: "pass" },
    rankInClass: { type: Number },
    remarks: { type: String },
    publishedToPortal: { type: Boolean, default: false },
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

ResultSchema.index({ student: 1, academicYear: 1, examName: 1 }, { unique: true });
ResultSchema.index({ className: 1, section: 1, examName: 1, percentage: -1 });

export default mongoose.models.Result || mongoose.model("Result", ResultSchema);
