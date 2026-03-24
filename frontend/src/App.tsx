import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAppSelector } from './hooks/store';
import { AdminAuditLogPage } from './pages/Admin/AuditLog';
import { AdminConfigPage } from './pages/Admin/Config';
import { AdminReviewBoardPage } from './pages/Admin/ReviewBoard';
import { CreatorUploadPage } from './pages/Creator/Upload';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

export const App: React.FC = () => {
  // 简体中文注释：侧边栏菜单必须与 Redux 中角色同步；仅用 localStorage 会在登录后首屏不刷新，仍沿用旧角色
  const authRole = useAppSelector((s) => s.auth.role);
  const adminShellRole = authRole === 'ADMIN' ? 'ADMIN' : 'REVIEW';

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/creator"
        element={
          <ProtectedRoute allow={['CREATOR']}>
            <AppShell role="CREATOR" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/creator/upload" replace />} />
        <Route path="upload" element={<CreatorUploadPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute allow={['ADMIN', 'REVIEW']}>
            <AppShell role={adminShellRole} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/review" replace />} />
        <Route
          path="users"
          element={
            <ProtectedRoute allow={['ADMIN']}>
              <AdminConfigPage />
            </ProtectedRoute>
          }
        />
        <Route path="review" element={<AdminReviewBoardPage />} />
        <Route path="audit-logs" element={<AdminAuditLogPage />} />
        <Route
          path="upload"
          element={
            <ProtectedRoute allow={['ADMIN']}>
              <CreatorUploadPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

