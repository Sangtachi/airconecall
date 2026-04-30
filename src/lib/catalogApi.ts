/**
 * 카탈로그·주문 API (`airconeCallServer`).
 * 서버 호스트 없이 빌드해도 `/api/...` 상대 요청으로 로컬 개발 서버 프록시에 붙습니다.
 */

import { apiRequestUrl } from '@/lib/apiRequestUrl';
import { nestErrorPlainText } from '@/lib/nestErrorMessage';

async function readEnvelope<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(apiRequestUrl(path), {
      credentials: 'omit',
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    });
  } catch {
    throw new Error('인터넷 연결이 불안정합니다. 잠시 후 다시 시도해 주세요.');
  }
  let json: { ok?: boolean; data?: T; error?: unknown };
  try {
    json = (await res.json()) as { ok?: boolean; data?: T; error?: unknown };
  } catch {
    throw new Error('응답을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
  if (!json.ok) throw new Error(nestErrorPlainText(json.error));
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

/** 백엔드에서 허용할 때만 true. 연결 실패 시 null. */
export async function fetchMockPaymentsAllowed(): Promise<boolean | null> {
  try {
    const v = await readEnvelope<{ mockPaymentsAllowed: boolean }>('/api/payments/mock-health');
    return !!v.mockPaymentsAllowed;
  } catch {
    return null;
  }
}
