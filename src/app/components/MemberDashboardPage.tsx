import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CircleHelp,
  Gift,
  Home,
  LogOut,
  MapPin,
  Pencil,
  ShieldCheck,
  Snowflake,
  Star,
  Ticket,
  Trash2,
  Wrench,
} from 'lucide-react';
import {
  clearMemberSession,
  createAirconAsset,
  createMemberAddress,
  deleteAirconAsset,
  deleteMemberAddress,
  fetchMemberDashboard,
  loginMember,
  readMemberSession,
  reviewMemberOrder,
  updateAirconAsset,
  updateMemberAddress,
  useMemberCoupon,
  type AirconAssetPayload,
  type MemberAddressPayload,
  type MemberDashboardData,
  type MemberSession,
} from '@/lib/memberRewards';

type Props = {
  onGoHome: () => void;
  onGoRequest: () => void;
  onOpenBenefits: () => void;
  onViewFaq: () => void;
  onSignedIn?: () => void;
  onSignedOut?: () => void;
};

type AddressForm = {
  id?: string;
  address: string;
  detailAddress: string;
  sido: string;
  sigungu: string;
  dong: string;
  isDefault: boolean;
};

type AssetForm = {
  id?: string;
  addressId: string;
  type: AirconAssetPayload['type'];
  brand: string;
  modelName: string;
  installedYear: string;
  memo: string;
};

const emptyAddressForm: AddressForm = {
  address: '',
  detailAddress: '',
  sido: '',
  sigungu: '',
  dong: '',
  isDefault: false,
};

const emptyAssetForm: AssetForm = {
  addressId: '',
  type: 'wall',
  brand: '',
  modelName: '',
  installedYear: '',
  memo: '',
};

function money(value: number): string {
  return `${Number(value || 0).toLocaleString()}원`;
}

