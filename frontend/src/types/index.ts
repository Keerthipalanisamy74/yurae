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
  address_type?: string; // 'Home' | 'Office' | 'Parents' | 'Other'
  name: string;
  phone: string;
  street?: string;
  address_line1: string;
  address_line2?: string;
  building_or_flat?: string;
  landmark?: string;
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
  photo_url?: string;
  is_approved: boolean;
  created_at: string;
  user_name?: string;
  is_verified_buyer?: boolean;
  product_name?: string;
  product_slug?: string;
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
  weight_kg?: number;
  length_cm?: number;
  breadth_cm?: number;
  height_cm?: number;
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
  payment_status: 'Pending' | 'Paid' | 'Failed' | 'Refunded' | string;
  order_status: 'Pending' | 'Confirmed' | 'Processing' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned' | string;
  
  // Shipping & Fulfillment
  shipping_status?: 'NOT_CREATED' | 'SHIPMENT_CREATED' | 'AWB_ASSIGNED' | 'PICKUP_SCHEDULED' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'CANCELLED' | 'RTO' | string;
  shiprocket_order_id?: string;
  shiprocket_shipment_id?: string;
  awb_code?: string;
  courier_name?: string;
  courier_id?: number;
  tracking_url?: string;
  shipping_label_url?: string;
  shipping_manifest_url?: string;
  pickup_scheduled_date?: string;
  pickup_token_number?: string;
  estimated_delivery_date?: string;
  shipping_error_log?: string;
  is_cod?: boolean;
  cod_amount?: number;

  // Enterprise OMS & Operations
  priority?: 'NORMAL' | 'HIGH' | 'URGENT' | string;
  assigned_staff?: string;
  shipping_method?: string;
  gst_number?: string;
  packing_checklist?: string;
  invoice_number?: string;
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  fulfillment_status?: string;
  picked_at?: string;
  qc_at?: string;
  packed_at?: string;
  invoice_generated_at?: string;
  shipping_label_generated_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  internal_notes?: string;
  gift_wrap?: boolean;
  gift_message?: string;
  free_samples_included?: string;

  created_at: string;
  updated_at?: string;
  items: OrderItem[];
  address?: Address;
  payments?: any[];
  user?: User;
}

export interface CardStat {
  key: string;
  label: string;
  count: number;
  total_revenue: number;
  today_count: number;
  weekly_count: number;
  monthly_count: number;
  icon?: string;
  color?: string;
}

export interface OrderAnalyticsSummary {
  cards: Record<string, CardStat>;
  total_revenue: number;
  average_order_value: number;
  cancellation_rate: number;
  return_rate: number;
  repeat_customer_rate: number;
  top_products: Array<{
    product_name: string;
    quantity: number;
    revenue: number;
    orders_count: number;
  }>;
  top_categories: Array<{
    category_name: string;
    units_sold: number;
    revenue: number;
  }>;
  top_customers: Array<{
    user_id: number;
    customer_name: string;
    email: string;
    total_spend: number;
    order_count: number;
  }>;
}

export interface OrderAlert {
  type: string;
  severity: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
}

export interface OrderTimelineEvent {
  stage: string;
  title: string;
  description: string;
  actor: string;
  timestamp: string | null;
}

