import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App';
import './styles/global.css';

const Dashboard2D = lazy(() => import('./pages/dashboard-2d/Dashboard2D'));
const Vehicle3D = lazy(() => import('./pages/vehicle-3d/Vehicle3D'));
const LogManage = lazy(() => import('./pages/log-manage/LogManage'));

const fallback = (
  <div className="loading-screen">
    <div className="loading-spinner" />
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={fallback}>
        <Routes>
          <Route element={<App />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard2D />} />
            <Route path="vehicle-3d" element={<Vehicle3D />} />
            <Route path="logs" element={<LogManage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
);
