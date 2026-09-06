import mongoose from "mongoose";

const InstallmentSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // e.g. "Term 1", "April", "Quarter 1"
    dueDate: { type: Date, required: true },
    amountDue: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    paidOn: { type: Date },
    mode: { type: String, enum: ["cash", "online", "cheque", "upi", "other"] },
    receiptNumber: { type: String },
  },
  { _id: false }
);

const FeeRecordSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    academicYear: { type: String, required: true },
    className: { type: String, required: true },
    totalAnnualFee: { type: Number, required: true },
    installments: [InstallmentSchema],
  },
  { timestamps: true }
);

FeeRecordSchema.index({ student: 1, academicYear: 1 }, { unique: true });

// Virtual: is any installment currently overdue and unpaid (a "fee default")?
FeeRecordSchema.virtual("isDefaulter").get(function () {
  const today = new Date();
  return this.installments.some(
    (i) => i.dueDate < today && i.amountPaid < i.amountDue
  );
});

FeeRecordSchema.set("toJSON", { virtuals: true });
FeeRecordSchema.set("toObject", { virtuals: true });

export default mongoose.models.FeeRecord || mongoose.model("FeeRecord", FeeRecordSchema);
