import mongoose from "mongoose";

const SubjectAssignmentSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    className: { type: String, required: true },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    // Optional short PIN (hashed) — lets Admin/Principal sign in with a PIN
    // instead of a full password (default PIN is seeded as 12345).
    pinHash: { type: String },
    role: {
      type: String,
      enum: ["superadmin", "admin", "teacher", "accountant", "principal"],
      required: true,
      default: "teacher",
    },
    // Finer-grained designation shown in the Admin > Staff screen. `role`
    // above still drives login/portal access; `roleType` is the job title.
    roleType: {
      type: String,
      enum: ["Teacher", "Accountant", "Principal"],
      default: "Teacher",
    },
    // A short, unique, human-facing staff ID (e.g. "T-0007"), separate from
    // the Mongo _id, used on ID cards / attendance sheets / exports.
    teacherId: { type: String, unique: true, sparse: true, trim: true },
    phone: { type: String },

    // Class-Teacher designation: at most one class this person is the class
    // teacher for.
    classTeacherOf: { type: String, default: null },

    // Subject-Teacher assignments: which subject this person teaches in
    // which class(es). Drives the Mark Lock Logic in Results.
    subjectAssignments: [SubjectAssignmentSchema],

    // Legacy/simple field still used by some existing screens (kept for
    // backward compatibility with attendance/copy-check components).
    assignedClasses: [{ type: String }],
    subject: { type: String },

    photoUrl: { type: String },

    // Face Recognition data capture — we store a captured reference image
    // and an opaque descriptor payload (produced client-side) used to match
    // the teacher during face-based check-in/check-out.
    faceCaptured: { type: Boolean, default: false },
    faceImageUrl: { type: String },
    faceDescriptor: { type: [Number], default: undefined },

    active: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null }, // soft-delete marker
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
