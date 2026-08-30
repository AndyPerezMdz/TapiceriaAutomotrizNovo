import Image from "next/image";

export function NoviAvatar({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/images/novi-avatar.png"
        alt="Novi, asistente virtual"
        width={size}
        height={size}
        className="h-full w-full object-cover"
      />
    </div>
  );
}