import { useMemo, useState } from 'react';
import { ArrowLeft, CircleHelp, Gift, Home, PencilLine, ShieldCheck, Sparkles, Ticket, Wrench } from 'lucide-react';

type Props = {
  onGoHome: () => void;
  onGoRequest: () => void;
  onOpenBenefits: () => void;
  onViewFaq: () => void;
};

export function MemberDashboardPage({ onGoHome, onGoRequest, onOpenBenefits, onViewFaq }: Props) {
  const [name, setName] = useState('에이씨나우 회원');
  const [phone, setPhone] = useState('010-1234-5678');
  const [marketingSms, setMarketingSms] = useState(true);

  const stats = useMemo(
    () => ({
      level: 'Silver',
      totalReward: 32000,
      monthlyExpected: 8000,
      usedCount: 2,
      remainingCoupons: 3,
    }),
    [],
  );

  return (
    <main className="min-h-full bg-slate-50/80 px-6 py-6 sm:py-8">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <section className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onGoHome}
            className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-sm text-gray-700 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            뒤로가기
          </button>
          <button
            type="button"
            onClick={onGoRequest}
            className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm"
          >
            <Wrench className="h-4 w-4" />
            긴급매칭으로
          </button>
        </section>

        <section className="rounded-3xl border border-blue-100/80 bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-6 text-white shadow-lg shadow-blue-900/20">
          <p className="mb-2 flex items-center gap-2 text-sm text-blue-100">
            <ShieldCheck className="h-4 w-4" />
            회원 관리
          </p>
          <h1 className="text-2xl font-semibold">안녕하세요, {name}님</h1>
          <p className="mt-2 text-sm text-blue-100">현재 등급 {stats.level} · 누적 리워드 혜택 {stats.totalReward.toLocaleString()}원</p>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">누적 리워드</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{stats.totalReward.toLocaleString()}원</p>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">
              이번 달
              <br />
              예상 혜택
            </p>
            <p className="mt-1 text-lg font-semibold text-blue-600">{stats.monthlyExpected.toLocaleString()}원</p>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">사용 가능 쿠폰</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{stats.remainingCoupons}장</p>
          </article>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
            <Gift className="h-4 w-4 text-blue-600" />
            리워드 현황
          </h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>이번 달 사용 횟수: {stats.usedCount}회</li>
            <li>다음 방문 할인 쿠폰: 1장 준비됨</li>
            <li>추천 보상 상태: 검증 대기 1건</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
            <Sparkles className="h-4 w-4 text-blue-600" />
            최근 활동
          </h2>
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-gray-700">
            <p className="font-medium text-gray-800">최근 접수:</p>
            <p className="mt-1">경기 파주시 스탠드 에어컨 · 기사 배정 대기 중</p>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
            <PencilLine className="h-4 w-4 text-blue-600" />
            회원정보 수정
          </h2>
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600">닉네임</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600">연락처</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={marketingSms}
                onChange={(e) => setMarketingSms(e.target.checked)}
              />
              혜택/이벤트 알림 문자 수신
            </label>
          </div>
        </section>

        <section className="space-y-2 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
          <button
            type="button"
            onClick={onGoHome}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white"
          >
            <Home className="h-4 w-4" />
            홈으로 이동
          </button>
          <button
            type="button"
            onClick={onViewFaq}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3 text-sm font-medium text-slate-700"
          >
            <CircleHelp className="h-4 w-4 text-blue-600" />
            FAQ 보기
          </button>
          <button
            type="button"
            onClick={onOpenBenefits}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700"
          >
            <Ticket className="h-4 w-4 text-blue-600" />
            회원 혜택 안내
          </button>
        </section>
      </div>
    </main>
  );
}
