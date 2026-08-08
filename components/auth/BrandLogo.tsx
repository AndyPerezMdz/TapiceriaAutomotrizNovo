"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function BrandLogo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex justify-center">
        <div className="h-[68px] w-[150px] sm:h-[82px] sm:w-[180px]" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";
  const src = isDark ? "/images/logo-amarillo-wbg.png" : "/images/logo-negro-wbg.png";

  return (
    <div className="relative flex justify-center">
      {isDark ? (
        <div className="pointer-events-none absolute inset-0 -z-0 flex items-center justify-center">
          <div className="h-24 w-56 rounded-full bg-white/25 blur-2xl sm:h-28 sm:w-64" />
        </div>
      ) : null}

      <Image
        src={src}
        alt="Tapicería Automotriz by NOVO"
        width={220}
        height={88}
        priority
        className="relative h-auto w-[150px] sm:w-[180px]"
      />
    </div>
  );
}