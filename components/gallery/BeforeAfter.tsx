"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  before: string;
  after: string;
  caption: string | null;
}

/** Foto "antes / después" con una línea que se arrastra (o se mueve con el teclado). */
export function BeforeAfter({ before, after, caption }: Props) {
  const [position, setPosition] = useState(50);

  return (
    <div className="relative aspect-[4/3] select-none overflow-hidden bg-seam">
      <Image src={after} alt={caption ? `Después: ${caption}` : "Después"} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <Image src={before} alt={caption ? `Antes: ${caption}` : "Antes"} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
      </div>

      {/* Línea y manija */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 border-l-[3px] border-dashed border-brand-yellow"
        style={{ left: `${position}%` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-yellow text-base font-bold text-ink shadow-md"
        style={{ left: `${position}%` }}
      >
        ↔
      </div>

      <span className="pointer-events-none absolute left-3.5 top-3.5 -rotate-[5deg] rounded-[7px] border-2 border-ink bg-white/85 px-2.5 py-1 font-display text-[15px] font-extrabold uppercase leading-none tracking-[0.06em] text-ink">
        Antes
      </span>
      <span className="pointer-events-none absolute right-3.5 top-3.5 -rotate-[5deg] rounded-[7px] border-2 border-brand-yellow bg-ink/70 px-2.5 py-1 font-display text-[15px] font-extrabold uppercase leading-none tracking-[0.06em] text-brand-yellow">
        Después
      </span>

      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label="Comparar antes y después"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
