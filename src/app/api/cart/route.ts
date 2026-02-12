import { connectDB } from "@/lib/db/mongodb";
import { Cart, Product } from "@/lib/db/models";
import { success, error } from "@/lib/api/response";
import { getSession, requireAuth } from "@/lib/auth-server";
import { cartAddBodySchema } from "@/lib/validations";
import mongoose from "mongoose";
import type { CartResponse, CartItemResponse } from "@/lib/api/cart";
import type { Product as ProductType } from "@/types";
import { PRODUCT_STATUS } from "@/lib/constants";

type CartDoc = {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  items?: { _id: mongoose.Types.ObjectId; productId: mongoose.Types.ObjectId; variantSKU: string; quantity: number }[];
};

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

/** GET /api/cart - fetch current user's cart (auth required) */
export async function GET(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const session = await getSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return error("Unauthorized", 401);

  try {
    await connectDB();
    const cart = await Cart.findOne({ userId: new mongoose.Types.ObjectId(userId) })
      .lean()
      .exec();
    if (!cart) {
      const empty: CartResponse = { id: "", items: [] };
      return success(empty);
    }

    const cartDoc = cart as unknown as CartDoc;
    const productIds = [...new Set((cartDoc.items ?? []).map((i) => i.productId.toString()))];
    const products = await Product.find({ _id: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) } })
      .lean()
      .exec();
    const productMap = new Map(products.map((p) => [(p as unknown as { _id: mongoose.Types.ObjectId })._id.toString(), p]));

    const items: CartItemResponse[] = (cartDoc.items ?? []).map(
      (item: { _id: mongoose.Types.ObjectId; productId: mongoose.Types.ObjectId; variantSKU: string; quantity: number }) => {
        const product = productMap.get(item.productId.toString());
        return {
          id: item._id.toString(),
          productId: item.productId.toString(),
          variantSKU: item.variantSKU,
          quantity: item.quantity,
          product: product ? toProductForCart(product) : undefined,
        };
      }
    );

    const response: CartResponse = {
      id: cartDoc._id.toString(),
      userId: cartDoc.userId?.toString?.(),
      items,
    };
    return success(response);
  } catch (e) {
    console.error("[api/cart] GET:", e);
    return error("Failed to fetch cart", 500);
  }
}

/** POST /api/cart - add or update item (auth required) */
export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const session = await getSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return error("Unauthorized", 401);

  const body = await request.json().catch(() => ({}));
  const parsed = cartAddBodySchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.flatten().fieldErrors ? Object.values(parsed.error.flatten().fieldErrors).flat().join(", ") : "Invalid body", 400);
  }
  const { productId, variantSKU, quantity } = parsed.data;

  try {
    await connectDB();
    const product = await Product.findOne({
      _id: new mongoose.Types.ObjectId(productId),
      status: PRODUCT_STATUS.ACTIVE,
    }).lean();
    if (!product) return error("Product not found or inactive", 404);

    const variant = (product as unknown as { variants: { variantSKU: string; stock: number }[] }).variants?.find(
      (v) => v.variantSKU === variantSKU
    );
    if (!variant) return error("Variant not found", 404);
    if (variant.stock < quantity) return error("Insufficient stock", 400);

    let cart = await Cart.findOne({ userId: new mongoose.Types.ObjectId(userId) }).exec();
    if (!cart) {
      cart = await Cart.create({
        userId: new mongoose.Types.ObjectId(userId),
        items: [{ productId: new mongoose.Types.ObjectId(productId), variantSKU, quantity }],
        updatedAt: new Date(),
      });
    } else {
      type CartItemDoc = { productId: mongoose.Types.ObjectId; variantSKU: string; quantity: number };
      const existing = cart.items.find(
        (i: CartItemDoc) => i.productId.toString() === productId && i.variantSKU === variantSKU
      );
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (variant.stock < newQty) return error("Insufficient stock", 400);
        existing.quantity = newQty;
      } else {
        cart.items.push({
          productId: new mongoose.Types.ObjectId(productId),
          variantSKU,
          quantity,
        } as { productId: mongoose.Types.ObjectId; variantSKU: string; quantity: number });
      }
      cart.updatedAt = new Date();
      await cart.save();
    }

    const populated = await Cart.findById(cart._id).lean().exec();
    if (!populated) return success({ id: cart._id.toString(), items: [] } as CartResponse);

    const populatedDoc = populated as unknown as CartDoc;
    const productIds = [...new Set((populatedDoc.items ?? []).map((i) => i.productId.toString()))];
    const products = await Product.find({ _id: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) } })
      .lean()
      .exec();
    const productMap = new Map(products.map((p) => [(p as unknown as { _id: mongoose.Types.ObjectId })._id.toString(), p]));

    const items: CartItemResponse[] = (populatedDoc.items ?? []).map(
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
      id: populatedDoc._id.toString(),
      userId: populatedDoc.userId?.toString?.(),
      items,
    };
    return success(response);
  } catch (e) {
    console.error("[api/cart] POST:", e);
    return error("Failed to update cart", 500);
  }
}

/** DELETE /api/cart - clear cart (auth required) */
export async function DELETE(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const session = await getSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return error("Unauthorized", 401);

  try {
    await connectDB();
    const cart = await Cart.findOne({ userId: new mongoose.Types.ObjectId(userId) }).exec();
    if (!cart) {
      return success({ id: "", items: [] } as CartResponse);
    }
    cart.items = [];
    cart.updatedAt = new Date();
    await cart.save();
    return success({
      id: cart._id.toString(),
      userId: cart.userId.toString(),
      items: [],
    } as CartResponse);
  } catch (e) {
    console.error("[api/cart] DELETE:", e);
    return error("Failed to clear cart", 500);
  }
}
