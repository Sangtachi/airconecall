/**
 * API 요청 URL (변수 이름은 사용자 화면에 노출하지 않음).
 * VITE 미설정 시 `/api/...` 상대 경로 → 로컬 `vite` 의 `/api` 프록시가 Nest 로 넘김.
 */
export function apiRequestUrl(pathWithLeadingSlash: string): string {
  const p = pathWithLeadingSlash.startsWith('/') ? pathWithLeadingSlash : `/${pathWithLeadingSlash}`;
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? '';
  const base = raw.replace(/\/$/, '');
  return base.length > 0 ? `${base}${p}` : p;
}
