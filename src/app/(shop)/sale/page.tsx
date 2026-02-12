"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { X, PackageOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "react-query";
import { ProductGrid } from "@/components/product/ProductGrid";
import {
  CollectionFilters,
  CollectionFiltersTrigger,
  CollectionToolbar,
} from "@/components/product/CollectionFilters";
import { DEFAULT_FILTERS, type ProductFiltersState } from "@/components/product/ProductFilters";
import { filterProducts, sortProducts } from "@/lib/productFilters";
import { ROUTES } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { SortValue } from "@/components/product/ProductSort";
import type { Product } from "@/types";

const ITEMS_PER_PAGE = 12;
const GOLD = "#C4A747";

async function fetchSaleProducts(): Promise<Product[]> {
  const res = await fetch("/api/products?sale=true");
  if (!res.ok) throw new Error("Failed to fetch sale products");
  return res.json();
}

function ActiveFilterChips({
  filters,
  onRemove,
  onClearAll,
}: {
  filters: ProductFiltersState;
  onRemove: (patch: Partial<ProductFiltersState>) => void;
  onClearAll: () => void;
}) {
  const chips: { key: string; label: string }[] = [];
  if (filters.priceMin > 0 || filters.priceMax < 100000) {
    chips.push({
      key: "price",
      label: `${formatPrice(filters.priceMin || 0)} – ${filters.priceMax === 100000 ? "Any" : formatPrice(filters.priceMax)}`,
    });
  }
  filters.sizes.forEach((s) => chips.push({ key: `size-${s}`, label: s }));
  filters.colors.forEach((c) => chips.push({ key: `color-${c}`, label: c }));
  if (filters.material) chips.push({ key: "material", label: filters.material });
  if (filters.minRating > 0)
    chips.push({ key: "rating", label: `${filters.minRating}+ stars` });
  if (filters.inStockOnly) chips.push({ key: "stock", label: "In stock" });

  if (chips.length === 0) return null;

  const removePrice = () => onRemove({ priceMin: 0, priceMax: 100000 });
  const removeSize = (s: string) =>
    onRemove({ sizes: filters.sizes.filter((x) => x !== s) });
  const removeColor = (c: string) =>
    onRemove({ colors: filters.colors.filter((x) => x !== c) });
  const removeMaterial = () => onRemove({ material: "" });
  const removeRating = () => onRemove({ minRating: 0 });
  const removeStock = () => onRemove({ inStockOnly: false });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => {
            if (chip.key === "price") removePrice();
            else if (chip.key.startsWith("size-")) removeSize(chip.key.replace("size-", ""));
            else if (chip.key.startsWith("color-")) removeColor(chip.key.replace("color-", ""));
            else if (chip.key === "material") removeMaterial();
            else if (chip.key === "rating") removeRating();
            else if (chip.key === "stock") removeStock();
          }}
          className="group flex items-center gap-1.5 rounded-full border border-[#ddd] bg-white px-3 py-1.5 text-sm text-[#333333] transition-colors hover:border-[#C4A747] hover:bg-[#F5F3EE]"
        >
          <span>{chip.label}</span>
          <X className="h-3.5 w-3.5 opacity-60 transition-opacity group-hover:opacity-100" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-sm font-medium text-[#C4A747] hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}

export default function SalePage() {
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["sale-products"],
    queryFn: fetchSaleProducts,
  });
  const [filters, setFilters] = useState<ProductFiltersState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortValue>("price-asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  const filteredAndSorted = useMemo(() => {
    if (!products) return [];
    return sortProducts(filterProducts(products, filters), sort);
  }, [products, filters, sort]);

  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE) || 1;
  const paginated = useMemo(
    () =>
      filteredAndSorted.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
      ),
    [filteredAndSorted, page]
  );

  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <div className="hidden lg:block lg:w-[280px]">
          <div className="sticky top-[120px] h-80 animate-pulse rounded-xl border border-[#eee] bg-muted" />
        </div>
        <div className="min-w-0 flex-1 space-y-6">
          <div className="h-12 w-64 animate-pulse rounded bg-muted" />
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div
          className="-mx-4 -mt-6 mb-6 px-4 py-12 md:-mx-8 md:px-8 lg:-mx-12 lg:px-12"
          style={{ backgroundColor: "#F5F3EE" }}
        >
          <h1 className="text-3xl font-bold text-[#333333] md:text-[40px]">Sale</h1>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#ddd] bg-[#F5F3EE]/50 py-20 text-center">
          <PackageOpen className="h-20 w-20 text-[#333333]/20" />
          <p className="mt-4 text-lg font-medium text-[#333333]">
            Unable to load sale products
          </p>
          <Link
            href={ROUTES.collections}
            className="mt-6 text-[#C4A747] font-medium hover:underline"
          >
            View all collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
      {/* Sidebar - desktop only */}
      <CollectionFilters
        value={filters}
        onChange={setFilters}
        sort={sort}
        onSortChange={(v) => {
          setSort(v);
          setPage(1);
        }}
        products={products}
      />

      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Header */}
        <div
          className="-mx-4 -mt-6 mb-6 px-4 py-12 md:-mx-8 md:px-8 lg:-mx-12 lg:px-12"
          style={{ backgroundColor: "#F5F3EE" }}
        >
          <h1 className="text-3xl font-bold text-[#333333] md:text-[40px]">
            Sale
          </h1>
          <p className="mt-3 line-clamp-2 text-lg text-[#333333]/80">
            Shop our exclusive deals and save on your favorite styles
          </p>
          <p className="mt-4 text-sm text-[#333333]/70">
            Showing {filteredAndSorted.length} product
            {filteredAndSorted.length !== 1 ? "s" : ""} on sale
          </p>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <CollectionFiltersTrigger
              value={filters}
              onChange={setFilters}
              sort={sort}
              onSortChange={(v) => {
                setSort(v);
                setPage(1);
              }}
              products={products}
            />
            <CollectionToolbar
              sort={sort}
              onSortChange={(v) => {
                setSort(v);
                setPage(1);
              }}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>
        </div>

        {/* Active filter chips */}
        <ActiveFilterChips
          filters={filters}
          onRemove={(p) => {
            setFilters((f) => ({ ...f, ...p }));
            setPage(1);
          }}
          onClearAll={clearAllFilters}
        />

        {/* Products */}
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#ddd] bg-[#F5F3EE]/50 py-20 text-center">
            <PackageOpen className="h-20 w-20 text-[#333333]/20" />
            <p className="mt-4 text-lg font-medium text-[#333333]">
              No products found
            </p>
            {Object.values(filters).some((v) => {
              if (typeof v === "object" && Array.isArray(v)) return v.length > 0;
              if (typeof v === "string") return v !== "";
              if (typeof v === "number") {
                if (v === filters.priceMin) return v > 0;
                if (v === filters.priceMax) return v < 100000;
                return v > 0;
              }
              if (typeof v === "boolean") return v === true;
              return false;
            }) && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-6 text-[#C4A747] font-medium hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <ProductGrid products={paginated} />
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg border border-[#ddd] transition-colors",
                    page === 1
                      ? "cursor-not-allowed opacity-50"
                      : "hover:border-[#C4A747] hover:bg-[#F5F3EE]"
                  )}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="px-4 text-sm text-[#333333]">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg border border-[#ddd] transition-colors",
                    page === totalPages
                      ? "cursor-not-allowed opacity-50"
                      : "hover:border-[#C4A747] hover:bg-[#F5F3EE]"
                  )}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
