// ---------------------------------------------------------------------------
// Site
// ---------------------------------------------------------------------------

export const SITE_NAME = "NOOR-G";
export const SITE_DESCRIPTION = "Premium clothing brand - NOOR-G";

/** Logo image path — replace public/noor-logo.jpeg with your logo file. */
export const LOGO_PATH = "/noor-logo.png";

export const ROUTES = {
  home: "/",
  shop: "/shop",
  collections: "/collections",
  newArrivals: "/collections/new-arrivals",
  sale: "/sale",
  search: "/search",
  about: "/about",
  contact: "/contact",
  cart: "/cart",
  wishlist: "/wishlist",
  login: "/login",
  signup: "/signup",
  account: "/account",
  checkout: "/checkout",
} as const;

export const ADMIN_ROUTES = {
  dashboard: "/admin",
  categories: "/admin/categories",
  categoriesNew: "/admin/categories/new",
  categoryDetail: (id: string) => `/admin/categories/${id}`,
  categoryEdit: (id: string) => `/admin/categories/${id}/edit`,
  categoryProductNew: (categoryId: string) => `/admin/categories/${categoryId}/products/new`,
  categoryProductEdit: (categoryId: string, productId: string) => `/admin/categories/${categoryId}/products/${productId}/edit`,
  /** Edit product - requires categoryId. Falls back to categories list if not provided. */
  productEdit: (productId: string, categoryId?: string) =>
    categoryId ? `/admin/categories/${categoryId}/products/${productId}/edit` : "/admin/categories",
  orders: "/admin/orders",
  orderDetail: (id: string) => `/admin/orders/${id}`,
  customers: "/admin/customers",
  customerDetail: (id: string) => `/admin/customers/${id}`,
  inventory: "/admin/inventory",
  reviews: "/admin/reviews",
  payments: "/admin/payments",
  settings: "/admin/settings",
  newArrivals: "/admin/new-arrivals",
  sale: "/admin/sale",
} as const;

export const COLORS = {
  primaryDark: "#333333",
  goldAccent: "#C4A747",
  cream: "#F5F3EE",
  sage: "#5BA383",
} as const;

// ---------------------------------------------------------------------------
// Enums (as const objects for type-safe string literals)
// ---------------------------------------------------------------------------

export const ORDER_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
  PARTIALLY_REFUNDED: "PARTIALLY_REFUNDED",
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

/** Pakistani payment methods (mock flow) */
export const PAYMENT_METHOD = {
  EASYPAISA: "EASYPAISA",
  JAZZCASH: "JAZZCASH",
  BANK_TRANSFER: "BANK_TRANSFER",
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const PRODUCT_STATUS = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
  OUT_OF_STOCK: "OUT_OF_STOCK",
} as const;

export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

export const REVIEW_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type ReviewStatus = (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS];

export const USER_ROLE = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

// ---------------------------------------------------------------------------
// Product options
// ---------------------------------------------------------------------------

export const SIZE_OPTIONS = [
  "STANDARD",
] as const;

export type SizeOption = (typeof SIZE_OPTIONS)[number];

export const COLOR_OPTIONS = [
  "White",
  "Black",
  "Navy",
  "Grey",
  "Beige",
  "Cream",
  "Brown",
  "Burgundy",
  "Red",
  "Pink",
  "Sage",
  "Green",
  "Blue",
  "Khaki",
  "Multi",
] as const;

export type ColorOption = (typeof COLOR_OPTIONS)[number];

/** Map color names to hex for swatches (approximate). */
export const COLOR_SWATCH_HEX: Record<string, string> = {
  White: "#ffffff",
  Black: "#000000",
  Navy: "#000080",
  Grey: "#808080",
  Beige: "#f5f5dc",
  Cream: "#fffdd0",
  Brown: "#8b4513",
  Burgundy: "#800020",
  Red: "#dc2626",
  Pink: "#ec4899",
  Sage: "#5BA383",
  Green: "#22c55e",
  Blue: "#3b82f6",
  Khaki: "#c3b091",
  Multi: "linear-gradient(90deg,#ec4899,#3b82f6,#22c55e)",
};

export const MATERIAL_TYPES = [
  "Cotton",
  "Linen",
  "Silk",
  "Wool",
  "Polyester",
  "Viscose",
  "Rayon",
  "Denim",
  "Leather",
  "Cashmere",
  "Blend",
  "Other",
] as const;

export type MaterialType = (typeof MATERIAL_TYPES)[number];
