import { StaffLoginForm } from "@/components/staff/StaffLoginForm";
import { Suspense } from "react";

export default function StaffLoginPage() {
  return (
    <Suspense fallback={null}>
      <StaffLoginForm />
    </Suspense>
  );
}