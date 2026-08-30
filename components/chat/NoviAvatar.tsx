export function NoviAvatar({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      {/* Antena */}
      <line x1="32" y1="4" x2="32" y2="11" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="32" cy="4" r="3" fill="#E4292B" />

      {/* Cara */}
      <circle cx="32" cy="34" r="26" fill="#F5C518" />

      {/* Costura (guiño a la tapicería) */}
      <path
        d="M10 34 Q 32 27 54 34"
        fill="none"
        stroke="#1A1A1A"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        opacity="0.3"
      />

      {/* Ojos */}
      <circle cx="24" cy="33" r="3" fill="#1A1A1A" />
      <circle cx="40" cy="33" r="3" fill="#1A1A1A" />

      {/* Sonrisa */}
      <path
        d="M22 42 Q32 49 42 42"
        fill="none"
        stroke="#1A1A1A"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}