import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Accountant Login — XYZ Public School" };

export default function AccountantLoginPage() {
  return (
    <LoginForm
      portal="accountant"
      redirectTo="/accountant/dashboard"
      title="Accountant Login"
      subtitle="View class-wise fee status, mark payments and track fee defaulters."
    />
  );
}
