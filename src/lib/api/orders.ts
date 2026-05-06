import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from "react-query";
import { apiClient } from "./client";
import { getApiErrorMessage, unwrapData } from "./types";
import { cartKeys } from "./cart";
import type { Order, Address } from "@/types";

export interface CreateOrderData {
  items: { productId: string; variantSKU: string; quantity: number }[];
  shippingAddress: Address;
  paymentMethod?: string;
}

export interface OrderResponse extends Order {
  createdAt?: string;
  trackingNumber?: string;
}

/** Create a new order */
export async function createOrder(orderData: CreateOrderData): Promise<OrderResponse> {
  const res = await apiClient.post<{ data?: OrderResponse } | OrderResponse>(
    "/api/orders",
    orderData
  );
  const data = unwrapData(res.data, null as OrderResponse | null);
  if (!data) throw new Error("Failed to create order");
  return data;
}

/** Fetch current user's orders */
export async function getOrders(): Promise<OrderResponse[]> {
  const res = await apiClient.get<{ data?: OrderResponse[] } | OrderResponse[]>("/api/orders");
  const data = unwrapData(res.data, []);
  return Array.isArray(data) ? data : [];
}

/** Fetch a single order by ID */
export async function getOrderById(orderId: string): Promise<OrderResponse | null> {
  try {
    const res = await apiClient.get<{ data?: OrderResponse } | OrderResponse>(
      `/api/orders/${orderId}`
    );
    return unwrapData(res.data, null as OrderResponse | null);
  } catch {
    return null;
  }
}

/** Confirm payment (mock) */
export async function confirmPayment(orderId: string): Promise<{ confirmed: boolean; orderId: string }> {
  const res = await apiClient.post<{ data?: { confirmed: boolean; orderId: string } } | { confirmed: boolean; orderId: string }>(
    "/api/payments/confirm",
    { orderId }
  );
  const data = unwrapData(res.data, { confirmed: false, orderId: "" });
  return data;
}

/** Fetch all orders (admin only) */
export async function getAdminOrders(): Promise<OrderResponse[]> {
  const res = await apiClient.get<{ data?: OrderResponse[] } | OrderResponse[]>("/api/admin/orders", {
    // Admin lists can be slow on cold start / large datasets.
    timeout: 120000,
  });
  const data = unwrapData(res.data, []);
  return Array.isArray(data) ? data : [];
}

// ---------------------------------------------------------------------------
// React Query hooks
// ---------------------------------------------------------------------------

export const ordersKeys = {
  all: ["orders"] as const,
  list: () => [...ordersKeys.all, "list"] as const,
  detail: (id: string) => [...ordersKeys.all, "detail", id] as const,
  adminList: () => [...ordersKeys.all, "admin"] as const,
};

export function useOrders(
  options?: Omit<
    UseQueryOptions<OrderResponse[], Error, OrderResponse[], ReturnType<typeof ordersKeys.list>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: ordersKeys.list(),
    queryFn: getOrders,
    ...options,
  });
}

export function useOrderById(
  orderId: string | null,
  options?: Omit<
    UseQueryOptions<OrderResponse | null, Error, OrderResponse | null, ReturnType<typeof ordersKeys.detail>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: ordersKeys.detail(orderId ?? ""),
    queryFn: () => getOrderById(orderId!),
    enabled: !!orderId,
    ...options,
  });
}

export function useCreateOrder(
  options?: UseMutationOptions<OrderResponse, Error, CreateOrderData>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries(ordersKeys.all);
      queryClient.invalidateQueries(cartKeys.all);
    },
    ...options,
  });
}

/** Update order (admin: orderStatus, paymentStatus) */
export async function updateOrder(
  orderId: string,
  payload: { orderStatus?: string; paymentStatus?: string }
): Promise<OrderResponse> {
  const res = await apiClient.patch<{ data?: OrderResponse } | OrderResponse>(
    `/api/orders/${orderId}`,
    payload
  );
  const data = unwrapData(res.data, null as OrderResponse | null);
  if (!data) throw new Error("Failed to update order");
  return data;
}

const STALE_TIME_ADMIN = 90 * 1000; // 90s — reduce refetches when navigating admin

/** Admin: fetch all orders */
export function useAdminOrders(
  options?: Omit<
    UseQueryOptions<OrderResponse[], Error, OrderResponse[], ReturnType<typeof ordersKeys.adminList>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: ordersKeys.adminList(),
    queryFn: getAdminOrders,
    staleTime: STALE_TIME_ADMIN,
    ...options,
  });
}

export { getApiErrorMessage as getOrdersErrorMessage };
