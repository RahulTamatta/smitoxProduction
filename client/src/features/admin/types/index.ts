// ===================================
// ADMIN DOMAIN TYPES & INTERFACES
// ===================================

export interface User {
  _id: string;
  user_fullname: string;
  email_id: string;
  phone: string;
  role: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BulkProduct {
  minimum: string;
  maximum: string;
  discount_mrp: string;
  selling_price_set: string;
  minNetWeight?: string;
  maxNetWeight?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  photos: string;
  multipleimages: string[];
  category: Category;
  subcategory: Subcategory;
  brand: Brand;
  price: number;
  perPiecePrice: number;
  mrp: number;
  purchaseRate: number;
  totalsetPrice: number;
  stock: number;
  weight: number;
  unit: string;
  unitSet: string;
  hsn: string;
  gst: number;
  gstType: string;
  shipping: boolean;
  allowCOD: boolean;
  returnProduct: boolean;
  isActive: string;
  custom_order: string;
  sku: string;
  tags: string[];
  fk_tags: string[];
  youtubeUrl: string;
  additionalUnit: string;
  bulkProducts: BulkProduct[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderProduct {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  photos: string;
  gst: number;
}

export interface Order {
  _id: string;
  orderId: string;
  products: OrderProduct[];
  buyer: User;
  status: OrderStatus;
  payment: PaymentStatus;
  amount: number;
  deliveryCharges: number;
  codCharges: number;
  discount: number;
  address: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 
  | 'Pending'
  | 'Confirmed' 
  | 'Accepted'
  | 'Cancelled'
  | 'Rejected'
  | 'Dispatched'
  | 'Delivered'
  | 'Returned';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  filter?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Form Types
export interface ProductFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  subcategory: string;
  brand: string;
  quantity: string;
  shipping: boolean;
  hsn: string;
  unit: string;
  unitSet: string;
  purchaseRate: string;
  mrp: string;
  perPiecePrice: string;
  totalsetPrice: string;
  weight: string;
  stock: string;
  gst: string;
  gstType: string;
  additionalUnit: string;
  allowCOD: boolean;
  returnProduct: boolean;
  tags: string[];
  fk_tags: string[];
  sku: string;
  customOrder: string;
  photos: string;
  multipleimages: File[];
  youtubeUrl: string;
  bulkProducts: BulkProduct[];
}

export interface CategoryFormData {
  name: string;
  isActive: boolean;
}

export interface UserFormData {
  user_fullname: string;
  email_id: string;
  phone: string;
  role: number;
  isActive: boolean;
}

// Filter and Sort Types
export interface ProductFilters {
  category?: string;
  subcategory?: string;
  brand?: string;
  status?: 'active' | 'inactive' | 'outOfStock' | 'all';
  priceRange?: {
    min: number;
    max: number;
  };
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Dashboard Statistics
export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
  recentOrders: Order[];
  topProducts: Product[];
}

export interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
}
