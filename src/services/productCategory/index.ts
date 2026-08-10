import { request } from '@umijs/max';

export interface ProductCategoryRef {
  id: number;
  parentId: number;
  name: string;
}

export async function getProductCategories(
  parentId: number,
  options?: { [key: string]: any },
) {
  return request('/api/product-categories', {
    method: 'GET',
    params: { parentId },
    ...(options || {}),
  });
}

export async function addProductCategory(
  body: { parentId: number; name: string },
  options?: { [key: string]: any },
) {
  return request('/api/product-category', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}
