"use client";

import { useQuery } from "react-query";
import { useParams } from "next/navigation";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Minus,
  Plus,
  Truck,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Shield,
  Headphones,
  RotateCcw,
  Loader2,
  ThumbsUp,
  Package,
  Droplets,
  Wind,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { ProductCard } from "@/components/product/ProductCard";
import { Container } from "@/components/layout/Container";
import { useToast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { COLOR_SWATCH_HEX, ROUTES } from "@/lib/constants";
import type { Product } from "@/types";

const GOLD = "#C4A747";
const CREAM = "#F5F3EE";
const DARK = "#333333";

type PublicReview = {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  status: string;
  helpfulCount: number;
  createdAt: string;
  user: { name: string; image: string | null };
};

async function fetchProduct(slug: string): Promise<Product> {
  const res = await fetch(`/api/products?slug=${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error("Product not found");
  return res.json();
}

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function fetchReviews(productId: string): Promise<PublicReview[]> {
  const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch reviews");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function submitReview(payload: { productId: string; rating: number; comment: string }) {
  const res = await fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error ?? "Failed to submit review");
  }
  return data as PublicReview;
}

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const value = Math.min(5, Math.max(0, Math.round(rating * 2) / 2));
  const sizeClass = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="flex gap-0.5" role="img" aria-label={`Rating: ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(sizeClass, "fill-current")}
          style={{ color: i <= value ? GOLD : "#d1d5db" }}
        />
      ))}
    </div>
  );
}

