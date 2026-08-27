import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star, Heart, Plus, Minus, ShieldCheck, Truck, RotateCcw,
  ChevronDown, ChevronUp, Trash2, Edit, Bell, Mail, CheckCircle2,
  Camera, Image as ImageIcon, X, ZoomIn, Upload, Sparkles, Share2, Ruler
} from 'lucide-react';
import { Product, ProductVariant, Review, Category } from '../types';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { ProductCard } from '../components/common/ProductCard';
import { ProductFormModal } from '../components/common/ProductFormModal';
import { SizeChartModal } from '../components/common/SizeChartModal';
import { SEO } from '../components/common/SEO';

export const ProductDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { formatPrice, currentCurrencyInfo } = useCurrency();

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // Back in Stock Notification State
  const [notifyEmail, setNotifyEmail] = useState('');
  const [isSubmittingNotify, setIsSubmittingNotify] = useState(false);
  const [notifiedVariants, setNotifiedVariants] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (user?.email) {
      setNotifyEmail(user.email);
    }
  }, [user]);

  // Accordion state
  const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({
    description: true,
    ingredients: true,
    size_chart: true,
    how_to_use: false,
    suitable_for: false,
    shipping: false,
  });

  // Size Chart Guide Modal State
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [accordionUnit, setAccordionUnit] = useState<'in' | 'cm'>('in');

  // Review Form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewPhotoUrl, setReviewPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [zoomedPhotoUrl, setZoomedPhotoUrl] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewEligibility, setReviewEligibility] = useState<{
    eligible: boolean;
    has_purchased: boolean;
    is_delivered: boolean;
    has_reviewed: boolean;
    message: string;
    existing_review?: {
      rating: number;
      review: string;
      photo_url?: string;
    };
  } | null>(null);

  useEffect(() => {
    if (isAuthenticated && product?.id) {
      api.get(`/products/${product.id}/review-eligibility`)
        .then((res) => {
          setReviewEligibility(res.data);
          if (res.data.existing_review) {
            setReviewRating(res.data.existing_review.rating);
            setReviewText(res.data.existing_review.review);
            if (res.data.existing_review.photo_url) {
              setReviewPhotoUrl(res.data.existing_review.photo_url);
            }
          }
        })
        .catch(() => setReviewEligibility(null));
    } else {
      setReviewEligibility(null);
    }
  }, [isAuthenticated, product?.id]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    api.get(`/products/${slug}`)
      .then((res) => {
        const prodData: Product = res.data;
        setProduct(prodData);
        setSelectedImage(prodData.images?.[0]?.image_url || '');
        if (prodData.variants && prodData.variants.length > 0) {
          setSelectedVariant(prodData.variants[0]);
        }

        // Fetch categories for edit modal
        api.get('/categories')
          .then((cRes) => setCategories(cRes.data))
          .catch((err) => console.error(err));

        // Fetch reviews & related products
        api.get(`/products/${prodData.id}/reviews`)
          .then((rRes) => setReviews(rRes.data))
          .catch((err) => console.error(err));

        api.get(`/products/${prodData.slug}/complementary?limit=4`)
          .then((relRes) => setRelatedProducts(relRes.data))
          .catch((err) => {
            console.error(err);
            api.get(`/products?category_slug=${prodData.category?.slug}&limit=4`)
              .then((fb) => setRelatedProducts(fb.data.filter((p: Product) => p.id !== prodData.id)))
              .catch(() => {});
          });
      })
      .catch((err) => {
        console.error(err);
        showToast('Product not found', 'error');
      })
      .finally(() => setLoading(false));
  }, [slug, showToast]);

  const handleProductEditSuccess = (savedProduct: Product) => {
    setProduct(savedProduct);
    if (savedProduct.images && savedProduct.images.length > 0) {
      setSelectedImage(savedProduct.images[0].image_url);
    }
    if (savedProduct.slug && savedProduct.slug !== slug) {
      navigate(`/product/${savedProduct.slug}`, { replace: true });
    }
  };

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddToCart = async () => {
    if (product) {
      await addToCart(product, selectedVariant, quantity);
    }
  };

  const handleBuyNow = async () => {
    if (product) {
      await addToCart(product, selectedVariant, quantity);
      navigate('/checkout');
    }
  };

  const handleSubscribeStockAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail.trim() || !product) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    const variantKey = selectedVariant ? `${product.id}-${selectedVariant.id}` : `${product.id}-all`;
    try {
      setIsSubmittingNotify(true);
      const res = await api.post(`/products/${product.id}/notify-stock`, {
        email: notifyEmail.trim(),
        variant_id: selectedVariant?.id || undefined,
        variant_value: selectedVariant?.variant_value || undefined,
      });
      showToast(res.data.message || 'You are on the priority restock list!', 'success');
      setNotifiedVariants((prev) => ({ ...prev, [variantKey]: true }));
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to register for restock alert';
      showToast(msg, 'error');
    } finally {
      setIsSubmittingNotify(false);
    }
  };

  const handleDeleteThisProduct = async () => {
    if (!product) return;
    if (window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/products/${product.id}`);
        showToast(`Product "${product.name}" deleted successfully`, 'success');
        navigate('/shop');
      } catch {
        showToast('Failed to delete product', 'error');
      }
    }
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Photo must be under 5MB', 'error');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/reviews/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReviewPhotoUrl(res.data.photo_url);
      showToast('📸 Glow / Look photo attached successfully!', 'success');
    } catch (err: any) {
      console.warn('File upload endpoint fallback to data URL:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReviewPhotoUrl(reader.result as string);
        showToast('📸 Photo attached successfully!', 'success');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please log in to submit a review', 'info');
      return;
    }
    if (!reviewText.trim()) return;

    try {
      setIsSubmittingReview(true);
      const res = await api.post(`/products/${product?.id}/reviews`, {
        product_id: product?.id,
        rating: reviewRating,
        review: reviewText,
        photo_url: reviewPhotoUrl || undefined,
      });
      setReviews((prev) => {
        const filtered = prev.filter((r) => r.id !== res.data.id && r.user_id !== res.data.user_id);
        return [res.data, ...filtered];
      });
      showToast('✨ Thank you! Your review has been published.', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to submit review. Please try again.';
      showToast(msg, 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Instant Social Share State & Handlers
  const [copiedLink, setCopiedLink] = useState(false);

  const getShareUrl = () => {
    return typeof window !== 'undefined' ? window.location.href : '';
  };

  const getShareTitle = () => {
    if (!product) return 'YURAE | Luxury Fashion & Beauty';
    const priceText = `₹${(product.sale_price || product.price).toLocaleString()} INR`;
    return isFashion
      ? `✨ ${product.name} (${priceText}) — Yurae Luxury Fashion`
      : isAccessories
      ? `✨ ${product.name} (${priceText}) — Yurae Luxury Accessories`
      : `✨ ${product.name} (${priceText}) — Yurae Botanical Skincare`;
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      showToast('✨ Product link copied to clipboard!', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      showToast('Failed to copy link', 'error');
    }
  };

  const handleWhatsAppShare = () => {
    const url = getShareUrl();
    const title = getShareTitle();
    const categoryTag = isFashion ? 'Luxury Minimalist Fashion' : isAccessories ? 'Artisanal Luxury Jewelry' : 'Korean-Inspired Botanical Skincare';
    const text = `${title}\n🌟 ${categoryTag}\n\n👉 Discover the look & ritual:\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handlePinterestShare = () => {
    const url = getShareUrl();
    const media = selectedImage || (product?.images && product.images[0]?.image_url) || '';
    const desc = `${product?.name || 'Yurae'} — ${product?.short_description || product?.description || 'Luxury Outfits & Skincare by Yurae'}`;
    window.open(
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(media)}&description=${encodeURIComponent(desc)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleInstagramShare = async () => {
    await handleCopyLink();
    showToast('📸 Link copied! Opening Instagram to share with friends or Story...', 'info');
    setTimeout(() => {
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    }, 700);
  };

  if (loading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 bg-[#FDF4F7]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
          <div className="h-[500px] bg-[#FCE7F0] rounded-3xl" />
          <div className="space-y-6">
            <div className="h-8 bg-[#FCE7F0] rounded-md w-3/4" />
            <div className="h-4 bg-[#FCE7F0] rounded-md w-1/4" />
            <div className="h-24 bg-[#FCE7F0] rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  const isSaved = isInWishlist(product.id);
  const currentBasePrice = selectedVariant
    ? (product.sale_price || product.price) + selectedVariant.additional_price
    : (product.sale_price || product.price);

  const categorySlug = product.category?.slug?.toLowerCase() || '';
  const categoryName = product.category?.name?.toLowerCase() || '';
  const isFashion =
    (categorySlug === 'fashion' ||
      categoryName.includes('fashion') ||
      categoryName === 'dresses' ||
      categoryName === 'clothing' ||
      categoryName === 'apparel') &&
    categorySlug !== 'skincare' &&
    categorySlug !== 'accessories';
  const isAccessories =
    categorySlug === 'accessories' ||
    categoryName.includes('accessories') ||
    categoryName.includes('jewelry') ||
    categoryName.includes('bag') ||
    categoryName.includes('pendant') ||
    categoryName.includes('ring') ||
    categoryName.includes('earring');

  const calculatedRating = product.avg_rating || (reviews.length > 0 ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)) : 5.0);
  const effectivePrice = product.sale_price || product.price;

  return (
    <div className="pb-24 pt-8 bg-[#FDF4F7]">
      <SEO
        title={`${product.name} — Luxury ${product.category?.name || 'Beauty'} | YURAE`}
        description={`${product.short_description || (product.description ? product.description.slice(0, 160) + '...' : 'Luxury Korean-inspired formulation.')} ₹${effectivePrice.toLocaleString()} INR. Complimentary express shipping & signature packaging.`}
        image={selectedImage || product.images?.[0]?.image_url || '/images/hero-skincare-model.jpg'}
        type="product"
        price={effectivePrice}
        currency="INR"
        availability={product.stock_quantity > 0 ? 'InStock' : 'OutOfStock'}
        brand="YURAE"
        sku={product.sku || `YURAE-${product.id}`}
        category={product.category?.name || 'Skincare'}
        ratingValue={calculatedRating}
        reviewCount={product.review_count || reviews.length || 1}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: product.category?.name || 'Shop', url: `/shop?category=${product.category?.slug || ''}` },
          { name: product.name, url: `/product/${product.id}` },
        ]}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <nav className="text-xs uppercase tracking-widest text-gray-500 mb-8 flex items-center gap-2">
          <Link to="/" className="hover:text-[#D84B7E]">Home</Link>
          <span>/</span>
          <Link to={`/shop?category=${product.category?.slug}`} className="hover:text-[#D84B7E]">
            {product.category?.name}
          </Link>
          <span>/</span>
          <span className="text-[#111111] font-bold line-clamp-1">{product.name}</span>
        </nav>

        {/* Product Hero Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          
          {/* LEFT: IMAGE GALLERY */}
          <div className="space-y-4">
            <div className="relative aspect-4/5 w-full bg-[#FFF8FA] rounded-3xl overflow-hidden shadow-md border border-[#F1BCCE]">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => toggleWishlist(product)}
                className={`absolute top-4 right-4 p-3 rounded-full shadow-lg transition-all cursor-pointer ${
                  isSaved ? 'bg-[#D84B7E] text-[#FDF4F7]' : 'bg-white/85 backdrop-blur-md text-[#111111] hover:scale-110'
                }`}
              >
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-[#FDF4F7]' : ''}`} />
              </button>
            </div>

            {/* Thumbnail Selectors */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {product.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.image_url)}
                    className={`w-20 h-24 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedImage === img.image_url ? 'border-[#D84B7E] scale-105' : 'border-[#F1BCCE] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: DETAILS & PURCHASING */}
          <div className="space-y-8">
            
            <div className="space-y-3 pb-6 border-b border-[#F1BCCE]">
              <span className="text-xs uppercase tracking-[0.25em] text-[#D84B7E] font-bold">
                {product.category?.name || 'Collection'}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#111111]">
                {product.name}
              </h1>

              {/* Rating */}
              <a
                href="#client-reviews"
                className="flex items-center gap-3 pt-1 group hover:opacity-85 transition-opacity cursor-pointer inline-flex"
                title="Jump to reviews"
              >
                <div className="flex text-[#D84B7E]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(product.avg_rating || 5) ? 'fill-[#D84B7E]' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#111111] group-hover:underline">
                  {product.avg_rating || 5.0} ({product.review_count || reviews.length} client reviews)
                </span>
                <span className="text-[11px] text-[#D84B7E] font-bold group-hover:underline">
                  Write a review ↓
                </span>
              </a>

              {/* Price with Currency Conversion */}
              <div className="flex items-baseline gap-3 pt-3">
                <span className="font-serif text-3xl font-bold text-[#111111]">
                  {formatPrice(currentBasePrice)}
                </span>
                {product.sale_price && (
                  <span className="text-base text-gray-400 line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
                <span className="text-[11px] bg-[#F8D7E3] text-[#D84B7E] px-2.5 py-0.5 rounded-full font-bold border border-[#F1BCCE]">
                  Taxes Included
                </span>
              </div>

              {/* Badges: only show when there are no selectable variants and value is a genuine single attribute */}
              {(!product.variants || product.variants.length === 0) && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {product.weight && (
                    <span className="text-xs bg-[#FFF0F5] text-[#D84B7E] font-bold px-3 py-1 rounded-full border border-[#F1BCCE] flex items-center gap-1.5 shadow-2xs">
                      <span>⚖️</span>
                      <span>Net Wt: {product.weight}</span>
                    </span>
                  )}
                  {product.skin_type && !product.skin_type.toLowerCase().includes('size') && (
                    <span className="text-xs bg-[#F8D7E3] text-[#111111] font-bold px-3 py-1 rounded-full border border-[#F1BCCE]">
                      {product.skin_type}
                    </span>
                  )}
                </div>
              )}

              <p className="text-sm text-gray-700 font-normal leading-relaxed pt-2">
                {product.short_description || product.description}
              </p>
            </div>

            {/* Variants Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs uppercase tracking-widest text-[#111111] font-bold block">
                      Select {product.variants[0].variant_name}
                    </label>
                    {selectedVariant && (
                      <span className="text-xs text-[#D84B7E] font-bold">
                        ({selectedVariant.variant_value})
                      </span>
                    )}
                  </div>

                  {/* Size Guide Button - strictly for Fashion category only */}
                  {isFashion && (
                    <button
                      type="button"
                      onClick={() => setIsSizeChartOpen(true)}
                      className="text-xs text-[#D84B7E] font-bold hover:underline flex items-center gap-1.5 cursor-pointer bg-[#FDF4F7] hover:bg-[#FCE7F0] px-3 py-1 rounded-full border border-[#F1BCCE] transition-all shadow-2xs group"
                    >
                      <Ruler className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
                      <span>Size Guide &amp; Measurements</span>
                    </button>
                  )}
                </div>

                {product.variants.some((v) => v.stock_quantity !== undefined && v.stock_quantity <= 0) && (
                  <div className="text-[11px] text-[#D84B7E] font-medium flex items-center gap-1">
                    <Bell className="w-3 h-3" /> Select a sold-out size to get a restock alert
                  </div>
                )}
                <div className="flex flex-wrap gap-2.5">
                  {product.variants.map((variant) => {
                    const isSelected = selectedVariant?.id === variant.id;
                    const isVariantOutOfStock = variant.stock_quantity !== undefined && variant.stock_quantity <= 0;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isVariantOutOfStock && isSelected
                            ? 'bg-rose-50 border-[#D84B7E] text-[#D84B7E] ring-2 ring-[#F1BCCE] shadow-sm scale-105'
                            : isVariantOutOfStock
                            ? 'bg-gray-100 text-gray-500 border-gray-200 hover:border-[#F1BCCE] hover:text-[#111111]'
                            : isSelected
                            ? 'bg-[#D84B7E] text-[#FDF4F7] border-[#D84B7E] shadow-sm scale-105'
                            : 'bg-[#FFF8FA] border-[#F1BCCE] text-[#111111] hover:border-[#D84B7E]'
                        }`}
                      >
                        <span>{variant.variant_value}</span>
                        {variant.additional_price > 0 && <span>(+{formatPrice(variant.additional_price)})</span>}
                        {isVariantOutOfStock && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            isSelected ? 'bg-[#D84B7E] text-white' : 'bg-red-100 text-red-700'
                          }`}>
                            Sold Out 🔔
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Real-time Inventory Stock Status - units count visible only to Admin */}
            {(() => {
              const currentStock = selectedVariant && selectedVariant.stock_quantity !== undefined
                ? selectedVariant.stock_quantity
                : product.stock_quantity;

              if (currentStock <= 0) {
                return (
                  <div className="pt-1">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-300 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      <span>
                        {selectedVariant
                          ? `Size ${selectedVariant.variant_value} Out of Stock`
                          : 'Out of Stock — Sold Out'}
                      </span>
                    </div>
                  </div>
                );
              }

              if (isAdmin) {
                return (
                  <div className="pt-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-full border border-amber-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>
                        Admin Stock: {currentStock} units in stock
                        {selectedVariant ? ` (${selectedVariant.variant_value})` : ''}
                      </span>
                    </div>
                  </div>
                );
              }

              return null;
            })()}

            {/* Quantity Selector & CTA Buttons */}
            {(() => {
              const currentStock = selectedVariant && selectedVariant.stock_quantity !== undefined
                ? selectedVariant.stock_quantity
                : product.stock_quantity;
              const isOutOfStock = currentStock <= 0;

              const variantKey = selectedVariant ? `${product.id}-${selectedVariant.id}` : `${product.id}-all`;
              const hasSubscribedForCurrent = Boolean(notifiedVariants[variantKey]);

              return (
                <div className="space-y-4 pt-2">
                  {isOutOfStock ? (
                    <div className="p-5 bg-[#FFF0F5] border border-[#F1BCCE] rounded-3xl space-y-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-white text-[#D84B7E] rounded-2xl border border-[#F1BCCE] shrink-0 shadow-2xs">
                          <Bell className="w-5 h-5 animate-bounce" />
                        </div>
                        <div>
                          <h4 className="font-serif text-base font-bold text-[#111111]">
                            {selectedVariant
                              ? `Size ${selectedVariant.variant_value} is Currently Sold Out`
                              : 'This Item is Currently Sold Out'}
                          </h4>
                          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                            Leave your email below to receive an instant priority notification the moment inventory is restocked.
                          </p>
                        </div>
                      </div>

                      {hasSubscribedForCurrent ? (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            ✓ You're on the priority list! We'll alert you at <span className="underline font-bold">{notifyEmail}</span> the moment {selectedVariant ? `Size ${selectedVariant.variant_value}` : 'this item'} returns.
                          </span>
                        </div>
                      ) : (
                        <form onSubmit={handleSubscribeStockAlert} className="space-y-2">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1">
                              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                              <input
                                type="email"
                                value={notifyEmail}
                                onChange={(e) => setNotifyEmail(e.target.value)}
                                required
                                placeholder="Enter your email address..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#F1BCCE] rounded-full text-xs outline-none focus:border-[#D84B7E] text-[#111111]"
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={isSubmittingNotify}
                              className="px-6 py-2.5 bg-[#D84B7E] hover:bg-[#111111] text-white text-xs uppercase tracking-wider font-bold rounded-full transition-all shadow-sm cursor-pointer shrink-0 disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              <Bell className="w-3.5 h-3.5" />
                              {isSubmittingNotify ? 'Registering...' : 'Notify Me'}
                            </button>
                          </div>
                          <p className="text-[10px] text-gray-500 italic pl-1">
                            Private alert • We will only email you once when restocked.
                          </p>
                        </form>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center justify-between border border-[#F1BCCE] rounded-full bg-[#FFF8FA] px-3 py-1.5 min-h-[44px]">
                          <button
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            disabled={isOutOfStock}
                            className="p-1.5 text-gray-600 hover:text-black cursor-pointer disabled:opacity-30 touch-target flex items-center justify-center"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 text-sm font-bold text-[#111111]">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(Math.min(currentStock || 1, quantity + 1))}
                            disabled={isOutOfStock || quantity >= currentStock}
                            className="p-1.5 text-gray-600 hover:text-black cursor-pointer disabled:opacity-30 touch-target flex items-center justify-center"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddToCart}
                          disabled={isOutOfStock}
                          className="flex-1 py-3.5 px-6 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed touch-target min-h-[44px] active:scale-98"
                        >
                          <Plus className="w-4 h-4" />
                          {isFashion
                            ? 'Add to Bag'
                            : isAccessories
                            ? 'Add to Bag'
                            : 'Add to Beauty Bag'}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleBuyNow}
                        disabled={isOutOfStock}
                        className="w-full py-3.5 px-6 bg-[#111111] hover:bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full transition-all shadow-md cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed touch-target min-h-[44px] active:scale-98"
                      >
                        Buy Now — Express Checkout
                      </button>
                    </>
                  )}
                </div>
              );
            })()}

              {isAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full py-3 bg-[#111111] hover:bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md touch-target min-h-[44px]"
                  >
                    <Edit className="w-4 h-4" />
                    Admin: Edit Product & Photos
                  </button>
                  <button
                    onClick={handleDeleteThisProduct}
                    className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs uppercase tracking-widest font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer touch-target min-h-[44px]"
                  >
                    <Trash2 className="w-4 h-4" />
                    Admin: Delete Product
                  </button>
                </div>
              )}

            {/* INSTANT SOCIAL SHARING BAR */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-[#FFF8FA] via-[#FDF4F7] to-[#FFF0F5] border border-[#F1BCCE] rounded-3xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#FCE7F0] border border-[#F1BCCE] flex items-center justify-center text-[#D84B7E] shrink-0">
                    <Share2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                      {isFashion
                        ? 'Share Outfit with Friends'
                        : isAccessories
                        ? 'Share Style with Friends'
                        : 'Share Beauty with Friends'}
                    </h4>
                    <p className="text-[10px] text-gray-500">
                      Send to your group chat, stories, or moodboard
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#D84B7E] bg-pink-100/70 px-2.5 py-0.5 rounded-full border border-[#F1BCCE]">
                  Instant Share
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#E8F8F0] hover:bg-[#D1F2E0] text-[#1B6F45] border border-[#BDE5D0] rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-95 touch-target min-h-[44px] group"
                  title="Share on WhatsApp"
                >
                  <svg className="w-4 h-4 fill-[#25D366] shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.072-1.042-.062-.239-.078-.544-.197-1.258-.507-1.874-.814-3.072-2.73-3.167-2.855-.095-.126-.757-1.007-.757-1.922s.475-1.365.644-1.554c.168-.189.367-.236.49-.236.122 0 .245.001.353.007.113.006.264-.042.413.315.153.367.522 1.272.568 1.365.046.094.076.204.015.326-.061.122-.092.198-.183.305-.091.107-.193.24-.275.322-.092.091-.188.19-.081.374.107.183.476.786 1.021 1.272.702.627 1.294.821 1.478.913.184.092.291.077.399-.046.108-.123.46-.537.583-.721.123-.184.246-.153.414-.092.169.061 1.072.506 1.256.598.184.092.307.138.353.215.046.077.046.444-.098.849z"/>
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.434 5.176L2 22l4.981-1.393A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.167c-1.637 0-3.155-.47-4.437-1.282l-.318-.202-2.956.826.837-2.883-.223-.335A8.136 8.136 0 013.833 12c0-4.503 3.664-8.167 8.167-8.167 4.503 0 8.167 3.664 8.167 8.167 0 4.503-3.664 8.167-8.167 8.167z"/>
                  </svg>
                  <span>WhatsApp</span>
                </button>

                {/* Instagram */}
                <button
                  type="button"
                  onClick={handleInstagramShare}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#FDF0F5] hover:bg-[#FCE2EC] text-[#B82B60] border border-[#F6C2D6] rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-95 group"
                  title="Share on Instagram"
                >
                  <svg className="w-4 h-4 fill-[#E1306C] shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>Instagram</span>
                </button>

                {/* Pinterest */}
                <button
                  type="button"
                  onClick={handlePinterestShare}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#FFF0F2] hover:bg-[#FDE2E6] text-[#C4122C] border border-[#F7C6CD] rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-95 group"
                  title="Pin on Pinterest"
                >
                  <svg className="w-4 h-4 fill-[#E60023] shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.33 1.365-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 12-5.373 12-12 0-6.628-5.393-12-12-12z"/>
                  </svg>
                  <span>Pinterest</span>
                </button>

                {/* Copy Link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-95 group border ${
                    copiedLink
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white hover:bg-[#FDF4F7] text-[#111111] border-[#F1BCCE]'
                  }`}
                  title="Copy Product Link"
                >
                  {copiedLink ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-[#D84B7E] shrink-0 group-hover:rotate-12 transition-transform" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Key Trust Signals */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#F1BCCE] text-center">
              <div className="flex flex-col items-center gap-1.5 p-3 bg-[#FCE7F0]/60 rounded-xl border border-[#F1BCCE]/60">
                <ShieldCheck className="w-5 h-5 text-[#D84B7E]" />
                <span className="text-[10px] uppercase font-bold text-[#111111]">100% Authentic</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 bg-[#FCE7F0]/60 rounded-xl border border-[#F1BCCE]/60">
                <Truck className="w-5 h-5 text-[#D84B7E]" />
                <span className="text-[10px] uppercase font-bold text-[#111111]">Worldwide Express</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 bg-[#FCE7F0]/60 rounded-xl border border-[#F1BCCE]/60">
                <RotateCcw className="w-5 h-5 text-[#D84B7E]" />
                <span className="text-[10px] uppercase font-bold text-[#111111]">7 Days Return</span>
              </div>
            </div>

            {/* EXPANDABLE ACCORDIONS */}
            <div className="space-y-3 pt-6 border-t border-[#F1BCCE]">
              
              {/* Description */}
              <div className="border border-[#F1BCCE] rounded-2xl overflow-hidden bg-[#FFF8FA]">
                <button
                  onClick={() => toggleAccordion('description')}
                  className="w-full px-6 py-4 flex justify-between items-center text-left font-serif text-base font-bold text-[#111111] cursor-pointer"
                >
                  {isFashion
                    ? 'Description & Fit Details'
                    : isAccessories
                    ? 'Description & Craftsmanship'
                    : 'Description & Formulations'}
                  {openAccordions.description ? <ChevronUp className="w-4 h-4 text-[#D84B7E]" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {openAccordions.description && (
                  <div className="px-6 pb-6 text-sm text-gray-700 font-normal leading-relaxed border-t border-[#F1BCCE]">
                    <p>
                      {product.description || (isFashion
                        ? 'Designed with premium luxury fabrics, comfortable tailoring, and refined silhouettes by Yurae.'
                        : isAccessories
                        ? 'Artisanal luxury accessory handcrafted with fine materials and delicate details by Yurae.'
                        : 'Crafted with potent botanical extracts to restore, hydrate, and maintain skin resilience.')}
                    </p>
                  </div>
                )}
              </div>

              {/* FASHION SIZE CHART & GARMENT DIMENSIONS ACCORDION */}
              {isFashion && (
                <div className="border border-[#F1BCCE] rounded-2xl overflow-hidden bg-[#FFF8FA]">
                  <button
                    onClick={() => toggleAccordion('size_chart')}
                    className="w-full px-6 py-4 flex justify-between items-center text-left font-serif text-base font-bold text-[#111111] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-[#D84B7E]" />
                      Size Chart &amp; Garment Dimensions
                    </span>
                    {openAccordions.size_chart ? <ChevronUp className="w-4 h-4 text-[#D84B7E]" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {openAccordions.size_chart && (() => {
                    const text = `${product.name} ${product.category?.name || ''} ${product.description || ''}`.toLowerCase();
                    const isKurti = text.includes('kurti') || text.includes('kurta') || text.includes('anarkali') || text.includes('ethnic');
                    const isTop = text.includes('shirt') || text.includes('top') || text.includes('blouse') || text.includes('tee');
                    const isBottom = text.includes('pant') || text.includes('trouser') || text.includes('jean') || text.includes('bottom') || text.includes('palazzo');
                    const isSaree = text.includes('saree') || text.includes('blouse') || text.includes('lehenga');
                    const isFootwear = text.includes('shoe') || text.includes('sandal') || text.includes('heel') || text.includes('footwear');

                    const getAccordionRows = () => {
                      if (isKurti) {
                        return [
                          { s: 'XS (34)', c1: accordionUnit === 'in' ? '33 - 34"' : '84 - 87 cm', c2: accordionUnit === 'in' ? '28 - 29"' : '71 - 74 cm', c3: accordionUnit === 'in' ? '36 - 37"' : '91 - 94 cm', c4: accordionUnit === 'in' ? '44"' : '112 cm' },
                          { s: 'S (36)', c1: accordionUnit === 'in' ? '35 - 36"' : '88 - 92 cm', c2: accordionUnit === 'in' ? '30 - 31"' : '76 - 79 cm', c3: accordionUnit === 'in' ? '38 - 39"' : '96 - 99 cm', c4: accordionUnit === 'in' ? '45"' : '114 cm' },
                          { s: 'M (38)', c1: accordionUnit === 'in' ? '37 - 38"' : '93 - 97 cm', c2: accordionUnit === 'in' ? '32 - 33"' : '81 - 84 cm', c3: accordionUnit === 'in' ? '40 - 41"' : '101 - 104 cm', c4: accordionUnit === 'in' ? '45.5"' : '115 cm' },
                          { s: 'L (40)', c1: accordionUnit === 'in' ? '39 - 40"' : '98 - 102 cm', c2: accordionUnit === 'in' ? '34 - 35"' : '86 - 89 cm', c3: accordionUnit === 'in' ? '42 - 43"' : '106 - 109 cm', c4: accordionUnit === 'in' ? '46"' : '117 cm' },
                          { s: 'XL (42)', c1: accordionUnit === 'in' ? '41 - 42"' : '103 - 108 cm', c2: accordionUnit === 'in' ? '36 - 37"' : '91 - 95 cm', c3: accordionUnit === 'in' ? '44 - 45"' : '111 - 115 cm', c4: accordionUnit === 'in' ? '46.5"' : '118 cm' },
                          { s: 'XXL (44)', c1: accordionUnit === 'in' ? '43 - 45"' : '109 - 115 cm', c2: accordionUnit === 'in' ? '38 - 40"' : '96 - 102 cm', c3: accordionUnit === 'in' ? '46 - 48"' : '116 - 122 cm', c4: accordionUnit === 'in' ? '47"' : '119 cm' },
                        ];
                      }
                      if (isTop) {
                        return [
                          { s: 'XS', c1: accordionUnit === 'in' ? '31 - 32"' : '78 - 82 cm', c2: accordionUnit === 'in' ? '24 - 25"' : '61 - 64 cm', c3: accordionUnit === 'in' ? '34 - 35"' : '86 - 89 cm', c4: accordionUnit === 'in' ? '24"' : '61 cm' },
                          { s: 'S', c1: accordionUnit === 'in' ? '33 - 34"' : '83 - 87 cm', c2: accordionUnit === 'in' ? '26 - 27"' : '65 - 69 cm', c3: accordionUnit === 'in' ? '36 - 37"' : '90 - 94 cm', c4: accordionUnit === 'in' ? '25"' : '63 cm' },
                          { s: 'M', c1: accordionUnit === 'in' ? '35 - 36"' : '88 - 92 cm', c2: accordionUnit === 'in' ? '28 - 29"' : '70 - 74 cm', c3: accordionUnit === 'in' ? '38 - 39"' : '95 - 99 cm', c4: accordionUnit === 'in' ? '25.5"' : '65 cm' },
                          { s: 'L', c1: accordionUnit === 'in' ? '37 - 39"' : '93 - 99 cm', c2: accordionUnit === 'in' ? '30 - 32"' : '75 - 81 cm', c3: accordionUnit === 'in' ? '40 - 42"' : '100 - 106 cm', c4: accordionUnit === 'in' ? '26"' : '66 cm' },
                          { s: 'XL', c1: accordionUnit === 'in' ? '40 - 42"' : '100 - 107 cm', c2: accordionUnit === 'in' ? '33 - 35"' : '82 - 89 cm', c3: accordionUnit === 'in' ? '43 - 45"' : '107 - 114 cm', c4: accordionUnit === 'in' ? '27"' : '68 cm' },
                          { s: 'XXL', c1: accordionUnit === 'in' ? '43 - 45"' : '108 - 115 cm', c2: accordionUnit === 'in' ? '36 - 38"' : '90 - 97 cm', c3: accordionUnit === 'in' ? '46 - 48"' : '115 - 122 cm', c4: accordionUnit === 'in' ? '28"' : '71 cm' },
                        ];
                      }
                      if (isBottom) {
                        return [
                          { s: 'XS (26)', c1: accordionUnit === 'in' ? '24 - 25"' : '61 - 64 cm', c2: accordionUnit === 'in' ? '34 - 35"' : '86 - 89 cm', c3: accordionUnit === 'in' ? '28"' : '71 cm', c4: accordionUnit === 'in' ? '38"' : '96 cm' },
                          { s: 'S (28)', c1: accordionUnit === 'in' ? '26 - 27"' : '66 - 69 cm', c2: accordionUnit === 'in' ? '36 - 37"' : '91 - 94 cm', c3: accordionUnit === 'in' ? '28.5"' : '72 cm', c4: accordionUnit === 'in' ? '38.5"' : '98 cm' },
                          { s: 'M (30)', c1: accordionUnit === 'in' ? '28 - 29"' : '71 - 74 cm', c2: accordionUnit === 'in' ? '38 - 39"' : '96 - 99 cm', c3: accordionUnit === 'in' ? '29"' : '74 cm', c4: accordionUnit === 'in' ? '39"' : '99 cm' },
                          { s: 'L (32)', c1: accordionUnit === 'in' ? '30 - 32"' : '76 - 81 cm', c2: accordionUnit === 'in' ? '40 - 42"' : '101 - 106 cm', c3: accordionUnit === 'in' ? '29.5"' : '75 cm', c4: accordionUnit === 'in' ? '39.5"' : '100 cm' },
                          { s: 'XL (34)', c1: accordionUnit === 'in' ? '33 - 35"' : '84 - 89 cm', c2: accordionUnit === 'in' ? '43 - 45"' : '109 - 114 cm', c3: accordionUnit === 'in' ? '30"' : '76 cm', c4: accordionUnit === 'in' ? '40"' : '102 cm' },
                          { s: 'XXL (36)', c1: accordionUnit === 'in' ? '35 - 37"' : '89 - 94 cm', c2: accordionUnit === 'in' ? '45 - 47"' : '114 - 119 cm', c3: accordionUnit === 'in' ? '30"' : '76 cm', c4: accordionUnit === 'in' ? '40.5"' : '103 cm' },
                        ];
                      }
                      if (isFootwear) {
                        return [
                          { s: 'UK 3', c1: 'US 5', c2: 'EU 36', c3: accordionUnit === 'in' ? '8.86"' : '22.5 cm', c4: 'IND 3' },
                          { s: 'UK 4', c1: 'US 6', c2: 'EU 37', c3: accordionUnit === 'in' ? '9.17"' : '23.3 cm', c4: 'IND 4' },
                          { s: 'UK 5', c1: 'US 7', c2: 'EU 38', c3: accordionUnit === 'in' ? '9.49"' : '24.1 cm', c4: 'IND 5' },
                          { s: 'UK 6', c1: 'US 8', c2: 'EU 39', c3: accordionUnit === 'in' ? '9.84"' : '25.0 cm', c4: 'IND 6' },
                          { s: 'UK 7', c1: 'US 9', c2: 'EU 40', c3: accordionUnit === 'in' ? '10.15"' : '25.8 cm', c4: 'IND 7' },
                          { s: 'UK 8', c1: 'US 10', c2: 'EU 41', c3: accordionUnit === 'in' ? '10.47"' : '26.6 cm', c4: 'IND 8' },
                        ];
                      }
                      // Default: Dresses & Gowns
                      return [
                        { s: 'XS', c1: accordionUnit === 'in' ? '31 - 32"' : '78 - 82 cm', c2: accordionUnit === 'in' ? '24 - 25"' : '61 - 64 cm', c3: accordionUnit === 'in' ? '34 - 35"' : '86 - 89 cm', c4: accordionUnit === 'in' ? '46"' : '117 cm' },
                        { s: 'S', c1: accordionUnit === 'in' ? '33 - 34"' : '83 - 87 cm', c2: accordionUnit === 'in' ? '26 - 27"' : '65 - 69 cm', c3: accordionUnit === 'in' ? '36 - 37"' : '90 - 94 cm', c4: accordionUnit === 'in' ? '47"' : '119 cm' },
                        { s: 'M', c1: accordionUnit === 'in' ? '35 - 36"' : '88 - 92 cm', c2: accordionUnit === 'in' ? '28 - 29"' : '70 - 74 cm', c3: accordionUnit === 'in' ? '38 - 39"' : '95 - 99 cm', c4: accordionUnit === 'in' ? '48"' : '122 cm' },
                        { s: 'L', c1: accordionUnit === 'in' ? '37 - 39"' : '93 - 99 cm', c2: accordionUnit === 'in' ? '30 - 32"' : '75 - 81 cm', c3: accordionUnit === 'in' ? '40 - 42"' : '100 - 106 cm', c4: accordionUnit === 'in' ? '49"' : '124 cm' },
                        { s: 'XL', c1: accordionUnit === 'in' ? '40 - 42"' : '100 - 107 cm', c2: accordionUnit === 'in' ? '33 - 35"' : '82 - 89 cm', c3: accordionUnit === 'in' ? '43 - 45"' : '107 - 114 cm', c4: accordionUnit === 'in' ? '50"' : '127 cm' },
                        { s: 'XXL', c1: accordionUnit === 'in' ? '43 - 45"' : '108 - 115 cm', c2: accordionUnit === 'in' ? '36 - 38"' : '90 - 97 cm', c3: accordionUnit === 'in' ? '46 - 48"' : '115 - 122 cm', c4: accordionUnit === 'in' ? '51"' : '129 cm' },
                      ];
                    };

                    const col1Header = isBottom ? 'Waist' : isFootwear ? 'US Size' : 'Bust';
                    const col2Header = isBottom ? 'Hips' : isFootwear ? 'EU Size' : 'Waist';
                    const col3Header = isBottom ? 'Inseam' : isFootwear ? 'Foot Length' : 'Hips';
                    const col4Header = isBottom ? 'Length' : isFootwear ? 'Standard' : 'Length';

                    return (
                      <div className="px-6 pb-6 text-xs text-gray-700 space-y-3.5 border-t border-[#F1BCCE]">
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">
                              Silhouette Measurements:
                            </span>
                            <div className="bg-white p-0.5 rounded-lg border border-[#F1BCCE] flex items-center shadow-2xs text-[11px]">
                              <button
                                type="button"
                                onClick={() => setAccordionUnit('in')}
                                className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                                  accordionUnit === 'in' ? 'bg-[#D84B7E] text-white' : 'text-gray-600'
                                }`}
                              >
                                in
                              </button>
                              <button
                                type="button"
                                onClick={() => setAccordionUnit('cm')}
                                className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                                  accordionUnit === 'cm' ? 'bg-[#D84B7E] text-white' : 'text-gray-600'
                                }`}
                              >
                                cm
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsSizeChartOpen(true)}
                            className="text-[#D84B7E] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Ruler className="w-3 h-3" />
                            <span>Full Guide &amp; Smart Fit Finder</span>
                          </button>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-[#F1BCCE] bg-white shadow-2xs">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-[#FCE7F0]/80 text-[#111111] border-b border-[#F1BCCE]">
                                <th className="py-2.5 px-3 font-bold">Size</th>
                                <th className="py-2.5 px-3 font-bold">{col1Header}</th>
                                <th className="py-2.5 px-3 font-bold">{col2Header}</th>
                                <th className="py-2.5 px-3 font-bold">{col3Header}</th>
                                <th className="py-2.5 px-3 font-bold">{col4Header}</th>
                                <th className="py-2.5 px-3 font-bold text-right">Select</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#FCE7F0]">
                              {getAccordionRows().map((row) => {
                                const isCur = selectedVariant && (
                                  selectedVariant.variant_value.toUpperCase() === row.s.toUpperCase() ||
                                  selectedVariant.variant_value.toUpperCase().startsWith(row.s.split(' ')[0].toUpperCase()) ||
                                  row.s.toUpperCase().startsWith(selectedVariant.variant_value.toUpperCase())
                                );
                                return (
                                  <tr
                                    key={row.s}
                                    className={`hover:bg-[#FFF8FA] transition-colors ${
                                      isCur ? 'bg-[#FFF0F5] font-bold text-[#D84B7E]' : ''
                                    }`}
                                  >
                                    <td className="py-2 px-3 font-bold">{row.s}</td>
                                    <td className="py-2 px-3">{row.c1}</td>
                                    <td className="py-2 px-3">{row.c2}</td>
                                    <td className="py-2 px-3">{row.c3}</td>
                                    <td className="py-2 px-3">{row.c4}</td>
                                    <td className="py-2 px-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const clean = row.s.split(' ')[0];
                                          const match = product.variants?.find((v) =>
                                            v.variant_value.toLowerCase().startsWith(clean.toLowerCase()) ||
                                            clean.toLowerCase().startsWith(v.variant_value.toLowerCase())
                                          );
                                          if (match) {
                                            setSelectedVariant(match);
                                            showToast(`✨ Selected Size ${match.variant_value}`, 'success');
                                          } else {
                                            showToast(`Size ${row.s} is not currently available for this piece`, 'info');
                                          }
                                        }}
                                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold transition-all cursor-pointer ${
                                          isCur
                                            ? 'bg-[#D84B7E] text-white shadow-2xs'
                                            : 'bg-[#FDF4F7] text-[#D84B7E] border border-[#F1BCCE] hover:bg-[#D84B7E] hover:text-white'
                                        }`}
                                      >
                                        {isCur ? 'Selected ✓' : 'Pick'}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <p className="text-[11px] text-gray-500 italic">
                          * Tailored fit. If in between sizes or desiring a flowy relaxed silhouette, we recommend sizing up.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Ingredients / Fabric / Material */}
              {product.ingredients && product.ingredients.trim() && (
                <div className="border border-[#F1BCCE] rounded-2xl overflow-hidden bg-[#FFF8FA]">
                  <button
                    onClick={() => toggleAccordion('ingredients')}
                    className="w-full px-6 py-4 flex justify-between items-center text-left font-serif text-base font-bold text-[#111111] cursor-pointer"
                  >
                    {isFashion
                      ? 'Fabric & Material Composition'
                      : isAccessories
                      ? 'Material & Finish Details'
                      : 'Hero Ingredients & Actives'}
                    {openAccordions.ingredients ? <ChevronUp className="w-4 h-4 text-[#D84B7E]" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {openAccordions.ingredients && (
                    <div className="px-6 pb-6 text-sm text-gray-700 font-normal leading-relaxed border-t border-[#F1BCCE]">
                      <p>{product.ingredients}</p>
                    </div>
                  )}
                </div>
              )}

              {/* How to Use / Garment Care Guide */}
              {product.how_to_use && product.how_to_use.trim() && (
                <div className="border border-[#F1BCCE] rounded-2xl overflow-hidden bg-[#FFF8FA]">
                  <button
                    onClick={() => toggleAccordion('how_to_use')}
                    className="w-full px-6 py-4 flex justify-between items-center text-left font-serif text-base font-bold text-[#111111] cursor-pointer"
                  >
                    {isFashion
                      ? 'Garment Care & Sizing Guide'
                      : isAccessories
                      ? 'Jewelry Care & Preservation'
                      : 'Ritual & Application Guide'}
                    {openAccordions.how_to_use ? <ChevronUp className="w-4 h-4 text-[#D84B7E]" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {openAccordions.how_to_use && (
                    <div className="px-6 pb-6 text-sm text-gray-700 font-normal leading-relaxed border-t border-[#F1BCCE]">
                      <p>{product.how_to_use}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Shipping & Delivery Info */}
              <div className="border border-[#F1BCCE] rounded-2xl overflow-hidden bg-[#FFF8FA]">
                <button
                  onClick={() => toggleAccordion('shipping')}
                  className="w-full px-6 py-4 flex justify-between items-center text-left font-serif text-base font-bold text-[#111111] cursor-pointer"
                >
                  Global Shipping & Delivery
                  {openAccordions.shipping ? <ChevronUp className="w-4 h-4 text-[#D84B7E]" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {openAccordions.shipping && (
                  <div className="px-6 pb-6 text-xs text-gray-600 font-normal leading-relaxed space-y-2 border-t border-[#F1BCCE]">
                    <p>• <strong>Domestic India</strong>: Express courier delivery in 2-4 business days.</p>
                    <p>• <strong>International (US, UK, Europe, Asia, Australia)</strong>: Priority international shipping delivered in 4-8 business days with live tracking.</p>
                    <p>• Free shipping applies automatically on qualifying orders above {formatPrice(1500)} ({currentCurrencyInfo.symbol}{currentCurrencyInfo.free_shipping_threshold}).</p>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* CLIENT REVIEWS SECTION */}
        <section id="client-reviews" className="mt-20 pt-12 border-t border-[#F1BCCE]">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-[#D84B7E] font-bold">Client Feedback</span>
              <h2 className="font-serif text-3xl font-bold text-[#111111]">
                {isFashion || isAccessories ? 'Client Reviews' : 'Ritual Reviews'}
              </h2>
            </div>

            {/* Submit Review Box */}
            <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl space-y-4 shadow-xs">
              <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-[#F1BCCE]">
                <h3 className="font-serif text-lg font-bold text-[#111111]">
                  {reviewEligibility?.has_reviewed ? 'Edit Your Review' : 'Share Your Experience'}
                </h3>
                {reviewEligibility?.is_delivered ? (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded-full tracking-wider border border-emerald-300">
                    ✓ Verified Delivered Buyer
                  </span>
                ) : reviewEligibility?.has_purchased ? (
                  <span className="px-3 py-1 bg-pink-100 text-[#D84B7E] text-[10px] font-bold uppercase rounded-full tracking-wider border border-[#F1BCCE]">
                    ✓ Verified Customer
                  </span>
                ) : isAuthenticated ? (
                  <span className="px-3 py-1 bg-white text-gray-700 text-[10px] font-bold uppercase rounded-full tracking-wider border border-[#F1BCCE]">
                    ★ Community Review
                  </span>
                ) : null}
              </div>

              {!isAuthenticated ? (
                <div className="p-6 bg-[#FDF4F7] border border-[#F1BCCE] rounded-2xl text-center space-y-3">
                  <p className="text-xs text-gray-700">
                    Please sign in to write a review and share your {isFashion ? 'fashion look' : isAccessories ? 'styling photo' : 'skincare glow'}.
                  </p>
                  <a
                    href={`/login?redirect=/product/${slug}`}
                    className="inline-block px-6 py-2 bg-[#D84B7E] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#111111] transition-all shadow-xs"
                  >
                    Sign In to Write a Review
                  </a>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">
                      Your Rating *
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= reviewRating ? 'fill-[#D84B7E] text-[#D84B7E]' : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">
                      Review *
                    </label>
                    <textarea
                      rows={3}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder={
                        isFashion
                          ? 'Describe fabric comfort, quality, sizing fit, and elegance...'
                          : isAccessories
                          ? 'Describe material finish, shine, craftsmanship, and styling...'
                          : 'Describe formulation texture, hydration, scent, and radiance results...'
                      }
                      className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
                      required
                    />
                  </div>

                  {/* Photo Upload for Skincare Glow / Fashion Look */}
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-[#D84B7E]" />
                        {isFashion
                          ? 'Upload Your Fashion Look Photo (Optional)'
                          : isAccessories
                          ? 'Upload Styling Photo (Optional)'
                          : 'Upload Your Skincare Glow Photo (Optional)'}
                      </span>
                      {isUploadingPhoto && (
                        <span className="text-[10px] text-[#D84B7E] font-bold animate-pulse">
                          Uploading photo...
                        </span>
                      )}
                    </label>

                    {reviewPhotoUrl ? (
                      <div className="flex items-center gap-3 p-3 bg-[#FDF4F7] border border-[#F1BCCE] rounded-2xl">
                        <div className="relative group">
                          <img
                            src={reviewPhotoUrl}
                            alt="Glow Preview"
                            className="w-16 h-16 rounded-xl object-cover border border-[#F1BCCE]"
                          />
                          <button
                            type="button"
                            onClick={() => setReviewPhotoUrl('')}
                            className="absolute -top-1.5 -right-1.5 p-1 bg-[#D84B7E] text-white rounded-full hover:bg-black transition-colors cursor-pointer shadow-xs"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex-1 text-xs">
                          <p className="font-bold text-gray-800">📸 Photo Attached</p>
                          <p className="text-[11px] text-gray-500">
                            Your photo will be showcased in the client review gallery.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-3 bg-[#FDF4F7] border border-dashed border-[#F1BCCE] hover:border-[#D84B7E] rounded-2xl cursor-pointer transition-colors text-xs font-bold text-gray-700">
                        <Upload className="w-4 h-4 text-[#D84B7E]" />
                        <span>Upload photo of your glow or look</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoFileChange}
                          className="hidden"
                          disabled={isUploadingPhoto}
                        />
                      </label>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview || isUploadingPhoto}
                    className="px-6 py-2.5 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isSubmittingReview
                      ? 'Publishing...'
                      : reviewEligibility?.has_reviewed
                      ? 'Update Review'
                      : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-center py-8 text-sm text-gray-500 font-light">
                  Be the first client to review this product and share your glow!
                </p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#111111]">{r.user_name}</span>
                          {r.is_verified_buyer ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase rounded-full border border-emerald-300">
                              ✓ Verified Buyer
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-pink-50 text-[#D84B7E] text-[9px] font-bold uppercase rounded-full border border-[#F1BCCE]">
                              ✓ Verified Reviewer
                            </span>
                          )}
                        </div>
                        <div className="flex text-[#D84B7E] mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-[#D84B7E]' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>

                    <p className="text-sm font-serif italic text-gray-800 leading-relaxed">{r.review}</p>

                    {/* Customer Glow Photo */}
                    {r.photo_url && (
                      <div className="pt-2 border-t border-[#F1BCCE]/40">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-[#D84B7E] flex items-center gap-1 mb-1.5">
                          <Sparkles className="w-3 h-3" /> Client Glow & Styling Showcase
                        </span>
                        <div
                          onClick={() => setZoomedPhotoUrl(r.photo_url!)}
                          className="relative inline-block group cursor-pointer overflow-hidden rounded-xl border border-[#F1BCCE] shadow-xs"
                        >
                          <img
                            src={r.photo_url}
                            alt="Customer Glow"
                            className="w-24 h-24 sm:w-32 sm:h-32 object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                            <ZoomIn className="w-3.5 h-3.5" /> View Photo
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Fullscreen Photo Lightbox Modal */}
        {zoomedPhotoUrl && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setZoomedPhotoUrl(null)}
          >
            <div
              className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setZoomedPhotoUrl(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={zoomedPhotoUrl}
                alt="Customer Glow Showcase"
                className="w-full max-h-[80vh] object-contain rounded-2xl"
              />
              <div className="p-3 text-center text-xs font-serif italic text-gray-700">
                ✨ Verified Customer Glow & Look on Yurae Beauty
              </div>
            </div>
          </div>
        )}

        {/* COMPLEMENTARY PRODUCTS SECTION */}
        {relatedProducts.length > 0 && (() => {
          const catSlug = product?.category?.slug?.toLowerCase() || '';
          const catName = product?.category?.name?.toLowerCase() || '';
          const prodName = product?.name?.toLowerCase() || '';
          const isSkincare = catSlug.includes('skincare') || catName.includes('skincare');
          const isFashion = catSlug.includes('fashion') || catName.includes('fashion') || ['dress', 'kurti', 'skirt', 'top', 'saree'].some((w) => prodName.includes(w));
          const isAccessories = catSlug.includes('accessories') || catName.includes('accessories') || ['ring', 'chain', 'necklace', 'earring', 'jewelry', 'bag'].some((w) => prodName.includes(w));

          let sectionPill = '✨ Recommended Pairings';
          let sectionTitle = 'Complete Your Ritual — Complementary Products';
          let sectionSubtitle = 'Specially curated items crafted to harmonize seamlessly with your selection.';

          if (isSkincare) {
            sectionPill = '✨ Botanical Routine Harmony';
            sectionTitle = 'Complete Your Skincare Ritual';
            sectionSubtitle = `Pair your ${product?.name || 'selection'} with matching routine steps for optimal hydration and a luminous glow.`;
          } else if (isFashion) {
            sectionPill = '✨ Styled For You';
            sectionTitle = 'Complete The Look — Recommended Pairings & Jewelry';
            sectionSubtitle = `Handpicked luxury jewelry and accents tailored to elevate and complement this piece.`;
          } else if (isAccessories) {
            sectionPill = '✨ Coordinated Pairings';
            sectionTitle = 'Complete Your Ensemble';
            sectionSubtitle = `Ready-to-wear fashion and matching jewelry designed to accompany this luxury piece.`;
          }

          return (
            <section className="mt-20 pt-12 border-t border-[#F1BCCE]">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FCE7F0] border border-[#F1BCCE] text-[#D84B7E] text-[11px] uppercase tracking-wider font-bold rounded-full mb-2">
                    {sectionPill}
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111]">
                    {sectionTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl font-light">
                    {sectionSubtitle}
                  </p>
                </div>
                <div className="hidden sm:block">
                  <span className="text-xs text-gray-500 font-bold">
                    Showing 4 Curated Recommendations
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.slice(0, 4).map((relProduct) => (
                  <ProductCard key={relProduct.id} product={relProduct} />
                ))}
              </div>
            </section>
          );
        })()}

        {/* Admin Edit Modal */}
        {isEditModalOpen && product && (
          <ProductFormModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            productToEdit={product}
            categories={categories}
            initialCategorySlug={product.category?.slug}
            onSuccess={handleProductEditSuccess}
          />
        )}

        {/* Fashion Size Chart Modal - strictly for Fashion category */}
        {isFashion && (
          <SizeChartModal
            isOpen={isSizeChartOpen}
            onClose={() => setIsSizeChartOpen(false)}
            productName={product.name}
            categoryName={product.category?.name}
            productDescription={product.description || product.short_description}
            selectedSize={selectedVariant?.variant_value}
            onSelectSize={(sizeName) => {
              const found = product.variants?.find((v) =>
                v.variant_value.toLowerCase().startsWith(sizeName.toLowerCase()) ||
                sizeName.toLowerCase().startsWith(v.variant_value.toLowerCase())
              );
              if (found) {
                setSelectedVariant(found);
                showToast(`✨ Selected Size ${found.variant_value}`, 'success');
              } else {
                showToast(`Size ${sizeName} is not currently available for this piece`, 'info');
              }
            }}
          />
        )}

      </div>
    </div>
  );
};
