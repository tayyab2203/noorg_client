"use client";

import { useState, useEffect, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

const GOLD = "#C4A747";
const SAGE = "#5BA383";
const MAX_STARS = 5;

function StarRating({ rating, size = "md" }: { rating: number; size?: "md" | "sm" }) {
  const value = Math.min(MAX_STARS, Math.max(0, Math.round(rating)));
  const sizeClass = size === "sm" ? "text-sm" : "text-base";
  return (
    <div
      className={cn("flex items-center gap-0.5", sizeClass)}
      role="img"
      aria-label={`Rating: ${value} out of ${MAX_STARS}`}
    >
      {Array.from({ length: MAX_STARS }, (_, i) => (
        <span
          key={i}
          style={{ color: i < value ? GOLD : "#d1d5db" }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

/** Splits text by term (case-insensitive) and wraps matches in <mark>. */
export function highlightText(text: string, term: string | undefined): ReactNode {
  if (!term?.trim()) return text;
  const lower = term.trim().toLowerCase();
  const parts = text.split(
    new RegExp(`(${lower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  );
  return parts.map((part, i) =>
    part.toLowerCase() === lower ? (
      <mark
        key={i}
        className="rounded bg-[#C4A747]/30 px-0.5 font-medium text-[#333333]"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

/** Skeleton matching premium card dimensions: 3:4 image + content */
export function ProductCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-xl bg-white"
      style={{ boxShadow: "none" }}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
        <div className="absolute inset-0 animate-shimmer bg-[length:200%_100%]" />
      </div>
      <div className="p-3 md:p-4 lg:p-5">
        <div className="mb-2 h-3 w-1/4 rounded bg-muted animate-shimmer" />
        <div className="mb-2 h-4 w-3/4 rounded bg-muted animate-shimmer" />
        <div className="mb-2 h-3 w-1/2 rounded bg-muted animate-shimmer" />
        <div className="mt-3 flex gap-2">
          <div className="h-5 w-16 rounded bg-muted animate-shimmer" />
          <div className="h-5 w-12 rounded bg-muted animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  /** Optional search term to highlight in product name */
  highlightTerm?: string;
  /** Optional category/brand label (e.g. from collection) */
  categoryName?: string;
  /** Optional review count for "(N reviews)" */
  reviewCount?: number;
  /** Index for stagger animation (from parent grid) */
  index?: number;
}

export function ProductCard({
  product,
  highlightTerm,
  categoryName,
  reviewCount,
  index = 0,
}: ProductCardProps) {
  const [hover, setHover] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const addToCart = useCartStore((s) => s.addToCart);
  const addToWishlist = useWishlistStore((s) => s.addToWishlist);
  const removeFromWishlist = useWishlistStore((s) => s.removeFromWishlist);
  const inWishlist = useWishlistStore((s) => s.isInWishlist(product.id));

  // Defer wishlist state to after mount so server and initial client render match (persisted wishlist rehydrates from localStorage).
  useEffect(() => setHasMounted(true), []);

  const images = product.images;
  const primaryImage = images[0]?.url?.trim() || "/placeholder.svg";
  const secondaryImage = images[1]?.url?.trim() || primaryImage;
  const firstVariant = product.variants[0];
  const variantSKU = firstVariant?.variantSKU;
  const inStock = product.variants.some((v) => v.stock > 0);
  const onSale =
    product.salePrice != null && product.salePrice < product.price;
  const saleDiscount =
    onSale && product.price > 0
      ? Math.round((1 - product.salePrice! / product.price) * 100)
      : 0;
  const isNewArrival = product.isNewArrival ?? false;

  const showQuickActions = hover;

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-xl bg-white transition-all duration-300 ease-in-out",
        "max-md:transition-none",
        "hover:shadow-lg md:hover:-translate-y-2 md:hover:shadow-lg"
      )}
      style={{ boxShadow: "none" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Image section — 3:4 aspect ratio */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
        <Link
          href={`/products/${product.slug}`}
          className="block h-full w-full"
          aria-label={product.name}
        >
          <span className="absolute inset-0 block overflow-hidden">
            <Image
              src={primaryImage}
              alt={product.images[0]?.altText ?? product.name}
              fill
              className={cn(
                "object-cover transition-all duration-300 ease-in-out",
                showQuickActions && "scale-[1.08]"
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {secondaryImage !== primaryImage && (
              <Image
                src={secondaryImage}
                alt=""
                fill
                className={cn(
                  "object-cover transition-opacity duration-300 ease-in-out",
                  showQuickActions ? "opacity-100" : "opacity-0"
                )}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                aria-hidden
              />
            )}
          </span>
        </Link>

        {/* Badges — top-right: 12px desktop, 10px mobile */}
        <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
          {onSale && (
            <span
              className="rounded px-2 py-1 font-semibold text-white max-sm:text-[10px] max-sm:px-1.5 max-sm:py-0.5"
              style={{
                backgroundColor: "#dc2626",
                padding: "8px",
                fontSize: "12px",
              }}
            >
              -{saleDiscount}%
            </span>
          )}
          {isNewArrival && (
            <span
              className="rounded px-2 py-1 font-semibold text-white max-sm:text-[10px] max-sm:px-1.5 max-sm:py-0.5"
              style={{
                backgroundColor: GOLD,
                padding: "8px",
                fontSize: "12px",
              }}
            >
              NEW
            </span>
          )}
        </div>

        {/* Wishlist — top-left: 40px desktop, 48px mobile (touch target) */}
        <button
          type="button"
          onClick={() =>
            inWishlist
              ? removeFromWishlist(product.id)
              : addToWishlist(product.id)
          }
          className={cn(
            "absolute left-2 top-2 z-10 flex items-center justify-center rounded-full transition-all duration-200",
            "bg-white/80 backdrop-blur-sm md:hover:bg-[#C4A747] md:hover:scale-110",
            "focus:outline-none focus:ring-2 focus:ring-[#C4A747] focus:ring-offset-2",
            "w-12 h-12 min-w-[48px] min-h-[48px] md:w-10 md:h-10 md:min-w-0 md:min-h-0",
            "group/wishlist"
          )}
          style={{
            backgroundColor: "rgba(255,255,255,0.8)",
          }}
          aria-label={hasMounted && inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={cn(
              "h-6 w-6 transition-colors",
              hasMounted && inWishlist
                ? "fill-[#C4A747] text-[#C4A747]"
                : "text-[#333333] group-hover/wishlist:text-white"
            )}
          />
        </button>

        {/* Quick actions — center of image, slide up on hover (desktop only) */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center gap-3 p-3 transition-all duration-300 ease-in-out",
            "translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100",
            "max-md:hidden"
          )}
        >
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-auto rounded-md border-[#333333] bg-white px-6 py-3 text-[#333333] hover:bg-muted"
              asChild
            >
              <Link href={`/products/${product.slug}`}>
                <Eye className="mr-1.5 h-4 w-4" aria-hidden />
                Quick View
              </Link>
            </Button>
            <Button
              size="sm"
              className="h-auto px-6 py-3 text-white hover:opacity-90"
              style={{ backgroundColor: GOLD, color: "#333333" }}
              onClick={() => variantSKU && addToCart(product, variantSKU, 1)}
              disabled={!inStock || !variantSKU}
            >
              <ShoppingBag className="mr-1.5 h-4 w-4" aria-hidden />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile: always show Add to Cart below image (keeps 3:4 aspect) */}
      <div className="flex justify-center border-t border-muted/50 py-3 md:hidden">
        <Button
          size="sm"
          className="h-auto min-h-touch w-full max-w-[200px] px-6 py-3 text-white"
          style={{ backgroundColor: GOLD, color: "#333333" }}
          onClick={() => variantSKU && addToCart(product, variantSKU, 1)}
          disabled={!inStock || !variantSKU}
        >
          <ShoppingBag className="mr-1.5 h-4 w-4" aria-hidden />
          Add to Cart
        </Button>
      </div>

      {/* Content section */}
      <div className="p-3 md:p-4 lg:p-5">
        {categoryName && (
          <p
            className="mb-2 text-xs font-semibold uppercase tracking-wider"
            style={{ color: SAGE, letterSpacing: "0.05em" }}
          >
            {categoryName}
          </p>
        )}
        <Link href={`/products/${product.slug}`}>
          <h3
            className={cn(
              "line-clamp-2 font-semibold text-[#333333] transition-colors cursor-pointer min-h-[48px]",
              "md:min-h-[48px] md:text-base",
              "sm:text-[15px] sm:min-h-[2.5rem]",
              "max-sm:text-sm max-sm:min-h-[2.5rem]",
              "hover:text-[#C4A747]"
            )}
          >
            {highlightTerm
              ? highlightText(product.name, highlightTerm)
              : product.name}
          </h3>
        </Link>
        <div className="mt-2 flex flex-row items-center gap-2">
          <StarRating rating={product.rating} size="md" />
          {reviewCount != null && (
            <span className="text-xs opacity-70">
              ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-row items-center gap-3">
          {onSale ? (
            <>
              <span
                className="text-xl font-bold text-[#333333] md:text-xl sm:text-lg"
                style={{ fontSize: "20px" }}
              >
                {formatPrice(product.salePrice!)}
              </span>
              <span
                className="text-base font-normal text-[#333333] line-through opacity-50"
                style={{ fontSize: "16px" }}
              >
                {formatPrice(product.price)}
              </span>
            </>
          ) : (
            <span
              className="text-xl font-bold text-[#333333] md:text-xl sm:text-lg"
              style={{ fontSize: "20px" }}
            >
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
