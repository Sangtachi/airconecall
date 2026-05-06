import { apiRequestUrl } from '@/lib/apiRequestUrl';
import { nestErrorPlainText } from '@/lib/nestErrorMessage';

/** 회원·리워드 — Supabase backed API + 화면 복구용 최소 캐시 */
const STORAGE_KEYS = {
  memberSession: 'acnow_member_session',
  legacyMemberPhone: 'aircone_member_phone_cache',
  waitlistContactPhone: 'aircone_waitlist_contact_cache',
} as const;

export type MemberSession = {
  memberId: string;
  name: string;
  phone: string;
  role: 'customer' | 'admin' | 'super_admin';
  status: string;
};

export type MemberDashboardData = {
  member: {
    id: string;
    name: string;
    phone: string;
    role: string;
    status: string;
    marketingConsent: boolean;
    createdAt: string;
    memo?: string;
  };
  coupons: Array<{
    id: string;
    couponType: string;
    amount: number;
    status: string;
    expiresAt?: string | null;
    usedBookingId?: string | null;
  }>;
  rewardLogs: Array<{
    id: string;
    actionType: string;
    rewardType: string;
    amount: number;
    status: string;
    referenceId?: string | null;
    createdAt: string;
  }>;
  addresses: Array<{
    id: string;
    userId?: string;
    address: string;
    detailAddress?: string | null;
    sido?: string | null;
    sigungu?: string | null;
    dong?: string | null;
    isDefault: boolean;
    createdAt?: string;
    updatedAt?: string;
  }>;
  airconAssets: Array<{
    id: string;
    userId?: string;
    addressId?: string | null;
    type: string;
    brand?: string | null;
    modelName?: string | null;
    installedYear?: number | null;
    memo?: string | null;
    createdAt?: string;
    updatedAt?: string;
  }>;
  orders: Array<{
    id: string;
    orderNo: string;
    productName: string;
    productCode: string;
    serviceType: string;
    airconType: string;
    orderStatus: string;
    paymentStatus: string;
    totalPrice: number;
    addressSummary: string;
    desiredDate?: string | null;
    desiredTimeSlot?: string | null;
    createdAt: string;
  }>;
  inquiries: Array<{
    id: string;
    location?: string | null;
    airconType?: string | null;
    issue?: string | null;
    urgency: string;
    status: string;
    convertedOrderId?: string | null;
    createdAt: string;
  }>;
  reviews?: Array<{
    id: string;
    orderId: string;
    technicianId?: string | null;
    memberId?: string | null;
    rating: number;
    comment?: string | null;
    createdAt: string;
    updatedAt?: string;
  }>;
};

export type MemberAddressPayload = {
  address: string;
  detailAddress?: string;
  sido?: string;
  sigungu?: string;
  dong?: string;
  isDefault?: boolean;
};

export type AirconAssetPayload = {
  addressId?: string | null;
  type: 'wall' | 'stand' | 'two_in_one' | 'system' | 'unknown';
  brand?: string;
  modelName?: string;
  installedYear?: number;
  memo?: string;
};

export function saveWaitlistContactPhone(phoneDigits: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.waitlistContactPhone, phoneDigits);
  } catch {
    /* ignore */
  }
}

export function readWaitlistContactPhone(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.waitlistContactPhone);
  } catch {
    return null;
  }
}

export function hasMemberSession(): boolean {
  return Boolean(readMemberSession()?.memberId);
}

function clearStoredMemberSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.memberSession);
    localStorage.removeItem(STORAGE_KEYS.legacyMemberPhone);
  } catch {
    /* ignore */
  }
}

export function readMemberSession(): MemberSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.memberSession);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MemberSession>;
    if (!parsed.memberId || parsed.role !== 'customer') return null;
    return {
      memberId: String(parsed.memberId),
      name: String(parsed.name ?? '에이씨나우 회원'),
      phone: String(parsed.phone ?? ''),
      role: 'customer',
      status: String(parsed.status ?? 'active'),
    };
  } catch {
    return null;
  }
}

function saveMemberSession(session: MemberSession): void {
  try {
    localStorage.setItem(STORAGE_KEYS.memberSession, JSON.stringify(session));
    localStorage.removeItem(STORAGE_KEYS.legacyMemberPhone);
  } catch {
    /* ignore */
  }
}

