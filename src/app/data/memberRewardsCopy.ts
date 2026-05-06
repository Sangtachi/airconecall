/** 리워드 카피 요약 — doc/ver2/aircon_reward_mvp_spec.md 과 정합 유지 (문구만) */

export const HOME_BENEFITS_BUTTON = '회원 혜택 · 출동 쿠폰 안내';

export const DIALOG = {
  title: '에이씨나우 회원 혜택',
  lead: '긴급 접수는 지금처럼 바로 가능하고, 회원으로 등록하면 출동·재이용 혜택을 쌓을 수 있어요.',
  bullets: [
    '전화번호 인증 시 첫 긴급출동 할인 쿠폰 안내',
    '우리집 에어컨 등록 시 추가 할인 쿠폰 안내',
    '첫 방문 완료 후 다음 이용 할인 쿠폰 안내',
    '친구 추천·기사 추천 보상(검증 후 지급)',
  ],
  footerNote:
    '실제 지급 조건·금액은 서비스 오픈 시점에 안내됩니다. 쿠폰은 출장비·점검·수리에 한해 적용됩니다.',
} as const;

export const WAITLIST = {
  title: '회원 등록 후 리워드 받기',
  subtitle:
    '아래에서는 비회원용 연락처와 회원 가입을 나눴어요. 회원 가입은 첫 화면과 같은 단계별 안내로 진행됩니다.',
  placeholder: '휴대폰 번호 (예: 01012345678)',
  /** @deprecated 버튼이 모달 회원 가입 플로우로 대체 */
  ctaPrimary: '회원 가입하고 리워드 받기',
  ctaDismiss: '나중에 받을게요',
} as const;

export const WAITLIST_CONTACT = {
  title: '연락처 (비회원 접수)',
  desc: '방문 안내 문자를 받으실 번호예요. 회원 가입과는 별도로 저장합니다.',
  ctaSave: '연락처 저장',
  savedToast: '저장했어요. 기사 안내 시 참고합니다.',
} as const;

export const BENEFITS_CTA_SIGNUP = '회원 가입 시작';

/** 다단계 회원가입 플로우 (홈 팝업·대기 화면 공통) */
export const SIGNUP_FLOW = {
  stepLabel: (n: number) => ['혜택 안내', '약관 동의', '휴대폰 인증', '계정 만들기', '가입 완료'][n - 1],
  introTitle: '회원 혜택을 단계별로 확인해요',
  introLead: DIALOG.lead,
  termsTitle: '서비스 이용 동의',
  termsService: '(필수) 서비스 이용약관에 동의합니다.',
  termsPrivacy: '(필수) 개인정보 수집·이용에 동의합니다.',
  termsMarketing: '(선택) 이벤트·혜택 알림 문자를 받습니다.',
  phoneTitle: '휴대폰 본인 확인',
  phoneHint: '인증 문자는 서비스 오픈 시 실제 발송됩니다. 지금은 입력 확인 후 회원 등록만 진행합니다.',
  phoneSend: '인증번호 받기',
  phoneVerifyPlaceholder: '6자리 인증번호',
  phoneVerifyBtn: '인증 확인',
  accountTitle: '에이씨나우 계정 만들기',
  nameLabel: '이름',
  pwLabel: '비밀번호 (8자 이상)',
  pwConfirmLabel: '비밀번호 확인',
  submitSignup: '가입 완료',
  back: '이전',
  next: '다음',
  close: '닫기',
} as const;

export const POST_SIGNUP = {
  title: '가입 준비가 완료되었어요',
  body: '다음 출동·재이용 시 적용 가능한 쿠폰과 미션(에어컨 등록, 친구 추천 등)을 차례로 안내드릴 예정이에요.',
  bullets: ['다음 긴급 출동 시 할인 쿠폰 적용 안내', '에어컨 사진 등록 시 추가 혜택 안내', '친구 초대·기사 추천 이벤트'],
} as const;
