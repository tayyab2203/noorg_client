"use client";

import { useQuery } from "react-query";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useCollections } from "@/lib/api/products";

const GOLD = "#C4A747";
const CREAM = "#F5F3EE";

export default function CollectionsPage() {
  const { data: collections = [], isLoading, error } = useCollections();

  if (isLoading) {
    return (
      <div className="space-y-0">
        <section className="py-12 text-center md:py-16" style={{ backgroundColor: CREAM }}>
          <div className="mx-auto h-10 w-64 animate-pulse rounded bg-[#333333]/10" />
          <div className="mx-auto mt-3 h-5 w-80 max-w-full animate-pulse rounded bg-[#333333]/10" />
        </section>
        <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[3/4] min-h-[320px] animate-pulse rounded-xl bg-[#333333]/10" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-0">
        <section className="py-12 text-center md:py-16" style={{ backgroundColor: CREAM }}>
          <h1 className="text-3xl font-bold text-[#333333] md:text-[48px]">Our Collections</h1>
        </section>
        <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-8 lg:px-12">
          <p className="text-center text-[#333333]/70">Unable to load collections. Try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <section
        className="py-12 text-center md:py-16"
        style={{ backgroundColor: CREAM }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-[#333333] md:text-[48px]"
        >
          Our Collections
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3 text-base text-[#333333]/80 md:text-lg"
        >
          Discover our curated fabric collections
        </motion.p>
      </section>

      <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-8 lg:px-12">
        {collections.length === 0 ? (
          <p className="text-center text-[#333333]/70">
            No collections yet. Add collections in the Admin panel.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
            {collections.map((c, index) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Link
                  href={`${ROUTES.collections}/${c.slug}`}
                  className="group relative block overflow-hidden rounded-xl md:min-h-[400px]"
                >
                  <div className="relative aspect-[3/4] min-h-[320px] overflow-hidden rounded-xl md:min-h-[400px]">
                    {/*
                      Vercel Blob images can cause optimizer upstream timeouts in some regions.
                      Use unoptimized for those URLs so the browser fetches directly.
                    */}
                    <Image
                      src={c.image || "/placeholder.svg"}
                      alt={c.name}
                      fill
                      className="object-cover transition-all duration-500 ease-out group-hover:scale-[1.08]"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized={
                        (c.image ?? "").includes(".public.blob.vercel-storage.com/") ||
                        (c.image ?? "").includes(".blob.vercel-storage.com/")
                      }
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent"
                      style={{ opacity: 0.85 }}
                      aria-hidden
                    />
                    <div className="absolute inset-x-0 bottom-0 p-6 pt-16 md:p-8">
                      <h2 className="text-2xl font-bold text-white md:text-[32px]">
                        {c.name}
                      </h2>
                      <p className="mt-1 text-sm text-white/80">
                        {c.productCount} product{c.productCount !== 1 ? "s" : ""}
                      </p>
                      <span
                        className="mt-4 inline-flex translate-y-2 items-center gap-2 rounded-full px-8 py-3 text-sm font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                        style={{ backgroundColor: GOLD }}
                      >
                        Explore
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
