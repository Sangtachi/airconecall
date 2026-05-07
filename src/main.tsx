import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import { registerSW } from 'virtual:pwa-register';
import App from './app/App.tsx';
import './styles/index.css';

const TechnicianPortal = lazy(() => import('@/technician/TechnicianPortal'));

function TechSplash() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-6 text-center text-sm text-slate-600">
      기사 업무 화면을 불러오는 중…
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route
        path="/technician/*"
        element={
          <Suspense fallback={<TechSplash />}>
            <TechnicianPortal />
          </Suspense>
        }
      />
      <Route path="*" element={<App />} />
    </Routes>
  </BrowserRouter>,
);

if (typeof window !== 'undefined') {
  window.addEventListener(
    'load',
    () => registerSW({ immediate: true }),
    { once: true },
  );
}
