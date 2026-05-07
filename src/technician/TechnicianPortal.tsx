import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router';
import {
  createTechnicianMaterialOrder,
  createJobExtraQuote,
  fetchTechnicianMe,
  fetchJobExtraQuotes,
  fetchJobPhotos,
  fetchTechnicianJob,
  fetchTechnicianJobs,
  fetchTechnicianMaterialOrders,
  fetchTechnicianMaterials,
  fetchTechnicianSettlements,
  getStoredTechnicianId,
  registerTechnician,
  requestTechnicianSettlementPayout,
  setStoredTechnicianId,
  technicianAccept,
  technicianComplete,
  technicianDepart,
  technicianSession,
  technicianStart,
  uploadJobPhoto,
  uploadJobPhotoFile,
  uploadTechnicianDocumentFile,
  type TechnicianMaterialOrderRow,
  type TechnicianMaterialRow,
  type TechnicianSettlementRow,
  type TechnicianExtraQuoteRow,
  type TechnicianOrderSummary,
} from '@/lib/technicianApi';

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
          <Link to="/" className="text-sm text-blue-600 underline">
            고객 홈
          </Link>
        </div>
        <p className="mt-1 text-xs text-slate-500">승인된 기사님 업무 안내 화면입니다</p>
      </header>
      <main className="flex-1 px-4 py-4">{children}</main>
    </div>
  );
}

function TechHome() {
  const logged = !!getStoredTechnicianId();
  return (
    <Shell title="기사 포털">
      <nav className="mt-3 flex flex-col gap-2">
        <Link className="rounded-lg bg-white px-4 py-3 text-sm shadow ring-1 ring-slate-200" to="/technician/login">
          로그인 (승인된 기사)
        </Link>
        <Link className="rounded-lg bg-white px-4 py-3 text-sm shadow ring-1 ring-slate-200" to="/technician/signup">
          회원 가입 (승인 대기)
        </Link>
        {logged ? (
          <Link className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium shadow ring-1 ring-emerald-200" to="/technician/jobs">
            내 작업 목록
          </Link>
        ) : (
          <p className="px-2 text-xs text-slate-500">로그인 후 작업 목록이 열립니다.</p>
        )}
        <Link className="rounded-lg bg-white px-4 py-3 text-sm shadow ring-1 ring-slate-200" to="/technician/settlements">
          정산
        </Link>
        <Link className="rounded-lg bg-white px-4 py-3 text-sm shadow ring-1 ring-slate-200" to="/technician/materials">
          자재 구매
        </Link>
        <Link className="rounded-lg bg-white px-4 py-3 text-sm shadow ring-1 ring-slate-200" to="/technician/material-orders">
          자재 구매내역
        </Link>
        <Link className="rounded-lg bg-white px-4 py-3 text-sm shadow ring-1 ring-slate-200" to="/technician/profile">
          프로필
        </Link>
        {logged ? (
          <button
            type="button"
            className="mt-2 rounded-lg border border-slate-200 px-4 py-2 text-xs text-slate-600"
            onClick={() => {
              setStoredTechnicianId(null);
              window.location.href = '/technician';
            }}
          >
            로그아웃
          </button>
        ) : null}
      </nav>
    </Shell>
  );
}

function TechLogin() {
  const nav = useNavigate();
  const [phone, setPhone] = useState('01099998888');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const r = await technicianSession({ phone, password });
      setStoredTechnicianId(r.technicianId);
      nav('/technician/jobs');
    } catch {
      setErr('승인된 기사를 찾을 수 없습니다. 가입·승인 후 다시 시도하세요.');
    }
  }

  return (
    <Shell title="기사 로그인">
      <form className="mt-3 space-y-3" onSubmit={submit}>
        <label className="block text-xs text-slate-600">
          휴대폰 번호 (관리자 승인 완료 기사)
          <input
            className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <label className="block text-xs text-slate-600">
          비밀번호
          <input
            className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        <button type="submit" className="w-full rounded-lg bg-slate-900 py-3 text-sm text-white">
          로그인
        </button>
      </form>
    </Shell>
  );
}

