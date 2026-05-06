import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Review, Product } from "@/lib/db/models";
import { requireAdmin } from "@/lib/auth-server";
import { REVIEW_STATUS } from "@/lib/constants";

async function updateProductAggregateRating(productId: mongoose.Types.ObjectId) {
  const agg = await Review.aggregate([
    { $match: { productId, status: REVIEW_STATUS.APPROVED } },
    { $group: { _id: "$productId", avg: { $avg: "$rating" } } },
  ]);
  const avg = typeof agg?.[0]?.avg === "number" ? agg[0].avg : 0;
  await Product.updateOne({ _id: productId }, { $set: { rating: avg } });
}

/** PATCH /api/admin/reviews/:id { status: APPROVED|REJECTED } */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdmin(request);
  if (forbidden) return forbidden;

  try {
    await connectDB();
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }
    const body = await request.json().catch(() => null);
    const status = (body?.status as string | undefined) ?? "";
    if (![REVIEW_STATUS.APPROVED, REVIEW_STATUS.REJECTED, REVIEW_STATUS.PENDING].includes(status as any)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const review = await Review.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id),
      { $set: { status } },
      { new: true }
    ).lean();

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Keep product aggregate rating correct after moderation changes
    await updateProductAggregateRating(review.productId as mongoose.Types.ObjectId);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/admin/reviews/:id] PATCH:", e);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

