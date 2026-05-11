# 에이씨나우 (ACnow)

React + Vite 고객용 모바일 웹/PWA. ([원본 Figma](https://www.figma.com/design/jz40QG3fGlULDCOfXNC8b2/%EC%95%B1-%EB%94%94%EC%9E%90%EC%9D%B8-%EC%9A%94%EC%B2%AD))

**모노레포 운영·환경 변수·플로우 통합 문서**: [`../doc/OPERATIONS.md`](../doc/OPERATIONS.md)

## 앱처럼 보려면 (중요)

`npm run dev`로 보면 **크롬 탭이라 주소줄이 있어서 웹처럼** 보입니다. “진짜 앱 느낌”으로 보려면 아래 둘 중 하나를 쓰면 됩니다.

### 1) Android 네이티브 앱 (Capacitor) — 우선 추천

같은 UI가 **설치형 앱(WebView 전체 화면, 주소창 없음)** 으로 올라갑니다.

1. **Android Studio + JDK 17** 설치, 기기에서 **개발자 옵션 · USB 디버깅** 켜기 *또는* **가상 디바이스(AVD)** 실행.
2. 터미널에서:

```bash
cd Aircone
npm install
npm run android:run
```

처음 빌드는 Gradle이 무거울 수 있습니다. 에뮬레이터/실기 중 하나가 선택되면 거기에 **에이씨나우 앱이 실행**됩니다.

수동 순서와 동일합니다:

```bash
npm run build:mobile
npx cap run android
```

Android Studio에서 열어 실행하려면: `npm run android` → 상단 **Run ▶** 로 기기/에뮬 선택 후 실행.

**APK만 설치해 보기:** Studio에서 `Build → Build Bundle(s) / APK(s) → Build APK(s)` 후 `android/app/build/outputs/...` APK를 기기로 옮겨 설치해도 됩니다.

### 2) PWA “홈 화면에 추가” (웹 배포 URL)

Vercel 등에 올린 **HTTPS 주소**를 **폰 크롬**으로 연 뒤, 메뉴에서 **홈 화면에 추가 / 앱 설치**. 열면 **주소줄 없이** 전체 화면에 가깝게 뜹니다. (OS마다 메뉴 이름이 다릅니다.)

---

## 로컬 개발 (웹 UI만 빠르게)

```bash
cd Aircone
npm install
npm run dev
```

## 프로덕션 빌드 (웹)

```bash
npm run build
npm run preview
```

## Vercel 배포

1. GitHub 등에 저장소를 연결하거나 `vercel` CLI로 배포합니다.
2. Vercel 프로젝트 설정에서 **Root Directory**를 `Aircone`으로 지정합니다 (모노레포인 경우).
3. **Build Command**는 기본값 `npm run build` 또는 저장소의 `vercel.json`과 동일하게 맞춥니다.
4. **Output Directory**는 `dist`입니다.
5. (선택) 백엔드 주소가 생기면 Vercel **Environment Variables**에 `VITE_API_BASE_URL`을 등록한 뒤 재배포합니다.

`vercel.json`에 SPA용 rewrite가 포함되어 있어 클라이언트 라우팅을 추가해도 동일 호스트에서 동작하기 쉽습니다.

## Android Studio에서 프로젝트만 열기

```bash
npm run build:mobile
npm run android
```

`android` 폴더가 열린 뒤 **Run ▶**, **Signed APK/AAB**(스토어 제출용) 빌드는 Studio 메뉴에서 진행하면 됩니다. 위쪽 **앱처럼 보려면** 에서 `npm run android:run` 로 바로 실행하는 방법도 같이 참고하면 됩니다.

웹 에셋만 다시 넣었을 때:

```bash
npm run build:mobile
```

앱 식별자(`com.aircone.app`)나 앱 이름을 바꾸려면 [`capacitor.config.ts`](capacitor.config.ts)를 수정한 뒤 `npx cap sync android`를 다시 실행합니다.

## 서버 연동 (나중에)

백엔드를 붙일 때는 `.env.example`을 참고해 `VITE_API_BASE_URL`을 설정하고, [`src/lib/api.ts`](src/lib/api.ts)의 `submitRequest`에 실제 `fetch`를 연결하면 됩니다.

---

## 긴급 접수 자동 전환 연동 메모 (2026-04)

고객앱의 긴급 접수는 서버의 `/api/emergency-leads` 계열 엔드포인트와 연결되어 있으며, 매칭 마감 후 서버가 자동으로 접수/배차와 주문 초안을 생성합니다.

- **기본 흐름**
  - 고객앱: `POST /api/emergency-leads` (긴급 리드 생성)
  - 고객앱: `PATCH /api/emergency-leads/:id/contact` (연락처 저장 시 `contact_saved`)
  - 고객앱(또는 서버 스윕): `PATCH /api/emergency-leads/:id/timeout`
  - 서버: 마감 이후 리드를 `converted_to_order`로 전환하고 `convertedBookingId`/`convertedOrderId`를 채움
- **중복 안전성**
  - `timeout` 재호출 시 동일 booking/order를 재사용(멱등), 중복 생성하지 않음
- **로컬 개발 시 확인 포인트**
  - Vite 프록시 또는 `VITE_API_BASE_URL`가 실제 Nest 포트를 바라보는지 확인
  - 서버 미기동이면 `ECONNREFUSED`가 발생하므로 먼저 서버 실행 필요

### 빠른 검증 순서

1. 서버 실행 (`airconeCallServer`): `npm run dev` 또는 `npm run build && npm run start`
2. 고객앱 실행: `npm run dev`
3. 긴급 접수 생성 후 타임아웃 전환까지 진행
4. 관리자 화면/스크립트에서 전환 결과(`converted*` 필드) 확인
