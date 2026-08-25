import { request } from '@umijs/max';

export interface KnowledgeEntry {
  id: number;
  knowledgeBaseId: number;
  knowledgeBaseName?: string;
  standardQuestion: string;
  variantQuestions?: string[];
  answer?: string;
  remark?: string;
  status: number;
  currentVersion: number;
  activeIndexVersion?: number;
  indexStatus: string;
  indexMessage?: string;
  indexedAt?: string;
}

export interface KnowledgePayload {
  knowledgeBaseId: number;
  tagIds?: number[];
  standardQuestion: string;
  variantQuestions: string[];
  answer: string;
  remark?: string;
  status: number;
}

export const getKnowledgeEntries = (params: Record<string, any>) =>
  request('/api/knowledge/entries', { method: 'GET', params });
export const getKnowledgeEntry = (id: number) =>
  request(`/api/knowledge/entries/${id}`, { method: 'GET' });
export const createKnowledgeEntry = (data: KnowledgePayload) =>
  request('/api/knowledge/entries', { method: 'POST', data });
export const updateKnowledgeEntry = (id: number, data: KnowledgePayload) =>
  request(`/api/knowledge/entries/${id}`, { method: 'PUT', data });
export const updateKnowledgeStatus = (id: number, status: number) =>
  request(`/api/knowledge/entries/${id}/status`, {
    method: 'PUT',
    params: { status },
  });
export const deleteKnowledgeEntries = (ids: number[]) =>
  request('/api/knowledge/entries', { method: 'DELETE', data: { ids } });
export const reindexKnowledgeEntry = (id: number) =>
  request(`/api/knowledge/entries/${id}/reindex`, { method: 'POST' });
export const testKnowledgeRecall = (data: Record<string, any>) =>
  request('/api/knowledge/retrieval/test', { method: 'POST', data });
export const getKnowledgeBases = () =>
  request('/api/knowledge/bases', { method: 'GET' });
export const generateVariantQuestions = (data: {
  standardQuestion: string;
  answer: string;
  count?: number;
}) =>
  request('/api/knowledge/entries/variants/generate', { method: 'POST', data });
export const getKnowledgeBasePage = (params: Record<string, any>) =>
  request('/api/knowledge/bases/page', { method: 'GET', params });
export const createKnowledgeBase = (data: {
  name: string;
  description?: string;
  status: number;
}) => request('/api/knowledge/bases', { method: 'POST', data });
export const getKnowledgeBase = (id: number) =>
  request(`/api/knowledge/bases/${id}`, { method: 'GET' });
export const updateKnowledgeBase = (
  id: number,
  data: { name: string; description?: string; status: number },
) => request(`/api/knowledge/bases/${id}`, { method: 'PUT', data });
export const updateKnowledgeBaseStatus = (id: number, status: number) =>
  request(`/api/knowledge/bases/${id}/status`, {
    method: 'PUT',
    params: { status },
  });

export interface KnowledgeImportBatch {
  id: number;
  knowledgeBaseId: number;
  knowledgeBaseName?: string;
  fileName: string;
  status: 'PARSING' | 'REVIEWING' | 'COMPLETED' | 'FAILED';
  stage: string;
  progress: number;
  progressMessage?: string;
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  deletedCount: number;
  failedCount: number;
  errorMessage?: string;
  createdAt: string;
}

export interface KnowledgeImportItem {
  id: number;
  batchId: number;
  knowledgeBaseId: number;
  knowledgeBaseName?: string;
  standardQuestion: string;
  answer: string;
  variantQuestions: string[];
  sourceText?: string;
  confidence?: number;
  warnings?: string[];
}

export const createKnowledgeImport = (file: File, knowledgeBaseId: number) => {
  const data = new FormData();
  data.append('file', file);
  data.append('knowledgeBaseId', String(knowledgeBaseId));
  return request('/api/knowledge/imports', { method: 'POST', data });
};
export const getKnowledgeImports = (params: Record<string, any>) =>
  request('/api/knowledge/imports', { method: 'GET', params });
export const deleteKnowledgeImports = (ids: number[]) =>
  request('/api/knowledge/imports', { method: 'DELETE', data: { ids } });
export const getKnowledgeImport = (id: number) =>
  request(`/api/knowledge/imports/${id}`, { method: 'GET' });
export const getKnowledgeImportItems = (
  id: number,
  params: Record<string, any>,
) => request(`/api/knowledge/imports/${id}/items`, { method: 'GET', params });
export const deleteKnowledgeImportItem = (batchId: number, itemId: number) =>
  request(`/api/knowledge/imports/${batchId}/items/${itemId}`, {
    method: 'DELETE',
  });
export const approveKnowledgeImportItem = (
  batchId: number,
  itemId: number,
  data: KnowledgePayload,
) =>
  request(`/api/knowledge/imports/${batchId}/items/${itemId}/approve`, {
    method: 'POST',
    data,
  });
