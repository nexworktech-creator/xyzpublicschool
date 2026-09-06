import { connectDB } from "@/lib/mongodb";
import FeeRecord from "@/models/FeeRecord";
import { requireRole } from "@/lib/auth";

// PATCH /api/fees/mark
// body: { student, academicYear, className, totalAnnualFee, label, dueDate,
//         amountDue, paid, amountPaid?, mode?, receiptNumber? }
//
// Accountant-facing "mark fee status" action: sets or updates a single
// month/term installment on a student's fee record (creating the record if
// it doesn't exist yet), instead of requiring the whole installments array
// to be resent. `paid: true` marks that installment fully paid (amountPaid
// = amountDue unless amountPaid is explicitly given); `paid: false` marks it
// unpaid (amountPaid = 0). Flows straight into the same FeeRecord that Admin
// and Principal dashboards already read from.
export const PATCH = requireRole(["superadmin", "admin", "accountant"], async (req) => {
  try {
    const {
      student,
      academicYear,
      className,
      totalAnnualFee,
      label,
      dueDate,
      amountDue,
      paid,
      amountPaid,
      mode,
      receiptNumber,
    } = await req.json();

    if (!student || !academicYear || !className || !label) {
      return Response.json({ error: "student, academicYear, className and label are required" }, { status: 400 });
    }

    await connectDB();

    let record = await FeeRecord.findOne({ student, academicYear });
    if (!record) {
      if (!totalAnnualFee) {
        return Response.json(
          { error: "totalAnnualFee is required when creating a new fee record for this student" },
          { status: 400 }
        );
      }
      record = new FeeRecord({ student, academicYear, className, totalAnnualFee, installments: [] });
    }

    const due = amountDue != null ? Number(amountDue) : record.totalAnnualFee;
    const idx = record.installments.findIndex((i) => i.label === label);
    const entry = {
      label,
      dueDate: dueDate ? new Date(dueDate) : new Date(),
      amountDue: due,
      amountPaid: paid ? (amountPaid != null ? Number(amountPaid) : due) : Number(amountPaid) || 0,
      mode: mode || undefined,
      receiptNumber: receiptNumber || undefined,
      ...(paid ? { paidOn: new Date() } : {}),
    };

    if (idx >= 0) record.installments[idx] = { ...record.installments[idx].toObject(), ...entry };
    else record.installments.push(entry);

    await record.save();
    const saved = await FeeRecord.findById(record._id).populate("student", "name rollNumber admissionNumber");

    return Response.json({ feeRecord: saved.toObject({ virtuals: true }) }, { status: 200 });
  } catch (err) {
    console.error("[fees/mark:PATCH]", err);
    return Response.json({ error: "Could not update fee status" }, { status: 500 });
  }
});
