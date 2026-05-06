import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Product, Review } from "@/lib/db/models";
import { requireAdmin } from "@/lib/auth-server";
import { REVIEW_STATUS } from "@/lib/constants";

export type AdminReviewRow = {
  id: string;
  product: { id: string; name: string; slug: string };
  rating: number;
  comment: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; image: string | null };
};

type ReviewLeanRow = {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  status: string;
  userName?: string;
  userImage?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

/** GET /api/admin/reviews?status=PENDING|APPROVED|REJECTED (default PENDING) */
export async function GET(request: Request) {
  const forbidden = await requireAdmin(request);
  if (forbidden) return forbidden;

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") ?? REVIEW_STATUS.PENDING) as string;
    const limit = Math.max(1, Math.min(200, Number(searchParams.get("limit") ?? 50) || 50));

    const rows = (await Review.find(
      { status },
      {
        productId: 1,
        userId: 1,
        rating: 1,
        comment: 1,
        status: 1,
        userName: 1,
        userImage: 1,
        createdAt: 1,
        updatedAt: 1,
      }
    )
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()) as unknown as ReviewLeanRow[];

    const productIds = Array.from(new Set(rows.map((r) => r.productId.toString())));
    const products = await Product.find(
      { _id: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) } },
      { name: 1, slug: 1 }
    ).lean();
    const productsById = new Map(
      products.map((p) => [
        (p._id as mongoose.Types.ObjectId).toString(),
        { id: (p._id as mongoose.Types.ObjectId).toString(), name: (p as { name?: string }).name ?? "Product", slug: (p as { slug?: string }).slug ?? "" },
      ])
    );

    const payload: AdminReviewRow[] = rows.map((r) => {
      const pid = r.productId.toString();
      const uid = r.userId.toString();
      return {
        id: r._id.toString(),
        product: productsById.get(pid) ?? { id: pid, name: "Product", slug: "" },
        rating: r.rating,
        comment: r.comment,
        status: r.status,
        createdAt: (r.createdAt ?? r.updatedAt ?? new Date()).toISOString(),
        user: {
          id: uid,
          name: (r.userName ?? "").trim() || "Anonymous",
          image: r.userImage ?? null,
        },
      };
    });

    return NextResponse.json(payload);
  } catch (e) {
    console.error("[api/admin/reviews] GET:", e);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

