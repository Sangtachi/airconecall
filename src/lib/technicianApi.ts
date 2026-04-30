/**
 * 기사 포털 API — 헤더 `x-technician-id` 에 승인 기사 UUID(또는 로컬 t_1).
 */
import { apiRequestUrl } from '@/lib/apiRequestUrl';
import { nestErrorPlainText } from '@/lib/nestErrorMessage';

export const TECHNICIAN_ID_STORAGE = 'air_technician_id';

export function getStoredTechnicianId(): string | null {
  return localStorage.getItem(TECHNICIAN_ID_STORAGE)?.trim() || null;
}

export function setStoredTechnicianId(id: string | null): void {
  if (id) localStorage.setItem(TECHNICIAN_ID_STORAGE, id.trim());
  else localStorage.removeItem(TECHNICIAN_ID_STORAGE);
}

async function parseJsonEnvelope<T>(res: Response): Promise<T> {
  let json: { ok?: boolean; data?: T; error?: unknown };
  try {
    json = (await res.json()) as { ok?: boolean; data?: T; error?: unknown };
  } catch {
    throw new Error('응답을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
  if (!json.ok) throw new Error(nestErrorPlainText(json.error));
  return json.data as T;
}

async function readEnvelope<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(apiRequestUrl(path), {
      credentials: 'omit',
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    });
  } catch {
    throw new Error('연결이 불안정합니다. 잠시 후 다시 시도해 주세요.');
  }
  return parseJsonEnvelope<T>(res);
}

