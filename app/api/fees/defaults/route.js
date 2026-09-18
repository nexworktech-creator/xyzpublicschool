import { connectDB } from "@/lib/mongodb";
import FeeDefault from "@/models/FeeDefault";
import FeeRecord from "@/models/FeeRecord";
import Student from "@/models/Student";
import { requireRole } from "@/lib/auth";

export const ACADEMIC_MONTHS = [
  "April", "May", "June", "July", "August", "September",
  "October", "November", "December", "January", "February", "March",
];

// "2026-27" -> due date for a given academic month, e.g. April 2026,
// January 2027. April–December fall in the first calendar year of the
// academic year string; January–March fall in the second.
function dueDateFor(academicYear, month) {
  const [startYear] = academicYear.split("-").map((s) => parseInt(s, 10));
  const idx = ACADEMIC_MONTHS.indexOf(month);
  if (idx === -1 || Number.isNaN(startYear)) return null;
  const calendarYear = idx <= 8 ? startYear : startYear + 1; // Jan/Feb/Mar roll into next year
  const monthIndex = [3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2][idx]; // April=3 ... March=2
  return new Date(calendarYear, monthIndex, 1);
}

// GET /api/fees/defaults?academicYear=
export const GET = requireRole(["superadmin", "admin", "accountant", "principal"], async (req) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter = {};
  if (searchParams.get("academicYear")) filter.academicYear = searchParams.get("academicYear");

  const defaults = await FeeDefault.find(filter).sort({ className: 1, month: 1 });
  return Response.json({ feeDefaults: defaults });
});

// POST /api/fees/defaults
// body: { academicYear, classNames: [...], months: [...], amount }
// Sets one default monthly fee amount across every selected class × month
// combination in a single request (Multi-Month & Class Selection), and
// patches that installment onto every existing student's FeeRecord in
// those classes so the change is reflected immediately.
export const POST = requireRole(["superadmin", "admin"], async (req) => {
  try {
    const { academicYear, classNames, months, amount } = await req.json();

    if (!academicYear || !Array.isArray(classNames) || !classNames.length) {
      return Response.json({ error: "Select at least one class" }, { status: 400 });
    }
    if (!Array.isArray(months) || !months.length) {
      return Response.json({ error: "Select at least one month" }, { status: 400 });
    }
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return Response.json({ error: "Enter a valid amount" }, { status: 400 });
    }

    await connectDB();

    const combos = [];
    classNames.forEach((className) => {
      months.forEach((month) => combos.push({ className, month }));
    });

    const defaults = await Promise.all(
      combos.map(({ className, month }) =>
        FeeDefault.findOneAndUpdate(
          { academicYear, className, month },
          { $set: { amount: numericAmount } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      )
    );

    // Apply to every existing FeeRecord in the selected classes: add the
    // installment for each month if it isn't already there, or update its
    // due amount if it is (without touching anything already paid).
    let patchedRecords = 0;
    for (const className of classNames) {
      const records = await FeeRecord.find({ academicYear, className });
      for (const record of records) {
        let changed = false;
        for (const month of months) {
          const due = dueDateFor(academicYear, month);
          const existing = record.installments.find((i) => i.label === month);
          if (existing) {
            if (existing.amountDue !== numericAmount) {
              existing.amountDue = numericAmount;
              changed = true;
            }
          } else {
            record.installments.push({ label: month, dueDate: due, amountDue: numericAmount, amountPaid: 0 });
            changed = true;
          }
        }
        if (changed) {
          await record.save();
          patchedRecords += 1;
        }
      }
    }

    // Report how many students in these classes don't have a FeeRecord yet
    // (their record will pick up these defaults whenever it's created).
    const studentCount = await Student.countDocuments({ className: { $in: classNames }, active: true });

    return Response.json(
      { feeDefaults: defaults, patchedRecords, studentsInClasses: studentCount },
      { status: 201 }
    );
  } catch (err) {
    console.error("[fees/defaults:POST]", err);
    return Response.json({ error: "Could not save fee defaults" }, { status: 500 });
  }
});
