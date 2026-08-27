import { Product, Order, User as CustomerUser, Category, Coupon, ContactMessage, ReturnRequest } from '../../../types';

export type AdminTab =
  | 'overview'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'orders'
  | 'customers'
  | 'payments'
  | 'shipping'
  | 'coupons'
  | 'reviews'
  | 'marketing'
  | 'content'
  | 'analytics'
  | 'support'
  | 'returns'
  | 'roles'
  | 'audit'
  | 'settings'
  | 'ai_studio'
  | 'database';

export interface AdminReview {
  id: number;
  product_id: number;
  product_name: string;
  product_image?: string | null;
  user_id: number;
  user_name: string;
  user_email: string;
  rating: number;
  review: string;
  photo_url?: string | null;
  is_approved: boolean;
  created_at: string;
}

export interface CustomerDetail {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  metrics: {
    total_orders: number;
    paid_orders: number;
    lifetime_value: number;
    average_order_value: number;
    wishlist_count: number;
    reviews_count: number;
  };
  addresses: Array<{
    id: number;
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone?: string;
    is_default: boolean;
  }>;
  recent_orders: Array<{
    id: number;
    order_number: string;
    total_amount: number;
    currency: string;
    payment_status: string;
    order_status: string;
    created_at: string;
  }>;
}

export interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface AuditLogEntry {
  id: number;
  actor_id?: number | null;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value_json?: string | null;
  new_value_json?: string | null;
  ip_address?: string | null;
  created_at: string;
}
