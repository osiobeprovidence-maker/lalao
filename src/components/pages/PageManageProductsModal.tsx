import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  ShoppingBag,
  Trash2,
  Image as ImageIcon,
  Check,
  Tag,
  DollarSign,
} from 'lucide-react';
import { Page, ShopProduct } from '../../types';
import { useLalao } from '../../context/LalaoContext';
import { uploadImageToCloudinary } from '../../lib/cloudinary';

interface PageManageProductsModalProps {
  page: Page;
  isOpen: boolean;
  onClose: () => void;
}

// Presets removed

export const PageManageProductsModal: React.FC<PageManageProductsModalProps> = ({
  page,
  isOpen,
  onClose,
}) => {
  const { addPageProduct, deletePageProduct, generateCloudinarySignature, triggerShareToast, pageProducts } = useLalao();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(8500);
  const [category, setCategory] = useState('Merchandise');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsUploading(true);
      let finalImageUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';

      if (imageFile) {
        const signatureData = await generateCloudinarySignature("products");
        finalImageUrl = await uploadImageToCloudinary(imageFile, signatureData);
      }

      await addPageProduct(page.id, {
        name: name.trim(),
        price: Number(price) || 0,
        currency: 'NGN',
        category: category.trim(),
        description: description.trim(),
        image: finalImageUrl,
        inStock: true,
      });

      setName('');
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
      setIsAddingNew(false);
    } catch (err: any) {
      console.error("Failed to add product:", err);
      triggerShareToast("Failed to upload product image");
    } finally {
      setIsUploading(false);
    }
  };

  const products = pageProducts || [];

  return (
    <div className="absolute inset-0 z-50 bg-white overflow-y-auto flex flex-col animate-in fade-in slide-in-from-right-4 duration-250">
      {/* Top Sticky Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 sm:px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 text-neutral-800 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-base font-black text-neutral-950">Storefront & Products</h3>
            <p className="text-xs text-neutral-500 font-medium truncate max-w-[180px] sm:max-w-md">
              @{page.username} · Manage catalog, items & pricing
            </p>
          </div>
        </div>

        {!isAddingNew ? (
          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className="px-4 py-2 rounded-xl bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Item</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingNew(false)}
            className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            View Catalog
          </button>
        )}
      </div>

      {/* Page Content Container */}
      <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 pb-24 flex-1">
        {!isAddingNew ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-500">
                Products in Catalog ({products.length})
              </span>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3.5 rounded-3xl bg-neutral-50 border border-neutral-200/80 flex items-center gap-3 relative group hover:border-[#5E43F3]/30 transition-all"
                  >
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-16 h-16 rounded-2xl object-cover bg-white ring-1 ring-neutral-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0 pr-8">
                      <p className="text-xs font-bold text-neutral-900 truncate">
                        {prod.name}
                      </p>
                      <p className="text-sm font-black text-[#5E43F3] mt-0.5">
                        ₦{prod.price.toLocaleString()}
                      </p>
                      <span className="text-[11px] text-neutral-400 font-medium">
                        {prod.category}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => deletePageProduct(page.id, prod.id)}
                      className="absolute top-3 right-3 p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Remove product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center rounded-3xl border-2 border-dashed border-neutral-200 p-8">
                <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-neutral-800">No products in storefront yet</p>
                <p className="text-xs text-neutral-500 mt-1 mb-4 max-w-sm mx-auto">
                  Add merchandise, apparel, hardware or goods for your visitors to purchase directly from {page.name}.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(true)}
                  className="px-5 py-2.5 rounded-2xl bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] cursor-pointer inline-flex items-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Create First Product</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleAddProduct} className="space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <span className="text-sm font-black text-neutral-900">
                New Product Details
              </span>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-xs text-neutral-500 hover:text-neutral-900 font-bold cursor-pointer"
              >
                Back to Catalog
              </button>
            </div>

            {/* Product Image */}
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-2">
                Product Image
              </label>
              <div className="flex items-center gap-4">
                <div 
                  className="w-20 h-20 rounded-2xl bg-neutral-100 ring-1 ring-neutral-200 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer relative group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </>
                  ) : (
                    <ImageIcon className="w-6 h-6 text-neutral-400" />
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Upload Image</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  <p className="text-[10px] text-neutral-400 mt-2">
                    Recommended: Square aspect ratio, minimum 800x800px.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Product Title *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Official Creator Lab Heavyweight Hoodie"
                className="w-full px-4 py-3 rounded-2xl border border-neutral-200 text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Price (NGN) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-xs font-bold text-neutral-400">₦</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    required
                    step="500"
                    className="w-full pl-8 pr-4 py-3 rounded-2xl border border-neutral-200 text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Merchandise / Tech / Gear"
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Product Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Materials, sizing specs, delivery notes..."
                className="w-full px-4 py-3 rounded-2xl border border-neutral-200 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-6 py-2.5 rounded-xl bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Add to Store</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
