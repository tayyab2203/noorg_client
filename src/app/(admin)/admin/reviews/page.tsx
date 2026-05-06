"use client";

import { useMemo, useState } from "react";
import { useQuery } from "react-query";
import Link from "next/link";
import { Check, X, RefreshCw } from "lucide-react";
import { ADMIN_ROUTES, COLORS, REVIEW_STATUS } from "@/lib/constants";

type AdminReviewRow = {
  id: string;
  product: { id: string; name: string; slug: string };
  rating: number;
  comment: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; image: string | null };
};

async function fetchAdminReviews(status: string): Promise<AdminReviewRow[]> {
  const res = await fetch(`/api/admin/reviews?status=${encodeURIComponent(status)}&limit=200`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load reviews");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function updateReviewStatus(id: string, status: string) {
  const res = await fetch(`/api/admin/reviews/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Failed to update review");
  }
}

export default function AdminReviewsPage() {
  const [status, setStatus] = useState<string>(REVIEW_STATUS.PENDING);
  const { data = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["adminReviews", status],
    queryFn: () => fetchAdminReviews(status),
  });

  const rows = useMemo(() => data, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>
          Reviews
        </h1>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-lg border border-[#ddd] bg-white px-3 py-2 text-sm font-medium hover:bg-[#F5F3EE]"
          style={{ color: COLORS.primaryDark }}
        >
          <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {([REVIEW_STATUS.PENDING, REVIEW_STATUS.APPROVED, REVIEW_STATUS.REJECTED] as string[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className="rounded-full border px-4 py-2 text-sm font-medium transition"
            style={{
              borderColor: s === status ? COLORS.goldAccent : "#ddd",
              backgroundColor: s === status ? "rgba(196,167,71,0.12)" : "white",
              color: COLORS.primaryDark,
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-[#eee] bg-white p-12 text-center text-[#333333]/70">
          Loading...
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#ddd] bg-white py-16 text-center text-[#333333]/70">
          No reviews found
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#eee] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#eee] bg-[#F5F3EE]">
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>
                    Product
                  </th>
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>
                    Customer
                  </th>
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>
                    Rating
                  </th>
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>
                    Comment
                  </th>
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>
                    Date
                  </th>
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-[#eee] hover:bg-[#F5F3EE]/50">
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="font-medium" style={{ color: COLORS.primaryDark }}>
                          {r.product.name}
                        </div>
                        {r.product.slug ? (
                          <Link
                            href={`/products/${r.product.slug}`}
                            className="text-xs hover:underline"
                            style={{ color: COLORS.goldAccent }}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View product
                          </Link>
                        ) : (
                          <span className="text-xs text-[#999]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4" style={{ color: COLORS.primaryDark }}>
                      {r.user.name}
                    </td>
                    <td className="p-4" style={{ color: COLORS.primaryDark }}>
                      {r.rating} / 5
                    </td>
                    <td className="p-4 text-[#333333]/80">
                      <div className="max-w-[520px] whitespace-pre-wrap">{r.comment}</div>
                    </td>
                    <td className="p-4 text-[#333333]/70" suppressHydrationWarning>
                      {new Date(r.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isFetching}
                          onClick={async () => {
                            await updateReviewStatus(r.id, REVIEW_STATUS.APPROVED);
                            await refetch();
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#ddd] bg-white px-3 py-1.5 text-sm font-medium hover:bg-green-50 disabled:opacity-60"
                          style={{ color: COLORS.primaryDark }}
                        >
                          <Check className="h-4 w-4 text-green-600" /> Approve
                        </button>
                        <button
                          type="button"
                          disabled={isFetching}
                          onClick={async () => {
                            await updateReviewStatus(r.id, REVIEW_STATUS.REJECTED);
                            await refetch();
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#ddd] bg-white px-3 py-1.5 text-sm font-medium hover:bg-red-50 disabled:opacity-60"
                          style={{ color: COLORS.primaryDark }}
                        >
                          <X className="h-4 w-4 text-red-600" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-[#eee] px-4 py-3 text-xs text-[#666]">
            <span>
              Showing <span className="font-medium">{rows.length}</span> review(s)
            </span>
            <Link href={ADMIN_ROUTES.dashboard} className="hover:underline" style={{ color: COLORS.goldAccent }}>
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

