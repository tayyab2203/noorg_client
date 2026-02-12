import { connectDB } from "@/lib/db/mongodb";
import { Cart, Product } from "@/lib/db/models";
import { success, error } from "@/lib/api/response";
import { getSession, requireAuth } from "@/lib/auth-server";
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

async function cartToResponse(cart: { _id: mongoose.Types.ObjectId; userId: mongoose.Types.ObjectId; items: { _id: mongoose.Types.ObjectId; productId: mongoose.Types.ObjectId; variantSKU: string; quantity: number }[] } | null): Promise<CartResponse> {
  if (!cart) return { id: "", items: [] };
  const productIds = [...new Set(cart.items.map((i) => i.productId.toString()))];
  const products = await Product.find({ _id: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) } })
    .lean()
    .exec();
  const productMap = new Map(products.map((p) => [(p as { _id: mongoose.Types.ObjectId })._id.toString(), p]));
  const items: CartItemResponse[] = cart.items.map((item) => ({
    id: item._id.toString(),
    productId: item.productId.toString(),
    variantSKU: item.variantSKU,
    quantity: item.quantity,
    product: productMap.get(item.productId.toString()) ? toProductForCart(productMap.get(item.productId.toString())!) : undefined,
  }));
  return {
    id: cart._id.toString(),
    userId: cart.userId.toString(),
    items,
  };
}

/** PATCH /api/cart/items/[itemId] - update quantity (auth required) */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const session = await getSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return error("Unauthorized", 401);

  const { itemId } = await params;
  const body = await request.json().catch(() => ({}));
  const quantity = typeof (body as { quantity?: number }).quantity === "number"
    ? (body as { quantity: number }).quantity
    : undefined;
  if (quantity === undefined || quantity < 1) return error("Invalid quantity", 400);

  try {
    await connectDB();
    const cart = await Cart.findOne({ userId: new mongoose.Types.ObjectId(userId) }).exec();
    if (!cart) return success({ id: "", items: [] });

    if (!mongoose.Types.ObjectId.isValid(itemId)) return error("Invalid item id", 400);
    const line = cart.items.id(itemId);
    if (!line) return error("Cart item not found", 404);

    const product = await import("@/lib/db/models").then((m) => m.Product).then((P) =>
      P.findById(line.productId).lean().exec()
    );
    const variant = (product as unknown as { variants: { variantSKU: string; stock: number }[] } | null)?.variants?.find(
      (v) => v.variantSKU === line.variantSKU
    );
    if (variant && variant.stock < quantity) return error("Insufficient stock", 400);

    line.quantity = quantity;
    cart.updatedAt = new Date();
    await cart.save();

    const response = await cartToResponse(cart);
    return success(response);
  } catch (e) {
    console.error("[api/cart/items] PATCH:", e);
    return error("Failed to update cart item", 500);
  }
}

/** DELETE /api/cart/items/[itemId] - remove item (auth required) */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const session = await getSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return error("Unauthorized", 401);

  const { itemId } = await params;

  try {
    await connectDB();
    const cart = await Cart.findOne({ userId: new mongoose.Types.ObjectId(userId) }).exec();
    if (!cart) return success({ id: "", items: [] });

    if (!mongoose.Types.ObjectId.isValid(itemId)) return error("Invalid item id", 400);
    const line = cart.items.id(itemId);
    if (line) {
      cart.items.pull(line._id);
      cart.updatedAt = new Date();
      await cart.save();
    }

    const response = await cartToResponse(cart);
    return success(response);
  } catch (e) {
    console.error("[api/cart/items] DELETE:", e);
    return error("Failed to remove cart item", 500);
  }
}
