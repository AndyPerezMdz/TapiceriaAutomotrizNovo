import { RegisterForm } from "@/components/auth/RegisterForm";
import { Suspense } from "react";

export default function RegistroPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}