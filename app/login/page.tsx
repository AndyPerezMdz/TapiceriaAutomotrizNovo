import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}