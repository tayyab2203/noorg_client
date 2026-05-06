"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function normalizePhone(raw: string) {
  return raw.replace(/[^\d]/g, "");
}

export function WhatsAppButton({
  phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  message = process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ?? "Hello! I need help with my order.",
  className,
}: {
  phone?: string;
  message?: string;
  className?: string;
}) {
  const num = normalizePhone(phone);
  if (!num) return null;
  const href = `https://wa.me/${num}?text=${encodeURIComponent(message ?? "")}`;

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className={cn(
        "fixed bottom-24 left-4 z-[9999] inline-flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white shadow-lg transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-white/80 focus:ring-offset-2 focus:ring-offset-transparent md:bottom-6",
        className
      )}
    >
      <MessageCircle className="h-5 w-5" aria-hidden />
      <span className="hidden sm:inline">WhatsApp</span>
    </Link>
  );
}

