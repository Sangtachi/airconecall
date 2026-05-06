import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { ServiceProductDto, fetchInstallProducts, getInstantInstallProducts } from '@/lib/catalogApi';

function formatWon(n: number): string {
  return `${new Intl.NumberFormat('ko-KR').format(n)}원`;
}

/** 설치 상품·요금 참고 안내만 표시합니다. 접수·결제는 매칭 이후 순서에서 진행합니다. */
export function InstallCatalogCheckout() {
  const [products, setProducts] = useState<ServiceProductDto[]>(() => getInstantInstallProducts());
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<'reservation' | 'same_day'>('reservation');
  const [productId, setProductId] = useState(() => getInstantInstallProducts()[0]?.id ?? '');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadErr(null);
      try {
        const rows = await fetchInstallProducts();
        if (cancelled) return;
        setProducts(rows);
        setProductId((prev) =>
          prev && rows.some((r) => r.id === prev) ? prev : (rows[0]?.id ?? ''),
        );
      } catch (e) {
        if (!cancelled && products.length === 0) {
          setLoadErr(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sel = products.find((p) => p.id === productId);
  const displayPrice =
    sel && schedule === 'same_day' ? sel.sameDayPrice : sel ? sel.basePrice : 0;

  return (
    <section className="bg-slate-50 px-6 py-10" aria-labelledby="install-catalog-heading">
      <div className="mx-auto max-w-xl">
        <h2 id="install-catalog-heading" className="text-xl font-semibold text-slate-900">
          에어컨 설치 참고 요금
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          대표 패키지 기준 참고 금액입니다. 긴급 매칭 접수 후 현장 확인·조건에 따라 실제 금액과 결제는 순서대로 안내드립니다.
        </p>

        <div className="mt-5 rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm">
          {loadErr ? (
            <div className="flex items-start gap-2 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{loadErr}</span>
            </div>
          ) : products.length === 0 ? (
            <p className="text-sm text-slate-500">안내 가능한 설치 패키지가 없습니다.</p>
          ) : (
            <div className="space-y-4">
              <label className="block text-xs font-medium text-slate-500">상품 종류</label>
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
                <legend className="sr-only">일정 유형</legend>
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
                {sel?.includedHoleCount ?? '-'}회. 현장 추가 작업은 고객님 동의 후 진행합니다.
              </p>

              <div className="flex justify-between rounded-2xl border border-slate-100 bg-slate-50/90 px-4 py-3 text-sm">
                <span className="text-slate-500">참고 금액 합계</span>
                <span className="font-semibold text-slate-900">{formatWon(displayPrice)}</span>
              </div>

              <p className="rounded-xl bg-blue-50/80 px-3 py-2.5 text-[12px] leading-relaxed text-slate-700">
                위 금액은 이해를 돕기 위한 참고치입니다. 접수 후 배정·현장 상태에 따라 실제 금액과 결제 시점은 별도로 정리합니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
