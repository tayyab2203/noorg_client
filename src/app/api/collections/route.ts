import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Collection, Product } from "@/lib/db/models";
import { isDbUnavailableError } from "@/lib/api/response";
import { PRODUCT_STATUS } from "@/lib/constants";
import type { Product as ProductType } from "@/types";

export interface CollectionListItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
  displayOrder: number;
}

function toProductJSON(doc: { _id: { toString: () => string }; [k: string]: unknown }): ProductType {
  const o = doc as Record<string, unknown>;
  return {
    id: (o._id as { toString: () => string }).toString(),
    name: o.name as string,
    slug: o.slug as string,
    categoryId: (o.categoryId as string) ?? "",
    price: o.price as number,
    salePrice: (o.salePrice as number | null) ?? null,
    material: (o.material as string) ?? "",
    description: (o.description as string) ?? "",
    rating: (o.rating as number) ?? 0,
    SKU: o.SKU as string,
    status: (o.status as ProductType["status"]) ?? PRODUCT_STATUS.ACTIVE,
    images: (o.images as ProductType["images"]) ?? [],
    variants: (o.variants as ProductType["variants"]) ?? [],
    isNewArrival: (o.isNewArrival as boolean) ?? false,
  };
}

export async function GET() {
  try {
    await connectDB();
    const collections = await Collection.find({}).sort({ displayOrder: 1 }).lean();
    const productIds = new Set<string>();
    collections.forEach((c) => {
      (c.productIds ?? []).forEach((id: mongoose.Types.ObjectId) =>
        productIds.add(id.toString())
      );
    });
    const activeProductIds = await Product.find(
      { _id: { $in: Array.from(productIds).map((id) => new mongoose.Types.ObjectId(id)) }, status: PRODUCT_STATUS.ACTIVE },
      { _id: 1 }
    ).lean();
    const activeSet = new Set(activeProductIds.map((p) => (p._id as mongoose.Types.ObjectId).toString()));

    const list: CollectionListItem[] = collections.map((c) => {
      const ids = (c.productIds ?? []) as mongoose.Types.ObjectId[];
      const count = ids.filter((id) => activeSet.has(id.toString())).length;
      return {
        id: (c._id as mongoose.Types.ObjectId).toString(),
        name: c.name,
        slug: c.slug,
        description: c.description ?? "",
        image: c.image ?? "",
        productCount: count,
        displayOrder: c.displayOrder ?? 0,
      };
    });

    return NextResponse.json(list);
  } catch (e) {
    console.error("[api/collections] GET:", e);
    const status = isDbUnavailableError(e) ? 503 : 500;
    const message = isDbUnavailableError(e) ? "Database unavailable" : "Failed to fetch collections";
    return NextResponse.json({ error: message }, { status });
  }
}
