import { useQuery, type UseQueryOptions } from "react-query";
import { apiClient } from "./client";
import { getApiErrorMessage, unwrapData } from "./types";
import type { Product } from "@/types";
import type { ProductImage, ProductVariant } from "@/types";

/** Collection list item (from GET /api/collections) */
export interface CollectionListItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
  displayOrder: number;
}

/** Single collection with products (from GET /api/collections/[slug]) */
export interface CollectionWithProducts {
  collection: {
    id: string;
    name: string;
    slug: string;
    description: string;
    image: string;
    productCount: number;
  };
  products: Product[];
}

export interface GetProductsParams {
  ids?: string[];
  page?: number;
  limit?: number;
}

/** Fetch all products (optional filters via params) */
export async function getProducts(params?: GetProductsParams): Promise<Product[]> {
  const { data } = await apiClient.get<Product[] | Product>("/api/products", {
    params: params?.ids ? { id: params.ids } : undefined,
  });
  const list = Array.isArray(data) ? data : [data];
  if (params?.page != null && params?.limit != null) {
    const start = (params.page - 1) * params.limit;
    return list.slice(start, start + params.limit);
  }
  return list;
}

/** Fetch a single product by slug */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const { data } = await apiClient.get<Product>(`/api/products`, {
      params: { slug },
    });
    return data ?? null;
  } catch {
    return null;
  }
}

/** Fetch a single product by id */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data } = await apiClient.get<Product>(`/api/products/${id}`);
    return data ?? null;
  } catch {
    return null;
  }
}

/** Search products by query */
export async function searchProducts(query: string): Promise<Product[]> {
  if (!query.trim()) return [];
  const { data } = await apiClient.get<Product[]>("/api/products", {
    params: { q: query.trim() },
  });
  return Array.isArray(data) ? data : [];
}

/** Create product (admin) */
export interface CreateProductPayload {
  name: string;
  slug?: string;
  description?: string;
  price: number;
  salePrice?: number | null;
  material?: string;
  rating?: number;
  SKU: string;
  status?: string;
  categoryId?: string;
  images?: ProductImage[];
  variants: ProductVariant[];
  isNewArrival?: boolean;
}
export async function createProduct(payload: CreateProductPayload): Promise<Product> {
  const res = await apiClient.post<{ data?: Product } | Product>("/api/products", payload);
  const data = unwrapData(res.data, null as Product | null);
  if (!data) throw new Error("Failed to create product");
  return data;
}

/** Update product (admin) */
export interface UpdateProductPayload extends Partial<CreateProductPayload> {}
export async function updateProduct(id: string, payload: UpdateProductPayload): Promise<Product> {
  const res = await apiClient.patch<{ data?: Product } | Product>(`/api/products/${id}`, payload);
  const data = unwrapData(res.data, null as Product | null);
  if (!data) throw new Error("Failed to update product");
  return data;
}

/** Delete product (admin) */
export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/api/products/${id}`);
}

/** Upload product image (admin) - uses Vercel Blob */
export async function uploadProductImage(file: File): Promise<{ url: string }> {
  const { uploadImage } = await import("./upload");
  return uploadImage(file, "products");
}

/** Fetch all collections */
export async function getCollections(): Promise<CollectionListItem[]> {
  const { data } = await apiClient.get<CollectionListItem[]>("/api/collections");
  return Array.isArray(data) ? data : [];
}

/** Fetch a single collection with products by slug */
export async function getCollectionBySlug(slug: string): Promise<CollectionWithProducts | null> {
  try {
    const { data } = await apiClient.get<CollectionWithProducts>(`/api/collections/${slug}`);
    return data ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// React Query hooks
// ---------------------------------------------------------------------------

export const productsKeys = {
  all: ["products"] as const,
  list: (params?: GetProductsParams) => [...productsKeys.all, "list", params] as const,
  slug: (slug: string) => [...productsKeys.all, "slug", slug] as const,
  id: (id: string) => [...productsKeys.all, "id", id] as const,
  search: (query: string) => [...productsKeys.all, "search", query] as const,
};

const collectionsKeys = {
  all: ["collections"] as const,
  list: () => [...collectionsKeys.all, "list"] as const,
  slug: (slug: string) => [...collectionsKeys.all, "slug", slug] as const,
};

export function useProducts(
  params?: GetProductsParams,
  options?: Omit<
    UseQueryOptions<Product[], Error, Product[], ReturnType<typeof productsKeys.list>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: productsKeys.list(params),
    queryFn: () => getProducts(params),
    ...options,
  });
}

export function useProductBySlug(
  slug: string | null,
  options?: Omit<
    UseQueryOptions<Product | null, Error, Product | null, ReturnType<typeof productsKeys.slug>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: productsKeys.slug(slug ?? ""),
    queryFn: () => getProductBySlug(slug!),
    enabled: !!slug,
    ...options,
  });
}

export function useProductById(
  id: string | null,
  options?: Omit<
    UseQueryOptions<Product | null, Error, Product | null, ReturnType<typeof productsKeys.id>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: productsKeys.id(id ?? ""),
    queryFn: () => getProductById(id!),
    enabled: !!id,
    ...options,
  });
}

export function useSearchProducts(
  query: string,
  options?: Omit<
    UseQueryOptions<Product[], Error, Product[], ReturnType<typeof productsKeys.search>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: productsKeys.search(query),
    queryFn: () => searchProducts(query),
    enabled: query.trim().length > 0,
    ...options,
  });
}

export function useCollections(
  options?: Omit<
    UseQueryOptions<CollectionListItem[], Error, CollectionListItem[], ReturnType<typeof collectionsKeys.list>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: collectionsKeys.list(),
    queryFn: getCollections,
    ...options,
  });
}

export function useCollectionBySlug(
  slug: string | null,
  options?: Omit<
    UseQueryOptions<CollectionWithProducts | null, Error, CollectionWithProducts | null, ReturnType<typeof collectionsKeys.slug>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: collectionsKeys.slug(slug ?? ""),
    queryFn: () => getCollectionBySlug(slug!),
    enabled: !!slug,
    ...options,
  });
}

export { getApiErrorMessage as getProductsErrorMessage };
