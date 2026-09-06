import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Principal Login — XYZ Public School" };

export default function PrincipalLoginPage() {
  return (
    <LoginForm
      portal="principal"
      redirectTo="/principal/dashboard"
      title="Principal Login"
      subtitle="School-wide analytics, audit reports and full academic oversight."
    />
  );
}
