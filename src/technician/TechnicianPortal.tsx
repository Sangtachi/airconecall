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
import { isCatalogApiAvailable } from '@/lib/catalogApi';
import {
  fetchJobPhotos,
  fetchTechnicianJob,
  fetchTechnicianJobs,
  fetchTechnicianMaterials,
  fetchTechnicianSettlements,
  getStoredTechnicianId,
  registerTechnician,
  setStoredTechnicianId,
  technicianAccept,
  technicianComplete,
  technicianDepart,
  technicianSession,
  technicianStart,
  uploadJobPhoto,
  uploadJobPhotoFile,
  type TechnicianMaterialRow,
  type TechnicianSettlementRow,
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
        <p className="mt-1 text-xs text-slate-500">설치·청소 기사 웹/PWA · Phase 3 API 연동</p>
      </header>
      <main className="flex-1 px-4 py-4">{children}</main>
    </div>
  );
}

function NoApiBanner() {
  return (
    <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
      환경에 <code className="text-xs">VITE_API_BASE_URL</code>이 없습니다. 에어컨 서버 URL을 설정한 뒤 다시
      호출해 주세요.
    </p>
  );
}

function TechHome() {
  const logged = !!getStoredTechnicianId();
  return (
    <Shell title="기사 포털">
      {!isCatalogApiAvailable() ? <NoApiBanner /> : null}
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
          자재
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
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!isCatalogApiAvailable()) return setErr('VITE_API_BASE_URL 미설정');
    try {
      const r = await technicianSession({ phone });
      setStoredTechnicianId(r.technicianId);
      nav('/technician/jobs');
    } catch {
      setErr('승인된 기사를 찾을 수 없습니다. 가입·승인 후 다시 시도하세요.');
    }
  }

  return (
    <Shell title="기사 로그인">
      {!isCatalogApiAvailable() ? <NoApiBanner /> : null}
      <form className="mt-3 space-y-3" onSubmit={submit}>
        <label className="block text-xs text-slate-600">
          휴대폰 번호 (데모: 승인 기사 김기사 01099998888)
          <input
            className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
  const [baseRegion, setBaseRegion] = useState('');
  const [done, setDone] = useState<{ id: string; status: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setDone(null);
    if (!isCatalogApiAvailable()) return setErr('VITE_API_BASE_URL 미설정');
    try {
      const res = await registerTechnician({
        name,
        phone,
        baseRegion: baseRegion || undefined,
        capabilities: [{ serviceType: 'install', airconType: 'wall' }],
      });
      setDone(res);
    } catch {
      setErr('가입에 실패했습니다. 번호 중복 등을 확인해 주세요.');
    }
  }

  return (
    <Shell title="기사 가입">
      {!isCatalogApiAvailable() ? <NoApiBanner /> : null}
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
            활동 지역 요약 (선택)
            <input
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              value={baseRegion}
              onChange={(e) => setBaseRegion(e.target.value)}
            />
          </label>
          {err ? <p className="text-sm text-red-600">{err}</p> : null}
          <button type="submit" className="w-full rounded-lg bg-slate-900 py-3 text-sm text-white">
            신청하기
          </button>
          <p className="text-xs text-slate-500">가능 업종은 기본값(설치 · 벽걸이). 추후 선택 UI 확대.</p>
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

  const load = useCallback(() => {
    fetchTechnicianJob(id)
      .then(setRow)
      .catch(() => setRow(null));
    fetchJobPhotos(id).then(setPhotos).catch(() => setPhotos([]));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!getStoredTechnicianId()) return <Navigate to="/technician/login" replace />;
  if (!row) return <Shell title="작업 상세"><p className="text-sm">불러오는 중 또는 없음...</p></Shell>;

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
          disabled={row.orderStatus !== 'working'}
          onClick={() => technicianComplete(id).then(setRow).catch(console.error)}
        >
          완료
        </button>
      </div>

      <section className="mt-8 space-y-2">
        <h2 className="text-sm font-semibold">현장 사진</h2>
        <p className="text-xs text-slate-500">
          Supabase 스토리지가 있으면 presigned 업로드 후 등록합니다. 실패 시 서버로 멀티파트 전송합니다. 로컬 전용(DB
          미연결)이면 공개 URL만 등록 가능합니다.
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
  return (
    <Shell title="프로필">
      <p className="text-sm text-slate-600">
        저장된 기사 ID:{' '}
        <code className="rounded bg-slate-100 px-2 py-0.5">{getStoredTechnicianId() ?? '미로그인'}</code>
      </p>
      <Link to="/technician/login" className="mt-3 inline-block text-sm text-blue-600 underline">
        로그인 화면
      </Link>
    </Shell>
  );
}

function SettlementsList() {
  const [rows, setRows] = useState<TechnicianSettlementRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const id = getStoredTechnicianId();
    if (!id) return;
    fetchTechnicianSettlements()
      .then(setRows)
      .catch(() => setErr('정산 목록을 불러오지 못했습니다. 로그인·Supabase 확인.'));
  }, []);

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
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function MaterialsList() {
  const [rows, setRows] = useState<TechnicianMaterialRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const id = getStoredTechnicianId();
    if (!id) return;
    fetchTechnicianMaterials()
      .then(setRows)
      .catch(() => setErr('자재 목록을 불러오지 못했습니다.'));
  }, []);

  if (!getStoredTechnicianId()) return <Navigate to="/technician/login" replace />;

  return (
    <Shell title="자재">
      <Link to="/technician" className="mb-3 inline-block text-xs text-blue-700 underline">
        포털 홈
      </Link>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {rows?.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          등록된 자재 없음 — Supabase 에 extras_materials_dispatch.sql 적용 후 materials 행을 넣어 주세요.
        </p>
      ) : null}
      <ul className="space-y-2">
        {(rows ?? []).map((m) => (
          <li key={m.id} className="rounded-lg bg-white p-3 text-xs shadow ring-1 ring-slate-200">
            <div className="font-semibold">{m.name}</div>
            <div className="text-slate-600">
              코드 {m.code} · 분류 {m.category} · 단위 {m.unit}
            </div>
            {m.customerPrice != null ? (
              <div className="text-slate-500">고객가 ₩{m.customerPrice.toLocaleString?.() ?? m.customerPrice}</div>
            ) : (
              <div className="text-slate-400">고객가 미정</div>
            )}
            {m.oemAvailable ? <div className="text-emerald-700">OEM 가능</div> : null}
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
      <Route path="profile" element={<Profile />} />
      <Route path="*" element={<Navigate to="/technician" replace />} />
    </Routes>
  );
}
