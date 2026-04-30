/**
 * 에어컨 설치·청소 카탈로그 / 주문 (백엔드 `airconeCallServer`).
 * `.env`: VITE_API_BASE_URL=http://127.0.0.1:4000 — 끝 슬래시 없이.
 */

const baseTrim = (): string =>
  ((import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim().replace(/\/$/, '') || '');

export function isCatalogApiAvailable(): boolean {
  return !!baseTrim();
}

async function readEnvelope<T>(path: string, init?: RequestInit): Promise<T> {
  const base = baseTrim();
  const res = await fetch(`${base}${path}`, {
    credentials: 'omit',
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const json = (await res.json()) as { ok?: boolean; data?: T; error?: unknown };
  if (!json.ok) throw new Error(json.error !== undefined ? JSON.stringify(json.error) : '요청 실패');
  return json.data as T;
}

export interface ServiceProductDto {
  id: string;
  categoryId: string;
  name: string;
  code: string;
  serviceType: 'install' | 'cleaning';
  airconType: string;
  basePrice: number;
  sameDayExtraPrice: number;
  sameDayPrice: number;
  includedPipeMeter: number;
  includedRefrigerantCount: number;
  includedHoleCount: number;
  description?: string | null;
  isActive?: boolean;
}

export function fetchInstallProducts(): Promise<ServiceProductDto[]> {
  return readEnvelope<ServiceProductDto[]>('/api/service-products?serviceType=install');
}

export interface OrderDraftDto {
  id: string;
  orderNo: string;
  productId: string;
  productTotalPrice: number;
  paymentStatus: string;
  orderStatus: string;
  scheduleType: string;
  customerName?: string;
}

export function createOrderDraft(body: {
  productId: string;
  scheduleType: 'same_day' | 'reservation';
  customerName: string;
  customerPhone: string;
  addressSummary: string;
  customerMemo?: string;
}): Promise<OrderDraftDto> {
  return readEnvelope<OrderDraftDto>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function mockConfirmPayment(orderId: string): Promise<OrderDraftDto> {
  return readEnvelope<OrderDraftDto>('/api/payments/mock-confirm', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}

/** 서버 설정에 따라 바뀜 — 비프로덕션은 기본 true */
export async function fetchMockPaymentsHealth(): Promise<boolean> {
  try {
    const v = await readEnvelope<{ mockPaymentsAllowed: boolean }>('/api/payments/mock-health');
    return !!v.mockPaymentsAllowed;
  } catch {
    return false;
  }
}
