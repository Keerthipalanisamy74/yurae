import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Heart, Plus, Minus, ShieldCheck, Truck, RotateCcw, ChevronDown, ChevronUp, Trash2, Edit } from 'lucide-react';
import { Product, ProductVariant, Review, Category } from '../types';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { ProductCard } from '../components/common/ProductCard';
import { ProductFormModal } from '../components/common/ProductFormModal';

export const ProductDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const { isAuthenticated, isAdmin } = useAuth();
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

  // Accordion state
  const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({
    description: true,
    ingredients: true,
    how_to_use: false,
    suitable_for: false,
    shipping: false,
  });

  // Review Form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    api.get(`/products/${slug}`)
      .then((res) => {
        const prodData: Product = res.data;
        setProduct(prodData);
        setSelectedImage(prodData.images[0]?.image_url || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80');
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

        api.get(`/products?category_slug=${prodData.category?.slug}&limit=4`)
          .then((relRes) => setRelatedProducts(relRes.data.filter((p: Product) => p.id !== prodData.id)))
          .catch((err) => console.error(err));
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
      });
      setReviews((prev) => [res.data, ...prev]);
      setReviewText('');
      showToast('Thank you! Your review has been submitted.', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to submit review. Only verified purchasers can review.';
      showToast(msg, 'error');
    } finally {
      setIsSubmittingReview(false);
    }
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
  const isFashion = categorySlug === 'fashion' || categoryName.includes('fashion') || categoryName.includes('dress') || categoryName.includes('apparel') || categoryName.includes('kurti') || categoryName.includes('saree') || categoryName.includes('clothing');
  const isAccessories = categorySlug === 'accessories' || categoryName.includes('accessories') || categoryName.includes('jewelry') || categoryName.includes('bag') || categoryName.includes('pendant') || categoryName.includes('ring') || categoryName.includes('earring');

  return (
    <div className="pb-24 pt-8 bg-[#FDF4F7]">
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
              <div className="flex items-center gap-3 pt-1">
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
                <span className="text-xs font-bold text-[#111111]">
                  {product.avg_rating || 5.0} ({product.review_count || reviews.length} client reviews)
                </span>
              </div>

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

              {/* Short Desc */}
              <p className="text-sm text-gray-700 font-normal leading-relaxed pt-2">
                {product.short_description || product.description}
              </p>
            </div>

            {/* Variants Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-widest text-[#111111] font-bold block">
                  Select {product.variants[0].variant_name}
                </label>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedVariant?.id === variant.id
                          ? 'bg-[#D84B7E] text-[#FDF4F7] border-[#D84B7E] shadow-sm scale-105'
                          : 'bg-[#FFF8FA] border-[#F1BCCE] text-[#111111] hover:border-[#D84B7E]'
                      }`}
                    >
                      {variant.variant_value}
                      {variant.additional_price > 0 && ` (+${formatPrice(variant.additional_price)})`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector & CTA Buttons */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-[#F1BCCE] rounded-full bg-[#FFF8FA] px-3 py-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-1 text-gray-600 hover:text-black cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-bold text-[#111111]">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-1 text-gray-600 hover:text-black cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3.5 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {isFashion ? 'Add to Bag' : isAccessories ? 'Add to Bag' : 'Add to Beauty Bag'}
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                className="w-full py-3.5 bg-[#111111] hover:bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full transition-all shadow-md cursor-pointer"
              >
                Buy Now — Express Checkout
              </button>

              {isAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full py-3 bg-[#111111] hover:bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Edit className="w-4 h-4" />
                    Admin: Edit Product & Photos
                  </button>
                  <button
                    onClick={handleDeleteThisProduct}
                    className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs uppercase tracking-widest font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Admin: Delete Product
                  </button>
                </div>
              )}
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
        <section className="mt-20 pt-12 border-t border-[#F1BCCE]">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-[#D84B7E] font-bold">Client Feedback</span>
              <h2 className="font-serif text-3xl font-bold text-[#111111]">
                {isFashion || isAccessories ? 'Client Reviews' : 'Ritual Reviews'}
              </h2>
            </div>

            {/* Submit Review Box */}
            <div className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-3xl space-y-4 shadow-xs">
              <h3 className="font-serif text-lg font-bold text-[#111111]">Share Your Experience</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Your Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-[#D84B7E] text-[#D84B7E]' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1">Written Review</label>
                  <textarea
                    rows={3}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder={
                      isFashion
                        ? 'Describe fabric comfort, quality, sizing fit, and elegance...'
                        : isAccessories
                        ? 'Describe material finish, shine, craftsmanship, and styling...'
                        : 'Describe formulation texture, hydration, scent, and results...'
                    }
                    className="w-full bg-[#FDF4F7] border border-[#F1BCCE] rounded-xl p-3 text-sm outline-none focus:border-[#D84B7E]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-6 py-2.5 bg-[#D84B7E] text-[#FDF4F7] text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#111111] transition-colors cursor-pointer"
                >
                  Submit Review
                </button>
              </form>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-center py-8 text-sm text-gray-500 font-light">Be the first client to review this product!</p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="p-6 bg-[#FFF8FA] border border-[#F1BCCE] rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-[#111111]">{r.user_name}</span>
                      <span className="text-[10px] text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex text-[#D84B7E]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-[#D84B7E]' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <p className="text-sm font-serif italic text-gray-800 leading-relaxed pt-1">{r.review}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-[#F1BCCE]">
            <h2 className="font-serif text-2xl font-bold text-[#111111] mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => (
                <ProductCard key={relProduct.id} product={relProduct} />
              ))}
            </div>
          </section>
        )}

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

      </div>
    </div>
  );
};
