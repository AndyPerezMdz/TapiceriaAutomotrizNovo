"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function FooterLogo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[52px] w-[130px]" />;
  }

  const isDark = resolvedTheme === "dark";
  const src = isDark ? "/images/logo-amarillo-wbg.png" : "/images/logo-negro-wbg.png";

  return (
    <Image
      src={src}
      alt="Tapicería Automotriz by NOVO"
      width={160}
      height={64}
      className="h-auto w-[130px]"
    />
  );
}