function RatingBar({ stars, count, total }: { stars: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-8 text-sm text-[#333333]/70">{stars} ★</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#333333]/10">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: GOLD }}
        />
      </div>
      <span className="w-8 text-right text-sm text-[#333333]/70">{count}</span>
    </div>
  );
}

// Lightbox component
function Lightbox({
  images,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: {
  images: { url: string; altText: string }[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [touchStart, setTouchStart] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) onNext();
      else onPrev();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition hover:bg-white/20"
        aria-label="Close lightbox"
      >
        <X className="h-6 w-6" />
      </button>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-4 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition hover:bg-white/20"
        aria-label="Previous image"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="absolute right-4 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition hover:bg-white/20"
        aria-label="Next image"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div
        className="relative h-[85vh] w-[85vw] max-w-[1200px]"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative h-full w-full"
          >
            <Image
              src={images[currentIndex].url}
              alt={images[currentIndex].altText}
              fill
              className="object-contain"
              sizes="85vw"
              priority
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-sm">
        {currentIndex + 1} / {images.length}
      </div>
    </motion.div>
  );
}

// Skeleton loader
function ProductPageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid gap-8 lg:grid-cols-[55%_45%] lg:gap-16">
        <div className="space-y-3">
          <div className="aspect-[4/5] rounded-lg bg-muted" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[100px] w-[100px] shrink-0 rounded-lg bg-muted" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="h-4 w-1/3 rounded bg-muted" />
          <div className="h-10 w-3/4 rounded bg-muted" />
          <div className="h-6 w-1/4 rounded bg-muted" />
          <div className="h-12 w-1/3 rounded bg-muted" />
          <div className="h-24 w-full rounded bg-muted" />
          <div className="h-12 w-full rounded bg-muted" />
          <div className="h-14 w-full rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

export default function ProductSlugPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const { status: authStatus } = useSession();
  const toast = useToast();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  const addToCart = useCartStore((s) => s.addToCart);
  const addToWishlist = useWishlistStore((s) => s.addToWishlist);
  const removeFromWishlist = useWishlistStore((s) => s.removeFromWishlist);
  const inWishlist = useWishlistStore((s) => s.isInWishlist);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProduct(slug),
    enabled: !!slug,
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { data: reviews = [], refetch: refetchReviews, isFetching: reviewsLoading } = useQuery({
    queryKey: ["reviews", product?.id],
    queryFn: () => fetchReviews(product!.id),
    enabled: !!product?.id,
  });

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter((p) => p.id !== product.id && p.categoryId === product.categoryId)
      .slice(0, 4);
  }, [product, allProducts]);

  useEffect(() => setHasMounted(true), []);

  useEffect(() => {
    if (product?.variants?.length) {
      setSelectedSize("STANDARD");
      setSelectedColor(product.variants[0].color);
    }
  }, [product?.id]);

  const selectedVariant = useMemo(() => {
    if (!product?.variants?.length) return null;
    const color = selectedColor ?? product.variants[0].color;
    return product.variants.find((v) => v.color === color) ?? product.variants[0];
  }, [product, selectedColor]);

  const inStock = selectedVariant ? selectedVariant.stock > 0 : false;

  const availableSizes = useMemo(() => {
    if (!product) return [];
    const totalStock = product.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
    return [{ size: "STANDARD", stock: totalStock }];
  }, [product]);

  const availableColors = useMemo(() => {
    if (!product) return [];
    const seen = new Set<string>();
    return product.variants.filter((v) => {
      if (seen.has(v.color)) return false;
      seen.add(v.color);
      return true;
    });
  }, [product]);

  const handleAddToCart = async () => {
    if (!product || !selectedVariant) return;
    setAddingToCart(true);
    await new Promise((r) => setTimeout(r, 600));
    addToCart(product, selectedVariant.variantSKU, quantity);
    setAddingToCart(false);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handlePrevImage = useCallback(() => {
    if (!product) return;
    setMainImageIndex((i) => (i > 0 ? i - 1 : product.images.length - 1));
  }, [product]);

  const handleNextImage = useCallback(() => {
    if (!product) return;
    setMainImageIndex((i) => (i < product.images.length - 1 ? i + 1 : 0));
  }, [product]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  // Touch swipe for mobile gallery
  const [touchStart, setTouchStart] = useState(0);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNextImage();
      else handlePrevImage();
    }
  };

  // Reviews stats (real data)
  const reviewCount = reviews.length;
  const avgRating =
    reviewCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Discount calculation
  const onSale = product?.salePrice != null && product.salePrice < product.price;
  const discountPct = onSale && product
    ? Math.round((1 - product.salePrice! / product.price) * 100)
    : 0;

  if (!slug) return null;

  if (isLoading) {
    return (
      <Container className="py-8 lg:py-16">
        <ProductPageSkeleton />
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container className="py-16">
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 py-16 text-center">
          <Package className="mb-4 h-16 w-16 text-muted-foreground opacity-30" />
          <p className="text-lg font-semibold text-[#333333]">Product not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The product you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button asChild className="mt-6" style={{ backgroundColor: GOLD, color: DARK }}>
            <Link href={ROUTES.shop}>Continue Shopping</Link>
          </Button>
        </div>
      </Container>
    );
  }

  const images = product.images?.length
    ? product.images
    : [{ url: "/placeholder.svg", altText: product.name, order: 0 }];
  const mainImage = images[mainImageIndex] ?? images[0];
  const isInWishlistNow = hasMounted && inWishlist(product.id);

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description,
            sku: product.SKU,
            image: images.map((i) =>
              i.url.startsWith("http") ? i.url : `${process.env.NEXT_PUBLIC_APP_URL ?? ""}${i.url}`
            ),
            offers: {
              "@type": "Offer",
              price: (product.salePrice ?? product.price) / 100,
              priceCurrency: "USD",
              availability: inStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: avgRating,
              reviewCount: reviewCount,
            },
          }),
        }}
      />

      <Container className="py-8 lg:px-12 lg:py-16">
        {/* Main grid: 55% / 45% on desktop */}
        <div className="grid gap-8 lg:grid-cols-[55%_45%] lg:gap-16">
          {/* LEFT: Image Gallery */}
          <div className="space-y-3">
            {/* Main image */}
            <div
              ref={imageRef}
              className="relative aspect-[4/5] cursor-zoom-in overflow-hidden rounded-lg"
              style={{ backgroundColor: CREAM }}
              onClick={() => setLightboxOpen(true)}
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
              onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Image
                src={mainImage.url}
                alt={mainImage.altText ?? product.name}
                fill
                className={cn(
                  "object-cover transition-transform duration-300",
                  isZooming && "scale-150"
                )}
                style={
                  isZooming
                    ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` }
                    : undefined
                }
                sizes="(max-width: 768px) 100vw, 55vw"
                priority
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BfwYABQAB/evYPfIAAAAASUVORK5CYII="
              />

              {/* Image counter */}
              <div className="absolute right-3 top-3 rounded-full bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-sm">
                {mainImageIndex + 1} / {images.length}
              </div>

              {/* Mobile swipe arrows */}
              <div className="absolute inset-y-0 left-0 flex items-center md:hidden">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  className="ml-2 rounded-full bg-white/80 p-2 shadow-md backdrop-blur-sm"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5 text-[#333333]" />
                </button>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center md:hidden">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className="mr-2 rounded-full bg-white/80 p-2 shadow-md backdrop-blur-sm"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5 text-[#333333]" />
                </button>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMainImageIndex(i)}
                  className={cn(
                    "relative h-[80px] w-[80px] shrink-0 overflow-hidden rounded-lg border-2 transition-all md:h-[100px] md:w-[100px]",
                    i === mainImageIndex
                      ? "border-[#C4A747] opacity-100"
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                  style={{ borderWidth: i === mainImageIndex ? "3px" : "2px" }}
                >
                  <Image
                    src={img.url}
                    alt={img.altText ?? `${product.name} ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Product Info */}
          <div className="flex flex-col">
            {/* Title */}
            <h1
              className="text-2xl font-bold leading-tight text-[#333333] md:text-[28px] lg:text-[36px]"
              style={{ lineHeight: 1.3 }}
            >
              {product.name}
            </h1>

            {/* Rating & Reviews */}
            <div className="mt-4 flex items-center gap-4 lg:mt-6">
              <StarRating rating={avgRating} size="lg" />
              <Link
                href="#reviews"
                className="text-sm text-[#333333]/70 underline-offset-2 hover:text-[#C4A747] hover:underline"
              >
                ({reviewCount} reviews)
              </Link>
            </div>

            {/* Price */}
            <div className="mt-6 flex flex-wrap items-center gap-4 lg:mt-8">
              <span
                className="text-[36px] font-bold text-[#333333] md:text-[40px] lg:text-[48px]"
              >
                {formatPrice(product.salePrice ?? product.price)}
              </span>
              {onSale && (
                <>
                  <span className="text-[24px] font-normal text-[#333333]/50 line-through md:text-[28px]">
                    {formatPrice(product.price)}
                  </span>
                  <span className="rounded bg-red-500 px-3 py-1.5 text-sm font-semibold text-white">
                    -{discountPct}%
                  </span>
                </>
              )}
            </div>

            {/* Product details grid */}
            <div className="mt-6 grid grid-cols-2 gap-4 lg:mt-8">
              <div>
                <span className="text-sm text-[#333333]/70">SKU</span>
                <p className="font-semibold text-[#333333]">{product.SKU}</p>
              </div>
              <div>
                <span className="text-sm text-[#333333]/70">Material</span>
                <p className="font-semibold text-[#333333]">{product.material}</p>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-[#333333]/70">Availability</span>
                <p className="flex items-center gap-2 font-semibold">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      inStock ? "bg-green-500" : "bg-red-500"
                    )}
                  />
                  <span className={inStock ? "text-green-600" : "text-red-600"}>
                    {inStock ? "In Stock" : "Out of Stock"}
                  </span>
                </p>
              </div>
            </div>

            {/* Standard size only (no selector) */}
            <div className="mt-6 lg:mt-8">
              <p className="mb-2 text-sm font-semibold text-[#333333]">Size</p>
              <div className="inline-flex items-center rounded-lg border-2 border-[#ddd] bg-white px-4 py-2 text-sm font-semibold text-[#333333]">
                Standard
              </div>
            </div>

            {/* Color Selector */}
            {availableColors.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold text-[#333333]">Select Color</p>
                <div className="flex flex-wrap gap-3">
                  {availableColors.map((v) => {
                    const hex = COLOR_SWATCH_HEX[v.color] ?? "#ccc";
                    const active = (selectedColor ?? product.variants[0]?.color) === v.color;
                    return (
                      <button
                        key={v.color}
                        type="button"
                        onClick={() => setSelectedColor(v.color)}
                        className={cn(
                          "relative h-11 w-11 rounded-full p-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-[#C4A747] focus:ring-offset-2",
                          active && "ring-2 ring-[#C4A747] ring-offset-2"
                        )}
                        style={{
                          border: active ? `3px solid ${GOLD}` : "2px solid transparent",
                        }}
                        title={v.color}
                        aria-label={`Color ${v.color}`}
                      >
                        <span
                          className="block h-full w-full rounded-full"
                          style={{ backgroundColor: hex }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mt-6">
              <p className="mb-3 text-sm font-semibold text-[#333333]">Quantity</p>
              <div className="flex items-center gap-0">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-12 w-12 items-center justify-center rounded-l-lg border-2 border-r-0 border-[#ddd] bg-white text-[#333333] transition hover:border-[#C4A747] hover:bg-[#F5F3EE] max-md:h-10 max-md:w-10"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="flex h-12 min-w-[80px] items-center justify-center border-y-2 border-[#ddd] bg-white text-lg font-semibold text-[#333333] max-md:h-10 max-md:min-w-[60px]">
                  {quantity}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(selectedVariant?.stock ?? 99, q + 1))
                  }
                  className="flex h-12 w-12 items-center justify-center rounded-r-lg border-2 border-l-0 border-[#ddd] bg-white text-[#333333] transition hover:border-[#C4A747] hover:bg-[#F5F3EE] max-md:h-10 max-md:w-10"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col gap-4">
              <Button
                className={cn(
                  "h-14 w-full text-lg font-semibold transition-all max-md:h-[52px]",
                  addedToCart && "bg-green-500 hover:bg-green-500"
                )}
                style={
                  addedToCart ? undefined : { backgroundColor: GOLD, color: DARK }
                }
                onClick={handleAddToCart}
                disabled={!inStock || !selectedVariant || addingToCart}
              >
                {addingToCart ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Adding...
                  </>
                ) : addedToCart ? (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Added to Cart!
                  </>
                ) : (
                  "Add to Cart"
                )}
              </Button>

              <Button
                variant="outline"
                className={cn(
                  "h-14 w-full text-lg font-semibold max-md:h-[52px]",
                  isInWishlistNow
                    ? "border-[#C4A747] bg-[#C4A747]/10 text-[#333333]"
                    : "border-[#C4A747] text-[#333333] hover:bg-[#C4A747]/10"
                )}
                onClick={() =>
                  isInWishlistNow
                    ? removeFromWishlist(product.id)
                    : addToWishlist(product.id)
                }
              >
                <Heart
                  className={cn(
                    "mr-2 h-5 w-5",
                    isInWishlistNow && "fill-[#C4A747] text-[#C4A747]"
                  )}
                />
                {isInWishlistNow ? "In Wishlist" : "Add to Wishlist"}
              </Button>
            </div>

            {/* Accordions */}
            <Accordion type="multiple" className="mt-8 w-full border-t border-[#333333]/10">
              <AccordionItem value="description" className="border-b border-[#333333]/10">
                <AccordionTrigger className="py-6 text-base font-semibold text-[#333333] hover:no-underline">
                  Description
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-base leading-relaxed text-[#333333]/80">
                  {product.description}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="care" className="border-b border-[#333333]/10">
                <AccordionTrigger className="py-6 text-base font-semibold text-[#333333] hover:no-underline">
                  Material & Care
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <ul className="space-y-3 text-[15px] text-[#333333]/80">
                    <li className="flex items-center gap-3">
                      <Package className="h-5 w-5 shrink-0 text-[#5BA383]" />
                      <span>Material: {product.material}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Droplets className="h-5 w-5 shrink-0 text-[#5BA383]" />
                      <span>Machine wash cold, gentle cycle</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Wind className="h-5 w-5 shrink-0 text-[#5BA383]" />
                      <span>Tumble dry low or hang dry</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <X className="h-5 w-5 shrink-0 text-red-400" />
                      <span>Do not bleach</span>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="shipping" className="border-b border-[#333333]/10">
                <AccordionTrigger className="py-6 text-base font-semibold text-[#333333] hover:no-underline">
                  Shipping & Returns
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <ul className="space-y-3 text-[15px] text-[#333333]/80">
                    <li className="flex items-center gap-3">
                      <Truck className="h-5 w-5 shrink-0 text-[#5BA383]" />
                      <span>Free shipping on orders over $50</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <RotateCcw className="h-5 w-5 shrink-0 text-[#5BA383]" />
                      <span>30-day free returns</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Package className="h-5 w-5 shrink-0 text-[#5BA383]" />
                      <span>Cash on Delivery available</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Truck className="mt-0.5 h-5 w-5 shrink-0 text-[#333333]/50" />
                      <span>Estimated delivery: 5-7 business days</span>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Trust Badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 rounded-lg border border-[#333333]/10 bg-[#F5F3EE] p-6 lg:gap-10">
              <div className="flex flex-col items-center gap-2 text-center">
                <Shield className="h-8 w-8 text-[#5BA383]" />
                <span className="text-xs font-medium text-[#333333]">Authentic Products</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <Check className="h-8 w-8 text-[#5BA383]" />
                <span className="text-xs font-medium text-[#333333]">Secure Checkout</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <Headphones className="h-8 w-8 text-[#5BA383]" />
                <span className="text-xs font-medium text-[#333333]">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* REVIEWS SECTION */}
        <section id="reviews" className="mt-16 border-t border-[#333333]/10 pt-12 lg:mt-24 lg:pt-16">
          <h2 className="text-2xl font-bold text-[#333333] md:text-[32px]">Customer Reviews</h2>

          <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-12">
            {/* Rating Summary */}
            <div className="rounded-xl border border-[#333333]/10 bg-white p-6">
              <div className="flex items-center gap-4">
                <span className="text-5xl font-bold text-[#333333]">{avgRating.toFixed(1)}</span>
                <div>
                  <StarRating rating={avgRating} size="lg" />
                  <p className="mt-1 text-sm text-[#333333]/70">
                    Based on {reviewCount} reviews
                  </p>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                {ratingCounts.map(({ stars, count }) => (
                  <RatingBar key={stars} stars={stars} count={count} total={reviewCount} />
                ))}
              </div>
              <Button
                variant="outline"
                className="mt-6 w-full border-[#C4A747] text-[#333333] hover:bg-[#C4A747]/10"
                onClick={() => {
                  if (authStatus !== "authenticated") {
                    toast.info("Please login to write a review.");
                    return;
                  }
                  setReviewOpen((v) => !v);
                }}
              >
                Write a Review
              </Button>

              {reviewOpen && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#333333]">Your rating</p>
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="h-10 rounded-lg border border-[#ddd] bg-white px-3 text-sm"
                    >
                      {[5, 4, 3, 2, 1].map((v) => (
                        <option key={v} value={v}>
                          {v} star{v === 1 ? "" : "s"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience..."
                    rows={4}
                    className="w-full rounded-lg border border-[#ddd] bg-white p-3 text-sm outline-none focus:border-[#C4A747]"
                  />
                  <Button
                    className="w-full"
                    style={{ backgroundColor: GOLD, color: DARK }}
                    disabled={reviewSubmitting || !product?.id || reviewComment.trim().length < 3}
                    onClick={async () => {
                      if (!product?.id) return;
                      setReviewSubmitting(true);
                      try {
                        await submitReview({
                          productId: product.id,
                          rating: reviewRating,
                          comment: reviewComment,
                        });
                        toast.success("Review submitted for approval.");
                        setReviewComment("");
                        setReviewOpen(false);
                        await refetchReviews();
                      } catch (e) {
                        toast.error((e as Error)?.message ?? "Failed to submit review");
                      } finally {
                        setReviewSubmitting(false);
                      }
                    }}
                  >
                    {reviewSubmitting ? "Submitting..." : "Submit Review"}
                  </Button>
                </div>
              )}
            </div>

            {/* Review Cards */}
            <div className="space-y-6">
              {reviewsLoading && (
                <div className="rounded-xl border border-[#333333]/10 bg-white p-6 text-sm text-[#333333]/70">
                  Loading reviews...
                </div>
              )}
              {!reviewsLoading && reviews.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#ddd] bg-[#F5F3EE]/50 p-10 text-center">
                  <p className="text-lg font-semibold text-[#333333]">No reviews yet</p>
                  <p className="mt-1 text-sm text-[#333333]/70">Be the first to review this product.</p>
                </div>
              )}
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-[#333333]/10 bg-white p-6"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-[#333333]">{review.user?.name ?? "Customer"}</span>
                    <span className="text-sm text-[#333333]/50" suppressHydrationWarning>
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="mt-2">
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  <p className="mt-3 text-[#333333]/80">{review.comment}</p>
                  <button
                    type="button"
                    className="mt-4 flex items-center gap-2 text-sm text-[#333333]/60 transition hover:text-[#C4A747]"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Helpful ({review.helpfulCount ?? 0})
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 border-t border-[#333333]/10 pt-12 lg:mt-24 lg:pt-16">
            <h2 className="text-2xl font-bold text-[#333333] md:text-[32px]">
              You May Also Like
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-8">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </Container>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox
            images={images}
            currentIndex={mainImageIndex}
            onClose={() => setLightboxOpen(false)}
            onPrev={handlePrevImage}
            onNext={handleNextImage}
          />
        )}
      </AnimatePresence>
    </>
  );
}
