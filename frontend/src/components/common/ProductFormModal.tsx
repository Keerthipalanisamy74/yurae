import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2, CheckCircle, Image as ImageIcon, Star } from 'lucide-react';
import { Product, Category } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

// Helper to compress client-side images before uploading
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Use high-quality JPEG for crisp luxury skincare product presentation
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(readerEvent.target?.result as string);
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  categories: Category[];
  initialCategorySlug?: string;
  allowCategorySelection?: boolean;
  onSuccess: (savedProduct: Product, isNew: boolean) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  categories: initialCategories = [],
  initialCategorySlug = 'skincare',
  allowCategorySelection = true,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const isEditMode = !!productToEdit;

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [targetCategory, setTargetCategory] = useState<string>(initialCategorySlug);
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [salePrice, setSalePrice] = useState<number | string>('');
  const [stock, setStock] = useState<number | string>(50);
  const [weight, setWeight] = useState<string>('50g');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [desc, setDesc] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [skinType, setSkinType] = useState('All');
  const [subCategory, setSubCategory] = useState('Maxi & Midi Dresses');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']);
  const [selectedSkincareSizes, setSelectedSkincareSizes] = useState<string[]>(['50g', '100g']);
  const [customSkincareSizeInput, setCustomSkincareSizeInput] = useState<string>('');
  const [sizeStocks, setSizeStocks] = useState<Record<string, number | string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);

  // Sync / fetch categories if empty
  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
    } else if (isOpen) {
      api.get('/categories')
        .then((res) => setCategories(res.data))
        .catch((err) => console.warn('Could not load categories:', err));
    }
  }, [initialCategories, isOpen]);

  const availableFashionSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const availableSkincareSizes = ['30g', '50g', '75g', '100g', '150g', '200g', '250g', '500g', '30ml', '50ml', '100ml', '150ml', '200ml'];

  const dressCategories = [
    'T-Shirts & Tops',
    'Shirts & Blouses',
    'Kurtis & Ethnic Wear',
    'Maxi & Midi Dresses',
    'Mini & Cocktail Dresses',
    'Skirts & Bottoms',
    'Pants & Trousers',
    'Silk Robes & Kimonos',
    'Co-ord Sets & Jumpsuits',
    'Evening & Party Gowns',
    'Loungewear & Nightwear',
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
    'Rings',
    'Necklaces & Pendants',
    'Bracelets & Bangles',
    'Earrings & Studs',
    'Anklets',
    'Hair Accessories & Scrunchies',
    'Handbags & Pouches',
  ];

  // Populate form on open or when productToEdit changes
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setPrice(productToEdit.price !== undefined && productToEdit.price !== null ? productToEdit.price : '');
      setSalePrice(productToEdit.sale_price !== undefined && productToEdit.sale_price !== null ? productToEdit.sale_price : '');
      setStock(productToEdit.stock_quantity !== undefined && productToEdit.stock_quantity !== null ? productToEdit.stock_quantity : '');
      setWeight(productToEdit.weight || '');
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

      // Sizes & Per-Size Stocks
      if (productToEdit.variants && productToEdit.variants.length > 0) {
        const stockMap: Record<string, number | string> = {};
        const sizes = productToEdit.variants
          .filter((v) => v.variant_name?.toLowerCase() === 'size')
          .map((v) => {
            stockMap[v.variant_value] = v.stock_quantity !== undefined ? v.stock_quantity : '';
            return v.variant_value;
          });
        setSizeStocks(stockMap);
        if (sizes.length > 0) {
          if (catSlug === 'skincare') {
            setSelectedSkincareSizes(sizes);
          } else {
            setSelectedSizes(sizes);
          }
        }
      } else if (productToEdit.weight) {
        const splitWeights = productToEdit.weight.split(',').map((s) => s.trim()).filter(Boolean);
        if (splitWeights.length > 0) {
          setSelectedSkincareSizes(splitWeights);
          const stockMap: Record<string, number | string> = {};
          splitWeights.forEach((w) => {
            stockMap[w] = Math.max(1, Math.floor(Number(productToEdit.stock_quantity || 50) / splitWeights.length));
          });
          setSizeStocks(stockMap);
        }
      }
    } else {
      // Reset to create defaults
      setName('');
      setPrice('');
      setSalePrice('');
      setStock(50);
      setWeight(initialCategorySlug === 'skincare' ? '50g' : '');
      setImages([]);
      setImageUrlInput('');
      setDesc('');
      setShortDesc('');
      setIngredients('');
      setTargetCategory(initialCategorySlug || 'skincare');
      setSkinType(initialCategorySlug === 'fashion' ? 'Standard Fit' : 'All');
      setSubCategory(initialCategorySlug === 'fashion' ? 'Maxi & Midi Dresses' : skincareCategories[0]);
      setSelectedSizes(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']);
      setSelectedSkincareSizes(['50g', '100g']);
      setCustomSkincareSizeInput('');

      // Default per-size stock units
      const defaultStocks: Record<string, number | string> = {
        XS: 10,
        S: 15,
        M: 20,
        L: 20,
        XL: 15,
        XXL: 10,
        XXXL: 10,
        '50g': 25,
        '100g': 25,
      };
      setSizeStocks(defaultStocks);
    }
  }, [productToEdit, initialCategorySlug, isOpen]);

  // Handler to update stock for a single size and recalculate total stock
  const handleSizeStockChange = (size: string, val: string | number) => {
    const updated = { ...sizeStocks, [size]: val };
    setSizeStocks(updated);

    const activeSizes = targetCategory === 'fashion' ? selectedSizes : selectedSkincareSizes;
    const total = activeSizes.reduce((acc, s) => {
      const q = Number(s === size ? val : updated[s]);
      return acc + (isNaN(q) ? 0 : Math.max(0, q));
    }, 0);
    setStock(total);
  };

  // Handle multiple files selected with instant compression
  const handleMultipleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsProcessingPhotos(true);
      const compressedList = await Promise.all(
        Array.from(files).map((f) => compressImageFile(f))
      );
      const validImages = compressedList.filter((img) => img && img.trim().length > 0);
      setImages((prev) => [...prev, ...validImages]);
    } catch (err) {
      console.error('Error processing photos:', err);
      showToast('Could not load some photos. Please try again.', 'error');
    } finally {
      setIsProcessingPhotos(false);
      e.target.value = '';
    }
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

      // 1. Resolve Category ID Safely
      let cat = categories.find((c) => c.slug.toLowerCase() === targetCategory.toLowerCase());
      let catId = cat?.id;

      if (!catId) {
        try {
          const catRes = await api.get('/categories');
          const latestCats = catRes.data as Category[];
          setCategories(latestCats);
          const foundCat = latestCats.find((c) => c.slug.toLowerCase() === targetCategory.toLowerCase());
          if (foundCat) {
            catId = foundCat.id;
          } else {
            const createRes = await api.post('/categories', {
              name: targetCategory.charAt(0).toUpperCase() + targetCategory.slice(1),
              slug: targetCategory.toLowerCase(),
            });
            catId = createRes.data.id;
          }
        } catch (catErr) {
          console.warn('Category resolution warning:', catErr);
          catId = categories[0]?.id || 1;
        }
      }

      const numPrice = Number(price);
      if (!price || isNaN(numPrice) || numPrice <= 0) {
        showToast('Please enter a valid regular price', 'error');
        setIsSubmitting(false);
        return;
      }

      const numStock = stock === '' ? 0 : Math.max(0, Number(stock));
      const numSalePrice = salePrice !== '' && salePrice !== undefined && !isNaN(Number(salePrice)) ? Number(salePrice) : undefined;

      const isFashion = targetCategory === 'fashion';
      const isAccessory = targetCategory === 'accessories';
      const isSkincare = targetCategory === 'skincare';

      const variantsPayload = isFashion && selectedSizes.length > 0
        ? selectedSizes.map((size) => {
            const rawStock = sizeStocks[size];
            const qty = rawStock !== undefined && rawStock !== '' && !isNaN(Number(rawStock))
              ? Math.max(0, Number(rawStock))
              : Math.max(0, Math.floor(numStock / (selectedSizes.length || 1)));
            return {
              variant_name: 'Size',
              variant_value: size,
              additional_price: 0,
              stock_quantity: qty,
            };
          })
        : isSkincare && selectedSkincareSizes.length > 0
        ? selectedSkincareSizes.map((size) => {
            const rawStock = sizeStocks[size];
            const qty = rawStock !== undefined && rawStock !== '' && !isNaN(Number(rawStock))
              ? Math.max(0, Number(rawStock))
              : Math.max(0, Math.floor(numStock / (selectedSkincareSizes.length || 1)));
            return {
              variant_name: 'Size',
              variant_value: size,
              additional_price: 0,
              stock_quantity: qty,
            };
          })
        : [];

      const totalCalculatedStock = variantsPayload.length > 0
        ? variantsPayload.reduce((sum, v) => sum + v.stock_quantity, 0)
        : numStock;

      const skinTypeVal = isFashion
        ? (selectedSizes.length > 0 ? `Sizes: ${selectedSizes.join(', ')}` : (skinType || 'Standard Fit'))
        : isSkincare
        ? (selectedSkincareSizes.length > 0 ? `Sizes: ${selectedSkincareSizes.join(', ')}` : (skinType || 'All'))
        : (skinType || 'All');

      const shortDescVal = shortDesc.trim() || (isFashion ? `${subCategory} • Premium Fashion` : name);
      const descVal = desc.trim() || (isFashion
        ? `${name} - Luxury ${subCategory} crafted with premium fabrics and tailored silhouette by Yurae.`
        : isAccessory
        ? `${name} - Artisanal luxury accessory handcrafted by Yurae.`
        : `${name} - Premium botanical skincare by Yurae Beauty.`
      );

      const effectiveWeight = isSkincare && selectedSkincareSizes.length > 0
        ? selectedSkincareSizes.join(', ')
        : (weight.trim() || undefined);

      let formattedWeight = effectiveWeight;
      if (formattedWeight && /^\d+(\.\d+)?$/.test(formattedWeight)) {
        formattedWeight = `${formattedWeight}g`;
      }

      const numWeightKg = formattedWeight
        ? (parseFloat(formattedWeight.replace(/[^\d.]/g, '')) / 1000 || 0.35)
        : 0.35;

      const payload = {
        category_id: catId,
        name: name.trim(),
        description: descVal,
        short_description: shortDescVal,
        price: numPrice,
        sale_price: numSalePrice,
        stock_quantity: totalCalculatedStock,
        weight: formattedWeight || undefined,
        weight_kg: numWeightKg,
        brand: 'Yurae Beauty',
        ingredients: ingredients.trim() || undefined,
        skin_type: skinTypeVal,
        status: 'ACTIVE',
        featured: true,
        images: images,
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
      console.error('Product save error:', err);
      let errorMsg = 'Failed to save product. Please verify inputs.';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          errorMsg = detail;
        } else if (Array.isArray(detail)) {
          errorMsg = detail.map((d: any) => `${d.loc?.slice(-1)[0] || 'Field'}: ${d.msg}`).join(', ');
        } else if (typeof detail === 'object') {
          errorMsg = JSON.stringify(detail);
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl max-w-2xl w-full p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-2xl my-4 sm:my-8 max-h-[92vh] overflow-y-auto touch-scroll">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#F1BCCE] pb-3 sm:pb-4">
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#111111]">
              {isEditMode ? `Edit: ${productToEdit?.name}` : 'Add New Product'}
            </h3>
            <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5">
              {isEditMode
                ? 'Update details, pricing, sizing, and add multiple high-resolution photos.'
                : 'Upload a product with multiple photos, custom sizes, and category options.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-black rounded-full hover:bg-gray-100 transition-colors cursor-pointer touch-target min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 text-xs">
          {/* STORE DEPARTMENT SELECTION (New Products Only) OR LOCKED INDICATOR (Edit Mode) */}
          {!isEditMode && allowCategorySelection ? (
            <div>
              <label className="font-bold text-[#111111] block mb-1.5 uppercase tracking-wider text-[11px]">
                Choose Store Department *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTargetCategory('skincare');
                    setSubCategory(skincareCategories[0]);
                    setSkinType('All');
                  }}
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
                  onClick={() => {
                    setTargetCategory('fashion');
                    setSubCategory(dressCategories[0]);
                    setSkinType('Standard Fit');
                  }}
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
                  onClick={() => {
                    setTargetCategory('accessories');
                    setSubCategory(accessoryCategories[0]);
                    setSkinType('All');
                  }}
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
          ) : (
            <div className="flex items-center gap-3 p-3.5 bg-[#FCE7F0] border border-[#F1BCCE] rounded-2xl">
              <div className="w-9 h-9 rounded-xl bg-[#D84B7E] text-white flex items-center justify-center font-bold text-base shadow-xs">
                {targetCategory === 'fashion' ? '👗' : targetCategory === 'accessories' ? '💍' : '🌸'}
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
                  Store Department
                </span>
                <span className="text-sm font-bold text-[#111111]">
                  {targetCategory === 'fashion'
                    ? 'Luxury Fashion & Apparel'
                    : targetCategory === 'accessories'
                    ? 'Fine Jewelry & Accessories'
                    : 'Botanical Glass Skincare'}
                </span>
              </div>
            </div>
          )}

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
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 1290"
                required
                className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111]"
              />
            </div>

            <div>
              <label className="font-bold text-[#111111] block mb-1">Sale Price (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="Optional"
                className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111]"
              />
            </div>

            <div>
              <label className="font-bold text-[#111111] block mb-1">Stock Units *</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="e.g. 50"
                required
                className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111]"
              />
            </div>
          </div>

          {/* SKINCARE MULTI-SELECT SIZES / GRAMS */}
          {targetCategory === 'skincare' && (
            <div className="p-4 bg-[#FFF0F5] border border-[#F1BCCE] rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <label className="font-bold text-[#111111] text-xs flex items-center gap-2">
                  <span className="text-sm">⚖️</span>
                  <span>Available Skincare Sizes & Grams (Multi-Select)</span>
                  <span className="px-2 py-0.5 bg-[#D84B7E] text-white text-[10px] font-bold rounded-full shadow-2xs">
                    {selectedSkincareSizes.length} selected
                  </span>
                </label>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedSkincareSizes(['50g', '100g', '150g'])}
                    className="text-[#D84B7E] font-bold hover:underline cursor-pointer"
                  >
                    Common (50g, 100g)
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSkincareSizes([...availableSkincareSizes])}
                    className="text-[#D84B7E] font-bold hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSkincareSizes([])}
                    className="text-gray-500 font-bold hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Multi-Select Size Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {availableSkincareSizes.map((size) => {
                  const isSelected = selectedSkincareSizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedSkincareSizes(selectedSkincareSizes.filter((s) => s !== size));
                        } else {
                          setSelectedSkincareSizes([...selectedSkincareSizes, size]);
                        }
                      }}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#D84B7E] text-[#FDF4F7] border-[#D84B7E] shadow-sm scale-105'
                          : 'bg-[#FDF4F7] text-gray-700 border-[#F1BCCE] hover:border-[#D84B7E]'
                      }`}
                    >
                      {isSelected ? `✓ ${size}` : size}
                    </button>
                  );
                })}

                {/* Any custom sizes added by admin */}
                {selectedSkincareSizes
                  .filter((s) => !availableSkincareSizes.includes(s))
                  .map((customSize) => (
                    <button
                      key={customSize}
                      type="button"
                      onClick={() =>
                        setSelectedSkincareSizes(selectedSkincareSizes.filter((s) => s !== customSize))
                      }
                      className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-[#D84B7E] text-[#FDF4F7] border-[#D84B7E] shadow-sm scale-105 cursor-pointer flex items-center gap-1"
                    >
                      <span>✓ {customSize}</span>
                      <span className="text-[10px] hover:text-black">✕</span>
                    </button>
                  ))}
              </div>

              {/* Custom Size / Grams Input */}
              <div className="flex gap-2 pt-2 border-t border-[#F1BCCE]/60 items-center">
                <input
                  type="text"
                  value={customSkincareSizeInput}
                  onChange={(e) => setCustomSkincareSizeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = customSkincareSizeInput.trim();
                      if (val) {
                        const formatted = /^\d+(\.\d+)?$/.test(val) ? `${val}g` : val;
                        if (!selectedSkincareSizes.includes(formatted)) {
                          setSelectedSkincareSizes([...selectedSkincareSizes, formatted]);
                          if (sizeStocks[formatted] === undefined) {
                            setSizeStocks((prev) => ({ ...prev, [formatted]: 25 }));
                          }
                        }
                        setCustomSkincareSizeInput('');
                      }
                    }
                  }}
                  placeholder="Or enter custom grams/size (e.g. 60g, 120ml)..."
                  className="flex-1 p-2.5 bg-white border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111] text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = customSkincareSizeInput.trim();
                    if (val) {
                      const formatted = /^\d+(\.\d+)?$/.test(val) ? `${val}g` : val;
                      if (!selectedSkincareSizes.includes(formatted)) {
                        setSelectedSkincareSizes([...selectedSkincareSizes, formatted]);
                        if (sizeStocks[formatted] === undefined) {
                          setSizeStocks((prev) => ({ ...prev, [formatted]: 25 }));
                        }
                      }
                      setCustomSkincareSizeInput('');
                    }
                  }}
                  className="px-4 py-2.5 bg-[#111111] text-white hover:bg-[#D84B7E] rounded-xl font-bold transition-colors text-xs shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Size
                </button>
              </div>

              {/* PER-SIZE STOCK UNITS BREAKDOWN (SKINCARE) */}
              {selectedSkincareSizes.length > 0 && (
                <div className="pt-3 border-t border-[#F1BCCE] space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-[#111111] text-xs flex items-center gap-1.5">
                      <span>📦</span>
                      <span>Stock Units for Each Size / Grams:</span>
                    </label>
                    <span className="text-[11px] text-gray-600 font-medium">
                      Sum: <strong className="text-[#D84B7E] font-bold">{stock} units total</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {selectedSkincareSizes.map((size) => (
                      <div
                        key={size}
                        className="p-2.5 bg-white border border-[#F1BCCE] rounded-xl flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <span className="text-xs font-bold text-[#111111] px-2 py-0.5 bg-[#FCE7F0] border border-[#F1BCCE] rounded-md shrink-0">
                          {size}
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={sizeStocks[size] !== undefined ? sizeStocks[size] : 25}
                            onChange={(e) => handleSizeStockChange(size, e.target.value)}
                            placeholder="Qty"
                            className="w-16 p-1 text-center font-bold text-xs bg-[#FDF4F7] border border-[#F1BCCE] rounded-lg outline-none focus:border-[#D84B7E] text-[#111111]"
                          />
                          <span className="text-[10px] text-gray-500 font-medium">units</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {targetCategory !== 'skincare' && targetCategory !== 'fashion' && (
            <div className="p-3.5 bg-[#FDF4F7] border border-[#F1BCCE] rounded-2xl space-y-1.5">
              <label className="font-bold text-[#111111] text-xs flex items-center gap-1.5">
                <span className="text-sm">⚖️</span>
                <span>Item Weight (Optional, e.g. 50g)</span>
              </label>
              <input
                type="text"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 50g"
                className="w-full p-2.5 bg-white border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111] text-xs font-bold placeholder:font-normal"
              />
            </div>
          )}

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
                <label className={`flex-1 px-4 py-2.5 ${isProcessingPhotos ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#D84B7E] hover:bg-[#111111] cursor-pointer'} text-white rounded-xl font-bold text-center transition-all flex items-center justify-center gap-2 shadow-sm`}>
                  <Upload className="w-4 h-4" />
                  {isProcessingPhotos ? 'Optimizing & Adding Photos...' : 'Upload Multiple Photos from Device'}
                  <input
                    type="file"
                    multiple
                    disabled={isProcessingPhotos}
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
                          if (sizeStocks[size] === undefined) {
                            setSizeStocks((prev) => ({ ...prev, [size]: 10 }));
                          }
                        }
                      }}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#D84B7E] text-[#FDF4F7] border-[#D84B7E] shadow-sm scale-105'
                          : 'bg-[#FFF8FA] text-gray-700 border-[#F1BCCE] hover:border-[#D84B7E]'
                      }`}
                    >
                      {isSelected ? `✓ ${size}` : size}
                    </button>
                  );
                })}
              </div>

              {/* PER-SIZE STOCK UNITS BREAKDOWN (FASHION) */}
              {selectedSizes.length > 0 && (
                <div className="pt-3 border-t border-[#F1BCCE] space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-[#111111] text-xs flex items-center gap-1.5">
                      <span>📦</span>
                      <span>Stock Units for Each Size:</span>
                    </label>
                    <span className="text-[11px] text-gray-600 font-medium">
                      Sum: <strong className="text-[#D84B7E] font-bold">{stock} units total</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {selectedSizes.map((size) => (
                      <div
                        key={size}
                        className="p-2.5 bg-white border border-[#F1BCCE] rounded-xl flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <span className="text-xs font-bold text-[#111111] px-2 py-0.5 bg-[#FCE7F0] border border-[#F1BCCE] rounded-md shrink-0">
                          {size}
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={sizeStocks[size] !== undefined ? sizeStocks[size] : 10}
                            onChange={(e) => handleSizeStockChange(size, e.target.value)}
                            placeholder="Qty"
                            className="w-16 p-1 text-center font-bold text-xs bg-[#FDF4F7] border border-[#F1BCCE] rounded-lg outline-none focus:border-[#D84B7E] text-[#111111]"
                          />
                          <span className="text-[10px] text-gray-500 font-medium">units</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
