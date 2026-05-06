"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Headphones,
  MapPin,
  Package,
  Truck,
  X,
  ExternalLink,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "react-query";
import { useOrderById } from "@/lib/api/orders";
import { getProducts } from "@/lib/api/products";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ROUTES, ORDER_STATUS } from "@/lib/constants";

const PLACEHOLDER_IMAGE = "/placeholder.svg";

const GOLD = "#C4A747";
const CREAM = "#F5F3EE";
const SAGE = "#5BA383";

const STATUS_STYLES: Record<string, string> = {
  [ORDER_STATUS.PROCESSING]: "bg-amber-100 text-amber-700 border-amber-200",
  [ORDER_STATUS.SHIPPED]: "bg-blue-100 text-blue-700 border-blue-200",
  [ORDER_STATUS.DELIVERED]: "bg-green-100 text-green-700 border-green-200",
  [ORDER_STATUS.PENDING]: "bg-gray-100 text-gray-700 border-gray-200",
  [ORDER_STATUS.CONFIRMED]: "bg-sky-100 text-sky-700 border-sky-200",
  [ORDER_STATUS.CANCELLED]: "bg-red-100 text-red-700 border-red-200",
};

const TIMELINE_STEPS = [
  { key: "placed", label: "Order Placed", icon: Package },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Check },
];

function getStepStatus(orderStatus: string, stepKey: string) {
  const statusOrder = ["placed", "processing", "shipped", "delivered"];
  const statusMap: Record<string, string> = {
    [ORDER_STATUS.PENDING]: "placed",
    [ORDER_STATUS.CONFIRMED]: "placed",
    [ORDER_STATUS.PROCESSING]: "processing",
    [ORDER_STATUS.SHIPPED]: "shipped",
    [ORDER_STATUS.DELIVERED]: "delivered",
  };

  const currentStep = statusMap[orderStatus] ?? "placed";
  const currentIndex = statusOrder.indexOf(currentStep);
  const stepIndex = statusOrder.indexOf(stepKey);

  if (stepIndex < currentIndex) return "complete";
  if (stepIndex === currentIndex) return "active";
  return "pending";
}

