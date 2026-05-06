"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Facebook, Instagram, Twitter } from "lucide-react";
import { ROUTES, LOGO_PATH, SITE_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container } from "./Container";

const FOOTER_LINKS = {
  aboutUs: [
    { label: "Our Story", href: ROUTES.about },
    { label: "Sustainability", href: ROUTES.about },
    { label: "Careers", href: ROUTES.about },
  ],
  quickLinks: [
    { label: "Shop", href: ROUTES.shop },
    { label: "Collections", href: ROUTES.collections },
    { label: "New Arrivals", href: "/shop?new=1" },
    { label: "Account", href: ROUTES.account },
  ],
  customerService: [
    { label: "Contact Us", href: ROUTES.contact },
    { label: "Shipping & Returns", href: ROUTES.contact },
    { label: "Size Guide", href: ROUTES.contact },
    { label: "FAQs", href: ROUTES.contact },
  ],
  contact: [
    { label: "Email", href: "mailto:noorgfabrics@gmail.com", value: "noorgfabrics@gmail.com" },
    { label: "Phone", href: "tel:+923190409623", value: "+92 319 0409623" },
  ],
};

const SOCIAL = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Twitter, href: "#", label: "Twitter" },
];

const linkClass =
  "flex min-h-[44px] items-center text-sm text-white/90 transition-colors hover:text-[#C4A747] md:min-h-0";

export function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setTimeout(() => {
      setStatus("success");
      setEmail("");
    }, 500);
  };

  return (
    <footer className="mt-0 bg-[#2a2a2a] text-white pb-20 md:pb-0">
      <Container
        noPadding
        className="py-8 px-4 md:py-12 md:px-8 lg:py-16 lg:px-12"
      >
        {/* Desktop: 4 cols equal, gap-12 (3rem). Tablet: 2 cols 2 rows, gap-8. Mobile: 1 col, stack */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-8 lg:grid-cols-4 lg:gap-12">
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              About Us
            </h3>
            <ul className="space-y-1">
              {FOOTER_LINKS.aboutUs.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h3>
            <ul className="space-y-1">
              {FOOTER_LINKS.quickLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Customer Service
            </h3>
            <ul className="space-y-1">
              {FOOTER_LINKS.customerService.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Contact
            </h3>
            <ul className="space-y-1">
              {FOOTER_LINKS.contact.map(({ label, href, value }) => (
                <li key={label}>
                  <Link href={href} className={linkClass}>
                    {value ?? label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-4">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-white/90 transition-colors hover:text-[#C4A747]"
                >
                  <Icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Newsletter: full width on mobile — no visible border to avoid light line */}
        <div className="mt-12 border-t border-transparent pt-10">
          <div className="mx-auto w-full max-w-md lg:max-w-md">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-white">
              Newsletter
            </h3>
            <p className="mb-4 text-sm text-white/80">
              Subscribe for updates and exclusive offers.
            </p>
            <form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col gap-4 sm:flex-row"
            >
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "loading"}
                className="w-full flex-1 border-white/30 bg-white/10 text-white placeholder:text-white/60 focus-visible:ring-[#C4A747]"
              />
              <Button
                type="submit"
                disabled={status === "loading"}
                className="w-full shrink-0 bg-[#C4A747] text-[#333333] hover:bg-[#C4A747]/90 sm:w-auto"
              >
                {status === "loading"
                  ? "..."
                  : status === "success"
                    ? "Subscribed"
                    : "Submit"}
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 border-t border-white/10 pt-6 text-center text-sm text-white/60">
          <Link href={ROUTES.home} className="block">
            <Image
              src={LOGO_PATH}
              alt={SITE_NAME}
              width={100}
              height={32}
              className="h-8 w-auto object-contain opacity-90"
              sizes="100px"
              unoptimized={LOGO_PATH.endsWith(".svg")}
            />
          </Link>
          <div className="flex flex-col items-center gap-2">
            <span suppressHydrationWarning>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</span>
            <Link 
              href="/admin/login" 
              className="text-xs text-white/40 transition-colors hover:text-white/60"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
