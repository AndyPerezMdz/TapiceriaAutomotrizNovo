import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  size?: "sm" | "md" | "lg" | "xl";
  action?: ReactNode;
  className?: string;
}

const sizes = {
  sm: "text-2xl",
  md: "text-[28px]",
  lg: "text-4xl",
  xl: "text-5xl sm:text-6xl",
};

/** Título condensado en mayúsculas; `action` va a la derecha (un link "Ver todo"). */
export function SectionTitle({ children, as: Tag = "h2", size = "md", action, className = "" }: Props) {
  const title = (
    <Tag
      className={`font-display font-bold uppercase leading-[0.95] text-foreground ${sizes[size]} ${
        size === "xl" ? "font-extrabold" : ""
      }`}
    >
      {children}
    </Tag>
  );

  if (!action) return <div className={className}>{title}</div>;

  return (
    <div className={`flex flex-wrap items-baseline justify-between gap-3 ${className}`}>
      {title}
      {action}
    </div>
  );
}
