/** 서버(ok:false) 에서 온 에러 객체를 사람이 읽는 한 줄 문자열로 */
export function nestErrorPlainText(payload: unknown): string {
  if (typeof payload === 'string') {
    const t = payload.trim();
    return t.length > 160 ? `${t.slice(0, 160)}…` : t;
  }
  if (payload !== null && typeof payload === 'object') {
    const m = (payload as { message?: unknown }).message;
    if (Array.isArray(m) && m.length > 0) {
      const line = m.map(String).join(' ');
      return line.length > 160 ? `${line.slice(0, 160)}…` : line;
    }
    if (typeof m === 'string') {
      const t = m.trim();
      return t.length > 160 ? `${t.slice(0, 160)}…` : t;
    }
  }
  return '일시적인 오류가 있었습니다. 잠시 후 다시 시도해 주세요.';
}
