import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Teacher Login — XYZ Public School" };

export default function TeacherLoginPage() {
  return (
    <LoginForm
      portal="teacher"
      redirectTo="/teacher/dashboard"
      title="Teacher Login"
      subtitle="Mark attendance, enter results and track copy-checking for your classes."
    />
  );
}
