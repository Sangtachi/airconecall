import { CheckCircle2, CircleHelp, Home, Sparkles } from 'lucide-react';

type Props = {
  source: 'contact' | 'member';
  isMemberSignedIn: boolean;
  onPrimaryAction: () => void;
  onViewFaq: () => void;
  onOpenBenefits: () => void;
};

export function PostSubmitStatusPage({
  source,
  isMemberSignedIn,
  onPrimaryAction,
  onViewFaq,
  onOpenBenefits,
}: Props) {
  const title =
    source === 'member' ? '회원 등록이 완료되었어요' : '연락처 저장이 완료되었어요';
  const description =
    source === 'member'
      ? '접수는 유지되고 있으며, 기사 배정이 되는 즉시 회원 혜택 안내와 함께 알려드릴게요.'
      : '접수는 유지되고 있으며, 기사 배정이 되는 즉시 등록된 연락처로 안내드릴게요.';

  return (
    <div className="flex min-h-full min-h-0 flex-1 flex-col bg-slate-50/80 px-6 py-8 sm:items-center sm:justify-center">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-gray-100 bg-white px-6 py-8 text-center shadow-xl shadow-slate-900/10 sm:p-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="mb-3 text-2xl text-gray-900">{title}</h2>
        <p className="mb-6 text-sm leading-relaxed text-gray-600">{description}</p>

        <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-left">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
            <Sparkles className="h-4 w-4 text-blue-600" />
            에이씨나우 안내
          </h3>
          <ul className="space-y-1.5 text-sm leading-relaxed text-gray-600">
            <li>1) 접수 완료 후 지역·거리 기준으로 순차 배정됩니다.</li>
            <li>2) 배정 가능 시 등록된 연락처로 먼저 안내합니다.</li>
            <li>3) 작업 전 비용 안내 후 동의된 항목만 진행합니다.</li>
          </ul>
          <p className="mt-3 text-xs text-gray-500">
            평균 대기 시간은 상황에 따라 달라질 수 있으며, 고객센터 운영 시간은 09:00~22:00 입니다.
          </p>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
          >
            <Home className="h-4 w-4" />
            {isMemberSignedIn ? '회원관리로 이동' : '홈으로 이동'}
          </button>
          <button
            type="button"
            onClick={onViewFaq}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            <CircleHelp className="h-4 w-4 text-blue-600" />
            FAQ 보기
          </button>
          <button
            type="button"
            onClick={onOpenBenefits}
            className="w-full rounded-2xl border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            회원 혜택 안내 보기
          </button>
        </div>
      </div>
    </div>
  );
}
