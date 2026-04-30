import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { DIALOG, SIGNUP_FLOW, POST_SIGNUP } from '@/app/data/memberRewardsCopy';
import { Gift } from 'lucide-react';
import { patchEmergencyLeadContact } from '@/lib/api';
import { registerMemberAfterBooking, setDemoMemberSignedUp } from '@/lib/memberRewards';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingRef?: string;
  onComplete?: () => void;
};

export function MemberSignupFlowModal({ open, onOpenChange, bookingRef, onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [agreeService, setAgreeService] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setAgreeService(false);
    setAgreePrivacy(false);
    setAgreeMarketing(false);
    setPhone('');
    setOtpSent(false);
    setOtp('');
    setPhoneVerified(false);
    setName('');
    setPassword('');
    setPassword2('');
    setSubmitting(false);
  }, [open]);

  const digits = (v: string) => v.replace(/\D/g, '');

  const canNextFrom2 = agreeService && agreePrivacy;
  const canNextFrom3 =
    phoneVerified && digits(phone).length >= 10;
  const canSubmitAccount =
    name.trim().length >= 2 && password.length >= 8 && password === password2;

  const handleNext = () => {
    setStep((s) => Math.min(5, s + 1));
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSendOtp = () => {
    if (digits(phone).length < 10) return;
    setOtpSent(true);
  };

  const handleVerifyOtp = () => {
    if (otp.replace(/\D/g, '').length >= 6) {
      setPhoneVerified(true);
    }
  };

  const handleFinishSignup = async () => {
    if (!canSubmitAccount) return;
    setSubmitting(true);
    try {
      await registerMemberAfterBooking({
        phone: digits(phone),
        bookingRef,
      });
      try {
        await patchEmergencyLeadContact({
          customerPhone: digits(phone),
          customerName: name.trim(),
        });
      } catch {
        /* 백엔드 미연결·리드 없음 시 데모 계속 */
      }
      setDemoMemberSignedUp(true);
      setStep(5);
      onComplete?.();
    } finally {
      setSubmitting(false);
    }
  };

  const stepDots = (
    <div className="mb-4 flex justify-center gap-1.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`h-2 w-2 rounded-full ${n === step ? 'bg-blue-600' : n < step ? 'bg-blue-200' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92dvh,620px)] flex-col gap-0 overflow-hidden rounded-2xl border-gray-200 bg-white p-0 sm:max-w-md">
        <div className="border-b border-gray-100 px-6 pb-4 pt-10 sm:pt-11">
          {stepDots}
          <DialogHeader className="space-y-1 text-left">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
              {SIGNUP_FLOW.stepLabel(step)} · {step}/5
            </p>
            <DialogTitle className="text-lg text-gray-900">
              {step === 1 && SIGNUP_FLOW.introTitle}
              {step === 2 && SIGNUP_FLOW.termsTitle}
              {step === 3 && SIGNUP_FLOW.phoneTitle}
              {step === 4 && SIGNUP_FLOW.accountTitle}
              {step === 5 && POST_SIGNUP.title}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {step === 1 && (
            <div className="space-y-4 text-left">
              <p className="text-sm leading-relaxed text-gray-600">{SIGNUP_FLOW.introLead}</p>
              <ul className="list-inside list-disc space-y-2 text-sm text-gray-700">
                {DIALOG.bullets.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="text-xs text-gray-500">{DIALOG.footerNote}</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 text-left">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 bg-slate-50/90 p-4">
                <input
                  type="checkbox"
                  checked={agreeService}
                  onChange={(e) => setAgreeService(e.target.checked)}
                  className="mt-1 size-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-800">{SIGNUP_FLOW.termsService}</span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 bg-slate-50/90 p-4">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="mt-1 size-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-800">{SIGNUP_FLOW.termsPrivacy}</span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 bg-slate-50/90 p-4">
                <input
                  type="checkbox"
                  checked={agreeMarketing}
                  onChange={(e) => setAgreeMarketing(e.target.checked)}
                  className="mt-1 size-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-800">{SIGNUP_FLOW.termsMarketing}</span>
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-left">
              <p className="text-sm text-gray-600">{SIGNUP_FLOW.phoneHint}</p>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="01012345678"
                value={phone}
                disabled={phoneVerified}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm disabled:bg-gray-50"
              />
              {!phoneVerified && (
                <>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={digits(phone).length < 10}
                    className="w-full rounded-xl border border-blue-200 bg-blue-50 py-3 text-sm font-medium text-blue-700 disabled:opacity-50"
                  >
                    {SIGNUP_FLOW.phoneSend}
                  </button>
                  {otpSent && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder={SIGNUP_FLOW.phoneVerifyPlaceholder}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        className="w-full rounded-xl bg-blue-600 py-3 text-sm font-medium text-white"
                      >
                        {SIGNUP_FLOW.phoneVerifyBtn}
                      </button>
                    </div>
                  )}
                </>
              )}
              {phoneVerified && (
                <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">본인 확인이 완료되었어요.</p>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-left">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{SIGNUP_FLOW.nameLabel}</label>
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{SIGNUP_FLOW.pwLabel}</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{SIGNUP_FLOW.pwConfirmLabel}</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                />
              </div>
              {password && password2 && password !== password2 && (
                <p className="text-xs text-red-600">비밀번호가 일치하지 않아요.</p>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-2 text-emerald-800">
                <Gift className="size-6 shrink-0" />
                <span className="font-semibold">에어컨콜 회원이 되었어요</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-700">{POST_SIGNUP.body}</p>
              <ul className="space-y-2 text-sm text-gray-700">
                {POST_SIGNUP.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-emerald-600">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 flex-col gap-2 border-t border-gray-100 bg-white px-6 py-4 sm:flex-row sm:justify-between">
          {step > 1 && step < 5 && (
            <button
              type="button"
              onClick={handleBack}
              className="w-full rounded-2xl border border-gray-200 py-3 text-sm font-medium text-gray-700 sm:w-auto sm:min-w-[100px]"
            >
              {SIGNUP_FLOW.back}
            </button>
          )}
          <div className="flex w-full flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
            {step === 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-medium text-white sm:min-w-[120px]"
              >
                {SIGNUP_FLOW.next}
              </button>
            )}
            {step === 2 && (
              <button
                type="button"
                disabled={!canNextFrom2}
                onClick={handleNext}
                className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-medium text-white disabled:opacity-50 sm:min-w-[120px]"
              >
                {SIGNUP_FLOW.next}
              </button>
            )}
            {step === 3 && (
              <button
                type="button"
                disabled={!canNextFrom3}
                onClick={handleNext}
                className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-medium text-white disabled:opacity-50 sm:min-w-[120px]"
              >
                {SIGNUP_FLOW.next}
              </button>
            )}
            {step === 4 && (
              <button
                type="button"
                disabled={!canSubmitAccount || submitting}
                onClick={handleFinishSignup}
                className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-medium text-white disabled:opacity-50 sm:min-w-[120px]"
              >
                {submitting ? '처리 중…' : SIGNUP_FLOW.submitSignup}
              </button>
            )}
            {step === 5 && (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-medium text-white sm:min-w-[120px]"
              >
                {SIGNUP_FLOW.close}
              </button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
