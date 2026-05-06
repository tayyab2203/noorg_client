import { z } from "zod";
import { PAYMENT_METHOD, PRODUCT_STATUS, REVIEW_STATUS } from "@/lib/constants";

export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(2, "Subject must be at least 2 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const checkoutFormSchema = z.object({
  email: z.string().email("Invalid email"),
  fullName: z.string().min(2, "Full name is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  zip: z.string().min(3, "ZIP code is required"),
  country: z.string().min(2, "Country is required"),
});

export const shippingAddressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(8, "Valid phone number is required"),
  street: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(1, "State / Province is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
});

/** Payment method selection (mock Pakistani methods) */
export const paymentMethodSchema = z.object({
  paymentMethod: z.enum([
    PAYMENT_METHOD.EASYPAISA,
    PAYMENT_METHOD.JAZZCASH,
    PAYMENT_METHOD.BANK_TRANSFER,
  ]),
});
export type PaymentMethodValues = z.infer<typeof paymentMethodSchema>;

/** Cart item for add/merge */
export const cartItemSchema = z.object({
  productId: z.string().min(1, "Product ID required"),
  variantSKU: z.string().min(1, "Variant SKU required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});
export const cartAddBodySchema = cartItemSchema;
export const cartMergeBodySchema = z.object({
  items: z.array(cartItemSchema),
});

/** Product image for create/update */
export const productImageSchema = z.object({
  url: z.string().url(),
  altText: z.string().default(""),
  order: z.number().int().min(0).default(0),
});
/** Product variant for create/update */
export const productVariantSchema = z.object({
  size: z.enum(["STANDARD"]),
  color: z.string().min(1),
  stock: z.number().int().min(0),
  variantSKU: z.string().min(1),
});
/** Product create body */
export const productCreateSchema = z.object({
  name: z.string().min(1, "Name required"),
  slug: z.string().optional(),
  description: z.string().default(""),
  price: z.number().min(0),
  salePrice: z.number().min(0).nullable().optional(),
  material: z.string().default(""),
  rating: z.number().min(0).max(5).default(0),
  SKU: z.string().min(1, "SKU required"),
  status: z.enum(Object.values(PRODUCT_STATUS) as [string, ...string[]]).default(PRODUCT_STATUS.ACTIVE),
  categoryId: z.string().default(""),
  images: z.array(productImageSchema).default([]),
  variants: z.array(productVariantSchema).min(1, "At least one variant required"),
  isNewArrival: z.boolean().default(false),
});
/** Product update body (partial) */
export const productUpdateSchema = productCreateSchema.partial();

/** Collection create/update body */
export const collectionCreateSchema = z.object({
  name: z.string().min(1, "Name required"),
  slug: z.string().optional(),
  description: z.string().default(""),
  image: z.string().default(""),
  displayOrder: z.number().int().min(0).default(0),
  productIds: z.array(z.string().min(1)).default([]),
});
export const collectionUpdateSchema = collectionCreateSchema.partial();

/** Review create body */
export const reviewCreateSchema = z.object({
  productId: z.string().min(1, "Product ID required"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: z.string().trim().min(3, "Comment is too short").max(2000, "Comment is too long"),
});

/** Review admin moderation body */
export const reviewUpdateSchema = z.object({
  status: z.enum(Object.values(REVIEW_STATUS) as [string, ...string[]]),
}).partial();

/** Order create body (items without unitPrice; server computes from Product) */
export const orderCreateSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      variantSKU: z.string().min(1),
      quantity: z.number().int().min(1),
    })
  ),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum([
    PAYMENT_METHOD.EASYPAISA,
    PAYMENT_METHOD.JAZZCASH,
    PAYMENT_METHOD.BANK_TRANSFER,
  ]),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
export type ShippingAddressValues = z.infer<typeof shippingAddressSchema>;