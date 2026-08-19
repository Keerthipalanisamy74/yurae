import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2, CheckCircle, Image as ImageIcon, Star } from 'lucide-react';
import { Product, Category } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  categories: Category[];
  initialCategorySlug?: string;
  onSuccess: (savedProduct: Product, isNew: boolean) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  categories,
  initialCategorySlug = 'skincare',
  onSuccess,
}) => {
  const { showToast } = useToast();
  const isEditMode = !!productToEdit;

  const [targetCategory, setTargetCategory] = useState<string>(initialCategorySlug);
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(1290);
  const [salePrice, setSalePrice] = useState<number | undefined>(undefined);
  const [stock, setStock] = useState<number>(50);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [desc, setDesc] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [skinType, setSkinType] = useState('All');
  const [subCategory, setSubCategory] = useState('Maxi & Midi Dresses');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableFashionSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  const dressCategories = [
    'Maxi & Midi Dresses',
    'Mini & Cocktail Dresses',
    'Silk Robes & Kimonos',
    'Co-ord Sets & Jumpsuits',
    'Evening & Party Gowns',
    'Summer & Casual Dresses',
    'Tops & Blouses',
    'Skirts & Bottoms',
    'Loungewear & Nightwear',
    'Ethnic & Fusion Wear',
  ];

  const skincareCategories = [
    'Cleansers & Face Wash',
    'Toners & Essences',
    'Serums & Treatments',
    'Moisturizers & Creams',
    'Masks & Exfoliators',
    'Sunscreens & UV Defense',
    'Eye & Lip Care',
  ];

  const accessoryCategories = [
    'Ring',
    'Necklace',
    'Bracelet',
    'Earrings',
  ];

  // Populate form on open or when productToEdit changes
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setPrice(productToEdit.price || 0);
      setSalePrice(productToEdit.sale_price || undefined);
      setStock(productToEdit.stock_quantity || 0);
      setDesc(productToEdit.description || '');
      setShortDesc(productToEdit.short_description || '');
      setIngredients(productToEdit.ingredients || '');
      setSkinType(productToEdit.skin_type || 'All');

      // Category
      const catSlug = productToEdit.category?.slug?.toLowerCase() || 'skincare';
      setTargetCategory(catSlug);

      // Images
      if (productToEdit.images && productToEdit.images.length > 0) {
        setImages(productToEdit.images.map((img) => img.image_url));
      } else {
        setImages([]);
      }

      // Sizes / Variants
      if (productToEdit.variants && productToEdit.variants.length > 0) {
        const sizes = productToEdit.variants
          .filter((v) => v.variant_name?.toLowerCase() === 'size')
          .map((v) => v.variant_value);
        if (sizes.length > 0) {
          setSelectedSizes(sizes);
        }
      }
    } else {
      // Reset to create defaults
      setName('');
      setPrice(1290);
      setSalePrice(undefined);
      setStock(50);
      setImages([]);
      setImageUrlInput('');
      setDesc('');
      setShortDesc('');
      setIngredients('');
      setTargetCategory(initialCategorySlug || 'skincare');
      setSkinType(initialCategorySlug === 'fashion' ? 'Standard Fit' : 'All');
      setSubCategory(initialCategorySlug === 'fashion' ? 'Maxi & Midi Dresses' : skincareCategories[0]);
      setSelectedSizes(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']);
    }
  }, [productToEdit, initialCategorySlug, isOpen]);

  // Handle multiple files selected
  const handleMultipleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const resultStr = reader.result;
          setImages((prev) => [...prev, resultStr]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  // Handle single URL add
  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setImages((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  // Remove an image by index
  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  // Set an image as primary / cover (moves it to index 0)
  const handleSetPrimaryImage = (indexToPrimary: number) => {
    setImages((prev) => {
      const selected = prev[indexToPrimary];
      const rest = prev.filter((_, i) => i !== indexToPrimary);
      return [selected, ...rest];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please provide a product title', 'error');
      return;
    }

    try {
      setIsSubmitting(true);

      const isFashion = targetCategory === 'fashion';
      const isAccessory = targetCategory === 'accessories';

      // Find Category ID
      let cat = categories.find((c) => c.slug.toLowerCase() === targetCategory.toLowerCase());
      let catId = cat?.id;

      if (!catId) {
        const catRes = await api.post('/categories', {
          name: targetCategory.charAt(0).toUpperCase() + targetCategory.slice(1),
          slug: targetCategory.toLowerCase(),
        });
        catId = catRes.data.id;
      }

      // Default fallback image if none provided
      let finalImages = [...images];
      if (finalImages.length === 0) {
        finalImages = [
          isFashion
            ? 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80'
            : isAccessory
            ? 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80'
            : 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80',
        ];
      }

      const variantsPayload = isFashion && selectedSizes.length > 0
        ? selectedSizes.map((size) => ({
            variant_name: 'Size',
            variant_value: size,
            additional_price: 0,
            stock_quantity: Math.max(1, Math.floor(stock / selectedSizes.length)),
          }))
        : [];

      const skinTypeVal = isFashion
        ? (selectedSizes.length > 0 ? `Sizes: ${selectedSizes.join(', ')}` : (skinType || 'Standard Fit'))
        : (skinType || 'All');

      const shortDescVal = shortDesc.trim() || (isFashion ? `${subCategory} • Premium Fashion` : name);
      const descVal = desc.trim() || (isFashion
        ? `${name} - Luxury ${subCategory} crafted with premium fabrics and tailored silhouette by Yurae.`
        : isAccessory
        ? `${name} - Artisanal luxury accessory handcrafted by Yurae.`
        : `${name} - Premium botanical skincare by Yurae Beauty.`
      );

      const payload = {
        category_id: catId,
        name: name.trim(),
        description: descVal,
        short_description: shortDescVal,
        price: Number(price),
        sale_price: salePrice ? Number(salePrice) : undefined,
        stock_quantity: Number(stock),
        brand: 'Yurae Beauty',
        ingredients: ingredients.trim() || undefined,
        skin_type: skinTypeVal,
        status: 'ACTIVE',
        featured: true,
        images: finalImages,
        variants: variantsPayload,
      };

      let resProduct: Product;
      if (isEditMode && productToEdit) {
        const res = await api.put(`/products/${productToEdit.id}`, payload);
        resProduct = res.data;
        showToast(`Product "${name}" updated successfully!`, 'success');
      } else {
        const res = await api.post('/products', payload);
        resProduct = res.data;
        showToast(`Product "${name}" created and added to store!`, 'success');
      }

      onSuccess(resProduct, !isEditMode);
      onClose();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Failed to save product. Please verify inputs.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#F1BCCE] pb-4">
          <div>
            <h3 className="font-serif text-2xl font-bold text-[#111111]">
              {isEditMode ? `Edit Product: ${productToEdit?.name}` : 'Add New Product'}
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {isEditMode
                ? 'Update details, pricing, sizing, and add multiple high-resolution photos.'
                : 'Upload a product with multiple photos, custom sizes, and category options.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-black rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* CATEGORY SELECTOR TABS */}
          <div>
            <label className="font-bold text-[#111111] block mb-1.5 uppercase tracking-wider text-[11px]">
              Store Department *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetCategory('skincare')}
                className={`py-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                  targetCategory === 'skincare'
                    ? 'bg-[#D84B7E] text-[#FDF4F7] border-[#D84B7E] shadow-sm'
                    : 'bg-[#FDF4F7] text-gray-700 border-[#F1BCCE] hover:border-[#D84B7E]'
                }`}
              >
                🌸 Skincare
              </button>
              <button
                type="button"
                onClick={() => setTargetCategory('fashion')}
                className={`py-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                  targetCategory === 'fashion'
                    ? 'bg-[#D84B7E] text-[#FDF4F7] border-[#D84B7E] shadow-sm'
                    : 'bg-[#FDF4F7] text-gray-700 border-[#F1BCCE] hover:border-[#D84B7E]'
                }`}
              >
                👗 Fashion & Dresses
              </button>
              <button
                type="button"
                onClick={() => setTargetCategory('accessories')}
                className={`py-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                  targetCategory === 'accessories'
                    ? 'bg-[#D84B7E] text-[#FDF4F7] border-[#D84B7E] shadow-sm'
                    : 'bg-[#FDF4F7] text-gray-700 border-[#F1BCCE] hover:border-[#D84B7E]'
                }`}
              >
                💍 Accessories
              </button>
            </div>
          </div>

          {/* NAME & SUBCATEGORY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-[#111111] block mb-1">
                {targetCategory === 'fashion' ? 'Garment / Dress Title *' : 'Product Name *'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={targetCategory === 'fashion' ? 'e.g. Mulberry Silk Slip Dress' : 'e.g. Ginseng Renewal Serum'}
                required
                className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111]"
              />
            </div>

            <div>
              <label className="font-bold text-[#111111] block mb-1">
                {targetCategory === 'fashion'
                  ? 'Dress & Apparel Subcategory *'
                  : targetCategory === 'accessories'
                  ? 'Accessory Category *'
                  : 'Skincare Subcategory *'}
              </label>
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] font-bold text-[#111111] cursor-pointer"
              >
                {targetCategory === 'fashion' &&
                  dressCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                {targetCategory === 'accessories' &&
                  accessoryCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                {targetCategory === 'skincare' &&
                  skincareCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* PRICING & STOCK */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="font-bold text-[#111111] block mb-1">Regular Price (₹) *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                required
                className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111]"
              />
            </div>

            <div>
              <label className="font-bold text-[#111111] block mb-1">Sale Price (₹)</label>
              <input
                type="number"
                value={salePrice || ''}
                onChange={(e) => setSalePrice(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Optional"
                className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111]"
              />
            </div>

            <div>
              <label className="font-bold text-[#111111] block mb-1">Stock Units *</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                required
                className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111]"
              />
            </div>
          </div>

          {/* MULTI-IMAGE UPLOAD SECTION */}
          <div className="p-4 bg-[#FCE7F0]/60 border border-[#F1BCCE] rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-bold text-[#111111] text-xs flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#D84B7E]" />
                <span>Product Pictures ({images.length} added)</span>
              </label>
              <span className="text-[10px] text-gray-500">Add front, back, detail, and model shots</span>
            </div>

            {/* Gallery of Uploaded Images */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-1">
                {images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border-2 border-[#F1BCCE] aspect-3/4 bg-white shadow-xs"
                  >
                    <img src={imgUrl} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />

                    {/* Primary Badge */}
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-[#D84B7E] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-white" /> Cover
                      </span>
                    )}

                    {/* Action buttons overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className="px-2 py-1 bg-white text-[#111111] hover:bg-[#D84B7E] hover:text-white rounded-md text-[10px] font-bold shadow-md transition-colors cursor-pointer"
                        >
                          Set Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="px-2 py-1 bg-red-600 text-white hover:bg-red-700 rounded-md text-[10px] font-bold shadow-md transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-2.5 h-2.5" /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* File Input & URL Input */}
            <div className="space-y-2 pt-2 border-t border-[#F1BCCE]/60">
              <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                <label className="flex-1 px-4 py-2.5 bg-[#D84B7E] text-white hover:bg-[#111111] rounded-xl font-bold text-center cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm">
                  <Upload className="w-4 h-4" />
                  Upload Multiple Photos from Device
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleMultipleFiles}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                  placeholder="Or paste an image web link (URL)..."
                  className="flex-1 p-2.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111] text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-4 py-2.5 bg-[#111111] text-white hover:bg-[#D84B7E] rounded-xl font-bold transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          </div>

          {/* FASHION SIZE SELECTOR */}
          {targetCategory === 'fashion' && (
            <div className="p-4 bg-[#F8D7E3]/80 border border-[#F1BCCE] rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <label className="font-bold text-[#111111] text-xs flex items-center gap-2">
                  <span>Available Sizes</span>
                  <span className="px-2 py-0.5 bg-[#D84B7E] text-white text-[10px] rounded-full">
                    {selectedSizes.length} selected
                  </span>
                </label>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedSizes([...availableFashionSizes])}
                    className="text-[#D84B7E] font-bold hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSizes([])}
                    className="text-gray-500 font-bold hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {availableFashionSizes.map((size) => {
                  const isSelected = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedSizes(selectedSizes.filter((s) => s !== size));
                        } else {
                          setSelectedSizes([...selectedSizes, size]);
                        }
                      }}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#D84B7E] text-[#FDF4F7] border-[#D84B7E] shadow-sm scale-105'
                          : 'bg-[#FDF4F7] text-gray-700 border-[#F1BCCE] hover:border-[#D84B7E]'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* MATERIAL / FABRIC / INGREDIENTS */}
          <div>
            <label className="font-bold text-[#111111] block mb-1">
              {targetCategory === 'fashion'
                ? 'Fabric & Material Composition'
                : targetCategory === 'accessories'
                ? 'Material Details & Finish'
                : 'Key Botanical Ingredients'}
            </label>
            <input
              type="text"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder={
                targetCategory === 'fashion'
                  ? 'e.g. 100% Organic Mulberry Silk, Pure Cotton, French Linen'
                  : targetCategory === 'accessories'
                  ? 'e.g. 18k Gold Plated Sterling Silver, Natural Freshwater Pearl'
                  : 'Centella Asiatica, Niacinamide, Rice Ferment Filtrate...'
              }
              className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111]"
            />
          </div>

          {/* SHORT DESCRIPTION */}
          <div>
            <label className="font-bold text-[#111111] block mb-1">Short Highlight (Optional)</label>
            <input
              type="text"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="Brief 1-line product highlight..."
              className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111]"
            />
          </div>

          {/* FULL DESCRIPTION */}
          <div>
            <label className="font-bold text-[#111111] block mb-1">Full Description (Optional)</label>
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder={
                targetCategory === 'fashion'
                  ? 'Detailed garment story, styling advice, and fit information...'
                  : targetCategory === 'accessories'
                  ? 'Detailed accessory story, craftsmanship, and styling notes...'
                  : 'Detailed product story, botanical benefits, and ritual guide...'
              }
              className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111]"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-[#D84B7E] text-[#FDF4F7] border border-[#D84B7E] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4 text-[#FDF4F7]" />
            {isSubmitting
              ? 'Saving Changes...'
              : isEditMode
              ? 'Save & Update Product'
              : 'Publish & Add Product to Store'}
          </button>
        </form>
      </div>
    </div>
  );
};
