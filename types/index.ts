export type ProfileRole = "cliente" | "empleado" | "admin";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: ProfileRole;
  created_at?: string;
  updated_at?: string;
}