export function clearMemberSession(): void {
  clearStoredMemberSession();
}

async function readEnvelope<T>(res: Response): Promise<T> {
  let json: { ok?: boolean; data?: T; error?: unknown };
  try {
    json = (await res.json()) as { ok?: boolean; data?: T; error?: unknown };
  } catch {
    throw new Error('응답을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
  if (!json.ok) throw new Error(nestErrorPlainText(json.error));
  return json.data as T;
}

/** bookingRef + phone 으로 회원 upsert + 가입 쿠폰 멱등 발급 */
export async function registerMemberAfterBooking(payload: {
  phone: string;
  password: string;
  name?: string;
  marketingConsent?: boolean;
  bookingRef?: string;
}): Promise<{ ok: boolean; memberId?: string; couponId?: string; session?: MemberSession }> {
  const res = await fetch(apiRequestUrl('/api/members/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const out = await readEnvelope<{
    member: { id: string; phone: string };
    signupCoupon: { id: string } | null;
  }>(res);
  let session: MemberSession | undefined;
  if (out.member?.id) {
    session = {
      memberId: out.member.id,
      name: payload.name?.trim() || '에이씨나우 회원',
      phone: out.member.phone,
      role: 'customer',
      status: 'active',
    };
    saveMemberSession(session);
  }
  return { ok: true, memberId: out.member?.id, couponId: out.signupCoupon?.id, session };
}

export async function loginMember(payload: { phone: string; password: string }): Promise<MemberSession> {
  const res = await fetch(apiRequestUrl('/api/members/session'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const out = await readEnvelope<MemberSession>(res);
  saveMemberSession(out);
  return out;
}

export async function fetchMemberDashboard(memberId: string): Promise<MemberDashboardData> {
  const res = await fetch(apiRequestUrl(`/api/members/${encodeURIComponent(memberId)}/dashboard`));
  return readEnvelope<MemberDashboardData>(res);
}

async function memberMutation<T>(
  memberId: string,
  path: string,
  init: RequestInit,
): Promise<T> {
  const res = await fetch(apiRequestUrl(`/api/members/${encodeURIComponent(memberId)}${path}`), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  return readEnvelope<T>(res);
}

export async function createMemberAddress(
  memberId: string,
  payload: MemberAddressPayload,
): Promise<MemberDashboardData['addresses'][number]> {
  return memberMutation(memberId, '/addresses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateMemberAddress(
  memberId: string,
  addressId: string,
  payload: Partial<MemberAddressPayload>,
): Promise<MemberDashboardData['addresses'][number]> {
  return memberMutation(memberId, `/addresses/${encodeURIComponent(addressId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteMemberAddress(memberId: string, addressId: string): Promise<void> {
  await memberMutation(memberId, `/addresses/${encodeURIComponent(addressId)}`, { method: 'DELETE' });
}

export async function createAirconAsset(
  memberId: string,
  payload: AirconAssetPayload,
): Promise<MemberDashboardData['airconAssets'][number]> {
  return memberMutation(memberId, '/assets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAirconAsset(
  memberId: string,
  assetId: string,
  payload: Partial<AirconAssetPayload>,
): Promise<MemberDashboardData['airconAssets'][number]> {
  return memberMutation(memberId, `/assets/${encodeURIComponent(assetId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteAirconAsset(memberId: string, assetId: string): Promise<void> {
  await memberMutation(memberId, `/assets/${encodeURIComponent(assetId)}`, { method: 'DELETE' });
}

export async function useMemberCoupon(
  memberId: string,
  couponId: string,
  orderId?: string,
): Promise<MemberDashboardData['coupons'][number]> {
  return memberMutation(memberId, `/coupons/${encodeURIComponent(couponId)}/use`, {
    method: 'POST',
    body: JSON.stringify(orderId ? { orderId } : {}),
  });
}

export async function reviewMemberOrder(
  memberId: string,
  orderId: string,
  payload: { rating: number; comment?: string },
): Promise<NonNullable<MemberDashboardData['reviews']>[number]> {
  return memberMutation(memberId, `/orders/${encodeURIComponent(orderId)}/review`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
