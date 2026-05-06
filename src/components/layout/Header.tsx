"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { Search, Heart, ShoppingBag, User } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { MobileMenu } from "./MobileMenu";
import { Container } from "./Container";
import { ROUTES, LOGO_PATH, SITE_NAME } from "@/lib/constants";
import { useCollections } from "@/lib/api/products";
import { useCartStore } from "@/store/cartStore";
import { useCart } from "@/lib/api/cart";
import { useWishlistStore } from "@/store/wishlistStore";
import { useSearchOpen } from "@/components/shared/Providers";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: ROUTES.about, label: "Who We Are" },
  { href: ROUTES.contact, label: "Contact" },
] as const;

export function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const { data: apiCart } = useCart({ enabled: isAuthenticated });
  const zustandCartCount = useCartStore((s) => s.getCartItemCount());
  const wishlistCount = useWishlistStore((s) => s.productIds.length);
  const { searchOpen, setSearchOpen } = useSearchOpen();
  const [mounted, setMounted] = useState(false);
  const { data: collections = [] } = useCollections();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch: pathname-based "active" styles can differ
  // between server HTML and the first client render.
  const activePath = mounted ? (pathname ?? "") : "";

  const cartCount = isAuthenticated && apiCart?.items
    ? apiCart.items.reduce((sum, i) => sum + i.quantity, 0)
    : zustandCartCount;
  const showCartCount = mounted ? cartCount : 0;
  const showWishlistCount = mounted ? wishlistCount : 0;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border bg-white/95 shadow-sm",
        "backdrop-blur-lg supports-[backdrop-filter]:bg-white/80",
        "h-[60px] md:h-[70px] lg:h-20"
      )}
    >
      <Container
        noPadding
        className="flex h-full items-center justify-between gap-4 px-4 md:px-8 lg:gap-8 lg:px-12"
      >
        {/* Mobile menu trigger - left on mobile */}
        <div className="order-first lg:order-none lg:hidden">
          <MobileMenu onSearchOpen={() => setSearchOpen(true)} />
        </div>
        {/* Logo: icon + brand text — desktop: text revealed from behind logo on hover; mobile: text static */}
        <Link
          href={ROUTES.home}
          className="group relative flex shrink-0 items-center gap-3 lg:gap-0"
          aria-label={`${SITE_NAME} home`}
        >
          {/* Logo icon: sits on top (z-10), shifts left ~8px on hover */}
          <span
            className={cn(
              "relative z-10 shrink-0 transition-transform duration-500 ease-out",
              "lg:group-hover:-translate-x-2"
            )}
          >
            <Image
              src={LOGO_PATH}
              alt=""
              width={140}
              height={44}
              className="h-9 w-auto shrink-0 object-contain lg:h-11"
              priority
              sizes="140px"
              unoptimized={LOGO_PATH.endsWith(".svg")}
              aria-hidden
            />
          </span>
          {/* Text: desktop = appears at logo’s right edge (small slide + fade); mobile = always visible */}
          <span
            className={cn(
              "relative z-0 overflow-hidden whitespace-nowrap font-semibold tracking-[0.12em] text-[#333333]",
              "inline-block min-w-0",
              /* Mobile: text always visible */
              "opacity-100 translate-x-0",
              /* Desktop: text starts at logo edge (slightly under logo), then slides 6px right + fades in */
              "lg:min-w-[12rem] lg:opacity-0 lg:-translate-x-1.5 lg:transition-[transform,opacity] lg:duration-500 lg:ease-out lg:group-hover:translate-x-0 lg:group-hover:opacity-100"
            )}
          >
            NoorG-Fabrics
          </span>
        </Link>

        {/* Desktop nav (1024px+): 16px, 2rem spacing */}
        <nav className="hidden items-center gap-8 lg:flex">
          <Link
            href={ROUTES.home}
            className={cn(
              "text-base font-medium transition-colors hover:text-[#C4A747]",
              activePath === ROUTES.home ? "text-[#C4A747]" : "text-[#333333]"
            )}
          >
            Home
          </Link>
          {/* Collections: hover dropdown */}
          <div className="group relative">
            <Link
              href={ROUTES.collections}
              className={cn(
                "inline-flex items-center text-base font-medium transition-colors hover:text-[#C4A747]",
                activePath === ROUTES.collections || (activePath.startsWith(`${ROUTES.collections}/`) && activePath !== ROUTES.newArrivals)
                  ? "text-[#C4A747]"
                  : "text-[#333333]"
              )}
            >
              Collections
            </Link>
            <div
              className="invisible absolute left-0 top-full z-50 pt-1 opacity-0 transition-[visibility,opacity] duration-150 group-hover:visible group-hover:opacity-100"
              aria-hidden
            >
              <div className="min-w-[200px] rounded-lg border border-[#eee] bg-white py-2 shadow-lg">
              {collections.map((c) => (
                <Link
                  key={c.id}
                  href={`${ROUTES.collections}/${c.slug}`}
                  className={cn(
                    "block px-4 py-2.5 text-sm font-medium text-[#333333] transition-colors hover:bg-[#F5F3EE] hover:text-[#C4A747]",
                    activePath === `${ROUTES.collections}/${c.slug}` && "bg-[#F5F3EE] text-[#C4A747]"
                  )}
                >
                  {c.name}
                </Link>
              ))}
              {collections.length > 0 && <div className="my-1 border-t border-[#eee]" />}
              <Link
                href={ROUTES.collections}
                className="block px-4 py-2.5 text-sm font-medium text-[#C4A747] hover:bg-[#F5F3EE]"
              >
                View all collections
              </Link>
              </div>
            </div>
          </div>
          <Link
            href={ROUTES.newArrivals}
            className={cn(
              "text-base font-medium transition-colors hover:text-[#C4A747]",
              activePath === ROUTES.newArrivals ? "text-[#C4A747]" : "text-[#333333]"
            )}
          >
            New Arrivals
          </Link>
          <Link
            href={ROUTES.sale}
            className={cn(
              "text-base font-medium transition-colors hover:text-[#C4A747]",
              activePath === ROUTES.sale ? "text-[#C4A747]" : "text-[#333333]"
            )}
          >
            Sale
          </Link>
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "text-base font-medium transition-colors hover:text-[#C4A747]",
                activePath === href ? "text-[#C4A747]" : "text-[#333333]"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right: Search, Wishlist, Cart, User. On mobile (<768px) show only Cart (rest in BottomNav) */}
        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-10 w-10 min-h-touch min-w-touch text-[#333333] transition-transform hover:scale-110 hover:text-[#C4A747] hover:bg-[#C4A747]/10 sm:flex lg:h-12 lg:w-12"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5 lg:h-6 lg:w-6" />
          </Button>

          <Link href={ROUTES.wishlist} className="hidden sm:block">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 min-h-touch min-w-touch text-[#333333] transition-transform hover:scale-110 hover:text-[#C4A747] hover:bg-[#C4A747]/10 lg:h-12 lg:w-12"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5 lg:h-6 lg:w-6" />
              {showWishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C4A747] px-1 text-[10px] font-medium text-white">
                  {showWishlistCount > 99 ? "99+" : showWishlistCount}
                </span>
              )}
            </Button>
          </Link>

          <Link href={ROUTES.cart} className="flex">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 min-h-touch min-w-touch text-[#333333] transition-transform hover:scale-110 hover:text-[#C4A747] hover:bg-[#C4A747]/10 lg:h-12 lg:w-12"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5 lg:h-6 lg:w-6" />
              {showCartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C4A747] px-1 text-[10px] font-medium text-white">
                  {showCartCount > 99 ? "99+" : showCartCount}
                </span>
              )}
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden h-10 w-10 min-h-touch min-w-touch text-[#333333] transition-transform hover:scale-110 hover:text-[#C4A747] hover:bg-[#C4A747]/10 sm:flex lg:h-12 lg:w-12"
                aria-label="User menu"
              >
                <User className="h-5 w-5 lg:h-6 lg:w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {mounted && status === "authenticated" && session?.user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.account}>Account</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-[#333333] focus:text-[#C4A747]"
                  >
                    Sign out
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem asChild>
                  <button
                    type="button"
                    className="w-full cursor-pointer text-left"
                    onClick={() => signIn("google")}
                  >
                    Google Sign In
                  </button>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </Container>

      <SearchBar open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
