import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import { registerSW } from 'virtual:pwa-register';
import App from './app/App.tsx';
import { TechnicianPortal } from '@/technician/TechnicianPortal';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/technician/*" element={<TechnicianPortal />} />
      <Route path="*" element={<App />} />
    </Routes>
  </BrowserRouter>,
);

registerSW({ immediate: true });
  