export interface Order360Detail {
  order: Order;
  customer: {
    user_id?: number;
    name: string;
    email: string;
    phone: string;
    account_created_at: string;
    total_orders: number;
    lifetime_spend: number;
    is_active: boolean;
  };
  items: Array<{
    id: number;
    product_id: number;
    product_name: string;
    sku: string;
    variant_info?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    image_url: string;
    category: string;
    live_warehouse_stock: number;
    weight_kg: number;
    hsn_code: string;
  }>;
  picklist: {
    picklist_number: string;
    assigned_staff_name: string;
    status: string;
    items: Array<{
      id: number;
      product_name: string;
      sku: string;
      variant_info?: string;
      shelf_location?: string;
      quantity_required: number;
      quantity_picked: number;
      status: string;
    }>;
  };
  packing_checklist: Record<string, any>;
  packing_logs: Array<{
    id: number;
    packer_name?: string;
    box_type?: string;
    total_weight_kg: number;
    created_at?: string;
    notes?: string;
  }>;
  alerts: OrderAlert[];
  timeline: OrderTimelineEvent[];
  internal_notes: string;
  gst_invoice_number: string;
  shipping_label_url: string;
  tax_invoice_url: string;
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

export interface ContactMessage {
  id: number;
  source?: 'CONTACT_FORM' | 'ORDER_QUERY';
  order_number?: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  rating?: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED';
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface CourierOption {
  courier_id: number;
  courier_name: string;
  rate: number;
  estimated_delivery_days: string;
  etd?: string;
  rating?: number;
  is_cod_available: boolean;
  is_recommended: boolean;
  service_tier?: 'STANDARD' | 'EXPRESS';
  currency?: string;
}

export interface ServiceabilityResult {
  pincode?: string;
  postal_code?: string;
  country?: string;
  city?: string;
  state?: string;
  is_serviceable: boolean;
  delivery_status_message: string;
  estimated_delivery: string;
  shipping_fee: number;
  is_free: boolean;
  free_shipping_threshold: number;
  recommended_courier?: string;
  available_couriers: CourierOption[];
  currency?: string;
  is_international?: boolean;
  customs_notice?: string;
}

export interface TrackingTimelineEvent {
  id: number;
  order_id: number;
  awb_code?: string;
  status: string;
  activity: string;
  location?: string;
  event_time: string;
}

export interface TrackingResponse {
  order_number: string;
  awb_code?: string;
  courier_name?: string;
  current_status: string;
  shipping_status: string;
  estimated_delivery?: string;
  tracking_url?: string;
  pickup_date?: string;
  events: TrackingTimelineEvent[];
}

export interface ShippingSettings {
  shipping_provider: string;
  shipping_mode: string;
  cod_enabled: boolean;
  flat_shipping_fee: number;
  free_shipping_threshold: number;
  cod_surcharge: number;
  default_package_weight_kg: number;
  default_package_length_cm: number;
  default_package_breadth_cm: number;
  default_package_height_cm: number;
  warehouse_contact_name: string;
  warehouse_email: string;
  warehouse_phone: string;
  warehouse_address: string;
  warehouse_address_2?: string;
  warehouse_city: string;
  warehouse_state: string;
  warehouse_pincode: string;
  warehouse_country: string;
  is_shiprocket_connected: boolean;
}

export interface ReturnRequest {
  id: number;
  request_number: string;
  order_id: number;
  user_id: number;
  request_type: 'EXCHANGE' | 'RETURN_REFUND';
  reason: string;
  detailed_reason?: string;
  preferred_exchange_size?: string;
  refund_mode?: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PICKUP_SCHEDULED' | 'COMPLETED';
  admin_notes?: string;
  photos?: string;
  items_json?: string;
  reverse_awb_code?: string;
  reverse_courier_name?: string;
  pickup_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface PackingSlipItem {
  product_name: string;
  variant_info?: string;
  sku: string;
  hsn_code: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface PackingSlipData {
  order_number: string;
  awb_code?: string;
  courier_name?: string;
  routing_code?: string;
  barcode_text: string;
  order_date: string;
  payment_method: string;
  payment_status: string;
  is_cod: boolean;
  cod_amount: number;
  total_quantity: number;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total_amount: number;
  currency: string;
  recipient: {
    name: string;
    phone: string;
    email: string;
    address_line1: string;
    address_line2?: string;
    building_or_flat?: string;
    landmark?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  sender: {
    company_name: string;
    warehouse: string;
    address: string;
    pincode: string;
    contact: string;
  };
  items: {
    product_name: string;
    variant_info?: string;
    sku: string;
    hsn_code: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  luxury_packaging_checklist: string[];
}

export interface PickListItem {
  id: number;
  product_name: string;
  sku: string;
  variant_info?: string;
  shelf_location: string;
  quantity_required: number;
  quantity_picked: number;
  status: 'PENDING' | 'PICKED' | 'SHORTAGE' | 'DAMAGED';
}

export interface PickList {
  id: number;
  picklist_number: string;
  assigned_staff_name: string;
  status: string;
  items: PickListItem[];
}
