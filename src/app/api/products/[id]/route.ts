import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Product } from "@/lib/db/models";
import { success, error, isDbUnavailableError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-server";
import { auth } from "@/lib/auth";
import { PRODUCT_STATUS } from "@/lib/constants";
import { productUpdateSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import type { Product as ProductType } from "@/types";

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

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return error("Invalid id", 400);
    }

    const session = await auth();
    const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";
    const filter: { _id: mongoose.Types.ObjectId; status?: string } = {
      _id: new mongoose.Types.ObjectId(id),
    };
    if (!isAdmin) filter.status = PRODUCT_STATUS.ACTIVE;

    const product = await Product.findOne(filter).lean();
    if (!product) return error("Not found", 404);
    return NextResponse.json(toProductJSON(product as Parameters<typeof toProductJSON>[0]));
  } catch (e) {
    console.error("[api/products/[id]] GET:", e);
    if (isDbUnavailableError(e)) return error("Database unavailable", 503);
    return error("Failed to fetch product", 500);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdmin(request);
  if (forbidden) return forbidden;

  try {
    await connectDB();
    const { id } = await context.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return error("Invalid id", 400);
    }

    const body = await request.json();
    
    const parsed = productUpdateSchema.safeParse(body);
    if (!parsed.success) {
      console.error(`[api/products/[id]] Validation failed:`, parsed.error.flatten());
      const msg = parsed.error.flatten().fieldErrors
        ? Object.entries(parsed.error.flatten().fieldErrors)
            .map(([k, v]) => `${k}: ${(v as string[])?.[0] ?? ""}`)
            .join("; ")
        : "Validation failed";
      return error(msg, 400);
    }

    const data = parsed.data;
    
    if (data.slug !== undefined) {
      const existing = await Product.findOne({
        slug: data.slug,
        _id: { $ne: new mongoose.Types.ObjectId(id) },
      });
      if (existing) return error("Slug already in use", 400);
    }

    const updateData = { ...data } as Record<string, unknown>;
    
    // Explicitly handle isNewArrival - if it's provided, always set it
    if ('isNewArrival' in data) {
      updateData.isNewArrival = Boolean(data.isNewArrival);
    }

    const mongoUpdate = { $set: updateData };
    
    // Explicitly ensure isNewArrival is included if it was in the data
    if ('isNewArrival' in data) {
      (mongoUpdate.$set as Record<string, unknown>).isNewArrival = Boolean(data.isNewArrival);
    }

    await Product.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      mongoUpdate,
      { runValidators: false, strict: false }
    );
    
    // ALWAYS use direct MongoDB collection update for isNewArrival to bypass Mongoose
    // Mongoose seems to be silently ignoring this field during updates
    if ('isNewArrival' in updateData) {
      const db = mongoose.connection.db;
      if (db) {
        await db.collection('products').updateOne(
          { _id: new mongoose.Types.ObjectId(id) },
          { $set: { isNewArrival: Boolean(updateData.isNewArrival) } }
        );
      }
    }
    
    const product = await Product.findById(id).lean();
    
    if (!product) return error("Not found", 404);
    
    const jsonResult = toProductJSON(product as Parameters<typeof toProductJSON>[0]);
    return success(jsonResult);
  } catch (e) {
    console.error("[api/products/[id]] PATCH:", e);
    if (isDbUnavailableError(e)) return error("Database unavailable", 503);
    return error("Failed to update product", 500);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdmin(request);
  if (forbidden) return forbidden;

  try {
    await connectDB();
    const { id } = await context.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return error("Invalid id", 400);
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) return error("Not found", 404);
    return success({ deleted: true });
  } catch (e) {
    console.error("[api/products/[id]] DELETE:", e);
    if (isDbUnavailableError(e)) return error("Database unavailable", 503);
    return error("Failed to delete product", 500);
  }
}
