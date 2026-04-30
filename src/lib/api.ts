import { apiRequestUrl } from '@/lib/apiRequestUrl';
import { nestErrorPlainText } from '@/lib/nestErrorMessage';

/** 접수 세션 localStorage 키 */
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

async function parseEnvelope<T>(res: Response): Promise<T> {
  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error('응답을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
  if (typeof json !== 'object' || json === null) {
    throw new Error('일시적인 오류가 있었습니다. 잠시 후 다시 시도해 주세요.');
  }

  const o = json as { ok?: boolean; data?: T; error?: unknown };
  if (!res.ok || o.ok === false) {
    throw new Error(nestErrorPlainText(o.error));
  }
  if (o.data === undefined) throw new Error('접수를 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.');
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
 * 긴급 접수 폼 제출. 주소는 `apiRequestUrl`: 환경변수 없으면 `/api/...` 상대 경로(로컬 Vite 프록시).
 */
export async function submitRequest(
  payload: Record<string, unknown>,
): Promise<EmergencyLeadSubmitOk> {
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

  let res: Response;
  try {
    res = await fetch(apiRequestUrl('/api/emergency-leads'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('인터넷 연결이 불안정합니다. 잠시 후 다시 시도해 주세요.');
  }

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

export async function markEmergencyLeadTimeout(): Promise<void> {
  const ctx = getEmergencyLeadContext();
  if (!ctx) return;
  try {
    const res = await fetch(apiRequestUrl(`/api/emergency-leads/${ctx.leadId}/timeout`), {
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

export async function patchEmergencyLeadContact(args: {
  customerPhone?: string;
  customerName?: string;
  userId?: string;
}): Promise<void> {
  const ctx = getEmergencyLeadContext();
  if (!ctx) return;

  const body: Record<string, unknown> = { clientSessionId: ctx.clientSessionId };
  if (args.customerPhone !== undefined) body.customerPhone = args.customerPhone;
  if (args.customerName !== undefined) body.customerName = args.customerName;
  if (args.userId !== undefined) body.userId = args.userId;

  const res = await fetch(apiRequestUrl(`/api/emergency-leads/${ctx.leadId}/contact`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  await parseEnvelope<unknown>(res);
}
