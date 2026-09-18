/**
 * Run with: npm run seed
 * Creates the first Super Admin account (from .env SEED_ADMIN_EMAIL /
 * SEED_ADMIN_PASSWORD) and a default CBSE-style grading scale, if they
 * don't already exist.
 */
require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set. Add it to .env.local first.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const User = mongoose.models.User || mongoose.model(
    "User",
    new mongoose.Schema(
      {
        name: String,
        email: { type: String, unique: true },
        passwordHash: String,
        pinHash: String,
        role: String,
        roleType: String,
        teacherId: { type: String, unique: true, sparse: true },
        active: { type: Boolean, default: true },
      },
      { timestamps: true }
    )
  );

  const GradeScale = mongoose.models.GradeScale || mongoose.model(
    "GradeScale",
    new mongoose.Schema(
      {
        name: String,
        appliesToClasses: [String],
        passPercent: Number,
        bands: [
          {
            grade: String,
            minPercent: Number,
            maxPercent: Number,
            remark: String,
          },
        ],
      },
      { timestamps: true }
    )
  );

  const email = (process.env.SEED_ADMIN_EMAIL || "admin@xyzschool.edu").toLowerCase();
  // Default credentials, per spec: PIN / Password = 12345. Override via
  // SEED_ADMIN_PASSWORD / SEED_ADMIN_PIN in .env.local for production use.
  const password = process.env.SEED_ADMIN_PASSWORD || "12345";
  const pin = process.env.SEED_ADMIN_PIN || "12345";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin account already exists for ${email}. Skipping.`);
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    const pinHash = await bcrypt.hash(pin, 10);
    await User.create({
      name: "Super Admin",
      email,
      passwordHash,
      pinHash,
      role: "superadmin",
      roleType: "Principal",
      teacherId: "ADM-0001",
    });
    console.log(`Created Super Admin: ${email} / password: ${password} / PIN: ${pin}`);
    console.log("Please change these credentials after first login.");
  }

  const existingScale = await GradeScale.findOne({ name: "CBSE Standard" });
  if (!existingScale) {
    await GradeScale.create({
      name: "CBSE Standard",
      appliesToClasses: [],
      passPercent: 33,
      // Matches the Admin Grading Scale Setup example in the spec exactly
      // (33-45 -> C2, 46-60 -> B1, 80-90 -> A2, 91-100 -> A1); the gaps are
      // filled in with sensible defaults and are fully editable from
      // Admin > Exam Configuration > Grading Scale.
      bands: [
        { grade: "A1", minPercent: 91, maxPercent: 100, remark: "Outstanding" },
        { grade: "A2", minPercent: 80, maxPercent: 90, remark: "Excellent" },
        { grade: "B2", minPercent: 61, maxPercent: 79, remark: "Good" },
        { grade: "B1", minPercent: 46, maxPercent: 60, remark: "Fair" },
        { grade: "C2", minPercent: 33, maxPercent: 45, remark: "Average" },
        { grade: "D", minPercent: 0, maxPercent: 32, remark: "Needs Improvement" },
      ],
    });
    console.log("Created default 'CBSE Standard' grade scale.");
  } else {
    console.log("'CBSE Standard' grade scale already exists. Skipping.");
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
