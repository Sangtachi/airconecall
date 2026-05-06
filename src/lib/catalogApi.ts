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

const INSTALL_PRODUCTS_CACHE_KEY = 'acnow_install_products_cache_v1';
const INSTALL_PRODUCTS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const FALLBACK_INSTALL_PRODUCTS: ServiceProductDto[] = [
  {
    id: 'fallback-install-wall',
    categoryId: 'fallback-install',
    name: '벽걸이 에어컨 설치',
    code: 'INSTALL_WALL_FALLBACK',
    serviceType: 'install',
    airconType: 'wall',
    basePrice: 150000,
    sameDayExtraPrice: 50000,
    sameDayPrice: 200000,
    includedPipeMeter: 5,
    includedRefrigerantCount: 1,
    includedHoleCount: 1,
    description: '대표 패키지 기준 참고 금액',
    isActive: true,
  },
  {
    id: 'fallback-install-stand',
    categoryId: 'fallback-install',
    name: '스탠드 에어컨 설치',
    code: 'INSTALL_STAND_FALLBACK',
    serviceType: 'install',
    airconType: 'stand',
    basePrice: 180000,
    sameDayExtraPrice: 60000,
    sameDayPrice: 240000,
    includedPipeMeter: 5,
    includedRefrigerantCount: 1,
    includedHoleCount: 1,
    description: '대표 패키지 기준 참고 금액',
    isActive: true,
  },
  {
    id: 'fallback-install-two-in-one',
    categoryId: 'fallback-install',
    name: '2in1 에어컨 설치',
    code: 'INSTALL_2IN1_FALLBACK',
    serviceType: 'install',
    airconType: 'two_in_one',
    basePrice: 280000,
    sameDayExtraPrice: 80000,
    sameDayPrice: 360000,
    includedPipeMeter: 5,
    includedRefrigerantCount: 1,
    includedHoleCount: 1,
    description: '대표 패키지 기준 참고 금액',
    isActive: true,
  },
];

let installProductsMemory: ServiceProductDto[] | null = null;
let installProductsPromise: Promise<ServiceProductDto[]> | null = null;

function normalizeInstallProducts(rows: ServiceProductDto[]): ServiceProductDto[] {
  return rows
    .filter((p) => p.serviceType === 'install' && p.isActive !== false)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));
}

function readCachedInstallProducts(): ServiceProductDto[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(INSTALL_PRODUCTS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt?: number; rows?: ServiceProductDto[] };
    if (!parsed.savedAt || Date.now() - parsed.savedAt > INSTALL_PRODUCTS_CACHE_TTL_MS) return null;
    const rows = normalizeInstallProducts(parsed.rows ?? []);
    return rows.length > 0 ? rows : null;
  } catch {
    return null;
  }
}

function writeCachedInstallProducts(rows: ServiceProductDto[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INSTALL_PRODUCTS_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), rows }));
  } catch {
    /* ignore */
  }
}

export function getInstantInstallProducts(): ServiceProductDto[] {
  if (installProductsMemory?.length) return installProductsMemory;
  const cached = readCachedInstallProducts();
  if (cached?.length) {
    installProductsMemory = cached;
    return cached;
  }
  return FALLBACK_INSTALL_PRODUCTS;
}

export function fetchInstallProducts(): Promise<ServiceProductDto[]> {
  if (!installProductsPromise) {
    installProductsPromise = readEnvelope<ServiceProductDto[]>('/api/service-products?serviceType=install')
      .then((rows) => {
        const normalized = normalizeInstallProducts(rows);
        installProductsMemory = normalized.length > 0 ? normalized : FALLBACK_INSTALL_PRODUCTS;
        writeCachedInstallProducts(installProductsMemory);
        return installProductsMemory;
      })
      .finally(() => {
        installProductsPromise = null;
      });
  }
  return installProductsPromise;
}

export function preloadInstallProducts(): void {
  void fetchInstallProducts().catch(() => {
    /* 섹션은 즉시 fallback/cache를 보여주므로 사전 로드 실패는 화면에서 처리하지 않습니다. */
  });
}
