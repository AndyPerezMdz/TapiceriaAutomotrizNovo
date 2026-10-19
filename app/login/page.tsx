import { LoginForm } from "@/components/auth/LoginForm";
import { getBusinessSettings } from "@/lib/data/business-settings";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const settings = await getBusinessSettings();

  return (
    <Suspense fallback={null}>
      <LoginForm hoursWeekday={settings.hoursWeekday} hoursSaturday={settings.hoursSaturday} />
    </Suspense>
  );
}
