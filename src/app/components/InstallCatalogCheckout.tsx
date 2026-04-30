import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import {
  ServiceProductDto,
  createOrderDraft,
  fetchInstallProducts,
  fetchMockPaymentsHealth,
  isCatalogApiAvailable,
  mockConfirmPayment,
} from '@/lib/catalogApi';

function formatWon(n: number): string {
  return `${new Intl.NumberFormat('ko-KR').format(n)}원`;
}

export function InstallCatalogCheckout() {
  const [ready, setReady] = useState(() => isCatalogApiAvailable());
  const [products, setProducts] = useState<ServiceProductDto[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<'reservation' | 'same_day'>('reservation');
  const [productId, setProductId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [addressSummary, setAddressSummary] = useState('');
  const [busy, setBusy] = useState(false);
  const [draftSuccess, setDraftSuccess] = useState<string | null>(null);
  const [paidNote, setPaidNote] = useState<string | null>(null);
  const [mockPayOk, setMockPayOk] = useState<boolean | null>(null);

  useEffect(() => {
    setReady(isCatalogApiAvailable());
  }, []);

  useEffect(() => {
    if (!ready) return;
    void fetchMockPaymentsHealth().then(setMockPayOk).catch(() => setMockPayOk(false));
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setLoadErr(null);
      try {
        const rows = await fetchInstallProducts();
        if (cancelled) return;
        setProducts(rows);
        setProductId((prev) =>
          prev && rows.some((r) => r.id === prev) ? prev : (rows[0]?.id ?? ''),
        );
      } catch (e) {
        if (!cancelled) setLoadErr(e instanceof Error ? e.message : '카탈로그를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  const sel = products.find((p) => p.id === productId);
  const displayPrice =
    sel && schedule === 'same_day' ? sel.sameDayPrice : sel ? sel.basePrice : 0;

  const onDraft = async () => {
    if (!sel || !customerName.trim() || customerPhone.trim().length < 8 || addressSummary.trim().length < 3) return;
    setBusy(true);
    setDraftSuccess(null);
    setPaidNote(null);
    try {
      const d = await createOrderDraft({
        productId: sel.id,
        scheduleType: schedule,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        addressSummary: addressSummary.trim(),
      });
      setDraftSuccess(d.id);
    } catch (e) {
      setDraftSuccess(null);
      alert(e instanceof Error ? e.message : '접수 초안 생성 실패');
    } finally {
      setBusy(false);
    }
  };

  const onMockPay = async () => {
    if (!draftSuccess) return;
    setBusy(true);
    setPaidNote(null);
    try {
      await mockConfirmPayment(draftSuccess);
      setPaidNote('모의 결제로 확정되었습니다. (운영에서는 비활성화하세요)');
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : '모의 결제 실패 — 프로덕션이거나 DISABLE_MOCK_PAYMENTS=true 여부 확인';
      alert(msg);
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return null;

  return (
    <section className="bg-slate-50 px-6 py-10" aria-labelledby="install-catalog-heading">
      <div className="mx-auto max-w-xl">
        <h2 id="install-catalog-heading" className="text-xl font-semibold text-slate-900">
          에어컨 설치 — 가격 확인·접수 초안 (베타)
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span>
            백엔드(API) 연결 시 설치 카탈로그와 접수 초안을 사용합니다. 사업자·PG 없을 때도 로컬/비프로덕션에서는
            모의 결제 버튼이 동작하도록 두었습니다.
          </span>
          {mockPayOk === null ? (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">결제 허용 확인 중…</span>
          ) : mockPayOk ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
              모의 결제 사용 가능
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
              모의 결제 차단됨(PRODUCTION 또는 DISABLE_MOCK_PAYMENTS)
            </span>
          )}
        </div>

        <div className="mt-5 rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> 목록 불러오는 중…
            </div>
          ) : loadErr ? (
            <div className="flex items-start gap-2 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{loadErr}</span>
            </div>
          ) : products.length === 0 ? (
            <p className="text-sm text-slate-500">설치 상품이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              <label className="block text-xs font-medium text-slate-500">상품</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <fieldset className="flex flex-wrap gap-3 text-sm">
                <legend className="sr-only">일정</legend>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                  <input
                    type="radio"
                    checked={schedule === 'reservation'}
                    onChange={() => setSchedule('reservation')}
                    name="sched"
                  />
                  예약 설치{' '}
                  <span className="font-semibold text-slate-900">
                    {sel ? formatWon(sel.basePrice) : ''}
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                  <input type="radio" checked={schedule === 'same_day'} onChange={() => setSchedule('same_day')} name="sched" />
                  당일 설치{' '}
                  <span className="font-semibold text-blue-700">
                    {sel ? formatWon(sel.sameDayPrice) : ''}
                  </span>
                </label>
              </fieldset>

              <p className="text-xs leading-relaxed text-slate-500">
                포함: 배관 {sel?.includedPipeMeter ?? '-'}m, 냉매 {sel?.includedRefrigerantCount ?? '-'}회, 타공{' '}
                {sel?.includedHoleCount ?? '-'}회. 현장 추가 작업은 앱에서 고객 승인 후만 진행됩니다.
              </p>

              <div className="grid gap-3">
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  placeholder="이름"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  placeholder="전화 (010 포함)"
                  inputMode="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
                <textarea
                  className="min-h-[72px] rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="주소 요약"
                  value={addressSummary}
                  onChange={(e) => setAddressSummary(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">선택 요금 합계(참고)</span>
                  <span className="font-semibold text-slate-900">{formatWon(displayPrice)}</span>
                </div>
                <button
                  type="button"
                  disabled={busy || !sel}
                  className="w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-medium text-white disabled:opacity-50"
                  onClick={() => void onDraft()}
                >
                  접수 초안 만들기 (결제 전)
                </button>
                <p className="text-[11px] text-slate-500">
                  실제 PG 결제 없이 초안 주문만 만듭니다. 사업자·PG 준비 전에는 로컬에서만 검증하는 것을 권장합니다.
                </p>
              </div>

              {draftSuccess ? (
                <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-200/70">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-medium">주문 초안 ID: {draftSuccess}</p>
                      <button
                        type="button"
                        className="mt-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                        disabled={busy}
                        onClick={() => void onMockPay()}
                      >
                        개발만: 모의 결제 확정
                      </button>
                      {paidNote ? <p className="mt-2 text-xs text-emerald-800">{paidNote}</p> : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
