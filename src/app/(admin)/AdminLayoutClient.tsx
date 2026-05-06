"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Menu,
  FolderOpen,
  Users,
  PackageCheck,
  CreditCard,
  Star,
  Settings,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useAdminCollections } from "@/lib/api/admin";
import { useProducts } from "@/lib/api/products";
import { ADMIN_ROUTES, COLORS, LOGO_PATH, SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SIDEBAR_LINKS = [
  { href: ADMIN_ROUTES.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { href: ADMIN_ROUTES.categories, label: "Categories", icon: FolderOpen },
  { href: ADMIN_ROUTES.orders, label: "Orders", icon: ShoppingBag },
  { href: ADMIN_ROUTES.customers, label: "Customers", icon: Users },
  { href: ADMIN_ROUTES.inventory, label: "Inventory", icon: PackageCheck },
  { href: ADMIN_ROUTES.reviews, label: "Reviews", icon: Star },
  { href: ADMIN_ROUTES.payments, label: "Payments", icon: CreditCard },
  { href: ADMIN_ROUTES.settings, label: "Settings", icon: Settings },
];

const STALE_TIME_ADMIN_NAV = 3 * 60 * 1000; // 3 min — breadcrumb data

function AdminBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean);
  const needCategories = pathname.includes("categories");
  const needProducts = pathname.includes("products");

  // Only fetch when breadcrumb needs to resolve category/product names
  const { data: categories = [] } = useAdminCollections({
    enabled: needCategories,
    staleTime: STALE_TIME_ADMIN_NAV,
  });
  const { data: products = [] } = useProducts(undefined, {
    enabled: needProducts,
    staleTime: STALE_TIME_ADMIN_NAV,
  });
  
  const labels: Record<string, string> = {
    categories: "Categories",
    products: "Products",
    new: "New",
    edit: "Edit",
    orders: "Orders",
    customers: "Customers",
    inventory: "Inventory",
    payments: "Payments",
    settings: "Settings",
    login: "Login",
  };
  
  // Helper to resolve ID to name
  const resolveLabel = (seg: string, prevSeg: string | null): string => {
    // If it's a known label, use it
    if (labels[seg]) return labels[seg];
    
    // Check if it's a category ID (after "categories")
    if (prevSeg === "categories") {
      const category = categories.find((c) => c.id === seg);
      if (category) return category.name;
    }
    
    // Check if it's a product ID (after "products" in categories context)
    if (prevSeg === "products") {
      const product = products.find((p) => p.id === seg);
      if (product) return product.name;
    }
    
    // Check if it's an order/customer ID
    if (prevSeg === "orders" || prevSeg === "customers") {
      return `#${seg.slice(-6)}`; // Show last 6 chars
    }
    
    return seg;
  };
  
  let href = "/admin";
  const crumbs = [{ label: "Dashboard", href: "/admin" }];
  let prevSeg: string | null = null;
  
  for (const seg of segments) {
    href += `/${seg}`;
    crumbs.push({ label: resolveLabel(seg, prevSeg), href });
    prevSeg = seg;
  }
  
  return (
    <nav aria-label="Breadcrumb" className="hidden items-center gap-2 text-sm sm:flex">
      {crumbs.map((c, i) => (
        <span key={c.href} className="flex items-center gap-2">
          {i > 0 && <span className="text-[#999]">/</span>}
          {i === crumbs.length - 1 ? (
            <span className="font-medium" style={{ color: COLORS.primaryDark }}>{c.label}</span>
          ) : (
            <Link href={c.href} className="hover:underline" style={{ color: COLORS.goldAccent }}>{c.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ backgroundColor: COLORS.cream }}>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-[#eee] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 bg-white flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-[#eee] px-4 lg:justify-center shrink-0">
          <Link href={ADMIN_ROUTES.dashboard} className="flex items-center gap-2">
            <Image
              src={LOGO_PATH}
              alt={SITE_NAME}
              width={100}
              height={32}
              className="h-8 w-auto object-contain"
              sizes="100px"
              unoptimized={LOGO_PATH.endsWith(".svg")}
            />
            <span className="text-sm font-semibold text-[#333333]/80">Admin</span>
          </Link>
          <button type="button" onClick={() => setSidebarOpen(false)} className="lg:hidden rounded p-2 hover:bg-[#F5F3EE]" aria-label="Close menu">
            <Menu className="h-6 w-6" style={{ color: COLORS.primaryDark }} />
          </button>
        </div>
        <nav className="flex flex-col flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="space-y-1">
            {SIDEBAR_LINKS.map(({ href, label, icon: Icon }) => {
              const isActive = href === pathname || (href !== ADMIN_ROUTES.dashboard && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn("flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition", isActive ? "bg-[#F5F3EE]" : "hover:bg-[#F5F3EE]/70")}
                  style={{ color: isActive ? COLORS.goldAccent : COLORS.primaryDark }}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>
          {/* Logout button */}
          <div className="mt-auto border-t border-[#eee] pt-4 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSidebarOpen(false);
                signOut({ callbackUrl: "/admin/login" });
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition",
                "hover:bg-red-50",
                "text-[#333333] hover:text-red-600"
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Logout
            </button>
          </div>
        </nav>
      </aside>
      {sidebarOpen && (
        <button type="button" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/30 lg:hidden" aria-label="Close overlay" />
      )}
      <main className="flex-1 min-w-0">
        <div className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-[#eee] px-4 lg:px-8 bg-white">
          <button type="button" onClick={() => setSidebarOpen(true)} className="lg:hidden rounded p-2 hover:bg-[#F5F3EE]" aria-label="Open menu">
            <Menu className="h-6 w-6" style={{ color: COLORS.primaryDark }} />
          </button>
          <AdminBreadcrumb />
          <Link href="/" className="ml-auto text-sm font-medium hover:underline" style={{ color: COLORS.primaryDark }}>
            Back to store
          </Link>
        </div>
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
