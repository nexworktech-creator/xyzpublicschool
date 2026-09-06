import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Student from "@/models/Student";
import TeacherAttendance from "@/models/TeacherAttendance";
import Attendance from "@/models/Attendance";
import { requireRole } from "@/lib/auth";

function startOfDay(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

// GET /api/dashboard/summary — today's real-time metric cards for the Admin dashboard:
// Total Teachers Present, Total Students Present, Total Absent Teachers, Total Absent Students.
export const GET = requireRole(["superadmin", "admin", "principal"], async () => {
  await connectDB();
  const today = startOfDay(new Date());

  const totalTeachers = await User.countDocuments({
    role: "teacher",
    active: true,
    deletedAt: null,
  });

  const teachersPresentToday = await TeacherAttendance.countDocuments({
    date: today,
    checkInAt: { $exists: true, $ne: null },
    status: { $ne: "absent" },
  });

  const totalStudents = await Student.countDocuments({ active: true });

  const todaysRolls = await Attendance.find({ date: today });
  let studentsPresentToday = 0;
  todaysRolls.forEach((roll) => {
    studentsPresentToday += roll.entries.filter((e) =>
      ["present", "late", "half-day"].includes(e.status)
    ).length;
  });

  return Response.json({
    totalTeachersPresent: teachersPresentToday,
    totalStudentsPresent: studentsPresentToday,
    totalAbsentTeachers: Math.max(totalTeachers - teachersPresentToday, 0),
    totalAbsentStudents: Math.max(totalStudents - studentsPresentToday, 0),
    totalTeachers,
    totalStudents,
    asOf: new Date().toISOString(),
  });
});
