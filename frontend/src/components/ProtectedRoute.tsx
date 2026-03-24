import React from 'react';
import { Navigate } from 'react-router-dom';

import { useAppSelector } from '../hooks/store';
import type { Role } from '../store/authSlice';

interface ProtectedRouteProps {
  allow: Role[];
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allow, children }) => {
  const token = useAppSelector((s) => s.auth.accessToken);
  const role = useAppSelector((s) => s.auth.role);

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  // 简体中文注释：管理员拥有所有页面权限
  if (role === 'ADMIN') {
    return children;
  }
  if (!role || !allow.includes(role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