async function technicianFetch(path: string, init?: RequestInit): Promise<Response> {
  const id = getStoredTechnicianId();
  if (!id) throw new Error('로그인 필요');
  try {
    return await fetch(apiRequestUrl(path), {
      credentials: 'omit',
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'x-technician-id': id,
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new Error('연결이 불안정합니다. 잠시 후 다시 시도해 주세요.');
  }
}

async function technicianEnvelope<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await technicianFetch(path, init);
  return parseJsonEnvelope<T>(res);
}

async function technicianFormEnvelope<T>(path: string, form: FormData): Promise<T> {
  const id = getStoredTechnicianId();
  if (!id) throw new Error('로그인 필요');
  let res: Response;
  try {
    res = await fetch(apiRequestUrl(path), {
      method: 'POST',
      credentials: 'omit',
      headers: { 'x-technician-id': id },
      body: form,
    });
  } catch {
    throw new Error('연결이 불안정합니다. 잠시 후 다시 시도해 주세요.');
  }
  return parseJsonEnvelope<T>(res);
}

export interface TechnicianSignupCapability {
  serviceType: 'install' | 'cleaning';
  airconType: 'wall' | 'stand' | 'two_in_one' | 'system';
}

export function registerTechnician(body: {
  name: string;
  phone: string;
  baseRegion?: string;
  capabilities: TechnicianSignupCapability[];
}): Promise<{ id: string; status: string }> {
  return readEnvelope('/api/technician/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function technicianSession(body: { phone: string }): Promise<{
  technicianId: string;
  name: string;
  baseRegion: string | null;
}> {
  return readEnvelope('/api/technician/session', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** 승인 기사 목록 호출용 간단 타입 — 주문 플로우 고객주문 타입 재사용 */
export interface TechnicianOrderSummary {
  id: string;
  orderNo: string;
  orderStatus: string;
  paymentStatus: string;
  assignedTechnicianId: string | null;
  customerName: string;
  customerPhone: string;
  addressSummary: string;
  productName: string;
  scheduleType: string;
  totalPrice: number;
}

export function fetchTechnicianJobs(): Promise<TechnicianOrderSummary[]> {
  return technicianEnvelope('/api/technician/jobs', { method: 'GET' });
}

export function fetchTechnicianJob(orderId: string): Promise<TechnicianOrderSummary> {
  return technicianEnvelope(`/api/technician/jobs/${encodeURIComponent(orderId)}`, { method: 'GET' });
}

export function technicianAccept(orderId: string): Promise<TechnicianOrderSummary> {
  return technicianEnvelope(`/api/technician/jobs/${encodeURIComponent(orderId)}/accept`, {
    method: 'PATCH',
  });
}

export function technicianDepart(orderId: string): Promise<TechnicianOrderSummary> {
  return technicianEnvelope(`/api/technician/jobs/${encodeURIComponent(orderId)}/depart`, {
    method: 'PATCH',
  });
}

export function technicianStart(orderId: string): Promise<TechnicianOrderSummary> {
  return technicianEnvelope(`/api/technician/jobs/${encodeURIComponent(orderId)}/start`, {
    method: 'PATCH',
  });
}

export function technicianComplete(orderId: string): Promise<TechnicianOrderSummary> {
  return technicianEnvelope(`/api/technician/jobs/${encodeURIComponent(orderId)}/complete`, {
    method: 'PATCH',
  });
}

export interface OrderPhotoSummary {
  id: string;
  orderId: string;
  technicianId: string | null;
  kind: string;
  url: string;
  caption: string | null;
  createdAt: string;
}

export function fetchJobPhotos(orderId: string): Promise<OrderPhotoSummary[]> {
  return technicianEnvelope(`/api/technician/jobs/${encodeURIComponent(orderId)}/photos`, {
    method: 'GET',
  });
}

export function uploadJobPhoto(
  orderId: string,
  body: { kind: 'before_work' | 'after_work' | 'other'; url: string; caption?: string },
): Promise<OrderPhotoSummary> {
  return technicianEnvelope(`/api/technician/jobs/${encodeURIComponent(orderId)}/photos`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export interface PhotoPresignResult {
  signedUrl: string;
  token: string;
  path: string;
  bucket: string;
  expiresInHours: number;
}

export function presignJobPhotoUpload(
  orderId: string,
  body: { mimeType?: string },
): Promise<PhotoPresignResult> {
  return technicianEnvelope(`/api/technician/jobs/${encodeURIComponent(orderId)}/photos/presign`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function confirmJobPhotoAfterUpload(
  orderId: string,
  body: { path: string; kind: 'before_work' | 'after_work' | 'other'; caption?: string },
): Promise<OrderPhotoSummary> {
  return technicianEnvelope(
    `/api/technician/jobs/${encodeURIComponent(orderId)}/photos/confirm-upload`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

export function uploadJobPhotoMultipart(
  orderId: string,
  kind: 'before_work' | 'after_work' | 'other',
  file: File,
  caption?: string,
): Promise<OrderPhotoSummary> {
  const form = new FormData();
  form.append('kind', kind);
  if (caption) form.append('caption', caption);
  form.append('file', file);
  return technicianFormEnvelope<OrderPhotoSummary>(
    `/api/technician/jobs/${encodeURIComponent(orderId)}/photos/upload`,
    form,
  );
}

/** Presigned PUT → confirm, 실패 시 서버 멀티파트 업로드 */
export async function uploadJobPhotoFile(
  orderId: string,
  kind: 'before_work' | 'after_work' | 'other',
  file: File,
  caption?: string,
): Promise<OrderPhotoSummary> {
  const mime = (file.type || 'image/jpeg').split(';')[0].trim();
  try {
    const presign = await presignJobPhotoUpload(orderId, { mimeType: mime });
    const put = await fetch(presign.signedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': mime },
    });
    if (!put.ok) throw new Error('사진 업로드에 문제가 있었습니다.');
    return await confirmJobPhotoAfterUpload(orderId, { path: presign.path, kind, caption });
  } catch {
    return uploadJobPhotoMultipart(orderId, kind, file, caption);
  }
}

export interface TechnicianSettlementRow {
  id: string;
  orderId: string;
  orderNo: string | null;
  grossAmount: number;
  materialAllowance: number;
  platformFee: number | null;
  technicianPayout: number | null;
  platformFeeRate: number | null;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

export function fetchTechnicianSettlements(): Promise<TechnicianSettlementRow[]> {
  return technicianEnvelope('/api/technician/settlements', { method: 'GET' });
}

export interface TechnicianMaterialRow {
  id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  customerPrice: number | null;
  technicianCostAllowance: number | null;
  oemAvailable: boolean;
  supplierName: string | null;
}

export function fetchTechnicianMaterials(): Promise<TechnicianMaterialRow[]> {
  return technicianEnvelope('/api/technician/materials', { method: 'GET' });
}

export interface TechnicianExtraQuoteRow {
  id: string;
  orderId: string;
  technicianId: string | null;
  status: 'requested' | 'approved' | 'paid' | 'rejected' | 'cancelled';
  totalAmount: number;
  customerApprovedAt: string | null;
  paidAt: string | null;
  memo: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    amount: number;
    addonId: string | null;
    materialId: string | null;
  }>;
}

export function fetchJobExtraQuotes(orderId: string): Promise<TechnicianExtraQuoteRow[]> {
  return technicianEnvelope(`/api/technician/jobs/${encodeURIComponent(orderId)}/extra-quotes`, {
    method: 'GET',
  });
}

export function createJobExtraQuote(
  orderId: string,
  body: {
    memo?: string;
    items: Array<{
      name: string;
      quantity: number;
      unit?: string;
      unitPrice: number;
      addonId?: string;
      materialId?: string;
    }>;
  },
): Promise<TechnicianExtraQuoteRow> {
  return technicianEnvelope(`/api/technician/jobs/${encodeURIComponent(orderId)}/extra-quotes`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
