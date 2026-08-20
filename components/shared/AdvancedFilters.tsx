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
        className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition ${
          hasActiveFilters
            ? "border-brand-yellow-dark bg-brand-yellow/10 text-brand-yellow-dark dark:border-brand-yellow dark:text-brand-yellow"
            : "border-black/15 text-foreground hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
        }`}
      >
        <SlidersHorizontal size={15} /> Filtros{hasActiveFilters ? " ●" : ""}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-10 mt-2 w-72 space-y-3 rounded-lg border border-black/10 bg-surface p-4 shadow-lg dark:border-white/10">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Desde</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-md border border-black/15 bg-surface px-2 py-1.5 text-sm text-foreground outline-none dark:border-white/15"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Hasta</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-md border border-black/15 bg-surface px-2 py-1.5 text-sm text-foreground outline-none dark:border-white/15"
              />
            </div>
          </div>

          {showPrice ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Precio mín.</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full rounded-md border border-black/15 bg-surface px-2 py-1.5 text-sm text-foreground outline-none dark:border-white/15"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Precio máx.</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full rounded-md border border-black/15 bg-surface px-2 py-1.5 text-sm text-foreground outline-none dark:border-white/15"
                />
              </div>
            </div>
          ) : null}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={apply}
              className="flex-1 rounded-md bg-brand-black px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 dark:bg-white dark:text-brand-black"
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={clear}
              className="rounded-md border border-black/15 px-3 py-1.5 text-sm text-foreground transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
            >
              Limpiar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}