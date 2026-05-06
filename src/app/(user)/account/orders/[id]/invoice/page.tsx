"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "react-query";
import { useOrderById } from "@/lib/api/orders";
import { getProducts } from "@/lib/api/products";
import { formatPrice } from "@/lib/utils";

const GOLD = "#C4A747";

export default function OrderInvoicePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { data: order, isLoading } = useOrderById(id || null);

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

  useEffect(() => {
    if (!order) return;
    const t = window.setTimeout(() => window.print(), 50);
    return () => window.clearTimeout(t);
  }, [order]);

  useEffect(() => {
    const onAfterPrint = () => {
      // If opened in a new tab, closing is best-effort only.
      try {
        window.close();
      } catch {}
    };
    window.addEventListener("afterprint", onAfterPrint);
    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, []);

  if (isLoading) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
        Loading invoice...
      </main>
    );
  }

  if (!order) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
        Invoice not found.
      </main>
    );
  }

  return (
    <main
      style={{
        padding: 24,
        color: "#111827",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
      }}
    >
      <style>{`
        @media print {
          .no-print { display: none !important; }
          html, body { background: #fff !important; }
          main { padding: 0 !important; }
        }
      `}</style>

      <div className="no-print" style={{ marginBottom: 16, display: "flex", gap: 12 }}>
        <button
          type="button"
          onClick={() => window.print()}
          style={{
            background: GOLD,
            border: "none",
            padding: "10px 14px",
            borderRadius: 10,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Print
        </button>
        <button
          type="button"
          onClick={() => window.close()}
          style={{
            background: "transparent",
            border: "1px solid #e5e7eb",
            padding: "10px 14px",
            borderRadius: 10,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 20 }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.2 }}>Invoice</div>
            <div style={{ marginTop: 6, color: "#6b7280" }}>
              Order: <span style={{ color: "#111827", fontWeight: 700 }}>{order.orderNumber}</span>
            </div>
            <div style={{ marginTop: 4, color: "#6b7280" }}>
              Date:{" "}
              <span style={{ color: "#111827", fontWeight: 600 }} suppressHydrationWarning>
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US") : "—"}
              </span>
            </div>
          </div>

          <div style={{ minWidth: 240 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Shipping Address</div>
            <div style={{ color: "#374151", lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700 }}>{order.shippingAddress.fullName}</div>
              <div>{order.shippingAddress.street}</div>
              <div>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </div>
              <div>{order.shippingAddress.country}</div>
              <div style={{ marginTop: 6 }}>{order.shippingAddress.phone}</div>
            </div>
          </div>
        </header>

        <section style={{ marginTop: 18 }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Items</div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 80px 120px 120px",
                background: "#f9fafb",
                padding: "10px 12px",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              <div>Product</div>
              <div style={{ textAlign: "right" }}>Qty</div>
              <div style={{ textAlign: "right" }}>Unit</div>
              <div style={{ textAlign: "right" }}>Total</div>
            </div>

            {order.items.map((item, idx) => {
              const product = productMap.get(item.productId);
              const name = product?.name ?? `Item (${item.variantSKU})`;
              const unit = item.unitPrice;
              const total = item.unitPrice * item.quantity;
              return (
                <div
                  key={`${item.productId}-${item.variantSKU}-${idx}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 80px 120px 120px",
                    padding: "10px 12px",
                    borderTop: "1px solid #e5e7eb",
                    fontSize: 13,
                    alignItems: "start",
                    gap: 8,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "#111827" }}>{name}</div>
                    <div style={{ color: "#6b7280", marginTop: 2 }}>SKU: {item.variantSKU}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>{item.quantity}</div>
                  <div style={{ textAlign: "right" }}>{formatPrice(unit)}</div>
                  <div style={{ textAlign: "right", fontWeight: 700 }}>{formatPrice(total)}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 320 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
              <span style={{ color: "#6b7280" }}>Subtotal</span>
              <span style={{ fontWeight: 700 }}>{formatPrice(order.subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
              <span style={{ color: "#6b7280" }}>Shipping</span>
              <span style={{ fontWeight: 700 }}>
                {order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}
              </span>
            </div>
            <div style={{ height: 1, background: "#e5e7eb", margin: "10px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 15 }}>
              <span style={{ fontWeight: 900 }}>Total</span>
              <span style={{ fontWeight: 900 }}>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

