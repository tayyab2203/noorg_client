import { connectDB } from "@/lib/db/mongodb";
import { Cart, Product } from "@/lib/db/models";
import { success, error } from "@/lib/api/response";
import { getSession, requireAuth } from "@/lib/auth-server";
import { cartMergeBodySchema } from "@/lib/validations";
import mongoose from "mongoose";
import type { CartResponse, CartItemResponse } from "@/lib/api/cart";
import type { Product as ProductType } from "@/types";
import { PRODUCT_STATUS } from "@/lib/constants";

function toProductForCart(doc: { _id: unknown; [k: string]: unknown }): ProductType {
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

/** POST /api/cart/merge - merge guest cart items into user cart (auth required) */
export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const session = await getSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return error("Unauthorized", 401);

  const body = await request.json().catch(() => ({}));
  const parsed = cartMergeBodySchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.flatten().fieldErrors ? Object.values(parsed.error.flatten().fieldErrors).flat().join(", ") : "Invalid body", 400);
  }
  const { items: rawItems } = parsed.data;

  try {
    await connectDB();
    let cart = await Cart.findOne({ userId: new mongoose.Types.ObjectId(userId) }).exec();
    if (!cart) {
      cart = await Cart.create({
        userId: new mongoose.Types.ObjectId(userId),
        items: [],
        updatedAt: new Date(),
      });
    }

    for (const raw of rawItems) {
      const product = await Product.findOne({
        _id: new mongoose.Types.ObjectId(raw.productId),
        status: PRODUCT_STATUS.ACTIVE,
      }).lean();
      if (!product) continue;
      const variant = (product as unknown as { variants: { variantSKU: string; stock: number }[] }).variants?.find(
        (v) => v.variantSKU === raw.variantSKU
      );
      if (!variant || variant.stock < 1) continue;

      type CartItemDoc = { productId: mongoose.Types.ObjectId; variantSKU: string; quantity: number };
      const existing = cart.items.find(
        (i: CartItemDoc) => i.productId.toString() === raw.productId && i.variantSKU === raw.variantSKU
      );
      const addQty = Math.min(raw.quantity, variant.stock);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + addQty, variant.stock);
      } else {
        cart.items.push({
          productId: new mongoose.Types.ObjectId(raw.productId),
          variantSKU: raw.variantSKU,
          quantity: addQty,
        } as { productId: mongoose.Types.ObjectId; variantSKU: string; quantity: number });
      }
    }
    cart.updatedAt = new Date();
    await cart.save();

    const populated = await Cart.findById(cart._id).lean().exec();
    if (!populated) return success({ id: cart._id.toString(), items: [] } as CartResponse);

    type PopulatedCart = { _id: mongoose.Types.ObjectId; userId: mongoose.Types.ObjectId; items?: { _id: mongoose.Types.ObjectId; productId: mongoose.Types.ObjectId; variantSKU: string; quantity: number }[] };
    const doc = populated as unknown as PopulatedCart;
    const productIds = [...new Set((doc.items ?? []).map((i) => i.productId.toString()))];
    const products = await Product.find({ _id: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) } })
      .lean()
      .exec();
    const productMap = new Map(products.map((p) => [(p as unknown as { _id: mongoose.Types.ObjectId })._id.toString(), p]));

    const items: CartItemResponse[] = (doc.items ?? []).map(
      (item: { _id: mongoose.Types.ObjectId; productId: mongoose.Types.ObjectId; variantSKU: string; quantity: number }) => ({
        id: item._id.toString(),
        productId: item.productId.toString(),
        variantSKU: item.variantSKU,
        quantity: item.quantity,
        product: productMap.get(item.productId.toString())
          ? toProductForCart(productMap.get(item.productId.toString())!)
          : undefined,
      })
    );

    const response: CartResponse = {
      id: doc._id.toString(),
      userId: doc.userId?.toString?.(),
      items,
    };
    return success(response);
  } catch (e) {
    console.error("[api/cart/merge] POST:", e);
    return error("Failed to merge cart", 500);
  }
}
