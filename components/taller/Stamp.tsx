interface Props {
  label: string;
  detail?: string;
  size?: "sm" | "md" | "lg";
  /** "yellow" sobre fondo negro; "ink" sobre fondo claro. */
  tone?: "yellow" | "ink";
  className?: string;
}

const sizes = {
  sm: { box: "border-2 rounded-[7px] px-2.5 py-1", text: "text-sm" },
  md: { box: "border-2 rounded-lg px-3.5 py-1.5", text: "text-xl" },
  lg: { box: "border-[3px] rounded-[10px] px-5 py-2.5", text: "text-[28px]" },
};

/** Estado como sello de goma, ligeramente ladeado. */
export function Stamp({ label, detail, size = "md", tone = "yellow", className = "" }: Props) {
  const color =
    tone === "yellow" ? "border-brand-yellow text-brand-yellow" : "border-foreground text-foreground";
  const s = sizes[size];

  return (
    <div className={`inline-block -rotate-[5deg] text-center ${s.box} ${color} ${className}`}>
      <p className={`font-display font-extrabold uppercase leading-none tracking-[0.06em] ${s.text}`}>
        {label}
      </p>
      {detail ? (
        <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-on-ink-muted">{detail}</p>
      ) : null}
    </div>
  );
}
