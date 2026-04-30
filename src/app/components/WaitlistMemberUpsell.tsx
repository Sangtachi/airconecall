import { useState } from 'react';
import { Gift } from 'lucide-react';
import { POST_SIGNUP, WAITLIST, WAITLIST_CONTACT } from '@/app/data/memberRewardsCopy';
import { patchEmergencyLeadContact } from '@/lib/api';
import {
  readDemoMemberSignedUp,
  readWaitlistContactPhone,
  saveWaitlistContactPhone,
} from '@/lib/memberRewards';

type Props = {
  /** 회원가입 모달 열기 (MemberSignupFlowModal 은 부모에서 렌더) */
  onOpenSignup: () => void;
  /** 연락처 저장 성공 시 다음 화면 전환 */
  onContactSavedSuccess?: () => void;
  /** 부모에서 가입 완료 시 true */
  signupComplete?: boolean;
};

export function WaitlistMemberUpsell({
  onOpenSignup,
  onContactSavedSuccess,
  signupComplete = false,
}: Props) {
  const [contactPhone, setContactPhone] = useState(() => readWaitlistContactPhone() ?? '');
  const [contactSaved, setContactSaved] = useState(() =>
    Boolean(readWaitlistContactPhone()?.length),
  );

  const done = Boolean(signupComplete) || readDemoMemberSignedUp();

  if (done) {
    return (
      <div className="mt-6 rounded-2xl border border-emerald-100/90 bg-emerald-50/95 p-5 text-left shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-emerald-800">
          <Gift className="h-5 w-5 shrink-0" aria-hidden />
          <span className="font-semibold">{POST_SIGNUP.title}</span>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-emerald-900/90">{POST_SIGNUP.body}</p>
        <ul className="space-y-2 text-sm text-emerald-900/85">
          {POST_SIGNUP.bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span aria-hidden className="text-emerald-600">
                ✓
              </span>
              {b}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-emerald-800/80">
          백엔드 연결 시 실제 쿠폰 발급·알림이 이어집니다.
        </p>
      </div>
    );
  }

  const saveContact = async () => {
    const phoneDigits = contactPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) return;
    saveWaitlistContactPhone(phoneDigits);
    try {
      await patchEmergencyLeadContact({ customerPhone: phoneDigits });
    } catch {
      /* API 없음 또는 리드 없음 — 로컬만 저장 */
    }
    setContactSaved(true);
    onContactSavedSuccess?.();
  };

  return (
    <div className="mt-6 space-y-5">
      {/* 비회원 연락처 — 회원 가입과 분리 */}
      <div className="rounded-2xl border border-gray-200/90 bg-[#f7f8f9] p-5 text-left shadow-sm">
        <h3 className="mb-1 font-semibold text-gray-900">{WAITLIST_CONTACT.title}</h3>
        <p className="mb-4 text-sm leading-relaxed text-gray-600">{WAITLIST_CONTACT.desc}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder={WAITLIST.placeholder}
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="min-h-[48px] flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="button"
            onClick={() => void saveContact()}
            disabled={contactPhone.replace(/\D/g, '').length < 10}
            className="shrink-0 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <span className="sm:hidden">저장</span>
            <span className="hidden sm:inline">{WAITLIST_CONTACT.ctaSave}</span>
          </button>
        </div>
        {contactSaved && (
          <p className="mt-3 text-xs text-emerald-700">{WAITLIST_CONTACT.savedToast}</p>
        )}
      </div>

      {/* 전체 회원 가입 플로우 — 첫 화면과 동일 단계별 모달 */}
      <div className="rounded-2xl border border-blue-100/90 bg-blue-50/50 p-5 text-left shadow-sm">
        <h3 className="mb-2 font-semibold text-gray-900">{WAITLIST.title}</h3>
        <p className="mb-4 text-sm leading-relaxed text-gray-600">{WAITLIST.subtitle}</p>
        <button
          type="button"
          onClick={onOpenSignup}
          className="w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
        >
          {WAITLIST.ctaPrimary}
        </button>
      </div>
    </div>
  );
}
