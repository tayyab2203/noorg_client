import type {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PRODUCT_STATUS,
  REVIEW_STATUS,
  USER_ROLE,
} from "@/lib/constants";

// ---------------------------------------------------------------------------
// User & Auth
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  googleId: string | null;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  profileImage: string | null;
  role: (typeof USER_ROLE)[keyof typeof USER_ROLE];
  status: string;
}

// ---------------------------------------------------------------------------
// Product & Catalog
// ---------------------------------------------------------------------------

export interface ProductImage {
  url: string;
  altText: string;
  order: number;
}

export interface ProductVariant {
  size: string;
  color: string;
  stock: number;
  variantSKU: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  price: number;
  salePrice: number | null;
  material: string;
  description: string;
  rating: number;
  SKU: string;
  status: (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];
  images: ProductImage[];
  variants: ProductVariant[];
  isNewArrival: boolean;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  products: Product[];
  displayOrder: number;
  status: string;
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export interface CartItem {
  productId: string;
  variantSKU: string;
  quantity: number;
  product?: Product;
}

/** Client-side cart line (store/UI) when variant is selected by size and color. */
export interface CartLineItem {
  product: Product;
  quantity: number;
  size: string;
  color: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  expiresAt: string;
}

// ---------------------------------------------------------------------------
// Order
// ---------------------------------------------------------------------------

export interface OrderItem {
  productId: string;
  variantSKU: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: string;
  paymentStatus: (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
  orderStatus: (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
}

// ---------------------------------------------------------------------------
// Address
// ---------------------------------------------------------------------------

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  status: (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS];
}

// ---------------------------------------------------------------------------
// Legacy / UI helpers (for existing components using simplified Product shape)
// ---------------------------------------------------------------------------

export interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export type SortOption = "newest" | "price-asc" | "price-desc" | "name";
