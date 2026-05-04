import { Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { readCachedMemberSignedUp } from '@/lib/memberRewards';

export type MemberHeaderVariant = 'onBlue' | 'onWhite';

type Props = {
  variant: MemberHeaderVariant;
  /** 로고 탭 → 혜택 안내로 바로 진입 */
  onOpenBenefits: () => void;
  /** 회원가입 (접수·대기에서 붙일 bookingRef) */
  onOpenSignup: (bookingRef?: string) => void;
  onOpenManage: () => void;
  /** 대기 접수 후 가입 버튼과 동일 ref */
  signupBookingRef?: string;
};

/**
 * 헤더 우측: 로고 + 삼선.
 * 미가입: 로고→가입, 삼선→혜택·가입 목록 | 가입됨: 로고→혜택, 삼선→회원 관리만.
 */
export function MemberHeaderActions({
  variant,
  onOpenBenefits,
  onOpenSignup,
  onOpenManage,
  signupBookingRef,
}: Props) {
  const enrolled = readCachedMemberSignedUp();
  const isBlue = variant === 'onBlue';
  const ring = isBlue ? 'border-white/40 bg-white/10 shadow-sm' : 'border-gray-200 bg-neutral-50 shadow-sm';

  const iconBtn =
    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40';
  const logoBtn = `${iconBtn} ${ring} ${isBlue ? 'hover:bg-white/20' : 'hover:bg-gray-50'}`;
  const menuBtn = `${iconBtn} ${ring} ${isBlue ? 'text-white hover:bg-white/20' : 'text-gray-700 hover:bg-gray-50'}`;

  const handleLogoClick = () => {
    if (enrolled) onOpenBenefits();
    else onOpenSignup(signupBookingRef);
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        className={logoBtn}
        onClick={handleLogoClick}
        aria-label={enrolled ? '회원 혜택 안내 열기' : '회원 가입 안내 열기'}
        title={enrolled ? '회원 혜택' : '회원 가입'}
      >
        <img
          src="/branding/icon-mark.png"
          alt=""
          className="h-[26px] w-auto max-w-[88px] rounded-md object-contain sm:h-7 sm:max-w-[96px]"
        />
      </button>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button type="button" className={menuBtn} aria-label="메뉴 열기">
            <Menu className="size-5" strokeWidth={2.25} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[12rem]" sideOffset={6}>
          {enrolled ? (
            <>
              <DropdownMenuItem disabled className="text-xs text-gray-500">
                리워드·사용량·정보 수정 확인
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => onOpenManage()}>
                회원 관리
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onOpenBenefits()}
              >
                회원 혜택 · 출동 쿠폰 안내
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onOpenSignup(signupBookingRef)}
              >
                회원 가입
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