function TechSignup() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [businessType, setBusinessType] = useState<'individual' | 'sole_business' | 'company'>('individual');
  const [businessNumber, setBusinessNumber] = useState('');
  const [baseRegion, setBaseRegion] = useState('');
  const [regionsText, setRegionsText] = useState('경기 고양시, 경기 파주시');
  const [serviceInstall, setServiceInstall] = useState(true);
  const [serviceCleaning, setServiceCleaning] = useState(false);
  const [airconWall, setAirconWall] = useState(true);
  const [airconStand, setAirconStand] = useState(false);
  const [airconTwoInOne, setAirconTwoInOne] = useState(false);
  const [airconSystem, setAirconSystem] = useState(false);
  const [availableSameDay, setAvailableSameDay] = useState(true);
  const [availableReservation, setAvailableReservation] = useState(true);
  const [availableWeekend, setAvailableWeekend] = useState(false);
  const [availableNight, setAvailableNight] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [idCardUrl, setIdCardUrl] = useState('');
  const [businessLicenseUrl, setBusinessLicenseUrl] = useState('');
  const [insuranceUrl, setInsuranceUrl] = useState('');
  const [docBusy, setDocBusy] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: string; status: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const documentFields: Array<{
    documentType: 'id_card' | 'business_license' | 'insurance';
    label: string;
    value: string;
    setValue: React.Dispatch<React.SetStateAction<string>>;
  }> = [
    { documentType: 'id_card', label: '신분증/자격 확인', value: idCardUrl, setValue: setIdCardUrl },
    {
      documentType: 'business_license',
      label: '사업자등록증',
      value: businessLicenseUrl,
      setValue: setBusinessLicenseUrl,
    },
    { documentType: 'insurance', label: '보험 증빙', value: insuranceUrl, setValue: setInsuranceUrl },
  ];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setDone(null);
    const services = [
      serviceInstall ? 'install' : null,
      serviceCleaning ? 'cleaning' : null,
    ].filter(Boolean) as Array<'install' | 'cleaning'>;
    const aircons = [
      airconWall ? 'wall' : null,
      airconStand ? 'stand' : null,
      airconTwoInOne ? 'two_in_one' : null,
      airconSystem ? 'system' : null,
    ].filter(Boolean) as Array<'wall' | 'stand' | 'two_in_one' | 'system'>;
    const capabilities = services.flatMap((serviceType) =>
      aircons.map((airconType) => ({ serviceType, airconType })),
    );
    if (capabilities.length === 0) {
      setErr('가능 서비스와 에어컨 유형을 1개 이상 선택해 주세요.');
      return;
    }
    const documents = [
      idCardUrl.trim() ? { documentType: 'id_card' as const, fileUrl: idCardUrl.trim() } : null,
      businessLicenseUrl.trim()
        ? { documentType: 'business_license' as const, fileUrl: businessLicenseUrl.trim() }
        : null,
      insuranceUrl.trim() ? { documentType: 'insurance' as const, fileUrl: insuranceUrl.trim() } : null,
    ].filter(Boolean) as Array<{ documentType: 'id_card' | 'business_license' | 'insurance'; fileUrl: string }>;
    try {
      const res = await registerTechnician({
        name,
        phone,
        password,
        businessType,
        businessNumber: businessNumber || undefined,
        baseRegion: baseRegion || undefined,
        regions: regionsText
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean),
        availableSameDay,
        availableReservation,
        availableWeekend,
        availableNight,
        bankName: bankName || undefined,
        bankAccount: bankAccount || undefined,
        bankHolder: bankHolder || undefined,
        capabilities,
        documents,
      });
      setDone(res);
    } catch {
      setErr('가입에 실패했습니다. 번호 중복 등을 확인해 주세요.');
    }
  }

  return (
    <Shell title="기사 가입">
      {done ? (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
          접수했습니다. 기사 ID: <strong className="font-mono text-xs">{done.id}</strong>
          <p className="mt-2 text-xs">관리자 승인 후 로그인할 수 있습니다.</p>
          <Link to="/technician/login" className="mt-2 inline-block text-sm underline">
            로그인으로 이동
          </Link>
        </div>
      ) : (
        <form className="mt-3 space-y-3" onSubmit={submit}>
          <label className="block text-xs text-slate-600">
            이름
            <input
              required
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block text-xs text-slate-600">
            휴대폰
            <input
              required
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="block text-xs text-slate-600">
            비밀번호
            <input
              required
              type="password"
              minLength={5}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="block text-xs text-slate-600">
            활동 지역 요약 (선택)
            <input
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              value={baseRegion}
              onChange={(e) => setBaseRegion(e.target.value)}
            />
          </label>
          <label className="block text-xs text-slate-600">
            사업자 유형
            <select
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value as typeof businessType)}
            >
              <option value="individual">개인</option>
              <option value="sole_business">개인사업자</option>
              <option value="company">법인</option>
            </select>
          </label>
          <label className="block text-xs text-slate-600">
            사업자번호 (선택)
            <input
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              value={businessNumber}
              onChange={(e) => setBusinessNumber(e.target.value)}
            />
          </label>
          <label className="block text-xs text-slate-600">
            활동 가능 지역 (쉼표로 구분)
            <input
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              value={regionsText}
              onChange={(e) => setRegionsText(e.target.value)}
            />
          </label>
          <fieldset className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
            <legend className="px-1 font-medium text-slate-800">가능 서비스</legend>
            <label className="mr-3 inline-flex items-center gap-1">
              <input type="checkbox" checked={serviceInstall} onChange={(e) => setServiceInstall(e.target.checked)} />
              설치
            </label>
            <label className="inline-flex items-center gap-1">
              <input type="checkbox" checked={serviceCleaning} onChange={(e) => setServiceCleaning(e.target.checked)} />
              청소
            </label>
          </fieldset>
          <fieldset className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
            <legend className="px-1 font-medium text-slate-800">에어컨 유형</legend>
            {[
              ['벽걸이', airconWall, setAirconWall],
              ['스탠드', airconStand, setAirconStand],
              ['투인원', airconTwoInOne, setAirconTwoInOne],
              ['시스템', airconSystem, setAirconSystem],
            ].map(([label, checked, setter]) => (
              <label key={String(label)} className="mr-3 inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={Boolean(checked)}
                  onChange={(e) => (setter as React.Dispatch<React.SetStateAction<boolean>>)(e.target.checked)}
                />
                {String(label)}
              </label>
            ))}
          </fieldset>
          <fieldset className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
            <legend className="px-1 font-medium text-slate-800">가능 시간</legend>
            {[
              ['당일', availableSameDay, setAvailableSameDay],
              ['예약', availableReservation, setAvailableReservation],
              ['주말', availableWeekend, setAvailableWeekend],
              ['야간', availableNight, setAvailableNight],
            ].map(([label, checked, setter]) => (
              <label key={String(label)} className="mr-3 inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={Boolean(checked)}
                  onChange={(e) => (setter as React.Dispatch<React.SetStateAction<boolean>>)(e.target.checked)}
                />
                {String(label)}
              </label>
            ))}
          </fieldset>
          <div className="grid grid-cols-1 gap-3">
            <label className="block text-xs text-slate-600">
              은행명 (선택)
              <input className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </label>
            <label className="block text-xs text-slate-600">
              계좌번호 (선택)
              <input className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
            </label>
            <label className="block text-xs text-slate-600">
              예금주 (선택)
              <input className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm" value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} />
            </label>
          </div>
          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-medium text-slate-800">서류 업로드 또는 URL</p>
            {documentFields.map(({ documentType, label, value, setValue }) => (
              <div key={documentType} className="space-y-1 rounded border border-slate-100 bg-slate-50 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-700">{label}</span>
                  <label className="cursor-pointer rounded bg-white px-2 py-1 text-[11px] text-blue-700 ring-1 ring-slate-200">
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={docBusy === documentType}
                      onChange={async (ev) => {
                        const file = ev.target.files?.[0];
                        ev.target.value = '';
                        if (!file) return;
                        setDocBusy(documentType);
                        setErr(null);
                        try {
                          const uploaded = await uploadTechnicianDocumentFile(documentType, file);
                          setValue(uploaded.fileUrl);
                        } catch {
                          setErr('서류 업로드 실패 — Storage 버킷 설정을 확인하거나 URL을 직접 입력해 주세요.');
                        } finally {
                          setDocBusy(null);
                        }
                      }}
                    />
                    {docBusy === documentType ? '업로드 중' : '파일 선택'}
                  </label>
                </div>
                <input
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                  placeholder={`${label} URL`}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
            ))}
          </div>
          {err ? <p className="text-sm text-red-600">{err}</p> : null}
          <button type="submit" className="w-full rounded-lg bg-slate-900 py-3 text-sm text-white">
            신청하기
          </button>
          <p className="text-xs text-slate-500">제출 정보는 Supabase 기사 검증 테이블에 저장되고, 관리자 승인 후 작업 알림을 받을 수 있습니다.</p>
        </form>
      )}
    </Shell>
  );
}

