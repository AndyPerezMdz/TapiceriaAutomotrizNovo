import { createClient } from "@/lib/supabase/server";

export interface BusinessSettings {
  whatsapp: string;
  hoursWeekday: string;
  hoursSaturday: string;
}

const fallback: BusinessSettings = {
  whatsapp: "9998024783",
  hoursWeekday: "9:30 am – 5:00 pm",
  hoursSaturday: "9:30 am – 3:00 pm",
};

export async function getBusinessSettings(): Promise<BusinessSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_settings")
    .select("whatsapp, hours_weekday, hours_saturday")
    .eq("id", 1)
    .single();

  if (!data) return fallback;

  return {
    whatsapp: data.whatsapp,
    hoursWeekday: data.hours_weekday,
    hoursSaturday: data.hours_saturday,
  };
}