/** localStorage keys — 접수 세션 추적용 */
const LS_SESSION = 'aircone_emergency_client_session_id';
const LS_LEAD = 'aircone_emergency_lead_id';
const LS_DEADLINE = 'aircone_emergency_deadline_iso';

export type EmergencyLeadSubmitOk = {
  leadId: string;
  clientSessionId: string;
  matchingTimeoutSeconds: number;
  deadlineIso: string;
  quotedFeeKrw: number;
};

function apiBase(): string | null {
  const b = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  return b ? b.replace(/\/$/, '') : null;
}

async function parseEnvelope<T>(res: Response): Promise<T> {
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`비 JSON 응답 (${res.status})`);
  }
  if (typeof json !== 'object' || json === null) throw new Error('잘못된 응답 형식');

  const o = json as { ok?: boolean; data?: T; error?: unknown };
  if (!res.ok || o.ok === false) {
    const msg =
      typeof o.error === 'string'
        ? o.error
        : o.error !== undefined && o.error !== null && typeof (o.error as { message?: unknown }).message === 'string'
          ? String((o.error as { message?: string }).message)
          : JSON.stringify(o.error ?? json);
    throw new Error(msg);
  }
  if (o.data === undefined) throw new Error('응답에 data가 없습니다');
  return o.data;
}

/** 브라우저 세션 ID (접수·PATCH 소유 증명용 MVP) */
export function ensureEmergencyClientSessionId(): string {
  try {
    let s = localStorage.getItem(LS_SESSION);
    if (!s || s.length < 8) {
      s =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
      localStorage.setItem(LS_SESSION, s);
    }
    return s;
  } catch {
    return `sess_${Date.now()}`;
  }
}

export function getEmergencyLeadContext(): { leadId: string; clientSessionId: string } | null {
  try {
    const leadId = localStorage.getItem(LS_LEAD);
    const clientSessionId = localStorage.getItem(LS_SESSION);
    if (!leadId || !clientSessionId) return null;
    return { leadId, clientSessionId };
  } catch {
    return null;
  }
}

export function readStoredMatchingDeadlineIso(): string | null {
  try {
    return localStorage.getItem(LS_DEADLINE);
  } catch {
    return null;
  }
}

/**
 * 긴급 접수 폼 제출 → `POST /api/emergency-leads`.
 * API 베이스 URL이 없으면 데모 모드 동작(undefined 반환).
 */
export async function submitRequest(
  payload: Record<string, unknown>,
): Promise<EmergencyLeadSubmitOk | undefined> {
  const base = apiBase();
  if (!base) return undefined;

  const session = ensureEmergencyClientSessionId();
  const mt = payload.matchingTimeoutSeconds;
  const body: Record<string, unknown> = {
    clientSessionId: session,
    location: String(payload.location ?? '').trim(),
    acType: String(payload.acType ?? '').trim(),
    issue: String(payload.issue ?? '').trim(),
    urgency: payload.urgency === 'scheduled' ? 'scheduled' : 'now',
  };
  if (typeof mt === 'number' && Number.isFinite(mt)) {
    body.matchingTimeoutSeconds = Math.floor(mt);
  }

  const res = await fetch(`${base}/api/emergency-leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await parseEnvelope<EmergencyLeadSubmitOk>(res);

  try {
    localStorage.setItem(LS_LEAD, data.leadId);
    if (data.deadlineIso) localStorage.setItem(LS_DEADLINE, data.deadlineIso);
    localStorage.setItem(LS_SESSION, data.clientSessionId);
  } catch {
    /* ignore */
  }

  void payload.submittedAt;
  return data;
}

/** 매칭 타이머 종료 시 `timed_out` 반영(MVP 클라 호출). */
export async function markEmergencyLeadTimeout(): Promise<void> {
  const base = apiBase();
  const ctx = getEmergencyLeadContext();
  if (!base || !ctx) return;
  try {
    const res = await fetch(`${base}/api/emergency-leads/${ctx.leadId}/timeout`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientSessionId: ctx.clientSessionId }),
    });
    if (!res.ok) return;
    await parseEnvelope<unknown>(res);
  } catch {
    /* ignore */
  }
}

/** 웨잇리스트 연락처·회원가입 후 서버 리드 PATCH */
export async function patchEmergencyLeadContact(args: {
  customerPhone?: string;
  customerName?: string;
  userId?: string;
}): Promise<void> {
  const base = apiBase();
  const ctx = getEmergencyLeadContext();
  if (!base || !ctx) return;

  const body: Record<string, unknown> = { clientSessionId: ctx.clientSessionId };
  if (args.customerPhone !== undefined) body.customerPhone = args.customerPhone;
  if (args.customerName !== undefined) body.customerName = args.customerName;
  if (args.userId !== undefined) body.userId = args.userId;

  const res = await fetch(`${base}/api/emergency-leads/${ctx.leadId}/contact`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  await parseEnvelope<unknown>(res);
}
