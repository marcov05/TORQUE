import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingState } from '../ui/Feedback';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-torque-offwhite"><LoadingState label="Restaurando sessão…" /></div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-torque-offwhite"><LoadingState label="Verificando sessão…" /></div>;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
