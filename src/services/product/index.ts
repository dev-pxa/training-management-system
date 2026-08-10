import type { ProductCategoryRef } from '@/services/productCategory';
import { request } from '@umijs/max';

export interface ProductResourceRef {
  id: number;
  name?: string;
  contentUrl: string;
  type: number;
  duration?: number;
}

export interface ProductSpec {
  title: string;
  content: string;
}

export interface ProductListItem {
  id: number;
  name: string;
  description: string;
  coverResource?: ProductResourceRef;
  primaryCategory?: ProductCategoryRef;
  secondaryCategory?: ProductCategoryRef;
  isOnline: boolean;
}

export interface ProductDetail extends ProductListItem {
  videoResource?: ProductResourceRef;
  specs: ProductSpec[];
}

export interface ProductRequest {
  name: string;
  description: string;
  coverResourceId: number;
  videoResourceId?: number;
  primaryCategoryId: number;
  secondaryCategoryId?: number;
  specs: ProductSpec[];
}

export interface ProductListRequest {
  queryInfo?: {
    name?: string;
    primaryCategoryId?: number;
    secondaryCategoryId?: number;
    isOnline?: boolean;
  };
  pageNum: number;
  pageSize: number;
}

export async function getProductList(params: ProductListRequest) {
  return request('/api/products', { method: 'GET', params });
}

export async function getProductDetail(id: string | number) {
  return request('/api/product', { method: 'GET', params: { id } });
}

export async function addProduct(body: ProductRequest) {
  return request('/api/product', { method: 'POST', data: body });
}

export async function updateProduct(id: string | number, body: ProductRequest) {
  return request('/api/product', { method: 'PUT', params: { id }, data: body });
}

export async function updateProductOnline(body: {
  id: string | number;
  isOnline: boolean;
}) {
  return request('/api/product/online', { method: 'PUT', data: body });
}

export async function deleteProducts(body: { ids: number[] }) {
  return request('/api/products', { method: 'DELETE', data: body });
}
