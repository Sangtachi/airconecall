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
  } catch (e) {
    if (import.meta.env.DEV) {
      // fetch 가 CORS/연결 등으로 reject 될 때만 여기로 옴 (콘솔로 원인 확인)
      console.warn('[catalogApi] fetch 실패:', path, e);
    }
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
