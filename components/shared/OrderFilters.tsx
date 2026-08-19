"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function OrderFilters({ showPriceFilter = false }: { showPriceFilter?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") ?? "");

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");

    q ? params.set("q", q) : params.delete("q");
    from ? params.set("from", from) : params.delete("from");
    to ? params.set("to", to) : params.delete("to");
    minPrice ? params.set("min_price", minPrice) : params.delete("min_price");
    maxPrice ? params.set("max_price", maxPrice) : params.delete("max_price");

    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    setQ("");
    setFrom("");
    setTo("");
    setMinPrice("");
    setMaxPrice("");
    router.push(pathname);
  }

  return (
    <form onSubmit={applyFilters} className="mb-6 space-y-3">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por vehículo, cliente o descripción..."
          className="w-full rounded-md border border-black/15 bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15"
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-black/15 bg-surface px-3 py-2 text-sm text-foreground outline-none dark:border-white/15"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-black/15 bg-surface px-3 py-2 text-sm text-foreground outline-none dark:border-white/15"
          />
        </div>

        {showPriceFilter ? (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Precio mín.</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-24 rounded-md border border-black/15 bg-surface px-3 py-2 text-sm text-foreground outline-none dark:border-white/15"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Precio máx.</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-24 rounded-md border border-black/15 bg-surface px-3 py-2 text-sm text-foreground outline-none dark:border-white/15"
              />
            </div>
          </>
        ) : null}

        <button
          type="submit"
          className="rounded-md bg-brand-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-black/85 dark:bg-white dark:text-brand-black"
        >
          Filtrar
        </button>
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
        >
          Limpiar
        </button>
      </div>
    </form>
  );
}