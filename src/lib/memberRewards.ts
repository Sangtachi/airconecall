import { apiRequestUrl } from '@/lib/apiRequestUrl';
import { nestErrorPlainText } from '@/lib/nestErrorMessage';

/** 회원·리워드 — Supabase backed API + 화면 복구용 최소 캐시 */
const STORAGE_KEYS = {
  cachedMemberPhone: 'aircone_member_phone_cache',
  waitlistContactPhone: 'aircone_waitlist_contact_cache',
} as const;

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

export function readCachedMemberSignedUp(): boolean {
  try {
    return !!localStorage.getItem(STORAGE_KEYS.cachedMemberPhone);
  } catch {
    return false;
  }
}

export function setCachedMemberPhone(phoneDigits: string | null): void {
  try {
    if (phoneDigits) localStorage.setItem(STORAGE_KEYS.cachedMemberPhone, phoneDigits);
    else localStorage.removeItem(STORAGE_KEYS.cachedMemberPhone);
  } catch {
    /* ignore */
  }
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
  name?: string;
  marketingConsent?: boolean;
  bookingRef?: string;
}): Promise<{ ok: boolean; memberId?: string; couponId?: string }> {
  const res = await fetch(apiRequestUrl('/api/members/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const out = await readEnvelope<{
    member: { id: string; phone: string };
    signupCoupon: { id: string } | null;
  }>(res);
  if (out.member?.phone) {
    setCachedMemberPhone(out.member.phone);
  }
  return { ok: true, memberId: out.member?.id, couponId: out.signupCoupon?.id };
}
