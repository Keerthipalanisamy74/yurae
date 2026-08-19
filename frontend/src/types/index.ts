export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'ADMIN';
  is_active: boolean;
  created_at: string;
}

export interface Address {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  created_at: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  sort_order: number;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  variant_name: string;
  variant_value: string;
  additional_price: number;
  stock_quantity: number;
}

export interface Review {
  id: number;
  user_id: number;
  product_id: number;
  rating: number;
  review: string;
  is_approved: boolean;
  created_at: string;
  user_name?: string;
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price: number;
  sale_price?: number;
  base_currency?: string;
  stock_quantity: number;
  sku: string;
  brand: string;
  weight?: string;
  ingredients?: string;
  how_to_use?: string;
  skin_type?: string;
  status: 'ACTIVE' | 'DRAFT' | 'OUT_OF_STOCK';
  featured: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  images: ProductImage[];
  variants: ProductVariant[];
  avg_rating?: number;
  review_count?: number;
}

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  variant_id?: number;
  quantity: number;
  price: number;
  product: Product;
  variant?: ProductVariant;
}

export interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
  subtotal: number;
  item_count: number;
}

export interface WishlistItem {
  id: number;
  user_id: number;
  product_id: number;
  created_at: string;
  product: Product;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  variant_info?: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  user_id: number;
  address_id?: number;
  order_number: string;
  currency?: string;
  exchange_rate?: number;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  tax?: number;
  total_amount: number;
  payment_status: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  order_status: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned';
  created_at: string;
  items: OrderItem[];
  address?: Address;
  payments?: any[];
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  minimum_order_amount: number;
  expiry_date?: string;
  usage_limit: number;
  times_used: number;
  active: boolean;
}

export interface CouponApplyResult {
  valid: boolean;
  code: string;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  message: string;
}

export interface AdminDashboardStats {
  total_sales: number;
  total_orders: number;
  total_customers: number;
  total_products: number;
  pending_orders: number;
  low_stock_products: number;
  recent_orders: Order[];
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  symbol_native: string;
  decimal_digits: number;
  flag: string;
  country: string;
  default_shipping_fee: number;
  free_shipping_threshold: number;
}

export interface ExchangeRatesResponse {
  base_currency: string;
  rates: Record<string, number>;
  currencies: CurrencyInfo[];
  last_updated: string;
}
