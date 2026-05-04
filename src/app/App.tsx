import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Clock, MapPin, Wrench, CreditCard, Shield, CheckCircle2, ArrowRight, User, Ticket } from 'lucide-react';
import { markEmergencyLeadTimeout, submitRequest } from '@/lib/api';
import { AppShell } from '@/app/components/AppShell';
import { MemberBenefitsDialog } from '@/app/components/MemberBenefitsDialog';
import { MemberDashboardPage } from '@/app/components/MemberDashboardPage';
import { MemberHeaderActions } from '@/app/components/MemberHeaderActions';
import { MemberSignupFlowModal } from '@/app/components/MemberSignupFlowModal';
import { PostSubmitStatusPage } from '@/app/components/PostSubmitStatusPage';
import { WaitlistMemberUpsell } from '@/app/components/WaitlistMemberUpsell';
import { readCachedMemberSignedUp } from '@/lib/memberRewards';
import { HOME_BENEFITS_BUTTON } from '@/app/data/memberRewardsCopy';
import { FAQ_ITEMS } from '@/seo/siteContent';
import { scrollAppToTop } from '@/lib/scrollApp';
import { InstallCatalogCheckout } from '@/app/components/InstallCatalogCheckout';

/** 1차 근처 검색 구간 종료까지 경과(초) — 이후 2차(광역) 검색 */
const MATCH_SWITCH_TO_WIDE_AT = 20;
/** 웨잇리스트 화면 전환까지 총 경과(초). 서버 매칭 기본 타임아웃과 맞춤 */
const MATCH_END_AT = 40;

