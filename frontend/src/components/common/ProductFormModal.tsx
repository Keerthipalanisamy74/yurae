import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Plus, Trash2, CheckCircle, Image as ImageIcon, Star, ChevronRight, ChevronDown, ChevronLeft, Check, Sparkles, Layers } from 'lucide-react';
import { Product, Category, Subcategory } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { getSubcategoryIconHelper } from '../../context/CategoryContext';

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
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>(['All']);
  const [customSkinTypeInput, setCustomSkinTypeInput] = useState<string>('');
  const [subCategory, setSubCategory] = useState('Maxi & Midi Dresses');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [isSubcategoryDropdownOpen, setIsSubcategoryDropdownOpen] = useState(false);
  const [activeParentSubcategoryId, setActiveParentSubcategoryId] = useState<number | null>(null);
  const [mobileSubcategoryView, setMobileSubcategoryView] = useState<'parents' | 'children'>('parents');
  const subcategoryDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']);
  const [selectedSkincareSizes, setSelectedSkincareSizes] = useState<string[]>(['50g', '100g']);
  const [customSkincareSizeInput, setCustomSkincareSizeInput] = useState<string>('');
  const [sizeStocks, setSizeStocks] = useState<Record<string, number | string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (subcategoryDropdownRef.current && !subcategoryDropdownRef.current.contains(e.target as Node)) {
        setIsSubcategoryDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSubcategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  const availableSkinTypes = [
    { id: 'Sensitive', label: 'Sensitive', icon: '🌿' },
    { id: 'Normal', label: 'Normal', icon: '✨' },
    { id: 'Oily', label: 'Oily', icon: '💧' },
    { id: 'Combination', label: 'Combination', icon: '⚖️' },
    { id: 'Dry', label: 'Dry', icon: '🌸' },
    { id: 'Oily Acne Prone', label: 'Oily Acne Prone', icon: '🛡️' },
  ];

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
      setSkinType(productToEdit.skin_type || '');

      // Populate subcategory
      if (productToEdit.subcategory_id) {
        setSelectedSubcategoryId(productToEdit.subcategory_id);
      } else if (productToEdit.subcategory?.id) {
        setSelectedSubcategoryId(productToEdit.subcategory.id);
      } else {
        setSelectedSubcategoryId(null);
      }

      // Populate selected skin types
      if (productToEdit.skin_type && !productToEdit.skin_type.toLowerCase().includes('size')) {
        const raw = productToEdit.skin_type.trim();
        if (raw.toLowerCase() === 'all' || raw.toLowerCase() === 'all skin types') {
          setSelectedSkinTypes(['All']);
        } else {
          const split = raw.split(',').map((s) => s.trim()).filter(Boolean);
          const mapped = split.map((t) => {
            if (/acne/i.test(t)) return 'Oily Acne Prone';
            const found = availableSkinTypes.find((a) => a.id.toLowerCase() === t.toLowerCase() || a.label.toLowerCase() === t.toLowerCase());
            return found ? found.id : t;
          });
          setSelectedSkinTypes(mapped);
        }
      } else {
        setSelectedSkinTypes([]);
      }

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
      setSkinType('');
      setSelectedSkinTypes([]);
      setCustomSkinTypeInput('');
      setSelectedSubcategoryId(null);
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
  }, [productToEdit?.id, isOpen]);

  // Toggle Skin Type selection (Optional)
  const toggleSkinType = (typeId: string) => {
    if (typeId === 'All') {
      if (selectedSkinTypes.includes('All')) {
        setSelectedSkinTypes([]);
      } else {
        setSelectedSkinTypes(['All']);
      }
      return;
    }

    let next = selectedSkinTypes.filter((t) => t !== 'All');
    if (next.includes(typeId)) {
      next = next.filter((t) => t !== typeId);
    } else {
      next.push(typeId);
    }
    setSelectedSkinTypes(next);
  };

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
      let catId = productToEdit?.category_id || productToEdit?.category?.id;
      if (!catId) {
        let cat = categories.find((c) => c.slug.toLowerCase() === targetCategory.toLowerCase());
        catId = cat?.id;
      }
      if (!catId && categories.length > 0) {
        catId = categories[0].id;
      }
      if (!catId) {
        catId = 1;
      }

      const cleanPriceStr = String(price).replace(/[^0-9.]/g, '');
      const numPrice = Number(cleanPriceStr);
      if (!cleanPriceStr || isNaN(numPrice) || numPrice <= 0) {
        showToast('Please enter a valid regular price', 'error');
        setIsSubmitting(false);
        return;
      }

      const numStock = stock === '' || stock === null || stock === undefined
        ? 0
        : Number(String(stock).replace(/[^0-9]/g, '')) || 0;

      const numSalePrice = salePrice !== '' && salePrice !== undefined && salePrice !== null && !isNaN(Number(String(salePrice).replace(/[^0-9.]/g, '')))
        ? Number(String(salePrice).replace(/[^0-9.]/g, ''))
        : undefined;

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

      let skinTypeVal = '';
      if (isFashion) {
        skinTypeVal = selectedSizes.length > 0 ? `Sizes: ${selectedSizes.join(', ')}` : (skinType || 'Standard Fit');
      } else if (isSkincare) {
        if (selectedSkinTypes.length > 0) {
          skinTypeVal = selectedSkinTypes.includes('All') ? 'All' : selectedSkinTypes.join(', ');
        } else {
          skinTypeVal = '';
        }
      } else {
        skinTypeVal = skinType ? skinType.trim() : '';
      }

      const shortDescVal = shortDesc.trim();
      const descVal = desc.trim();
      const ingredientsVal = ingredients.trim();

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
        subcategory_id: selectedSubcategoryId || undefined,
        name: name.trim(),
        description: descVal,
        short_description: shortDescVal,
        price: numPrice,
        sale_price: numSalePrice,
        stock_quantity: totalCalculatedStock,
        weight: formattedWeight || undefined,
        weight_kg: numWeightKg,
        brand: 'Yurae Beauty',
        ingredients: ingredientsVal,
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
      console.error('Error saving product:', err);
      const detailMsg = err?.response?.data?.detail;
      const errorMsg = typeof detailMsg === 'string'
        ? detailMsg
        : Array.isArray(detailMsg)
        ? detailMsg.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
        : 'Failed to save product. Please check required fields.';
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const activeCategoryObj = categories.find((c) => c.slug.toLowerCase() === targetCategory.toLowerCase());
  const categorySubcategories = activeCategoryObj?.subcategories || [];

  // Helper to find selected subcategory info (parent + child)
  const getSelectedSubcategoryInfo = () => {
    if (!selectedSubcategoryId || categorySubcategories.length === 0) return null;
    for (const parent of categorySubcategories) {
      if (parent.id === selectedSubcategoryId) {
        return { parent, child: null, isParent: true };
      }
      if (parent.children) {
        for (const child of parent.children) {
          if (child.id === selectedSubcategoryId) {
            return { parent, child, isParent: false };
          }
        }
      }
    }
    return null;
  };
  const selectedInfo = getSelectedSubcategoryInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FFFDFC] rounded-3xl w-full max-w-4xl p-4 sm:p-6 md:p-8 max-h-[92vh] overflow-y-auto border border-[#F1BCCE] shadow-2xl relative animate-in fade-in zoom-in duration-200">
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
                Choose Store Department / Category *
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const isSelected = targetCategory.toLowerCase() === cat.slug.toLowerCase();
                  const icon = cat.name.toLowerCase().includes('skin')
                    ? '🌸'
                    : cat.name.toLowerCase().includes('fashion') || cat.name.toLowerCase().includes('dress')
                    ? '👗'
                    : cat.name.toLowerCase().includes('access') || cat.name.toLowerCase().includes('jewel')
                    ? '💍'
                    : cat.name.toLowerCase().includes('hair')
                    ? '💇‍♀️'
                    : cat.name.toLowerCase().includes('body')
                    ? '🧴'
                    : '✨';

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setTargetCategory(cat.slug.toLowerCase());
                        setSelectedSubcategoryId(null);
                        if (cat.slug.toLowerCase().includes('fashion') || cat.name.toLowerCase().includes('fashion')) {
                          setSubCategory(dressCategories[0]);
                          setSkinType('Standard Fit');
                        } else if (cat.slug.toLowerCase().includes('access') || cat.name.toLowerCase().includes('access')) {
                          setSubCategory(accessoryCategories[0]);
                          setSkinType('All');
                        } else if (cat.slug.toLowerCase().includes('skin') || cat.name.toLowerCase().includes('skin')) {
                          setSubCategory(skincareCategories[0]);
                          setSkinType('All');
                        } else {
                          setSubCategory(cat.name);
                          setSkinType('All');
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl font-bold text-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#D84B7E] text-[#FDF4F7] border-[#D84B7E] shadow-sm'
                          : 'bg-[#FDF4F7] text-gray-700 border-[#F1BCCE] hover:border-[#D84B7E] hover:bg-[#FCE7F0]'
                      }`}
                    >
                      <span className="text-sm">{icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3.5 bg-[#FCE7F0] border border-[#F1BCCE] rounded-2xl">
              <div className="w-9 h-9 rounded-xl bg-[#D84B7E] text-white flex items-center justify-center font-bold text-base shadow-xs">
                {targetCategory.includes('fashion') ? '👗' : targetCategory.includes('access') ? '💍' : '🌸'}
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#D84B7E] block">
                  Store Department
                </span>
                <span className="text-sm font-bold text-[#111111]">
                  {categories.find((c) => c.slug.toLowerCase() === targetCategory.toLowerCase())?.name || targetCategory}
                </span>
              </div>
            </div>
          )}

          {/* NAME & SUBCATEGORY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-[#111111] block mb-1">
                {targetCategory.includes('fashion') ? 'Garment / Item Title *' : 'Product Name *'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={targetCategory.includes('fashion') ? 'e.g. Mulberry Silk Slip Dress' : 'e.g. Ginseng Renewal Serum'}
                required
                className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111]"
              />
            </div>

            <div className="relative" ref={subcategoryDropdownRef}>
              <label className="font-bold text-[#111111] block mb-1 flex items-center justify-between">
                <span>
                  {targetCategory.includes('fashion')
                    ? 'Apparel Subcategory'
                    : targetCategory.includes('access')
                    ? 'Accessory Subcategory'
                    : 'Subcategory / Type'}
                </span>
                {categorySubcategories.length > 0 && (
                  <span className="text-[10px] text-[#D84B7E] font-bold bg-[#FCE7F0] px-2 py-0.5 rounded-full">
                    {categorySubcategories.reduce((acc, p) => acc + (p.children?.length || 1), 0)} options available
                  </span>
                )}
              </label>

              {categorySubcategories.length > 0 ? (
                <div>
                  {/* Dropdown Trigger Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubcategoryDropdownOpen(!isSubcategoryDropdownOpen);
                      setMobileSubcategoryView('parents');
                      if (selectedInfo?.parent?.id) {
                        setActiveParentSubcategoryId(selectedInfo.parent.id);
                      } else if (categorySubcategories.length > 0) {
                        setActiveParentSubcategoryId(categorySubcategories[0].id);
                      }
                    }}
                    className={`w-full p-3 bg-[#FDF4F7] border rounded-xl flex items-center justify-between text-left transition-all cursor-pointer shadow-2xs ${
                      isSubcategoryDropdownOpen
                        ? 'border-[#D84B7E] ring-2 ring-[#D84B7E]/20 bg-white'
                        : 'border-[#F1BCCE] hover:border-[#D84B7E]'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden pr-2 min-w-0">
                      {selectedInfo ? (
                        <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold text-[#111111]">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#FCE7F0] text-[#D84B7E] font-bold text-[11px] border border-[#F1BCCE]">
                            <span>{getSubcategoryIconHelper(selectedInfo.parent)}</span>
                            <span>{selectedInfo.parent.name}</span>
                          </span>
                          {selectedInfo.child && (
                            <>
                              <ChevronRight className="w-3.5 h-3.5 text-[#D84B7E] shrink-0" />
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white text-[#111111] font-bold text-[11px] border border-[#F1BCCE] shadow-2xs">
                                <span>{getSubcategoryIconHelper(selectedInfo.child)}</span>
                                <span>{selectedInfo.child.name}</span>
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 font-medium text-xs flex items-center gap-1.5 truncate">
                          <span>🌸</span>
                          <span>-- Choose Subcategory (e.g. Skincare ▶ Face Wash) --</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      {selectedSubcategoryId && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubcategoryId(null);
                            setSubCategory('');
                          }}
                          className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                          title="Clear subcategory"
                        >
                          <X className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                          isSubcategoryDropdownOpen ? 'rotate-180 text-[#D84B7E]' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Cascading Flyout Menu Dropdown */}
                  {isSubcategoryDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#FFFDFC] border border-[#F1BCCE] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                      {/* Desktop / Tablet 2-Column Cascading Flyout */}
                      <div className="hidden sm:flex divide-x divide-[#F1BCCE]/60 max-h-[320px]">
                        {/* Left Column: Parent Groups (Skincare, Bodycare, Haircare) */}
                        <div className="w-1/2 p-2 bg-[#FFF8FA]/80 overflow-y-auto space-y-1">
                          <div className="px-2.5 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <span>📁</span> Parent Groups
                          </div>
                          {categorySubcategories.map((parent) => {
                            const isActive = activeParentSubcategoryId === parent.id;
                            const hasChildren = parent.children && parent.children.length > 0;
                            const isSelectedParent = selectedSubcategoryId === parent.id;

                            return (
                              <button
                                key={parent.id}
                                type="button"
                                onMouseEnter={() => setActiveParentSubcategoryId(parent.id)}
                                onClick={() => {
                                  setActiveParentSubcategoryId(parent.id);
                                  if (!hasChildren) {
                                    setSelectedSubcategoryId(parent.id);
                                    setSubCategory(parent.name);
                                    setIsSubcategoryDropdownOpen(false);
                                  }
                                }}
                                className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between transition-all group cursor-pointer ${
                                  isActive
                                    ? 'bg-[#FCE7F0] text-[#D84B7E] font-bold shadow-xs border border-[#F1BCCE]'
                                    : 'text-gray-700 hover:bg-white hover:text-gray-900'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-base shrink-0">{getSubcategoryIconHelper(parent)}</span>
                                  <div className="truncate">
                                    <div className="text-xs truncate font-bold">{parent.name}</div>
                                    {hasChildren && (
                                      <div className="text-[10px] text-gray-500 font-normal">
                                        {parent.children?.length} types
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0 ml-1">
                                  {isSelectedParent && <Check className="w-3.5 h-3.5 text-[#D84B7E]" />}
                                  {hasChildren && (
                                    <ChevronRight
                                      className={`w-4 h-4 transition-transform ${
                                        isActive
                                          ? 'text-[#D84B7E] translate-x-0.5'
                                          : 'text-gray-400 group-hover:text-gray-600'
                                      }`}
                                    />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Right Column: Nested Children of the hovered/active parent group */}
                        <div className="w-1/2 p-2 bg-white overflow-y-auto space-y-1">
                          {(() => {
                            const activeParent =
                              categorySubcategories.find((p) => p.id === activeParentSubcategoryId) ||
                              categorySubcategories[0];

                            if (!activeParent) {
                              return (
                                <div className="p-4 text-center text-xs text-gray-400">
                                  Hover a parent group on the left to see types
                                </div>
                              );
                            }

                            const childrenList = activeParent.children || [];

                            return (
                              <div>
                                <div className="px-2.5 py-1 text-[10px] font-bold text-[#D84B7E] uppercase tracking-wider flex items-center justify-between border-b border-[#F1BCCE]/40 pb-1.5 mb-1.5">
                                  <span className="flex items-center gap-1">
                                    <span>{getSubcategoryIconHelper(activeParent)}</span>
                                    <span>{activeParent.name} Types</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSubcategoryId(activeParent.id);
                                      setSubCategory(activeParent.name);
                                      setIsSubcategoryDropdownOpen(false);
                                    }}
                                    className="text-[10px] text-[#D84B7E] hover:underline font-bold cursor-pointer"
                                  >
                                    Select All {activeParent.name}
                                  </button>
                                </div>

                                {childrenList.length > 0 ? (
                                  <div className="space-y-0.5">
                                    {childrenList.map((child) => {
                                      const isSelected = selectedSubcategoryId === child.id;
                                      return (
                                        <button
                                          key={child.id}
                                          type="button"
                                          onClick={() => {
                                            setSelectedSubcategoryId(child.id);
                                            setSubCategory(child.name);
                                            setIsSubcategoryDropdownOpen(false);
                                          }}
                                          className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                                            isSelected
                                              ? 'bg-[#D84B7E] text-white font-bold shadow-xs'
                                              : 'text-gray-700 hover:bg-[#FFF0F5] hover:text-[#D84B7E]'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-sm shrink-0">{getSubcategoryIconHelper(child)}</span>
                                            <span className="text-xs truncate">{child.name}</span>
                                          </div>
                                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="p-3 text-center text-xs text-gray-500">
                                    No nested subcategories
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Mobile Drill-Down Accordion View */}
                      <div className="block sm:hidden p-2 max-h-[300px] overflow-y-auto">
                        {mobileSubcategoryView === 'parents' ? (
                          <div className="space-y-1">
                            <div className="px-2 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                              Select Parent Group
                            </div>
                            {categorySubcategories.map((parent) => {
                              const hasChildren = parent.children && parent.children.length > 0;
                              return (
                                <button
                                  key={parent.id}
                                  type="button"
                                  onClick={() => {
                                    setActiveParentSubcategoryId(parent.id);
                                    if (hasChildren) {
                                      setMobileSubcategoryView('children');
                                    } else {
                                      setSelectedSubcategoryId(parent.id);
                                      setSubCategory(parent.name);
                                      setIsSubcategoryDropdownOpen(false);
                                    }
                                  }}
                                  className="w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between bg-[#FFF8FA] hover:bg-[#FCE7F0] border border-[#F1BCCE]/60 rounded-xl"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">{getSubcategoryIconHelper(parent)}</span>
                                    <div>
                                      <div className="text-xs font-bold text-gray-800">{parent.name}</div>
                                      {hasChildren && (
                                        <div className="text-[10px] text-gray-500">
                                          {parent.children?.length} options
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {(() => {
                              const activeParent =
                                categorySubcategories.find((p) => p.id === activeParentSubcategoryId) ||
                                categorySubcategories[0];
                              const childrenList = activeParent?.children || [];

                              return (
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => setMobileSubcategoryView('parents')}
                                    className="w-full px-2.5 py-1.5 mb-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 flex items-center gap-1.5"
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span>Back to Parent Groups</span>
                                  </button>

                                  <div className="px-2 py-1 text-[10px] font-bold text-[#D84B7E] uppercase tracking-wider flex items-center justify-between border-b border-[#F1BCCE]/40 pb-1 mb-1.5">
                                    <span className="flex items-center gap-1">
                                      <span>{getSubcategoryIconHelper(activeParent)}</span>
                                      <span>{activeParent?.name}</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (activeParent) {
                                          setSelectedSubcategoryId(activeParent.id);
                                          setSubCategory(activeParent.name);
                                          setIsSubcategoryDropdownOpen(false);
                                        }
                                      }}
                                      className="text-[10px] text-[#D84B7E] font-bold underline"
                                    >
                                      Select Whole Group
                                    </button>
                                  </div>

                                  <div className="space-y-1">
                                    {childrenList.map((child) => {
                                      const isSelected = selectedSubcategoryId === child.id;
                                      return (
                                        <button
                                          key={child.id}
                                          type="button"
                                          onClick={() => {
                                            setSelectedSubcategoryId(child.id);
                                            setSubCategory(child.name);
                                            setIsSubcategoryDropdownOpen(false);
                                          }}
                                          className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between ${
                                            isSelected
                                              ? 'bg-[#D84B7E] text-white font-bold'
                                              : 'bg-[#FFF8FA] text-gray-800'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm">{getSubcategoryIconHelper(child)}</span>
                                            <span className="text-xs font-medium">{child.name}</span>
                                          </div>
                                          {isSelected && <Check className="w-3.5 h-3.5" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : targetCategory.includes('fashion') ? (
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] font-bold text-[#111111] cursor-pointer"
                >
                  {dressCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : targetCategory.includes('access') ? (
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] font-bold text-[#111111] cursor-pointer"
                >
                  {accessoryCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : targetCategory.includes('skin') ? (
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] font-bold text-[#111111] cursor-pointer"
                >
                  {skincareCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  placeholder="e.g. Standard, Luxury Line..."
                  className="w-full p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] font-bold text-[#111111]"
                />
              )}
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

          {/* SKINCARE TARGET SKIN TYPES / COMPATIBILITY (MULTI-SELECT - OPTIONAL) */}
          {targetCategory === 'skincare' && (
            <div className="p-4 bg-[#FFF0F5] border border-[#F1BCCE] rounded-2xl space-y-3">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <label className="font-bold text-[#111111] text-xs flex items-center gap-2">
                  <span className="text-sm">🌸</span>
                  <span>Target Skin Types / Skin Compatibility</span>
                  <span className="text-[10px] text-gray-500 font-normal">(Optional)</span>
                  {selectedSkinTypes.length > 0 && (
                    <span className="px-2 py-0.5 bg-[#D84B7E] text-white text-[10px] font-bold rounded-full shadow-2xs">
                      {selectedSkinTypes.includes('All') ? 'All Skin Types' : `${selectedSkinTypes.length} selected`}
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedSkinTypes(['All'])}
                    className="text-[#D84B7E] font-bold hover:underline cursor-pointer"
                  >
                    All Skin Types
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSkinTypes(availableSkinTypes.map((st) => st.id))}
                    className="text-[#D84B7E] font-bold hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSkinTypes([]);
                      setSkinType('');
                    }}
                    className="text-gray-500 font-bold hover:underline cursor-pointer"
                  >
                    Clear (None)
                  </button>
                </div>
              </div>

              {/* Multi-Select Skin Type Pill Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {/* All Skin Types pill */}
                <button
                  type="button"
                  onClick={() => toggleSkinType('All')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer border flex items-center gap-1.5 ${
                    selectedSkinTypes.includes('All')
                      ? 'bg-[#D84B7E] text-[#FDF4F7] border-[#D84B7E] shadow-sm scale-105'
                      : 'bg-[#FDF4F7] text-gray-700 border-[#F1BCCE] hover:border-[#D84B7E]'
                  }`}
                >
                  <span>🌟</span>
                  <span>{selectedSkinTypes.includes('All') ? '✓ All Skin Types' : 'All Skin Types'}</span>
                </button>

                {/* Individual Skin Type Pills */}
                {availableSkinTypes.map((st) => {
                  const isSelected = !selectedSkinTypes.includes('All') && selectedSkinTypes.includes(st.id);
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => toggleSkinType(st.id)}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#D84B7E] text-[#FDF4F7] border-[#D84B7E] shadow-sm scale-105'
                          : 'bg-[#FDF4F7] text-gray-700 border-[#F1BCCE] hover:border-[#D84B7E]'
                      }`}
                    >
                      <span>{st.icon}</span>
                      <span>{isSelected ? `✓ ${st.label}` : st.label}</span>
                    </button>
                  );
                })}

                {/* Custom Skin Types added by Admin */}
                {selectedSkinTypes
                  .filter((t) => t !== 'All' && !availableSkinTypes.some((st) => st.id === t))
                  .map((customType) => (
                    <button
                      key={customType}
                      type="button"
                      onClick={() => setSelectedSkinTypes(selectedSkinTypes.filter((t) => t !== customType))}
                      className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-[#D84B7E] text-[#FDF4F7] border-[#D84B7E] shadow-sm scale-105 cursor-pointer flex items-center gap-1"
                    >
                      <span>✓ {customType}</span>
                      <span className="text-[10px] hover:text-black">✕</span>
                    </button>
                  ))}
              </div>

              {/* Custom Skin Concern / Type Input */}
              <div className="flex gap-2 pt-2 border-t border-[#F1BCCE]/60 items-center">
                <input
                  type="text"
                  value={customSkinTypeInput}
                  onChange={(e) => setCustomSkinTypeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = customSkinTypeInput.trim();
                      if (val) {
                        const next = selectedSkinTypes.filter((t) => t !== 'All');
                        if (!next.includes(val)) {
                          setSelectedSkinTypes([...next, val]);
                        }
                        setCustomSkinTypeInput('');
                      }
                    }
                  }}
                  placeholder="Or enter custom skin type/concern (e.g. Dehydrated, Hyperpigmentation)..."
                  className="flex-1 p-2.5 bg-white border border-[#F1BCCE] rounded-xl outline-none focus:border-[#D84B7E] text-[#111111] text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = customSkinTypeInput.trim();
                    if (val) {
                      const next = selectedSkinTypes.filter((t) => t !== 'All');
                      if (!next.includes(val)) {
                        setSelectedSkinTypes([...next, val]);
                      }
                      setCustomSkinTypeInput('');
                    }
                  }}
                  className="px-4 py-2.5 bg-[#111111] text-white hover:bg-[#D84B7E] rounded-xl font-bold transition-colors text-xs shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Type
                </button>
              </div>
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
