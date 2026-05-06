"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { cn } from "@/lib/utils";

/**
 * Wraps the app and only shows store UI (header, footer, bottom nav) on non-admin routes.
 * On /admin/* we render only children so the admin layout is clean (no store navbar or bottom bar).
 * Uses mounted state and CSS to prevent hydration mismatches.
 */
export function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsAdmin(pathname?.startsWith("/admin") ?? false);
  }, [pathname]);

  // Always render the same structure to prevent hydration mismatch
  // Use CSS to hide elements on admin pages after mount
  return (
    <>
      <div className={cn(mounted && isAdmin && "hidden")}>
        <Header />
      </div>
      <main
        id="main-content"
        className={cn("flex-1 pb-20 md:pb-0", mounted && isAdmin && "pb-0")}
        role="main"
      >
        {children}
      </main>
      <div className={cn(mounted && isAdmin && "hidden")}>
        <Footer />
        <BottomNav />
      </div>
      <div className={cn(mounted && isAdmin && "hidden")}>
        <WhatsAppButton />
      </div>
    </>
  );
}
