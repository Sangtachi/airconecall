import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { readCachedMemberSignedUp } from '@/lib/memberRewards';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSignup: () => void;
};

/** 실제 마이페이지 연동 전 — 가입 상태 안내 및 가입 유도 */
export function MemberManageDialog({ open, onOpenChange, onOpenSignup }: Props) {
  const enrolled = readCachedMemberSignedUp();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl border-gray-200 bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-left">회원 관리</DialogTitle>
          <DialogDescription className="text-left">
            에이씨나우 계정 로그인·예약 내역 등은 순차적으로 열립니다.
          </DialogDescription>
        </DialogHeader>
        {enrolled ? (
          <div className="space-y-3 text-sm leading-relaxed text-gray-700">
            <p>이 브라우저에서는 <span className="font-medium text-gray-900">회원 등록 완료</span> 상태로 보입니다.</p>
            <p className="text-gray-500">정식 론칭 시 이 번호로 로그인하면 출동 내역과 쿠폰을 모아 볼 수 있어요.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">아직 가입 정보가 없어요. 회원 가입하면 리워드를 쌓을 수 있어요.</p>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onOpenSignup();
              }}
              className="w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700"
            >
              회원 가입 하기
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
