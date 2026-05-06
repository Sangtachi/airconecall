import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { hasMemberSession } from '@/lib/memberRewards';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSignup: () => void;
};

/** 회원 세션 상태 안내 및 가입 유도 */
export function MemberManageDialog({ open, onOpenChange, onOpenSignup }: Props) {
  const enrolled = hasMemberSession();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl border-gray-200 bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-left">회원 관리</DialogTitle>
          <DialogDescription className="text-left">
            로그인하면 내 문의, 주문, 쿠폰, 리워드를 회원 기준으로 확인합니다.
          </DialogDescription>
        </DialogHeader>
        {enrolled ? (
          <div className="space-y-3 text-sm leading-relaxed text-gray-700">
            <p>현재 기기에서 <span className="font-medium text-gray-900">회원 세션</span>이 유지되고 있습니다.</p>
            <p className="text-gray-500">회원 관리 화면에서 서버에 저장된 문의와 쿠폰을 확인할 수 있어요.</p>
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
