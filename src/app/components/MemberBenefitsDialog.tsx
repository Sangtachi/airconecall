import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { BENEFITS_CTA_SIGNUP, DIALOG } from '@/app/data/memberRewardsCopy';
import { hasMemberSession } from '@/lib/memberRewards';

type MemberBenefitsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 혜택 확인 후 전체 회원가입 플로우 */
  onStartSignup?: () => void;
};

export function MemberBenefitsDialog({ open, onOpenChange, onStartSignup }: MemberBenefitsDialogProps) {
  const enrolled = hasMemberSession();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90dvh,560px)] overflow-y-auto rounded-2xl border-gray-200 bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-left text-gray-900">{DIALOG.title}</DialogTitle>
          <DialogDescription className="text-left text-gray-600">{DIALOG.lead}</DialogDescription>
        </DialogHeader>
        <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-gray-700">
          {DIALOG.bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="text-xs leading-relaxed text-gray-500">{DIALOG.footerNote}</p>
        <DialogFooter className="mt-4 flex-col gap-2 sm:flex-col">
          {enrolled ? (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
            >
              확인
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onStartSignup?.();
              }}
              className="w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
            >
              {BENEFITS_CTA_SIGNUP}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
