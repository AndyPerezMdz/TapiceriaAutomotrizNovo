import { MessageCircle } from "lucide-react";

interface Props {
  href: string;
  label?: string;
  variant?: "solid" | "outline";
}

export function WhatsAppLink({ href, label = "WhatsApp", variant = "outline" }: Props) {
  const baseClasses =
    "flex w-fit items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition";

  const variantClasses =
    variant === "solid"
      ? "bg-[#25D366] text-white hover:bg-[#20bd5a]"
      : "border border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClasses} ${variantClasses}`}
    >
      <MessageCircle size={16} /> {label}
    </a>
  );
}