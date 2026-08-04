import { request } from '@umijs/max';

export interface CertificateVerifyResult {
  exists: boolean;
  certificateNo?: string;
  certificateIssuedAt?: string;
  examRecordId?: number;
  userId?: number;
  userName?: string;
  phone?: string;
  companyId?: number;
  courseId?: number;
  courseName?: string;
  quizId?: number;
  quizName?: string;
  status?: string;
  passed?: boolean;
  score?: number;
  passScore?: number;
  totalScore?: number;
  correctCount?: number;
  totalCount?: number;
  submittedAt?: string;
}

export async function verifyCertificate(
  certificateNo: string,
  options?: { [key: string]: any },
) {
  return request('/api/certificate/verify', {
    method: 'GET',
    params: { certificateNo },
    ...(options || {}),
  });
}
