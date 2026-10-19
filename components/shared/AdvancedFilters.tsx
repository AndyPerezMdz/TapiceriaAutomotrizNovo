"use client";

import { SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function AdvancedFilters({ showPrice = false }: { showPrice?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") ?? "");

  const hasActiveFilters = Boolean(from || to || minPrice || maxPrice);

  function apply() {
    const params = new URLSearchParams(searchParams.toString());
    from ? params.set("from", from) : params.delete("from");
    to ? params.set("to", to) : params.delete("to");
    minPrice ? params.set("min_price", minPrice) : params.delete("min_price");
    maxPrice ? params.set("max_price", maxPrice) : params.delete("max_price");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  function clear() {
    setFrom("");
    setTo("");
    setMinPrice("");
    setMaxPrice("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("from");
    params.delete("to");
    params.delete("min_price");
    params.delete("max_price");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[15px] font-medium transition ${
          hasActiveFilters
            ? "border-brand-yellow-dark bg-highlight text-yellow-text dark:border-brand-yellow"
            : "border-field-border text-foreground hover:bg-black/5 dark:hover:bg-white/5"
        }`}
      >
        <SlidersHorizontal size={15} /> Filtros{hasActiveFilters ? " ●" : ""}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-10 mt-2 w-72 space-y-3 rounded-2xl bg-surface p-5 sm:p-6 shadow-lg dark:ring-1 dark:ring-white/5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[13px] font-medium text-muted">Desde</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-xl border-[1.5px] border-field-border bg-surface px-2 py-1.5 text-[15px] text-foreground outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium text-muted">Hasta</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-xl border-[1.5px] border-field-border bg-surface px-2 py-1.5 text-[15px] text-foreground outline-none"
              />
            </div>
          </div>

          {showPrice ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[13px] font-medium text-muted">Precio mín.</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full rounded-xl border-[1.5px] border-field-border bg-surface px-2 py-1.5 text-[15px] text-foreground outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-muted">Precio máx.</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full rounded-xl border-[1.5px] border-field-border bg-surface px-2 py-1.5 text-[15px] text-foreground outline-none"
                />
              </div>
            </div>
          ) : null}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={apply}
              className="flex-1 rounded-xl bg-brand-yellow hover:bg-[#e8b90f] px-3 py-1.5 text-[15px] font-semibold text-ink transition min-h-11 inline-flex items-center justify-center"
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={clear}
              className="rounded-xl border-[1.5px] border-field-border px-3 py-1.5 text-[15px] text-foreground transition hover:bg-black/5 dark:hover:bg-white/5"
            >
              Limpiar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}