function ProgressTimeline({
  orderStatus,
  orderDate,
}: {
  orderStatus: string;
  orderDate?: string;
}) {
  return (
    <div className="rounded-xl border border-[#eee] bg-white p-6">
      <h3 className="mb-6 text-lg font-bold text-[#333333]">Order Progress</h3>

      {/* Desktop: Horizontal */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {TIMELINE_STEPS.map((step, i) => {
            const status = getStepStatus(orderStatus, step.key);
            const Icon = step.icon;

            return (
              <div
                key={step.key}
                className="relative flex flex-1 flex-col items-center"
              >
                {/* Connector line: left half of this column only (so it doesn't escape) */}
                {i > 0 && (
                  <div
                    className={cn(
                      "absolute left-0 top-6 h-0.5 w-1/2 -translate-y-1/2",
                      status === "complete" || status === "active"
                        ? "bg-[#C4A747]"
                        : "bg-[#ddd]"
                    )}
                    aria-hidden
                  />
                )}

                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all",
                      status === "complete" &&
                        "border-[#C4A747] bg-[#C4A747] text-white",
                      status === "active" &&
                        "border-[#C4A747] bg-white text-[#C4A747]",
                      status === "pending" && "border-[#ddd] bg-white text-[#999]"
                    )}
                  >
                    {status === "complete" ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-3 text-sm font-medium",
                      status === "pending" ? "text-[#999]" : "text-[#333333]"
                    )}
                  >
                    {step.label}
                  </span>
                  {step.key === "placed" && orderDate && (
                    <span className="mt-1 text-xs text-[#333333]/50" suppressHydrationWarning>
                      {new Date(orderDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: Vertical */}
      <div className="space-y-4 md:hidden">
        {TIMELINE_STEPS.map((step, i) => {
          const status = getStepStatus(orderStatus, step.key);
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2",
                    status === "complete" &&
                      "border-[#C4A747] bg-[#C4A747] text-white",
                    status === "active" &&
                      "border-[#C4A747] bg-white text-[#C4A747]",
                    status === "pending" && "border-[#ddd] bg-white text-[#999]"
                  )}
                >
                  {status === "complete" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                {i < TIMELINE_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "mt-2 h-8 w-0.5",
                      status === "complete" || status === "active"
                        ? "bg-[#C4A747]"
                        : "bg-[#ddd]"
                    )}
                  />
                )}
              </div>
              <div className="pt-2">
                <span
                  className={cn(
                    "text-sm font-medium",
                    status === "pending" ? "text-[#999]" : "text-[#333333]"
                  )}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const { data: order, isLoading } = useOrderById(id || null);
  const [copied, setCopied] = useState(false);

  const productIds = useMemo(
    () => (order?.items ? [...new Set(order.items.map((i) => i.productId))] : []),
    [order?.items]
  );
  const { data: products = [] } = useQuery({
    queryKey: ["products", "byIds", productIds],
    queryFn: () => getProducts({ ids: productIds }),
    enabled: productIds.length > 0,
  });
  const productMap = useMemo(() => {
    const map = new Map<string, (typeof products)[0]>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link
          href={`${ROUTES.account}/orders`}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#C4A747] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
        <div className="rounded-xl border border-[#eee] bg-white p-12 text-center text-[#333333]/70">
          Loading order...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Link
          href={`${ROUTES.account}/orders`}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#C4A747] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#ddd] bg-[#F5F3EE]/50 py-20 text-center">
          <Package className="h-20 w-20 text-[#333333]/20" />
          <p className="mt-4 text-lg font-medium text-[#333333]">
            Order not found
          </p>
          <Button
            asChild
            className="mt-6"
            style={{ backgroundColor: GOLD, color: "#333333" }}
          >
            <Link href={`${ROUTES.account}/orders`}>View All Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleCopyTracking = () => {
    if (order.trackingNumber) {
      navigator.clipboard.writeText(order.trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canCancel =
    order.orderStatus === ORDER_STATUS.PENDING ||
    order.orderStatus === ORDER_STATUS.PROCESSING;

  const handlePrintInvoice = () => {
    if (!id) return;
    const url = `${ROUTES.account}/orders/${id}/invoice`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href={`${ROUTES.account}/orders`}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#C4A747] transition hover:gap-3 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <h1 className="text-2xl font-bold text-[#333333] md:text-[28px]">
            {order.orderNumber}
          </h1>
          <span
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium",
              STATUS_STYLES[order.orderStatus] ?? "bg-gray-100"
            )}
          >
            {order.orderStatus}
          </span>
        </div>

        <p className="mt-2 text-[#333333]/70" suppressHydrationWarning>
          Placed on{" "}
          {order.createdAt
            ? new Date(order.createdAt).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "—"}
        </p>
      </div>

      {/* Progress Timeline */}
      {order.orderStatus !== ORDER_STATUS.CANCELLED && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ProgressTimeline
            orderStatus={order.orderStatus}
            orderDate={order.createdAt}
          />
        </motion.div>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr_auto] lg:gap-8">
        {/* Shipping Address */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-[#eee] bg-white p-6"
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: `${GOLD}20` }}
            >
              <MapPin className="h-5 w-5" style={{ color: GOLD }} />
            </div>
            <h3 className="text-lg font-bold text-[#333333]">Shipping Address</h3>
          </div>
          <div className="mt-4 text-[#333333]/80">
            <p className="font-medium text-[#333333]">
              {order.shippingAddress.fullName}
            </p>
            <p className="mt-1">{order.shippingAddress.street}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.postalCode}
            </p>
            <p>{order.shippingAddress.country}</p>
            <p className="mt-2">{order.shippingAddress.phone}</p>
          </div>
        </motion.div>

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-[#eee] bg-white p-6"
        >
          <h3 className="text-lg font-bold text-[#333333]">
            Order Items ({order.items.length})
          </h3>
          <div className="mt-4 space-y-4">
            {order.items.map((item, i) => {
              const product = productMap.get(item.productId);
              const firstImage = product?.images?.[0];
              const imageUrl =
                (firstImage && typeof firstImage === "object" && "url" in firstImage
                  ? (firstImage as { url: string }).url
                  : typeof firstImage === "string"
                    ? firstImage
                    : null) ?? PLACEHOLDER_IMAGE;
              const productName = product?.name ?? `Item (${item.variantSKU})`;
              return (
                <div
                  key={`${item.productId}-${item.variantSKU}-${i}`}
                  className="flex gap-4 border-b border-[#eee] pb-4 last:border-0 last:pb-0"
                >
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={imageUrl}
                      alt={productName}
                      fill
                      className="object-cover"
                      sizes="64px"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== PLACEHOLDER_IMAGE) target.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#333333]">
                      {productName} ({item.variantSKU})
                    </p>
                    <p className="text-sm text-[#333333]/60">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-[#333333]">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="mt-6 space-y-2 border-t border-[#eee] pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-[#333333]/70">Subtotal</span>
              <span className="text-[#333333]">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#333333]/70">Shipping</span>
              <span className="text-[#333333]">
                {order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}
              </span>
            </div>
            <div className="flex justify-between border-t border-[#eee] pt-2 text-base font-bold text-[#333333]">
              <span>Total</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 lg:w-[200px]"
        >
          <Button
            variant="outline"
            className="w-full justify-start border-[#ddd]"
            onClick={handlePrintInvoice}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Invoice
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start border-[#ddd]"
          >
            <Headphones className="mr-2 h-4 w-4" />
            Contact Support
          </Button>
          {canCancel && (
            <Button
              variant="outline"
              className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Order
            </Button>
          )}
        </motion.div>
      </div>

      {/* Tracking Info */}
      {order.trackingNumber && order.orderStatus === ORDER_STATUS.SHIPPED && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl border border-blue-200 bg-blue-50 p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Truck className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-semibold text-[#333333]">
                  Your order is on the way!
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm text-[#333333]/70">
                    Tracking: {order.trackingNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyTracking}
                    className="rounded p-1 text-blue-600 transition hover:bg-blue-100"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Track Shipment
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
