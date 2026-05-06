import mongoose, { Schema, model, models } from "mongoose";
import { REVIEW_STATUS } from "@/lib/constants";

export interface IReview {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  status: (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS];
  helpfulCount: number;
  /** Snapshot of customer name at time of review (for display even if profile changes). */
  userName?: string;
  /** Snapshot of customer image at time of review. */
  userImage?: string | null;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: Object.values(REVIEW_STATUS),
      default: REVIEW_STATUS.PENDING,
      index: true,
    },
    helpfulCount: { type: Number, default: 0, min: 0 },
    userName: { type: String, default: "" },
    userImage: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One review per user per product
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

ReviewSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    const out = ret as unknown as Record<string, unknown> & { _id?: { toString: () => string } };
    out.id = out._id?.toString?.();
    delete out._id;
    delete out.__v;
    return out;
  },
});

export const Review = models.Review ?? model<IReview>("Review", ReviewSchema);

