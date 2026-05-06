import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Product, Review, User } from "@/lib/db/models";
import { REVIEW_STATUS } from "@/lib/constants";
import { requireAuth } from "@/lib/auth-server";
import { reviewCreateSchema } from "@/lib/validations";

function toPublicReview(o: {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  status: string;
  helpfulCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  userName?: string;
  userImage?: string | null;
  user?: { name?: string; image?: string | null };
}) {
  return {
    id: o._id.toString(),
    productId: o.productId.toString(),
    userId: o.userId.toString(),
    rating: o.rating,
    comment: o.comment,
    status: o.status,
    helpfulCount: o.helpfulCount ?? 0,
    createdAt: (o.createdAt ?? o.updatedAt ?? new Date()).toISOString(),
    user: {
      name:
        (o.userName && o.userName.trim()) ||
        (o.user?.name && o.user.name.trim()) ||
        "Anonymous",
      image: o.userImage ?? o.user?.image ?? null,
    },
  };
}

async function updateProductAggregateRating(productId: mongoose.Types.ObjectId) {
  const agg = await Review.aggregate([
    { $match: { productId, status: REVIEW_STATUS.APPROVED } },
    { $group: { _id: "$productId", avg: { $avg: "$rating" } } },
  ]);
  const avg = typeof agg?.[0]?.avg === "number" ? agg[0].avg : 0;
  // Product.rating is a simple number (0-5). Keep it up-to-date.
  await Product.updateOne({ _id: productId }, { $set: { rating: avg } });
}

// GET /api/reviews?productId=...
// GET /api/reviews (no productId) => latest approved reviews for homepage
export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const limit = Math.max(1, Math.min(12, Number(searchParams.get("limit") ?? 6) || 6));

    // Homepage mode: latest approved reviews across all products
    if (!productId) {
      const rows = await Review.find(
        { status: REVIEW_STATUS.APPROVED },
        { productId: 1, userId: 1, rating: 1, comment: 1, status: 1, helpfulCount: 1, userName: 1, userImage: 1, createdAt: 1, updatedAt: 1 }
      )
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      const userIds = Array.from(new Set(rows.map((r) => (r.userId as mongoose.Types.ObjectId).toString())));
      const users = await User.find(
        { _id: { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) } },
        { name: 1, image: 1 }
      ).lean();
      const usersById = new Map(
        users.map((u) => [
          (u._id as mongoose.Types.ObjectId).toString(),
          { name: (u as { name?: string }).name, image: (u as { image?: string | null }).image ?? null },
        ])
      );

      const productIds = Array.from(new Set(rows.map((r) => (r.productId as mongoose.Types.ObjectId).toString())));
      const products = await Product.find(
        { _id: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) } },
        { name: 1, slug: 1 }
      ).lean();
      const productsById = new Map(
        products.map((p) => [
          (p._id as mongoose.Types.ObjectId).toString(),
          { name: (p as { name?: string }).name ?? "Product", slug: (p as { slug?: string }).slug ?? "" },
        ])
      );

      const payload = rows.map((r) => {
        const base = toPublicReview({
          ...(r as unknown as Parameters<typeof toPublicReview>[0]),
          user: usersById.get((r.userId as mongoose.Types.ObjectId).toString()),
        });
        const p = productsById.get((r.productId as mongoose.Types.ObjectId).toString());
        return { ...base, product: p ?? { name: "Product", slug: "" } };
      });

      return NextResponse.json(payload);
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
    }
    const pid = new mongoose.Types.ObjectId(productId);

    const rows = await Review.find(
      { productId: pid, status: REVIEW_STATUS.APPROVED },
      { productId: 1, userId: 1, rating: 1, comment: 1, status: 1, helpfulCount: 1, userName: 1, userImage: 1, createdAt: 1, updatedAt: 1 }
    )
      .sort({ createdAt: -1 })
      .lean();

    const userIds = Array.from(new Set(rows.map((r) => (r.userId as mongoose.Types.ObjectId).toString())));
    const users = await User.find({ _id: { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) } }, { name: 1, image: 1 }).lean();
    const usersById = new Map(users.map((u) => [(u._id as mongoose.Types.ObjectId).toString(), { name: (u as { name?: string }).name, image: (u as { image?: string | null }).image ?? null }]));

    const payload = rows.map((r) =>
      toPublicReview({
        ...(r as unknown as Parameters<typeof toPublicReview>[0]),
        user: usersById.get((r.userId as mongoose.Types.ObjectId).toString()),
      })
    );

    return NextResponse.json(payload);
  } catch (e) {
    console.error("[api/reviews] GET:", e);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// POST /api/reviews
export async function POST(request: Request) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    await connectDB();
    const body = await request.json().catch(() => null);
    const parsed = reviewCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues?.[0]?.message ?? "Invalid review" },
        { status: 400 }
      );
    }

    const { productId, rating, comment } = parsed.data;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
    }

    // Get user from session
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    const userId = (session?.user as { id?: string | null } | undefined)?.id;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const sessionName = (session?.user as { name?: string | null } | undefined)?.name ?? null;
    const sessionImage = (session?.user as { image?: string | null } | undefined)?.image ?? null;

    const pid = new mongoose.Types.ObjectId(productId);
    const uid = new mongoose.Types.ObjectId(userId);

    const exists = await Product.findById(pid, { _id: 1 }).lean();
    if (!exists) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Upsert: allow user to edit their review by re-posting
    const doc = await Review.findOneAndUpdate(
      { productId: pid, userId: uid },
      {
        $set: {
          rating,
          comment,
          status: REVIEW_STATUS.PENDING,
          userName: sessionName ?? "",
          userImage: sessionImage ?? null,
        },
        $setOnInsert: {
          helpfulCount: 0,
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true }
    ).lean();

    // Only update aggregate rating once approved (admin moderation)

    const user = await User.findById(uid, { name: 1, image: 1 }).lean();

    return NextResponse.json(
      toPublicReview({
        ...(doc as unknown as Parameters<typeof toPublicReview>[0]),
        user: user ? { name: (user as { name?: string }).name, image: (user as { image?: string | null }).image ?? null } : undefined,
      }),
      { status: 201 }
    );
  } catch (e) {
    // Duplicate key from unique index (rare due to upsert, but keep safe)
    if ((e as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: "You already reviewed this product." }, { status: 409 });
    }
    console.error("[api/reviews] POST:", e);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}

