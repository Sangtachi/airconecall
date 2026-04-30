/**
 * API 요청 URL (변수 이름은 사용자 화면에 노출하지 않음).
 * - 배포 등: `VITE_API_BASE_URL` 이 있으면 그 호스트 + path.
 * - 기본은 `/api/...` 상대 → Vercel rewrite·vite preview 의 `/api` 프록시 등.
 * - 브라우저 `vite` 개발 서버에서 `localhost`/`127.0.0.1`(루프백)로 열었다면 프록시에 의존하지 않고
 *   같은 머신의 Nest(기본 :4000)로 직접 요청 (CORS 허용). 프록시가 POST 를 못 넘기는 환경에서도 동작합니다.
 */

function loopbackFrontendHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]'
  );
}

function devBootstrapNestOrigin(): string {
  const fromEnv = (import.meta.env.VITE_LOCAL_NEST_ORIGIN as string | undefined)?.trim();
  if (fromEnv?.length) return fromEnv.replace(/\/$/, '');
  const port = (import.meta.env.VITE_LOCAL_NEST_PORT as string | undefined)?.trim() || '4000';
  if (typeof window === 'undefined') return `http://127.0.0.1:${port}`;
  // 페이지와 같은 hostname (localhost vs 127.0.0.1 vs ::1) — 믹스 시 일부 브라우저에서 CORS/PNA 가 실패함
  const h = window.location.hostname;
  const host = h.includes(':') && !h.startsWith('[') ? `[${h}]` : h;
  return `http://${host}:${port}`;
}

export function apiRequestUrl(pathWithLeadingSlash: string): string {
  const p = pathWithLeadingSlash.startsWith('/') ? pathWithLeadingSlash : `/${pathWithLeadingSlash}`;
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? '';
  const base = raw.replace(/\/$/, '');
  if (base.length > 0) return `${base}${p}`;

  if (
    typeof window !== 'undefined' &&
    import.meta.env.DEV &&
    loopbackFrontendHost(window.location.hostname)
  ) {
    return `${devBootstrapNestOrigin()}${p}`;
  }

  return p;
}