export default function App() {
  const [step, setStep] = useState<'home' | 'request' | 'memberDashboard'>('home');
  const [formData, setFormData] = useState({
    location: '',
    acType: '',
    issue: '',
    urgency: 'now'
  });
  const [memberBenefitsOpen, setMemberBenefitsOpen] = useState(false);
  const [memberSignupOpen, setMemberSignupOpen] = useState(false);
  const [signupBookingRef, setSignupBookingRef] = useState<string | undefined>();
  const [memberSignupDone, setMemberSignupDone] = useState(() => readCachedMemberSignedUp());
  const [memberSignupEventId, setMemberSignupEventId] = useState(0);

  const openSignup = (ref?: string) => {
    setSignupBookingRef(ref);
    setMemberSignupOpen(true);
  };

  const onMemberSignupOpenChange = (open: boolean) => {
    setMemberSignupOpen(open);
    if (!open) setSignupBookingRef(undefined);
  };

  useLayoutEffect(() => {
    scrollAppToTop();
  }, [step]);

  const memberModals = (
    <>
      <MemberBenefitsDialog
        open={memberBenefitsOpen}
        onOpenChange={setMemberBenefitsOpen}
        onStartSignup={() => {
          setMemberBenefitsOpen(false);
          openSignup(undefined);
        }}
      />
      <MemberSignupFlowModal
        open={memberSignupOpen}
        onOpenChange={onMemberSignupOpenChange}
        bookingRef={signupBookingRef}
        onComplete={() => {
          setMemberSignupDone(true);
          setMemberSignupEventId((prev) => prev + 1);
        }}
      />
    </>
  );

  return (
    <AppShell>
      {memberModals}
      {step === 'home' ? (
        <HomePage
          onRequestClick={() => setStep('request')}
          onOpenBenefits={() => setMemberBenefitsOpen(true)}
          onOpenSignup={openSignup}
          onOpenManage={() => setStep('memberDashboard')}
        />
      ) : step === 'request' ? (
        <RequestPage
          formData={formData}
          setFormData={setFormData}
          onBack={() => setStep('home')}
          memberSignupDone={memberSignupDone}
          memberSignupEventId={memberSignupEventId}
          onOpenBenefits={() => setMemberBenefitsOpen(true)}
          onOpenSignup={openSignup}
          onOpenManage={() => setStep('memberDashboard')}
          onGoMemberDashboard={() => setStep('memberDashboard')}
        />
      ) : (
        <MemberDashboardPage
          onGoHome={() => setStep('home')}
          onGoRequest={() => setStep('request')}
          onOpenBenefits={() => setMemberBenefitsOpen(true)}
          onViewFaq={() => {
            setStep('home');
            setTimeout(() => {
              const faq = document.getElementById('faq');
              if (faq) faq.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 60);
          }}
        />
      )}
    </AppShell>
  );
}

function MatchingScreen({
  stage,
  elapsedTime,
  matchingDeadlineIso,
  formData,
  onCancel,
  signupBookingRef,
  onOpenBenefits,
  onOpenSignup,
  onOpenManage
}: {
  stage: string;
  elapsedTime: number;
  matchingDeadlineIso?: string | null;
  formData: any;
  onCancel: () => void;
  signupBookingRef?: string;
  onOpenBenefits: () => void;
  onOpenSignup: (bookingRef?: string) => void;
  onOpenManage: () => void;
}) {
  const deadlineMs = matchingDeadlineIso ? Date.parse(matchingDeadlineIso) : NaN;
  const serverRemainSec =
    Number.isFinite(deadlineMs) ? Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000)) : null;
  return (
    <div className="flex w-full min-h-full flex-col bg-slate-50/90">
      {/* Header — 스크롤 시에도 상단 고정 */}
      <div className="sticky top-0 z-20 flex-shrink-0 border-b border-gray-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm md:px-6 md:py-4">
        <div className="flex w-full items-center justify-between gap-3">
          <h1 className="text-base font-semibold md:text-lg">기사님 찾는 중</h1>
          <div className="flex shrink-0 items-center gap-3">
            <MemberHeaderActions
              variant="onWhite"
              signupBookingRef={signupBookingRef}
              onOpenBenefits={onOpenBenefits}
              onOpenSignup={onOpenSignup}
              onOpenManage={onOpenManage}
            />
            <button
              onClick={onCancel}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              취소
            </button>
          </div>
        </div>
        {/* Progress strip: keeps map block free for 지도 영역 */}
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
            <span>매칭 진행 중</span>
            <span>
              {elapsedTime}초
              {serverRemainSec != null && (
                <span className="ml-2 text-[11px] text-gray-400">· 서버 종료까지 ~{serverRemainSec}초</span>
              )}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full bg-blue-600 transition-all duration-1000"
              style={{
                width: `${Math.min((elapsedTime / MATCH_END_AT) * 100, 100)}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Map Area — 문서 흐름으로 최소 높이만 보장(아래까지 스크롤 가능) */}
      <div className="relative min-h-[min(52vh,480px)] w-full shrink-0 bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50">
        <div className="absolute inset-0">
          {/* Mock Map Grid */}
          <svg className="h-full w-full opacity-25">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Mock Roads */}
          <svg className="absolute inset-0 w-full h-full opacity-30">
            <line x1="0" y1="40%" x2="100%" y2="40%" stroke="#666" strokeWidth="3"/>
            <line x1="0" y1="60%" x2="100%" y2="60%" stroke="#666" strokeWidth="2"/>
            <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#666" strokeWidth="2"/>
            <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#666" strokeWidth="3"/>
          </svg>

          {/* Search Radius — 크기 단계 전환 + 호흡(스케일) 반복 */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              aria-hidden
              className="match-ring-breathe rounded-full border-[3px] border-blue-400/70 bg-blue-100/25 shadow-[0_0_28px_-4px_rgba(59,130,246,0.45)] transition-[width,height] duration-700 ease-out"
              style={{
                width: stage === '15분' ? '200px' : '320px',
                height: stage === '15분' ? '200px' : '320px'
              }}
            />
          </div>

          {/* User Location (Center) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border-4 border-white bg-blue-600 shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm bg-white px-3 py-1 rounded-full shadow-md">
                {formData.location || '내 위치'}
              </div>
            </div>
          </div>

          {/* Searching Indicator */}
          <div className="absolute top-3 left-1/2 z-10 -translate-x-1/2 px-3">
            <div className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs shadow-lg shadow-slate-900/10 backdrop-blur-sm md:text-sm">
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
              <span className="font-medium">{stage} 거리 내 검색 중</span>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 카드 + 매칭 취소: 한 열로 이어져 전체 화면 스크롤로 도달 */}
      <div className="w-full shrink-0 rounded-t-[1.35rem] border-t border-gray-100 bg-white/98 shadow-[0_-10px_40px_-12px_rgb(15_23_42/0.15)]">
        <div className="px-4 pt-3 md:px-6 md:pt-4">
          <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-gray-200/90 md:hidden" aria-hidden />

          <h2 className="mb-2 text-lg font-semibold leading-snug text-gray-900 md:text-xl">
            {stage} 거리 내 기사님을 찾고 있습니다
          </h2>
          <p className="mb-3 flex items-start gap-2 text-xs text-gray-600 md:text-sm">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <span>
              등록된 기사님만 연결합니다.
              {stage === '15분'
                ? ' 주변 가능 인력을 확인하는 중이에요.'
                : ' 조금만 기다려 주세요.'}
            </span>
          </p>

          <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl border border-blue-100/70 bg-blue-50/90 p-3 text-center text-[11px] shadow-sm md:gap-3 md:p-4 md:text-sm">
            <div>
              <div className="mb-0.5 text-[10px] text-gray-500 md:text-xs">검색</div>
              <div className="font-semibold text-blue-600">{stage}</div>
            </div>
            <div className="border-x border-blue-100/80">
              <div className="mb-0.5 text-[10px] text-gray-500 md:text-xs">에어컨</div>
              <div className="font-medium text-gray-900">{formData.acType || '벽걸이'}</div>
            </div>
            <div>
              <div className="mb-0.5 text-[10px] text-gray-500 md:text-xs">출장비</div>
              <div className="font-semibold text-gray-900">3만원</div>
            </div>
          </div>

          <div className="mb-4 space-y-2.5 rounded-2xl border border-gray-100 bg-slate-50/90 p-4 text-xs leading-relaxed text-gray-600 md:text-[13px]">
            <p>
              서비스 지역은{' '}
              <span className="font-medium text-gray-700">경기 고양시·파주시·포천시</span>
            우선 안내합니다. 에어컨 설치·청소 중심으로 매칭하며, 접수 과정에서 일정 유형별 요금 안내가 따릅니다.
            </p>
            <p>
              현장에서 추가 비용이 생기면{' '}
              <span className="font-medium text-gray-800">고객님 동의 후</span>에만 진행됩니다.
            </p>
            <p className="text-gray-500">
              매칭이 길어질 경우 알림 문자로 상태를 안내드릴 수 있어요. (서비스 정책에 따라 변경될 수 있음)
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 bg-white px-4 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] md:px-6">
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-2xl bg-slate-100 py-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            매칭 취소
          </button>
          <p className="mt-3 text-center text-[10px] text-gray-400 md:text-[11px]">
            지도 화면에서 아래로 스크롤하면 이 버튼까지 내려올 수 있어요
          </p>
        </div>
      </div>
    </div>
  );
}

function HomePage({
  onRequestClick,
  onOpenBenefits,
  onOpenSignup,
  onOpenManage
}: {
  onRequestClick: () => void;
  onOpenBenefits: () => void;
  onOpenSignup: (bookingRef?: string) => void;
  onOpenManage: () => void;
}) {
  return (
    <main id="primary" lang="ko" className="min-w-0">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-600 to-blue-800 text-white">
        <div className="absolute right-4 top-4 z-10 md:right-8 md:top-5">
          <MemberHeaderActions
            variant="onBlue"
            onOpenBenefits={onOpenBenefits}
            onOpenSignup={onOpenSignup}
            onOpenManage={onOpenManage}
          />
        </div>
        <div className="w-full px-6 py-12">
          <div className="mb-8">
            <div className="mb-6 flex justify-center md:justify-start">
              <div className="inline-flex rounded-2xl border border-white/65 bg-neutral-50 p-3 shadow-lg shadow-black/15 ring-[0.5px] ring-black/[0.08] md:rounded-[1.35rem] md:p-[0.875rem]">
                <img
                  src="/branding/icon-mark.png"
                  alt="에어컨콜"
                  className="h-14 w-auto max-w-[200px] rounded-lg object-contain sm:h-16 sm:max-w-[220px]"
                />
              </div>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-4">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm">고양·파주·포천 접수 가능</span>
            </div>
            <h1 id="hero-heading" className="text-3xl mb-4">
              긴급 기사 매칭부터<br />
              설치·청소 예약까지
            </h1>
            <p className="text-blue-100 text-lg">
              당장 문제가 있을 땐 긴급 매칭으로 접수하고,<br />
              일정 예약과 요금 확인도 이어서 이용할 수 있어요
            </p>
          </div>

          <button
            onClick={onRequestClick}
            className="flex w-full items-center justify-center gap-2 rounded-3xl bg-white py-4 text-blue-600 shadow-lg shadow-blue-950/25 transition-colors hover:bg-blue-50"
          >
            <span className="text-lg">긴급 기사 매칭</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl mb-1">당일·예약</div>
              <div className="text-sm text-blue-200">가격 구분</div>
            </div>
            <div>
              <div className="text-2xl mb-1">앱 결제</div>
              <div className="text-sm text-blue-200">투명한 요금</div>
            </div>
            <div>
              <div className="text-2xl mb-1">검증</div>
              <div className="text-sm text-blue-200">파트너 기사</div>
            </div>
          </div>
        </div>
      </div>

      <InstallCatalogCheckout />

      {/* How It Works */}
      <div className="w-full px-6 py-12">
        <h2 className="text-2xl mb-8 text-center">이렇게 이용해요</h2>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100/90 bg-blue-50 text-base font-semibold text-blue-600 shadow-sm">
              1
            </div>
            <div className="flex-1">
              <h3 className="mb-1">설치 종류·일정·위치</h3>
              <p className="text-gray-600">
                에어컨 유형과 당일/예약, 방문 지역을 입력합니다 (고양·파주·포천 우선 안내 구역)
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100/90 bg-blue-50 text-base font-semibold text-blue-600 shadow-sm">
              2
            </div>
            <div className="flex-1">
              <h3 className="mb-1">예상 비용 확인</h3>
              <p className="text-gray-600">평균 출장비·작업비 참고 금액을 먼저 안내해 드립니다</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100/90 bg-blue-50 text-base font-semibold text-blue-600 shadow-sm">
              3
            </div>
            <div className="flex-1">
              <h3 className="mb-1">기사님 매칭</h3>
              <p className="text-gray-600">
                가능한 분께 순서대로 연결합니다. (수동 배정으로 시간이 걸릴 수 있어요)
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100/90 bg-blue-50 text-base font-semibold text-blue-600 shadow-sm">
              4
            </div>
            <div className="flex-1">
              <h3 className="mb-1">방문·설치·청소</h3>
              <p className="text-gray-600">
                포함 범위는 상품 안내를 따르고, 추가 작업만 고객 앱 동의 후 진행합니다
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white">
        <div className="w-full px-6 py-12">
          <h2 className="text-2xl mb-8 text-center">에어컨콜의 장점</h2>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="flex aspect-square flex-col items-start justify-start rounded-2xl border border-gray-200/85 bg-[#f7f8f9] p-4 text-left shadow-sm sm:rounded-[1.25rem] sm:p-5">
              <Clock className="mb-3 h-8 w-8 shrink-0 text-blue-600" strokeWidth={1.75} />
              <h3 className="mb-2 font-semibold text-gray-900">긴급 우선</h3>
              <p className="text-sm leading-snug text-gray-500">
                당일/예약<br />요금 구분 노출
              </p>
            </div>

            <div className="flex aspect-square flex-col items-start justify-start rounded-2xl border border-gray-200/85 bg-[#f7f8f9] p-4 text-left shadow-sm sm:rounded-[1.25rem] sm:p-5">
              <Shield className="mb-3 h-8 w-8 shrink-0 text-blue-600" strokeWidth={1.75} />
              <h3 className="mb-2 font-semibold text-gray-900">검증 파트너</h3>
              <p className="text-sm leading-snug text-gray-500">
                사전 등록된<br />기사님만 연결
              </p>
            </div>

            <div className="flex aspect-square flex-col items-start justify-start rounded-2xl border border-gray-200/85 bg-[#f7f8f9] p-4 text-left shadow-sm sm:rounded-[1.25rem] sm:p-5">
              <CreditCard className="mb-3 h-8 w-8 shrink-0 text-blue-600" strokeWidth={1.75} />
              <h3 className="mb-2 font-semibold text-gray-900">투명한 금액</h3>
              <p className="text-sm leading-snug text-gray-500">
                출장비·평균 작업비<br />미리 안내
              </p>
            </div>

            <div className="flex aspect-square flex-col items-start justify-start rounded-2xl border border-gray-200/85 bg-[#f7f8f9] p-4 text-left shadow-sm sm:rounded-[1.25rem] sm:p-5">
              <Wrench className="mb-3 h-8 w-8 shrink-0 text-blue-600" strokeWidth={1.75} />
              <h3 className="mb-2 font-semibold text-gray-900">플랫폼 결제 안내</h3>
              <p className="text-sm leading-snug text-gray-500">
                앱 밖 현금은<br />보증·CS 미적용 원칙
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="w-full px-6 py-12">
        <h2 className="text-2xl mb-8 text-center">요금 안내</h2>
        <p className="-mt-6 mb-8 px-2 text-center text-sm text-gray-500">
          아래 금액은 참고용이며, 현장 결과에 따라 달라질 수 있습니다
        </p>

        <div className="mb-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-md shadow-slate-900/5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg">기본 출장비 (참고)</h3>
            <span className="text-2xl text-blue-600">30,000원~</span>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>평일 주간 (09:00~18:00)</span>
              <span>기본 구간</span>
            </div>
            <div className="flex justify-between">
              <span>평일 야간 (18:00~22:00)</span>
              <span>할증 참고</span>
            </div>
            <div className="flex justify-between">
              <span>주말·공휴일</span>
              <span>할증 참고</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100/80 bg-blue-50/90 p-6 shadow-sm">
          <h3 className="text-lg mb-3">작업비 참고 구간</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">에어컨 점검/진단</span>
              <span>무료</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">냉매 보충</span>
              <span>50,000~80,000원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">실외기 수리</span>
              <span>80,000~150,000원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">기타 부품 교체</span>
              <span>현장 견적</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-sm text-gray-600 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>추가 작업·부품은 반드시 동의 후 진행합니다</span>
            </p>
          </div>
        </div>
      </div>

      {/* FAQ — AEO: 화면 본문·JSON-LD FAQPage(siteContent)·동일 카피 */}
      <section
        id="faq"
        className="scroll-mt-24 border-y border-blue-100/80 bg-blue-50/40"
        aria-labelledby="faq-heading"
      >
        <div className="w-full px-6 py-12">
          <h2 id="faq-heading" className="text-2xl mb-2 text-center">
            자주 묻는 질문
          </h2>
          <p className="mb-8 text-center text-sm text-gray-600">
            고양·파주·포천 에어컨 긴급 매칭과 비용·접수에 관한 안내입니다
          </p>
          <dl className="mx-auto max-w-2xl space-y-8">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border-b border-gray-200/80 pb-8 last:border-0 last:pb-0">
                <dt className="font-semibold text-gray-900">{item.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-gray-600">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white">
        <div className="w-full px-6 py-12 text-center">
          <h2 className="text-2xl mb-4">지금 요청해 보세요</h2>
          <p className="text-blue-100 mb-8">
            고양·파주·포천에서 긴급 에어컨 문제를 접수해 주세요
          </p>
          <button
            onClick={onRequestClick}
            className="w-full rounded-3xl bg-white py-4 text-blue-600 shadow-lg shadow-blue-950/30 transition-colors hover:bg-blue-50"
          >
            긴급 기사 매칭
          </button>
        </div>
      </div>

      {/* 회원 혜택 — 메인 플로우 외 선택 진입 (플랜 Phase 1) */}
      <div className="border-t border-gray-100 bg-white px-6 py-8">
        <button
          type="button"
          onClick={onOpenBenefits}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200/95 bg-[#f7f8f9] py-4 text-base font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
        >
          <Ticket className="h-5 w-5 shrink-0 text-blue-600" aria-hidden />
          {HOME_BENEFITS_BUTTON}
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-400">
        <div className="w-full px-6 py-8">
          <div className="mb-6">
            <h3 className="mb-1 text-lg text-white">에어컨콜</h3>
            <p className="text-sm text-gray-300">긴급 에어컨 출동·기사 매칭</p>
            <p className="mt-3 text-sm text-gray-300">
              대표자 :{' '}
              <span className="text-white">최병성</span>
              <span className="text-gray-400">, </span>
              <span className="text-white">최우혁</span>
            </p>
          </div>
          <div className="space-y-2 text-sm leading-relaxed">
            <p>
              <span className="text-gray-500">서비스 지역</span>
              <br />
              <span className="text-gray-300">경기 고양시·파주시·포천시</span>
            </p>
            <p>
              <span className="text-gray-500">대상</span>
              <br />
              가정용 벽걸이·스탠드·2in1 긴급 점검·수리
            </p>
            <p>
              <span className="text-gray-500">운영</span>
              <br />
              연중무휴 접수 (출동·매칭은 현장 사정에 따라 달라질 수 있어요)
            </p>
          </div>
          <div className="mt-6 border-t border-gray-800 pt-6 text-xs text-gray-500">
            <p>© 2026 에어컨콜. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function RequestPage({
  formData,
  setFormData,
  onBack,
  memberSignupDone,
  memberSignupEventId,
  onOpenBenefits,
  onOpenSignup,
  onOpenManage,
  onGoMemberDashboard
}: {
  formData: any;
  setFormData: (data: any) => void;
  onBack: () => void;
  memberSignupDone: boolean;
  memberSignupEventId: number;
  onOpenBenefits: () => void;
  onOpenSignup: (bookingRef?: string) => void;
  onOpenManage: () => void;
  onGoMemberDashboard: () => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [matchingStage, setMatchingStage] = useState<'searching15' | 'searching30' | 'waitlist' | 'matched'>('searching15');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [matchingDeadlineIso, setMatchingDeadlineIso] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [postSubmitSource, setPostSubmitSource] = useState<'contact' | 'member' | null>(null);
  const handledSignupEventRef = useRef(0);

  useLayoutEffect(() => {
    scrollAppToTop();
  }, [submitted, matchingStage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    try {
      setSubmitting(true);
      const lead = await submitRequest({
        ...formData,
        submittedAt: new Date().toISOString(),
        matchingTimeoutSeconds: MATCH_END_AT
      });
      setMatchingDeadlineIso(lead.deadlineIso);
      setSubmitted(true);
      setElapsedTime(0);
      setMatchingStage('searching15');
    } catch (err) {
      const raw = err instanceof Error ? err.message.trim() : '';
      setSubmitError(raw || '접수를 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  // Matching timer logic
  useEffect(() => {
    if (!submitted) return;

    const interval = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 1;

        if (newTime === MATCH_SWITCH_TO_WIDE_AT) {
          setMatchingStage('searching30');
        } else if (newTime === MATCH_END_AT) {
          void markEmergencyLeadTimeout();
          setMatchingStage('waitlist');
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [submitted]);

  useEffect(() => {
    if (memberSignupEventId <= handledSignupEventRef.current) return;
    handledSignupEventRef.current = memberSignupEventId;
    if (submitted && matchingStage === 'waitlist') {
      setPostSubmitSource('member');
    }
  }, [memberSignupEventId, submitted, matchingStage]);

  const memberHeaderCallbacks = {
    onOpenBenefits,
    onOpenSignup,
    onOpenManage
  };
  const isMemberSignedIn = memberSignupDone || readCachedMemberSignedUp();
  const goHomeOrManage = () => {
    if (isMemberSignedIn) onGoMemberDashboard();
    else onBack();
  };

  const moveToFaqSection = () => {
    onBack();
    setTimeout(() => {
      const faq = document.getElementById('faq');
      if (faq) {
        faq.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.location.hash = 'faq';
      }
    }, 60);
  };

  if (submitted && matchingStage === 'waitlist' && postSubmitSource) {
    return (
      <PostSubmitStatusPage
        source={postSubmitSource}
        isMemberSignedIn={isMemberSignedIn}
        onPrimaryAction={goHomeOrManage}
        onViewFaq={moveToFaqSection}
        onOpenBenefits={onOpenBenefits}
      />
    );
  }

  if (submitted && matchingStage === 'searching15') {
    return (
      <MatchingScreen
        stage="15분"
        elapsedTime={elapsedTime}
        matchingDeadlineIso={matchingDeadlineIso}
        formData={formData}
        onCancel={onBack}
        {...memberHeaderCallbacks}
      />
    );
  }

  if (submitted && matchingStage === 'searching30') {
    return (
      <MatchingScreen
        stage="30분"
        elapsedTime={elapsedTime}
        matchingDeadlineIso={matchingDeadlineIso}
        formData={formData}
        onCancel={onBack}
        {...memberHeaderCallbacks}
      />
    );
  }

  if (submitted && matchingStage === 'waitlist') {
    return (
      <div className="flex min-h-full min-h-0 flex-1 flex-col bg-slate-50/80">
        <div className="sticky top-0 z-10 flex w-full shrink-0 items-center justify-end gap-3 border-b border-gray-200/80 bg-white/95 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top,0px))] shadow-sm backdrop-blur-sm md:px-6">
          <MemberHeaderActions
            variant="onWhite"
            onOpenBenefits={onOpenBenefits}
            onOpenSignup={onOpenSignup}
            onOpenManage={onOpenManage}
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col items-stretch justify-start overflow-y-auto px-6 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-6 sm:items-center sm:justify-center sm:pb-10 sm:pt-10">
          <div className="mx-auto w-full max-w-md rounded-3xl border border-gray-100 bg-white px-6 py-10 text-center shadow-xl shadow-slate-900/10 sm:p-10">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100/90 bg-blue-50 shadow-sm">
            <Clock className="h-8 w-8 animate-pulse text-blue-600" />
          </div>
          <h2 className="mb-8 text-2xl">접수되었습니다</h2>

          <div className="mb-6 rounded-3xl border border-blue-100/80 bg-blue-50/90 p-6 text-left shadow-sm">
            <h3 className="mb-4">접수 내용</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">위치</span>
                <span>{formData.location || '경기 고양시'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">에어컨 종류</span>
                <span>{formData.acType || '벽걸이'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">긴급도</span>
                <span>{formData.urgency === 'now' ? '지금 바로' : '예약'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">예상 출장비</span>
                <span className="text-blue-600">30,000원</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>가능 시 빠르게 연락드릴 예정이에요</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>등록 기사님 순서로 배정</span>
            </div>
          </div>

          <WaitlistMemberUpsell
            signupComplete={memberSignupDone}
            onOpenSignup={() => onOpenSignup()}
            onContactSavedSuccess={() => setPostSubmitSource('contact')}
          />

          <button
            type="button"
            onClick={goHomeOrManage}
            className="mt-8 w-full rounded-3xl bg-slate-100 py-4 text-slate-700 transition-colors hover:bg-slate-200"
          >
            {isMemberSignedIn ? '회원관리로 이동' : '홈으로 돌아가기'}
          </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full min-h-0 flex-1 flex-col bg-slate-50/80">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200/80 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="flex w-full items-center justify-between gap-3 px-6 py-4">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
            ← 뒤로
          </button>
          <MemberHeaderActions
            variant="onWhite"
            onOpenBenefits={onOpenBenefits}
            onOpenSignup={onOpenSignup}
            onOpenManage={onOpenManage}
          />
        </div>
      </div>

      {/* Form */}
      <div className="w-full flex-1 px-6 py-8">
        <h1 className="text-2xl mb-2">긴급 기사 매칭</h1>
        <p className="mb-8 text-gray-600">방문 지역과 에어컨 상태를 알려 주세요</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location */}
          <div>
            <label className="block mb-2">
              <MapPin className="inline w-5 h-5 mr-2 text-blue-600" />
              방문 지역
            </label>
            <select
              className="w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            >
              <option value="">시·군을 선택하세요</option>
              <option value="경기 고양시">경기 고양시</option>
              <option value="경기 파주시">경기 파주시</option>
              <option value="경기 포천시">경기 포천시</option>
            </select>
          </div>

          {/* AC Type */}
          <div>
            <label className="block mb-2">
              <Wrench className="inline w-5 h-5 mr-2 text-blue-600" />
              에어컨 종류
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['벽걸이', '스탠드', '2in1'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, acType: type })}
                  className={`rounded-2xl border-2 p-4 transition-all ${
                    formData.acType === type
                      ? 'border-blue-600 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white shadow-sm'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Issue */}
          <div>
            <label className="block mb-2">증상 (선택)</label>
            <textarea
              className="w-full resize-none rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              rows={4}
              placeholder="예: 냉방이 안 되고 이상한 소리가 나요"
              value={formData.issue}
              onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
            />
          </div>

          {/* Urgency */}
          <div>
            <label className="block mb-2">
              <Clock className="inline w-5 h-5 mr-2 text-blue-600" />
              희망 시간
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, urgency: 'now' })}
                className={`rounded-2xl border-2 p-4 transition-all ${
                  formData.urgency === 'now'
                    ? 'border-blue-600 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-white shadow-sm'
                }`}
              >
                <div className="mb-1">지금 바로</div>
                <div className="text-sm text-gray-600">즉시 매칭</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, urgency: 'scheduled' })}
                className={`rounded-2xl border-2 p-4 transition-all ${
                  formData.urgency === 'scheduled'
                    ? 'border-blue-600 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-white shadow-sm'
                }`}
              >
                <div className="mb-1">예약</div>
                <div className="text-sm text-gray-600">일정 조율</div>
              </button>
            </div>
          </div>

          {/* Estimate */}
          <div className="rounded-3xl border border-blue-100/80 bg-blue-50/90 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-700">예상 출장비</span>
              <span className="text-2xl text-blue-600">30,000원</span>
            </div>
            <p className="text-sm text-gray-600">
              * 실제 작업비는 현장 점검 후 안내드리며, 동의하신 항목만 진행합니다
            </p>
          </div>

          {submitError ? (
            <div
              className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-relaxed text-rose-900 shadow-sm"
              role="alert"
            >
              {submitError}
            </div>
          ) : null}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-3xl bg-blue-600 py-4 text-white shadow-lg shadow-blue-900/25 transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? '접수 저장 중…' : '접수·매칭 요청'}
          </button>

          <p className="text-center text-xs text-gray-500">
            접수 후 순서에 따라 연결됩니다. 심야·주말은 대기가 길어질 수 있어요
          </p>
        </form>
      </div>
    </div>
  );
}
