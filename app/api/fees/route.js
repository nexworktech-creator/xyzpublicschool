import { connectDB } from "@/lib/mongodb";
import FeeRecord from "@/models/FeeRecord";
import { requireRole } from "@/lib/auth";

// GET /api/fees?className=&academicYear=&defaultersOnly=true
export const GET = requireRole(["superadmin", "admin", "accountant", "principal"], async (req) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter = {};
  if (searchParams.get("className")) filter.className = searchParams.get("className");
  if (searchParams.get("academicYear")) filter.academicYear = searchParams.get("academicYear");

  let records = await FeeRecord.find(filter).populate("student", "name rollNumber admissionNumber");

  if (searchParams.get("defaultersOnly") === "true") {
    records = records.filter((r) => r.isDefaulter);
  }

  // Fee Defaulter Tracking: attach `pendingMonths` — the number of overdue,
  // unpaid installments — used by the Admin dashboard's defaulter list.
  const today = new Date();
  const withPending = records.map((r) => {
    const overdue = r.installments.filter((i) => i.dueDate < today && i.amountPaid < i.amountDue);
    const obj = r.toObject({ virtuals: true });
    return {
      ...obj,
      pendingMonths: overdue.length,
      pendingAmount: overdue.reduce((sum, i) => sum + (i.amountDue - i.amountPaid), 0),
    };
  });

  return Response.json({ feeRecords: withPending });
});

// POST /api/fees  body: { student, academicYear, className, totalAnnualFee, installments }
export const POST = requireRole(["superadmin", "admin", "accountant"], async (req) => {
  try {
    const { student, academicYear, className, totalAnnualFee, installments } = await req.json();
    if (!student || !academicYear || !className || !totalAnnualFee) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDB();
    const record = await FeeRecord.findOneAndUpdate(
      { student, academicYear },
      { $set: { className, totalAnnualFee, installments: installments || [] } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return Response.json({ feeRecord: record }, { status: 201 });
  } catch (err) {
    console.error("[fees:POST]", err);
    return Response.json({ error: "Could not save fee record" }, { status: 500 });
  }
});
