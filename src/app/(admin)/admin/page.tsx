"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Package, ShoppingBag, LayoutDashboard, AlertTriangle, ListOrdered } from "lucide-react";
import { useAdminOrders } from "@/lib/api/orders";
import { useAdminInventory } from "@/lib/api/admin";
import { ADMIN_ROUTES, COLORS, ROUTES } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

const RECENT_ORDERS_COUNT = 10;
const LOW_STOCK_THRESHOLD = 5;

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const isAdmin = status === "authenticated" && (session?.user as { role?: string })?.role === "ADMIN";

  const { data: orders = [], isLoading: ordersLoading } = useAdminOrders({ enabled: isAdmin });
  const { data: lowStockItems = [], isLoading: inventoryLoading } = useAdminInventory("low_stock", { enabled: isAdmin });
  const { data: outOfStockItems = [] } = useAdminInventory("out_of_stock", { enabled: isAdmin });

  const ordersCount = orders.length;
  const revenuePlaceholder = orders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
  const now = new Date();
  const today = orders.filter((o) => o.createdAt && new Date(o.createdAt).toDateString() === now.toDateString()).length;
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const weekCount = orders.filter((o) => o.createdAt && new Date(o.createdAt) >= weekStart).length;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthCount = orders.filter((o) => o.createdAt && new Date(o.createdAt) >= monthStart).length;

  const recentOrders = [...orders].sort((a, b) => {
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return db - da;
  }).slice(0, RECENT_ORDERS_COUNT);

  const pendingOrdersCount = orders.filter((o) => o.orderStatus === "PENDING" || o.paymentStatus === "PENDING").length;
  const lowStockCount = lowStockItems.length + outOfStockItems.length;

  if (status === "loading") {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold md:text-3xl" style={{ color: COLORS.primaryDark }}>Dashboard</h1>
        <div className="rounded-xl border border-[#eee] bg-white p-12 text-center text-[#333333]/70">Loading…</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold md:text-3xl" style={{ color: COLORS.primaryDark }}>Dashboard</h1>
        <div className="rounded-xl border border-[#eee] bg-white p-12 text-center text-[#333333]/70">You need to sign in as an admin to view this page.</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold md:text-3xl" style={{ color: COLORS.primaryDark }}>
        Dashboard
      </h1>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            {outOfStockItems.length > 0 && (
              <span>{outOfStockItems.length} variant(s) out of stock.</span>
            )}
            {lowStockItems.length > 0 && (
              <span>{lowStockItems.length} variant(s) low stock (&lt; {LOW_STOCK_THRESHOLD}).</span>
            )}
            {" "}
            <Link href={ADMIN_ROUTES.inventory} className="font-semibold underline hover:no-underline">
              View inventory
            </Link>
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href={ADMIN_ROUTES.orders}
          className="rounded-xl border border-[#eee] bg-white p-6 shadow-sm transition hover:border-[#C4A747]/50 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg"
              style={{ backgroundColor: COLORS.cream }}
            >
              <ShoppingBag className="h-6 w-6" style={{ color: COLORS.sage }} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#333333]/70">Total orders</p>
              <p className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>
                {ordersLoading ? "…" : ordersCount}
              </p>
              <p className="text-xs text-[#333333]/60">Today: {today} · Week: {weekCount} · Month: {monthCount}</p>
            </div>
          </div>
        </Link>

        <div className="rounded-xl border border-[#eee] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg"
              style={{ backgroundColor: COLORS.cream }}
            >
              <LayoutDashboard className="h-6 w-6" style={{ color: COLORS.goldAccent }} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#333333]/70">Revenue (mock)</p>
              <p className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>
                {ordersLoading ? "…" : formatPrice(revenuePlaceholder)}
              </p>
            </div>
          </div>
        </div>

        {pendingOrdersCount > 0 && (
          <Link
            href={ADMIN_ROUTES.orders}
            className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm transition hover:border-amber-300"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                <ListOrdered className="h-6 w-6 text-amber-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800">Pending orders</p>
                <p className="text-2xl font-bold text-amber-900">{pendingOrdersCount}</p>
              </div>
            </div>
          </Link>
        )}

        <Link
          href={ADMIN_ROUTES.categories}
          className="rounded-xl border border-[#eee] bg-white p-6 shadow-sm transition hover:border-[#C4A747]/50 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg"
              style={{ backgroundColor: COLORS.cream }}
            >
              <Package className="h-6 w-6" style={{ color: COLORS.sage }} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#333333]/70">Categories</p>
              <p className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>
                Manage
              </p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#eee] bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: COLORS.primaryDark }}>
              Recent orders
            </h2>
            <Link href={ADMIN_ROUTES.orders} className="text-sm font-medium hover:underline" style={{ color: COLORS.goldAccent }}>
              View all
            </Link>
          </div>
          {ordersLoading ? (
            <p className="mt-4 text-sm text-[#333333]/60">Loading…</p>
          ) : recentOrders.length === 0 ? (
            <p className="mt-4 text-sm text-[#333333]/60">No orders yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {recentOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={ADMIN_ROUTES.orderDetail(o.id)}
                    className="flex items-center justify-between rounded-lg border border-[#eee] px-4 py-3 transition hover:bg-[#F5F3EE]/50"
                  >
                    <span className="font-medium" style={{ color: COLORS.primaryDark }}>{o.orderNumber}</span>
                    <span className="text-sm text-[#333333]/70">{formatPrice(o.totalAmount ?? 0)}</span>
                    <span className="rounded-full border border-[#ddd] px-2 py-0.5 text-xs">{o.orderStatus ?? "—"}</span>
                    <span className="text-xs text-[#333333]/60" suppressHydrationWarning>
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-[#eee] bg-white p-6">
          <h2 className="text-lg font-bold" style={{ color: COLORS.primaryDark }}>
            Quick links
          </h2>
          <ul className="mt-4 space-y-2">
            <li>
              <Link href={ADMIN_ROUTES.categories} className="font-medium hover:underline" style={{ color: COLORS.goldAccent }}>
                Manage categories & products
              </Link>
            </li>
            <li>
              <Link href={ADMIN_ROUTES.categoriesNew} className="font-medium hover:underline" style={{ color: COLORS.goldAccent }}>
                Add new category
              </Link>
            </li>
            <li>
              <Link href={ADMIN_ROUTES.orders} className="font-medium hover:underline" style={{ color: COLORS.goldAccent }}>
                View all orders
              </Link>
            </li>
            <li>
              <Link href={ADMIN_ROUTES.inventory} className="font-medium hover:underline" style={{ color: COLORS.goldAccent }}>
                Inventory
              </Link>
            </li>
            <li>
              <Link href={ADMIN_ROUTES.payments} className="font-medium hover:underline" style={{ color: COLORS.goldAccent }}>
                Payments
              </Link>
            </li>
            <li>
              <Link href={ADMIN_ROUTES.customers} className="font-medium hover:underline" style={{ color: COLORS.goldAccent }}>
                Customers
              </Link>
            </li>
          </ul>
          <div className="mt-6 border-t border-[#eee] pt-4">
            <h3 className="text-sm font-semibold text-[#333333] mb-2">Store Pages</h3>
            <ul className="space-y-2">
              <li>
                <Link href={ROUTES.newArrivals} target="_blank" className="text-sm font-medium hover:underline" style={{ color: COLORS.goldAccent }}>
                  View New Arrivals Page
                </Link>
                <p className="text-xs text-[#333333]/60 mt-0.5">
                  Shows products created in the last 30 days
                </p>
              </li>
              <li>
                <Link href={ROUTES.sale} target="_blank" className="text-sm font-medium hover:underline" style={{ color: COLORS.goldAccent }}>
                  View Sale Page
                </Link>
                <p className="text-xs text-[#333333]/60 mt-0.5">
                  Shows products with sale prices. Set salePrice when editing products to add them to sale.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