function shortDate(value?: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function statusLabel(value: string): string {
  const labels: Record<string, string> = {
    active: '사용 가능',
    used: '사용 완료',
    expired: '만료',
    cancelled: '취소',
    created: '생성',
    matching: '매칭 중',
    assigned: '배정',
    accepted: '수락',
    on_the_way: '출발',
    working: '작업 중',
    completed: '완료',
    settlement_pending: '정산 대기',
    settled: '정산 완료',
    paid: '결제 완료',
    ready: '결제 대기',
    pending: '대기',
  };
  return labels[value] ?? value;
}

function assetTypeLabel(value: string): string {
  const labels: Record<string, string> = {
    wall: '벽걸이',
    stand: '스탠드',
    two_in_one: '2in1',
    system: '시스템',
    unknown: '미확인',
  };
  return labels[value] ?? value;
}

function addressPayload(form: AddressForm): MemberAddressPayload {
  return {
    address: form.address.trim(),
    detailAddress: form.detailAddress.trim() || undefined,
    sido: form.sido.trim() || undefined,
    sigungu: form.sigungu.trim() || undefined,
    dong: form.dong.trim() || undefined,
    isDefault: form.isDefault,
  };
}

function assetPayload(form: AssetForm): AirconAssetPayload {
  const installedYear = Number(form.installedYear);
  return {
    addressId: form.addressId || null,
    type: form.type,
    brand: form.brand.trim() || undefined,
    modelName: form.modelName.trim() || undefined,
    installedYear: Number.isFinite(installedYear) && installedYear >= 1990 ? installedYear : undefined,
    memo: form.memo.trim() || undefined,
  };
}

function memberDisplayName(name?: string | null): string {
  const base = name?.trim() || '회원';
  return base.endsWith('회원님') ? base : `${base} 회원님`;
}

export function MemberDashboardPage({
  onGoHome,
  onGoRequest,
  onOpenBenefits,
  onViewFaq,
  onSignedIn,
  onSignedOut,
}: Props) {
  const [session, setSession] = useState<MemberSession | null>(() => readMemberSession());
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [data, setData] = useState<MemberDashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressForm>(emptyAddressForm);
  const [assetForm, setAssetForm] = useState<AssetForm>(emptyAssetForm);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [operationBusy, setOperationBusy] = useState(false);

  const loadDashboard = useCallback(async (memberId: string) => {
    setLoadingDashboard(true);
    setDashboardError(null);
    try {
      const next = await fetchMemberDashboard(memberId);
      setData(next);
    } catch (e) {
      setDashboardError(e instanceof Error ? e.message : '회원 정보를 불러오지 못했습니다.');
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  useEffect(() => {
    if (!session?.memberId) return;
    void loadDashboard(session.memberId);
  }, [loadDashboard, session?.memberId]);

  const stats = useMemo(() => {
    const coupons = data?.coupons ?? [];
    const rewards = data?.rewardLogs ?? [];
    return {
      activeCoupons: coupons.filter((c) => c.status === 'active').length,
      rewardTotal: rewards.reduce((sum, r) => sum + Number(r.amount ?? 0), 0),
      orderCount: data?.orders.length ?? 0,
      assetCount: data?.airconAssets.length ?? 0,
    };
  }, [data]);

  const reviewedOrderIds = useMemo(() => new Set((data?.reviews ?? []).map((r) => r.orderId)), [data?.reviews]);

  const submitLogin = async () => {
    setLoadingLogin(true);
    setLoginError(null);
    try {
      const next = await loginMember({ phone: phone.replace(/\D/g, ''), password });
      setSession(next);
      onSignedIn?.();
    } catch (e) {
      setLoginError(e instanceof Error ? e.message : '로그인하지 못했습니다.');
    } finally {
      setLoadingLogin(false);
    }
  };

  const logout = () => {
    clearMemberSession();
    setSession(null);
    setData(null);
    setPassword('');
    onSignedOut?.();
  };

  const runMemberMutation = async (work: () => Promise<unknown>) => {
    if (!session?.memberId) return;
    setOperationBusy(true);
    setOperationError(null);
    try {
      await work();
      await loadDashboard(session.memberId);
    } catch (e) {
      setOperationError(e instanceof Error ? e.message : '저장하지 못했습니다.');
    } finally {
      setOperationBusy(false);
    }
  };

  const submitAddress = () =>
    runMemberMutation(async () => {
      if (!addressForm.address.trim()) throw new Error('주소를 입력해 주세요.');
      if (addressForm.id) {
        await updateMemberAddress(session!.memberId, addressForm.id, addressPayload(addressForm));
      } else {
        await createMemberAddress(session!.memberId, addressPayload(addressForm));
      }
      setAddressForm(emptyAddressForm);
    });

  const submitAsset = () =>
    runMemberMutation(async () => {
      if (assetForm.id) {
        await updateAirconAsset(session!.memberId, assetForm.id, assetPayload(assetForm));
      } else {
        await createAirconAsset(session!.memberId, assetPayload(assetForm));
      }
      setAssetForm(emptyAssetForm);
    });

  if (!session) {
    return (
      <main className="min-h-full bg-slate-50/80 px-6 py-6 sm:py-8">
        <div className="mx-auto w-full max-w-md space-y-4">
          <button
            type="button"
            onClick={onGoHome}
            className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-sm text-gray-700 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            뒤로가기
          </button>
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
              <ShieldCheck className="h-4 w-4" />
              회원 로그인
            </p>
            <h1 className="text-2xl font-semibold text-gray-950">내 문의와 혜택을 확인합니다</h1>
            <div className="mt-6 space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">전화번호</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="numeric"
                  autoComplete="tel"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">비밀번호</span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3"
                />
              </label>
              {loginError && <p className="text-sm text-red-600">{loginError}</p>}
              <button
                type="button"
                onClick={() => void submitLogin()}
                disabled={loadingLogin || phone.replace(/\D/g, '').length < 10 || password.length < 5}
                className="w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingLogin ? '확인 중' : '로그인'}
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const member = data?.member;

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
            onClick={logout}
            className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-sm text-gray-700 shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        </section>

        <section className="rounded-3xl border border-blue-100/80 bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-6 text-white shadow-lg shadow-blue-900/20">
          <p className="mb-2 flex items-center gap-2 text-sm text-blue-100">
            <ShieldCheck className="h-4 w-4" />
            회원 관리
          </p>
          <h1 className="text-2xl font-semibold">안녕하세요, {memberDisplayName(member?.name ?? session.name)}</h1>
          <p className="mt-2 text-sm text-blue-100">
            주소, 에어컨 정보, 문의, 쿠폰과 리워드를 회원 계정 기준으로 관리합니다.
          </p>
        </section>

        {(dashboardError || operationError) && (
          <section className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {dashboardError || operationError}
          </section>
        )}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">사용 가능 쿠폰</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{loadingDashboard ? '-' : `${stats.activeCoupons}장`}</p>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">누적 리워드</p>
            <p className="mt-1 text-lg font-semibold text-blue-600">{loadingDashboard ? '-' : money(stats.rewardTotal)}</p>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">주문</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{loadingDashboard ? '-' : `${stats.orderCount}건`}</p>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">에어컨 자산</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{loadingDashboard ? '-' : `${stats.assetCount}대`}</p>
          </article>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
            <MapPin className="h-4 w-4 text-blue-600" />
            주소 관리
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm sm:col-span-2"
              placeholder="방문 주소"
              value={addressForm.address}
              onChange={(e) => setAddressForm((v) => ({ ...v, address: e.target.value }))}
            />
            <input
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm sm:col-span-2"
              placeholder="상세 주소"
              value={addressForm.detailAddress}
              onChange={(e) => setAddressForm((v) => ({ ...v, detailAddress: e.target.value }))}
            />
            <input
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="시/도"
              value={addressForm.sido}
              onChange={(e) => setAddressForm((v) => ({ ...v, sido: e.target.value }))}
            />
            <input
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="시/군/구"
              value={addressForm.sigungu}
              onChange={(e) => setAddressForm((v) => ({ ...v, sigungu: e.target.value }))}
            />
            <input
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="동/읍/면"
              value={addressForm.dong}
              onChange={(e) => setAddressForm((v) => ({ ...v, dong: e.target.value }))}
            />
            <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={addressForm.isDefault}
                onChange={(e) => setAddressForm((v) => ({ ...v, isDefault: e.target.checked }))}
              />
              기본 주소
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={operationBusy}
              onClick={() => void submitAddress()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {addressForm.id ? '주소 수정' : '주소 추가'}
            </button>
            {addressForm.id && (
              <button
                type="button"
                onClick={() => setAddressForm(emptyAddressForm)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-gray-700"
              >
                취소
              </button>
            )}
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-700">
            {(data?.addresses ?? []).map((addr) => (
              <div key={addr.id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3">
                <p>
                  <span className="font-medium text-gray-900">{addr.address}</span> {addr.detailAddress ?? ''}
                  {addr.isDefault ? <span className="ml-2 text-xs font-semibold text-blue-700">기본</span> : null}
                </p>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    className="rounded-lg bg-white p-2 text-gray-600 shadow-sm"
                    onClick={() =>
                      setAddressForm({
                        id: addr.id,
                        address: addr.address,
                        detailAddress: addr.detailAddress ?? '',
                        sido: addr.sido ?? '',
                        sigungu: addr.sigungu ?? '',
                        dong: addr.dong ?? '',
                        isDefault: addr.isDefault,
                      })
                    }
                    aria-label="주소 수정"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-white p-2 text-red-600 shadow-sm"
                    onClick={() => {
                      if (window.confirm('주소를 삭제할까요?')) {
                        void runMemberMutation(() => deleteMemberAddress(session.memberId, addr.id));
                      }
                    }}
                    aria-label="주소 삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {data && data.addresses.length === 0 && <p className="text-gray-500">등록된 주소가 없습니다.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
            <Snowflake className="h-4 w-4 text-blue-600" />
            에어컨 자산 관리
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={assetForm.type}
              onChange={(e) => setAssetForm((v) => ({ ...v, type: e.target.value as AssetForm['type'] }))}
            >
              <option value="wall">벽걸이</option>
              <option value="stand">스탠드</option>
              <option value="two_in_one">2in1</option>
              <option value="system">시스템</option>
              <option value="unknown">미확인</option>
            </select>
            <select
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={assetForm.addressId}
              onChange={(e) => setAssetForm((v) => ({ ...v, addressId: e.target.value }))}
            >
              <option value="">주소 연결 안 함</option>
              {(data?.addresses ?? []).map((addr) => (
                <option key={addr.id} value={addr.id}>
                  {addr.address}
                </option>
              ))}
            </select>
            <input
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="브랜드"
              value={assetForm.brand}
              onChange={(e) => setAssetForm((v) => ({ ...v, brand: e.target.value }))}
            />
            <input
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="모델명"
              value={assetForm.modelName}
              onChange={(e) => setAssetForm((v) => ({ ...v, modelName: e.target.value }))}
            />
            <input
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="설치연도"
              inputMode="numeric"
              value={assetForm.installedYear}
              onChange={(e) => setAssetForm((v) => ({ ...v, installedYear: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
            />
            <input
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="관리 메모"
              value={assetForm.memo}
              onChange={(e) => setAssetForm((v) => ({ ...v, memo: e.target.value }))}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={operationBusy}
              onClick={() => void submitAsset()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {assetForm.id ? '자산 수정' : '자산 추가'}
            </button>
            {assetForm.id && (
              <button
                type="button"
                onClick={() => setAssetForm(emptyAssetForm)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-gray-700"
              >
                취소
              </button>
            )}
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-700">
            {(data?.airconAssets ?? []).map((asset) => {
              const addr = data?.addresses.find((a) => a.id === asset.addressId);
              return (
                <div key={asset.id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {asset.brand || '브랜드 미등록'} {asset.modelName || assetTypeLabel(asset.type)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {assetTypeLabel(asset.type)}
                      {asset.installedYear ? ` · ${asset.installedYear}년 설치` : ''}
                      {addr ? ` · ${addr.address}` : ''}
                    </p>
                    {asset.memo ? <p className="mt-1 text-xs text-gray-500">{asset.memo}</p> : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      className="rounded-lg bg-white p-2 text-gray-600 shadow-sm"
                      onClick={() =>
                        setAssetForm({
                          id: asset.id,
                          addressId: asset.addressId ?? '',
                          type: asset.type as AssetForm['type'],
                          brand: asset.brand ?? '',
                          modelName: asset.modelName ?? '',
                          installedYear: asset.installedYear ? String(asset.installedYear) : '',
                          memo: asset.memo ?? '',
                        })
                      }
                      aria-label="자산 수정"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg bg-white p-2 text-red-600 shadow-sm"
                      onClick={() => {
                        if (window.confirm('에어컨 정보를 삭제할까요?')) {
                          void runMemberMutation(() => deleteAirconAsset(session.memberId, asset.id));
                        }
                      }}
                      aria-label="자산 삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {data && data.airconAssets.length === 0 && <p className="text-gray-500">등록된 에어컨 자산이 없습니다.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
            <Wrench className="h-4 w-4 text-blue-600" />
            내 문의·주문
          </h2>
          <div className="space-y-2">
            {(data?.orders ?? []).slice(0, 8).map((order) => (
              <div key={order.id} className="rounded-xl border border-gray-100 bg-slate-50 p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{order.productName || order.orderNo}</p>
                    <p className="mt-1 text-gray-500">{order.addressSummary}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    {statusLabel(order.orderStatus)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                  <span>{shortDate(order.createdAt)} · {money(order.totalPrice)}</span>
                  {['completed', 'settlement_pending', 'settled'].includes(order.orderStatus) ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 font-medium text-blue-700 shadow-sm"
                      onClick={() => {
                        const ratingRaw = window.prompt('기사 평가를 1~5점으로 입력해 주세요.', reviewedOrderIds.has(order.id) ? '5' : '5');
                        if (!ratingRaw) return;
                        const rating = Math.max(1, Math.min(5, Math.round(Number(ratingRaw) || 5)));
                        const comment = window.prompt('평가 메모를 남겨 주세요. 비워도 됩니다.', '') ?? '';
                        void runMemberMutation(() => reviewMemberOrder(session.memberId, order.id, { rating, comment }));
                      }}
                    >
                      <Star className="h-3.5 w-3.5" />
                      {reviewedOrderIds.has(order.id) ? '평가 수정' : '평가'}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
            {(data?.inquiries ?? []).slice(0, 5).map((inquiry) => (
              <div key={inquiry.id} className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{inquiry.location || '문의 위치 미등록'}</p>
                    <p className="mt-1 text-gray-500">{inquiry.airconType || '에어컨 유형 미등록'} · {inquiry.issue || '상세 증상 미등록'}</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-blue-700">
                    {statusLabel(inquiry.status)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {shortDate(inquiry.createdAt)}
                  {inquiry.convertedOrderId ? ` · 주문 전환 ${inquiry.convertedOrderId}` : ''}
                </p>
              </div>
            ))}
            {data && data.orders.length === 0 && data.inquiries.length === 0 && (
              <p className="text-sm text-gray-500">아직 문의나 주문 내역이 없습니다.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
            <Ticket className="h-4 w-4 text-blue-600" />
            쿠폰·리워드
          </h2>
          <div className="space-y-2">
            {(data?.coupons ?? []).map((coupon) => (
              <div key={coupon.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{money(coupon.amount)} 할인</p>
                  <p className="text-xs text-gray-500">{coupon.couponType} · {coupon.expiresAt ? `${shortDate(coupon.expiresAt)}까지` : '기한 없음'}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-medium text-blue-700">{statusLabel(coupon.status)}</span>
                  {coupon.status === 'active' ? (
                    <button
                      type="button"
                      disabled={operationBusy}
                      className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      onClick={() => void runMemberMutation(() => useMemberCoupon(session.memberId, coupon.id))}
                    >
                      사용 처리
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
            {(data?.rewardLogs ?? []).slice(0, 6).map((reward) => (
              <div key={reward.id} className="flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
                <Gift className="h-4 w-4" />
                <span>{reward.rewardType} · {money(reward.amount)} · {shortDate(reward.createdAt)}</span>
              </div>
            ))}
            {data && data.coupons.length === 0 && data.rewardLogs.length === 0 && (
              <p className="text-sm text-gray-500">아직 쿠폰이나 리워드 기록이 없습니다.</p>
            )}
          </div>
        </section>

        <section className="space-y-2 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
          <button
            type="button"
            onClick={onGoRequest}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white"
          >
            <Wrench className="h-4 w-4" />
            새 문의 남기기
          </button>
          <button
            type="button"
            onClick={onOpenBenefits}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3 text-sm font-medium text-slate-700"
          >
            <Ticket className="h-4 w-4 text-blue-600" />
            회원 혜택 보기
          </button>
          <button
            type="button"
            onClick={onViewFaq}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700"
          >
            <CircleHelp className="h-4 w-4 text-blue-600" />
            FAQ 보기
          </button>
          <button
            type="button"
            onClick={onGoHome}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700"
          >
            <Home className="h-4 w-4 text-blue-600" />
            홈으로 이동
          </button>
        </section>
      </div>
    </main>
  );
}
