import { connectDB } from "@/lib/mongodb";
import Inquiry, { CLASS_OPTIONS } from "@/models/Inquiry";
import { getSessionFromRequest } from "@/lib/auth";
import { z } from "zod";

const InquirySchema = z.object({
  studentOrParentName: z.string().trim().min(2, "Name is too short"),
  classAppliedFor: z.enum(CLASS_OPTIONS),
  mobileNumber: z.string().trim().regex(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number"),
  area: z.string().trim().min(2, "Area / address is required"),
});

// POST /api/inquiry — public, called from the Admission Inquiry modal
export async function POST(req) {
  try {
    const body = await req.json();
    const parsed = InquirySchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || "Invalid submission" },
        { status: 400 }
      );
    }

    await connectDB();
    const inquiry = await Inquiry.create(parsed.data);

    return Response.json(
      { message: "Inquiry submitted successfully", id: inquiry._id },
      { status: 201 }
    );
  } catch (err) {
    console.error("[inquiry:POST]", err);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

// GET /api/inquiry — admin only, list inquiries for the admissions dashboard
export async function GET(req) {
  const session = getSessionFromRequest(req);
  if (!session || !["superadmin", "admin"].includes(session.role)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const filter = status ? { status } : {};
  const inquiries = await Inquiry.find(filter).sort({ createdAt: -1 }).limit(500);

  return Response.json({ inquiries });
}