function JobsList() {
  const nav = useNavigate();
  const [rows, setRows] = useState<TechnicianOrderSummary[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const id = getStoredTechnicianId();
    if (!id) return;
    fetchTechnicianJobs()
      .then(setRows)
      .catch(() => setErr('작업 목록 로드 실패 — 로그인·백엔드를 확인해 주세요.'));
  }, []);

  if (!getStoredTechnicianId()) {
    return <Navigate to="/technician/login" replace />;
  }

  return (
    <Shell title="내 작업">
      <button type="button" className="mb-3 text-xs text-blue-700 underline" onClick={() => nav('/technician')}>
        포털 홈
      </button>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {rows?.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          표시할 작업 없음 — 관리자가 결제 완료 주문에 배정했는지 확인하세요.
        </p>
      ) : null}
      <ul className="space-y-2">
        {(rows ?? []).map((r) => (
          <li key={r.id}>
            <button
              type="button"
              className="w-full rounded-lg bg-white px-3 py-3 text-left shadow ring-1 ring-slate-200"
              onClick={() => nav(`/technician/jobs/${r.id}`)}
            >
              <div className="text-sm font-semibold">{r.orderNo}</div>
              <div className="text-xs text-slate-500">{r.productName}</div>
              <div className="mt-1 text-xs">{r.customerName}</div>
              <div className="text-xs capitalize text-emerald-700">{r.orderStatus}</div>
            </button>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function TechJobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const nav = useNavigate();
  const id = jobId!;
  const [row, setRow] = useState<TechnicianOrderSummary | null>(null);
  const [photos, setPhotos] = useState<Awaited<ReturnType<typeof fetchJobPhotos>>>([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoKind, setPhotoKind] = useState<'before_work' | 'after_work'>('before_work');
  const [exQuotes, setExQuotes] = useState<TechnicianExtraQuoteRow[]>([]);
  const [exName, setExName] = useState('현장 추가 작업');
  const [exQty, setExQty] = useState('1');
  const [exPrice, setExPrice] = useState('30000');
  const [exMemo, setExMemo] = useState('');
  const [exErr, setExErr] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchTechnicianJob(id)
      .then(setRow)
      .catch(() => setRow(null));
    fetchJobPhotos(id).then(setPhotos).catch(() => setPhotos([]));
    fetchJobExtraQuotes(id).then(setExQuotes).catch(() => setExQuotes([]));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!getStoredTechnicianId()) return <Navigate to="/technician/login" replace />;
  if (!row) return <Shell title="작업 상세"><p className="text-sm">불러오는 중 또는 없음...</p></Shell>;
  const photoKinds = new Set(photos.map((p) => p.kind));
  const hasRequiredPhotos = photoKinds.has('before_work') && photoKinds.has('after_work');

  return (
    <Shell title="작업 상세">
      <button type="button" className="mb-3 text-xs text-blue-700 underline" onClick={() => nav('/technician/jobs')}>
        목록으로
      </button>
      <div className="space-y-1 rounded-xl bg-white p-4 shadow ring-1 ring-slate-200 text-sm">
        <div><span className="text-slate-500">주문번호</span> {row.orderNo}</div>
        <div><span className="text-slate-500">상품</span> {row.productName}</div>
        <div><span className="text-slate-500">고객</span> {row.customerName}</div>
        <div><span className="text-slate-500">연락처</span> {row.customerPhone}</div>
        <div><span className="text-slate-500">주소 요약</span> {row.addressSummary}</div>
        <div><span className="text-slate-500">금액</span> ₩{row.totalPrice?.toLocaleString?.() ?? row.totalPrice}</div>
        <div><span className="text-slate-500">상태</span> <strong>{row.orderStatus}</strong></div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          className="rounded-lg bg-emerald-600 py-3 text-xs text-white disabled:opacity-40"
          disabled={row.orderStatus !== 'assigned'}
          onClick={() => technicianAccept(id).then(setRow).catch(console.error)}
        >
          수락 (assigned→)
        </button>
        <button
          type="button"
          className="rounded-lg bg-teal-600 py-3 text-xs text-white disabled:opacity-40"
          disabled={row.orderStatus !== 'accepted'}
          onClick={() => technicianDepart(id).then(setRow).catch(console.error)}
        >
          출발→
        </button>
        <button
          type="button"
          className="rounded-lg bg-blue-700 py-3 text-xs text-white disabled:opacity-40"
          disabled={!['accepted', 'on_the_way'].includes(row.orderStatus)}
          onClick={() => technicianStart(id).then(setRow).catch(console.error)}
        >
          작업 시작
        </button>
        <button
          type="button"
          className="rounded-lg bg-indigo-800 py-3 text-xs text-white disabled:opacity-40"
          disabled={row.orderStatus !== 'working' || !hasRequiredPhotos}
          onClick={() => technicianComplete(id).then(setRow).catch(console.error)}
        >
          {hasRequiredPhotos ? '완료' : '사진 등록 후 완료'}
        </button>
      </div>

      <section className="mt-8 space-y-2 rounded-xl bg-white p-4 shadow ring-1 ring-slate-200">
        <h2 className="text-sm font-semibold">추가금 견적</h2>
        <p className="text-xs text-slate-500">
          현장 행(Line item) 단위 견적 → 관리 화면에서 고객 승인 처리 · 모의 결제까지 이어지면 상태가{' '}
          <code className="text-[10px]">paid</code> 로 표시됩니다 (Supabase + DDL 필요).
        </p>
        {exErr ? <p className="text-xs text-red-600">{exErr}</p> : null}
        <ul className="space-y-2 text-xs text-slate-700">
          {exQuotes.map((q) => (
            <li key={q.id} className="rounded border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="font-medium capitalize">{q.status}</div>
              <div>합계 ₩{q.totalAmount.toLocaleString?.() ?? q.totalAmount}</div>
              {q.memo ? <div className="text-slate-500">{q.memo}</div> : null}
              <ul className="mt-1 text-[11px] text-slate-600">
                {q.items.map((it) => (
                  <li key={it.id}>
                    {it.name} × {it.quantity} @ ₩{it.unitPrice.toLocaleString?.() ?? it.unitPrice} → ₩
                    {it.amount.toLocaleString?.() ?? it.amount}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          <input
            className="rounded border border-slate-200 px-2 py-2 text-xs sm:col-span-2"
            placeholder="항목명"
            value={exName}
            onChange={(e) => setExName(e.target.value)}
          />
          <input
            type="number"
            min={0.001}
            step="any"
            className="rounded border border-slate-200 px-2 py-2 text-xs"
            placeholder="수량"
            value={exQty}
            onChange={(e) => setExQty(e.target.value)}
          />
          <input
            type="number"
            min={0}
            className="rounded border border-slate-200 px-2 py-2 text-xs"
            placeholder="단가(원)"
            value={exPrice}
            onChange={(e) => setExPrice(e.target.value)}
          />
          <input
            className="rounded border border-slate-200 px-2 py-2 text-xs sm:col-span-4"
            placeholder="메모(선택)"
            value={exMemo}
            onChange={(e) => setExMemo(e.target.value)}
          />
          <button
            type="button"
            className="rounded-lg bg-slate-900 py-2 text-xs text-white sm:col-span-4"
            onClick={async () => {
              setExErr(null);
              try {
                await createJobExtraQuote(id, {
                  memo: exMemo.trim() || undefined,
                  items: [
                    {
                      name: exName.trim() || '항목',
                      quantity: Number(exQty) || 1,
                      unitPrice: Math.max(0, Math.round(Number(exPrice) || 0)),
                    },
                  ],
                });
                await load();
              } catch {
                setExErr('견적 등록 실패 — Supabase DDL(extras…) 및 주문 존재 여부 확인');
              }
            }}
          >
            견적 등록(requested)
          </button>
        </div>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="text-sm font-semibold">현장 사진</h2>
        <p className="text-xs text-slate-500">
          Supabase 스토리지가 있으면 presigned 업로드 후 등록합니다. 실패 시 서버로 멀티파트 전송합니다.
        </p>
        {photoErr ? <p className="text-xs text-red-600">{photoErr}</p> : null}
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded border border-slate-200 px-2 py-2 text-xs"
            value={photoKind}
            onChange={(e) => setPhotoKind(e.target.value as typeof photoKind)}
          >
            <option value="before_work">작업 전</option>
            <option value="after_work">작업 후</option>
          </select>
          <label className="inline-flex cursor-pointer items-center rounded border border-dashed border-slate-300 bg-white px-3 py-2 text-xs hover:bg-slate-50">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={photoBusy}
              onChange={async (ev) => {
                const file = ev.target.files?.[0];
                ev.target.value = '';
                if (!file) return;
                setPhotoErr(null);
                setPhotoBusy(true);
                try {
                  await uploadJobPhotoFile(id, photoKind, file);
                  await load();
                } catch {
                  setPhotoErr(
                    '파일 업로드 실패 — Storage·버킷·백엔드(Supabase) 설정 또는 아래 공개 URL 등록을 사용하세요.',
                  );
                } finally {
                  setPhotoBusy(false);
                }
              }}
            />
            {photoBusy ? '업로드 중…' : '파일 선택 (권장)'}
          </label>
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded border border-slate-200 px-2 py-2 text-xs"
            placeholder="또는 공개 이미지 URL"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
          />
          <button
            type="button"
            className="shrink-0 rounded bg-slate-700 px-3 py-2 text-xs text-white"
            disabled={photoBusy}
            onClick={async () => {
              setPhotoErr(null);
              setPhotoBusy(true);
              try {
                await uploadJobPhoto(id, { kind: photoKind, url: photoUrl });
                setPhotoUrl('');
                await load();
              } catch {
                setPhotoErr('URL 등록 실패');
              } finally {
                setPhotoBusy(false);
              }
            }}
          >
            URL 등록
          </button>
        </div>
        <ul className="mt-2 space-y-1">
          {photos.map((p) => (
            <li key={p.id} className="text-xs text-slate-600">
              [{p.kind}]{' '}
              <a href={p.url} className="text-blue-600 underline" target="_blank" rel="noreferrer">
                링크
              </a>
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}

function Profile() {
  const [me, setMe] = useState<Awaited<ReturnType<typeof fetchTechnicianMe>> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!getStoredTechnicianId()) return;
    fetchTechnicianMe()
      .then(setMe)
      .catch(() => setErr('프로필을 불러오지 못했습니다.'));
  }, []);

  return (
    <Shell title="프로필">
      <p className="text-sm text-slate-600">
        저장된 기사 ID:{' '}
        <code className="rounded bg-slate-100 px-2 py-0.5">{getStoredTechnicianId() ?? '미로그인'}</code>
      </p>
      {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}
      {me ? (
        <div className="mt-4 space-y-2 rounded-xl bg-white p-4 text-sm shadow ring-1 ring-slate-200">
          <div><span className="text-slate-500">이름</span> {me.name}</div>
          <div><span className="text-slate-500">활동 지역</span> {(me.regions?.length ? me.regions.join(', ') : me.baseRegion) || '-'}</div>
          <div><span className="text-slate-500">가능 시간</span> {me.availability?.join(', ') || '-'}</div>
          <div><span className="text-slate-500">계좌</span> {me.bankName || '-'} {me.bankHolder || ''} {me.bankAccountMasked || ''}</div>
          <div><span className="text-slate-500">계좌 검증</span> {me.bankVerificationStatus || 'unsubmitted'}</div>
          {me.bankRejectReason ? <div className="text-red-600">반려 사유: {me.bankRejectReason}</div> : null}
        </div>
      ) : null}
      <Link to="/technician/login" className="mt-3 inline-block text-sm text-blue-600 underline">
        로그인 화면
      </Link>
    </Shell>
  );
}

function SettlementsList() {
  const [rows, setRows] = useState<TechnicianSettlementRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    const id = getStoredTechnicianId();
    if (!id) return;
    fetchTechnicianSettlements()
      .then(setRows)
      .catch(() => setErr('정산 목록을 불러오지 못했습니다. 로그인·Supabase 확인.'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!getStoredTechnicianId()) return <Navigate to="/technician/login" replace />;

  return (
    <Shell title="정산">
      <Link to="/technician" className="mb-3 inline-block text-xs text-blue-700 underline">
        포털 홈
      </Link>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {rows?.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          표시할 정산 행 없음 — 작업 완료 후 생성되며(DB 모드 필요) 과거 행만 보일 수 있습니다.
        </p>
      ) : null}
      <ul className="space-y-3">
        {(rows ?? []).map((r) => (
          <li key={r.id} className="rounded-lg bg-white p-4 text-xs shadow ring-1 ring-slate-200">
            <div className="font-semibold">{r.orderNo ?? r.orderId.slice(0, 8)}</div>
            <div className="mt-1 text-slate-600">
              총액 ₩{r.grossAmount.toLocaleString?.() ?? r.grossAmount}{' '}
              <span className="mx-1">·</span> 수수료 ₩{(r.platformFee ?? 0).toLocaleString?.() ?? r.platformFee}
              <span className="mx-1">·</span> 지급액 ₩
              {(r.technicianPayout ?? 0).toLocaleString?.() ?? r.technicianPayout}
            </div>
            <div className="mt-1 text-slate-500">
              상태 {r.status}
              {(r.platformFeeRate != null && Number.isFinite(r.platformFeeRate)) ? ` · 플랫폼 요율 ${r.platformFeeRate}%` : null}
            </div>
            {r.payoutRequestedAt ? (
              <div className="mt-1 text-slate-500">지급 요청 {new Date(r.payoutRequestedAt).toLocaleDateString('ko-KR')}</div>
            ) : null}
            {['pending', 'held'].includes(r.status) ? (
              <button
                type="button"
                disabled={busyId === r.id}
                className="mt-3 w-full rounded-lg bg-slate-900 py-2 text-xs font-medium text-white disabled:opacity-50"
                onClick={async () => {
                  setBusyId(r.id);
                  setErr(null);
                  try {
                    await requestTechnicianSettlementPayout(r.id);
                    await load();
                  } catch (e) {
                    setErr(e instanceof Error ? e.message : '지급 요청을 저장하지 못했습니다.');
                  } finally {
                    setBusyId(null);
                  }
                }}
              >
                {busyId === r.id ? '요청 중' : '지급 요청'}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function won(value: number | null | undefined) {
  if (value == null) return '-';
  return `₩${value.toLocaleString?.() ?? value}`;
}

function materialOrderStatusLabel(status: TechnicianMaterialOrderRow['status']) {
  return {
    requested: '요청',
    confirmed: '확인',
    preparing: '준비중',
    shipped: '배송중',
    delivered: '완료',
    cancelled: '취소',
  }[status] || status;
}

function MaterialsList() {
  const [rows, setRows] = useState<TechnicianMaterialRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [requestMemo, setRequestMemo] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const load = useCallback(() => {
    const id = getStoredTechnicianId();
    if (!id) return;
    fetchTechnicianMaterials()
      .then((items) => {
        setRows(items);
        setQuantities((prev) => {
          const next = { ...prev };
          items.forEach((m) => {
            if (!next[m.id]) next[m.id] = Math.max(1, m.minOrderQuantity || 1);
          });
          return next;
        });
      })
      .catch(() => setErr('자재 목록을 불러오지 못했습니다.'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!getStoredTechnicianId()) return <Navigate to="/technician/login" replace />;

  return (
    <Shell title="자재 구매">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Link to="/technician" className="text-xs text-blue-700 underline">
          포털 홈
        </Link>
        <Link to="/technician/material-orders" className="text-xs text-blue-700 underline">
          구매내역
        </Link>
      </div>
      <div className="mb-4 space-y-2 rounded-xl bg-white p-3 shadow ring-1 ring-slate-200">
        <label className="block text-xs text-slate-600">
          배송지 또는 수령 장소
          <input
            className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="예: 경기 포천시 현장 / 사무실 수령"
          />
        </label>
        <label className="block text-xs text-slate-600">
          요청 메모
          <input
            className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
            value={requestMemo}
            onChange={(e) => setRequestMemo(e.target.value)}
            placeholder="희망 출고일, 연락 가능 시간"
          />
        </label>
      </div>
      {done ? <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 ring-1 ring-emerald-200">{done}</p> : null}
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {rows?.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          구매 가능한 자재가 없습니다. 판매자가 재고와 판매 상태를 확인해야 합니다.
        </p>
      ) : null}
      <ul className="space-y-3">
        {(rows ?? []).map((m) => (
          <li key={m.id} className="overflow-hidden rounded-xl bg-white text-xs shadow ring-1 ring-slate-200">
            {m.imageUrl ? (
              <img src={m.imageUrl} alt="" className="h-36 w-full object-cover" />
            ) : (
              <div className="flex h-24 items-center justify-center bg-slate-100 text-slate-400">
                {m.code}
              </div>
            )}
            <div className="space-y-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">{m.name}</div>
                  <div className="text-slate-500">{m.supplierName || '판매자 미지정'} · {m.category}</div>
                </div>
                <div className="shrink-0 rounded-full bg-blue-50 px-2 py-1 font-semibold text-blue-700">
                  {won(m.customerPrice)}
                </div>
              </div>
              {m.description ? <p className="leading-relaxed text-slate-600">{m.description}</p> : null}
              <div className="grid grid-cols-3 gap-2 text-slate-600">
                <div className="rounded bg-slate-50 px-2 py-1">단위 {m.unit}</div>
                <div className="rounded bg-slate-50 px-2 py-1">재고 {m.stockQuantity}</div>
                <div className="rounded bg-slate-50 px-2 py-1">최소 {m.minOrderQuantity}</div>
              </div>
              {m.deliveryNote ? <div className="rounded bg-slate-50 px-2 py-2 text-slate-600">{m.deliveryNote}</div> : null}
              {m.oemAvailable ? <div className="text-emerald-700">OEM 가능</div> : null}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={m.minOrderQuantity || 1}
                  max={m.stockQuantity}
                  className="w-24 rounded border border-slate-200 px-2 py-2 text-sm"
                  value={quantities[m.id] ?? Math.max(1, m.minOrderQuantity || 1)}
                  onChange={(e) =>
                    setQuantities((prev) => ({
                      ...prev,
                      [m.id]: Math.max(m.minOrderQuantity || 1, Math.floor(Number(e.target.value) || 1)),
                    }))
                  }
                />
                <button
                  type="button"
                  disabled={busyId === m.id || m.customerPrice == null || m.stockQuantity < (m.minOrderQuantity || 1)}
                  className="flex-1 rounded-lg bg-slate-900 py-2 text-xs font-medium text-white disabled:opacity-40"
                  onClick={async () => {
                    setBusyId(m.id);
                    setErr(null);
                    setDone(null);
                    try {
                      const quantity = Math.min(
                        m.stockQuantity,
                        Math.max(m.minOrderQuantity || 1, quantities[m.id] ?? m.minOrderQuantity ?? 1),
                      );
                      const order = await createTechnicianMaterialOrder({
                        items: [{ materialId: m.id, quantity }],
                        deliveryAddress: deliveryAddress.trim() || undefined,
                        requestMemo: requestMemo.trim() || undefined,
                      });
                      setDone(`${order.orderNo} 구매요청이 저장됐습니다.`);
                      await load();
                    } catch (e) {
                      setErr(e instanceof Error ? e.message : '구매요청을 저장하지 못했습니다.');
                    } finally {
                      setBusyId(null);
                    }
                  }}
                >
                  {busyId === m.id ? '요청 중' : '구매요청'}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function MaterialOrdersList() {
  const [rows, setRows] = useState<TechnicianMaterialOrderRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!getStoredTechnicianId()) return;
    fetchTechnicianMaterialOrders()
      .then(setRows)
      .catch(() => setErr('구매내역을 불러오지 못했습니다.'));
  }, []);

  if (!getStoredTechnicianId()) return <Navigate to="/technician/login" replace />;

  return (
    <Shell title="자재 구매내역">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Link to="/technician" className="text-xs text-blue-700 underline">
          포털 홈
        </Link>
        <Link to="/technician/materials" className="text-xs text-blue-700 underline">
          자재 구매
        </Link>
      </div>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {rows?.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">아직 자재 구매요청이 없습니다.</p>
      ) : null}
      <ul className="space-y-3">
        {(rows ?? []).map((order) => (
          <li key={order.id} className="rounded-xl bg-white p-4 text-xs shadow ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{order.orderNo}</div>
                <div className="mt-1 text-slate-500">{order.sellerName || '판매자 미지정'}</div>
              </div>
              <span className="rounded-full bg-blue-50 px-2 py-1 font-semibold text-blue-700">
                {materialOrderStatusLabel(order.status)}
              </span>
            </div>
            <ul className="mt-3 space-y-1 text-slate-700">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span>{item.name} × {item.quantity}</span>
                  <span>{won(item.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 border-t border-slate-100 pt-3 font-semibold">
              합계 {won(order.totalAmount)}
            </div>
            {order.deliveryAddress ? <div className="mt-2 text-slate-500">배송지 {order.deliveryAddress}</div> : null}
            {order.sellerMemo ? <div className="mt-2 rounded bg-slate-50 px-2 py-2 text-slate-600">판매자 메모: {order.sellerMemo}</div> : null}
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export function TechnicianPortal() {
  return (
    <Routes>
      <Route index element={<TechHome />} />
      <Route path="login" element={<TechLogin />} />
      <Route path="signup" element={<TechSignup />} />
      <Route path="jobs" element={<JobsList />} />
      <Route path="jobs/:jobId" element={<TechJobDetail />} />
      <Route path="settlements" element={<SettlementsList />} />
      <Route path="materials" element={<MaterialsList />} />
      <Route path="material-orders" element={<MaterialOrdersList />} />
      <Route path="profile" element={<Profile />} />
      <Route path="*" element={<Navigate to="/technician" replace />} />
    </Routes>
  );
}
