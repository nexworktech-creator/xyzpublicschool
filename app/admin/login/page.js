import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Admin Login — XYZ Public School" };

export default function AdminLoginPage() {
  return (
    <LoginForm
      portal="admin"
      redirectTo="/admin/dashboard"
      title="Admin Login"
      subtitle="For school administrators managing admissions, results, fees and the public website."
    />
  );
}
