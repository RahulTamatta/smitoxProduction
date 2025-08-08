// Centralized shared types for the client
// Keep these interfaces minimal and flexible to match API responses without over-constraining

// Generic API response wrappers
export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  [key: string]: any;
}

// Core domain types (kept broad/optional to avoid type friction)
export type OrderStatus = string; // Use string to align with backend values

export interface OrderProduct {
  _id?: string;
  product?: string | Product; // id or populated product
  name?: string;
  price: number | string;
  quantity: number | string;
  gst?: number | string;
  [key: string]: any;
}

export interface Order {
  _id?: string;
  user?: string | User;
  products: OrderProduct[];
  status?: OrderStatus;
  deliveryCharges?: number | string;
  codCharges?: number | string;
  discount?: number | string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface Product {
  _id?: string;
  name?: string;
  slug?: string;
  description?: string;
  price?: number | string;
  perPiecePrice?: number | string;
  unitSet?: number | string;
  bulkProducts?: any[];
  photo?: string;
  multipleimages?: string[] | string | null;
  category?: string | Category;
  brand?: string | Brand;
  isActive?: boolean | string;
  [key: string]: any;
}

export interface User {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: any;
  role?: string | number;
  [key: string]: any;
}

export interface UserFormData {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
  [key: string]: any;
}

export interface Category {
  _id?: string;
  name?: string;
  slug?: string;
  [key: string]: any;
}

export interface CategoryFormData {
  name: string;
  [key: string]: any;
}

export interface Subcategory {
  _id?: string;
  name?: string;
  category?: string | Category;
  [key: string]: any;
}

export interface Brand {
  _id?: string;
  name?: string;
  [key: string]: any;
}

export interface DashboardStats {
  totalOrders?: number;
  totalProducts?: number;
  totalUsers?: number;
  revenue?: number;
  [key: string]: any;
}

export interface CloudinaryResponse {
  asset_id?: string;
  public_id?: string;
  secure_url: string;
  url?: string;
  [key: string]: any;
}
