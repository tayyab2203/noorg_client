"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useProductById, updateProduct, deleteProduct, uploadProductImage, getProductsErrorMessage } from "@/lib/api/products";
import { useAdminCollection, useUpdateAdminCollection } from "@/lib/api/admin";
import { useQueryClient } from "react-query";
import { productsKeys } from "@/lib/api/products";
import { ADMIN_ROUTES, COLORS, PRODUCT_STATUS, type ProductStatus } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductImage, ProductVariant } from "@/types";

const defaultVariant: ProductVariant = { size: "M", color: "Black", stock: 0, variantSKU: "" };
const defaultImage: ProductImage = { url: "", altText: "", order: 0 };

export default function AdminCategoryProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = typeof params.id === "string" ? params.id : "";
  const productId = typeof params.productId === "string" ? params.productId : "";
  const queryClient = useQueryClient();
  const { data: category, isLoading: categoryLoading } = useAdminCollection(categoryId);
  const { data: product, isLoading: productLoading } = useProductById(productId);
  const updateCategoryMutation = useUpdateAdminCollection(categoryId);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [material, setMaterial] = useState("");
  const [SKU, setSKU] = useState("");
  const [status, setStatus] = useState<ProductStatus>(PRODUCT_STATUS.ACTIVE);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [images, setImages] = useState<ProductImage[]>([{ ...defaultImage }]);
  const [variants, setVariants] = useState<ProductVariant[]>([{ ...defaultVariant, variantSKU: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!product || initialized) return;
    setName(product.name ?? "");
    setSlug(product.slug ?? "");
    setDescription(product.description ?? "");
    setPrice(product.price != null ? String(product.price) : "");
    setSalePrice(product.salePrice != null ? String(product.salePrice) : "");
    setMaterial(product.material ?? "");
    setSKU(product.SKU ?? "");
    setStatus(product.status ?? PRODUCT_STATUS.ACTIVE);
    setIsNewArrival(product.isNewArrival ?? false);
    setImages(product.images?.length ? product.images : [{ ...defaultImage }]);
    setVariants(product.variants?.length ? product.variants : [{ ...defaultVariant, variantSKU: "" }]);
    setInitialized(true);
  }, [product, initialized]);

  const addVariant = () => setVariants((v) => [...v, { ...defaultVariant, variantSKU: "" }]);
  const removeVariant = (i: number) => {
    if (variants.length <= 1) return;
    setVariants((v) => v.filter((_, j) => j !== i));
  };
  const updateVariant = (i: number, field: keyof ProductVariant, value: string | number) => {
    setVariants((v) => v.map((x, j) => (j === i ? { ...x, [field]: value } : x)));
  };

  const addImage = () => setImages((im) => [...im, { ...defaultImage }]);
  const removeImage = (i: number) => {
    if (images.length <= 1) return;
    setImages((im) => im.filter((_, j) => j !== i));
  };
  const updateImage = (i: number, field: keyof ProductImage, value: string | number) => {
    setImages((im) => im.map((x, j) => (j === i ? { ...x, [field]: value } : x)));
  };
  const onFileSelect = async (i: number, file: File) => {
    setUploading(true);
    setError(null);
    try {
      const { url } = await uploadProductImage(file);
      updateImage(i, "url", url);
    } catch (e) {
      setError(getProductsErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const priceNum = parseFloat(price);
    const salePriceNum = salePrice === "" ? undefined : parseFloat(salePrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setError("Invalid price");
      return;
    }
    const variantsValid = variants.filter((v) => v.variantSKU.trim());
    if (variantsValid.length === 0) {
      setError("At least one variant with SKU required");
      return;
    }
    const imagesValid = images.filter((im) => im.url.trim());
    setIsSubmitting(true);
    
    const updatePayload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim(),
      price: priceNum,
      salePrice: salePriceNum ?? null,
      material: material.trim(),
      SKU: SKU.trim(),
      status,
      categoryId: categoryId,
      images: imagesValid.length ? imagesValid : [{ url: "/placeholder.svg", altText: "", order: 0 }],
      variants: variantsValid,
      isNewArrival: Boolean(isNewArrival), // Explicitly convert to boolean
    };
    
    try {
      await updateProduct(productId, updatePayload);
      queryClient.invalidateQueries(productsKeys.all);
      queryClient.invalidateQueries(productsKeys.id(productId));
      // Invalidate new arrivals cache
      queryClient.invalidateQueries({ queryKey: ["new-arrivals"] });
      router.push(ADMIN_ROUTES.categoryDetail(categoryId));
    } catch (e) {
      setError(getProductsErrorMessage(e) ?? "Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this product?")) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteProduct(productId);
      // Remove product from category's productIds
      if (category?.productIds) {
        await updateCategoryMutation.mutateAsync({
          productIds: category.productIds.filter((pid) => pid !== productId),
        });
      }
      queryClient.invalidateQueries(productsKeys.all);
      router.push(ADMIN_ROUTES.categoryDetail(categoryId));
    } catch (e) {
      setError(getProductsErrorMessage(e) ?? "Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  if (categoryLoading || productLoading || !categoryId || !productId) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-[#eee] bg-white p-12 text-center text-[#333333]/70">
          Loading...
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="space-y-6">
        <Link
          href={ADMIN_ROUTES.categories}
          className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
          style={{ color: COLORS.goldAccent }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to categories
        </Link>
        <div className="rounded-xl border border-[#eee] bg-white p-12 text-center text-[#333333]/70">
          Category not found
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <Link
          href={ADMIN_ROUTES.categoryDetail(categoryId)}
          className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
          style={{ color: COLORS.goldAccent }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {category.name}
        </Link>
        <div className="rounded-xl border border-[#eee] bg-white p-12 text-center text-[#333333]/70">
          Product not found
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={ADMIN_ROUTES.categoryDetail(categoryId)}
        className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
        style={{ color: COLORS.goldAccent }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {category.name}
      </Link>
      <h1 className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>
        Edit product
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-[#eee] bg-white p-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: COLORS.primaryDark }}>Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" className="border-[#ddd]" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: COLORS.primaryDark }}>Slug</label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="product-slug" className="border-[#ddd]" />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: COLORS.primaryDark }}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="min-h-[100px] w-full rounded-lg border border-[#ddd] px-3 py-2 text-sm" rows={3} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: COLORS.primaryDark }}>Price *</label>
            <Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required className="border-[#ddd]" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: COLORS.primaryDark }}>Sale price</label>
            <Input type="number" step="0.01" min="0" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="border-[#ddd]" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: COLORS.primaryDark }}>SKU *</label>
            <Input value={SKU} onChange={(e) => setSKU(e.target.value)} placeholder="SKU-001" className="border-[#ddd]" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: COLORS.primaryDark }}>Material</label>
            <Input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Cotton" className="border-[#ddd]" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: COLORS.primaryDark }}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as keyof typeof PRODUCT_STATUS)} className="h-10 w-full rounded-lg border border-[#ddd] px-3 py-2 text-sm">
              {Object.values(PRODUCT_STATUS).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isNewArrival"
            checked={isNewArrival}
            onChange={(e) => setIsNewArrival(e.target.checked)}
            className="h-4 w-4 rounded border-[#ddd] text-[#C4A747] focus:ring-[#C4A747]"
          />
          <label htmlFor="isNewArrival" className="text-sm font-medium" style={{ color: COLORS.primaryDark }}>
            Mark as New Arrival
          </label>
          <span className="text-xs text-[#333333]/60">(Will appear on New Arrivals page - product must be ACTIVE status)</span>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium" style={{ color: COLORS.primaryDark }}>Images</label>
            <Button type="button" variant="outline" size="sm" onClick={addImage} className="border-[#ddd]"><Plus className="mr-1 h-4 w-4" /> Add</Button>
          </div>
          <div className="space-y-2">
            {images.map((im, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-[#eee] p-2">
                <Input placeholder="URL or upload" value={im.url} onChange={(e) => updateImage(i, "url", e.target.value)} className="flex-1 min-w-[200px] border-[#ddd]" />
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" className="text-sm" onChange={(e) => e.target.files?.[0] && onFileSelect(i, e.target.files[0])} disabled={uploading} />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeImage(i)} disabled={images.length <= 1}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium" style={{ color: COLORS.primaryDark }}>Variants *</label>
            <Button type="button" variant="outline" size="sm" onClick={addVariant} className="border-[#ddd]"><Plus className="mr-1 h-4 w-4" /> Add variant</Button>
          </div>
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-[#eee] p-2">
                <Input placeholder="Size" value={v.size} onChange={(e) => updateVariant(i, "size", e.target.value)} className="w-20 border-[#ddd]" />
                <Input placeholder="Color" value={v.color} onChange={(e) => updateVariant(i, "color", e.target.value)} className="w-24 border-[#ddd]" />
                <Input type="number" min="0" placeholder="Stock" value={v.stock} onChange={(e) => updateVariant(i, "stock", parseInt(e.target.value, 10) || 0)} className="w-20 border-[#ddd]" />
                <Input placeholder="Variant SKU" value={v.variantSKU} onChange={(e) => updateVariant(i, "variantSKU", e.target.value)} className="flex-1 min-w-[120px] border-[#ddd]" />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(i)} disabled={variants.length <= 1}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <Button type="submit" disabled={isSubmitting || uploading} style={{ backgroundColor: COLORS.goldAccent, color: COLORS.primaryDark }}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={ADMIN_ROUTES.categoryDetail(categoryId)}>Cancel</Link>
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting} className="ml-auto">
            {isDeleting ? "Deleting…" : "Delete product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
