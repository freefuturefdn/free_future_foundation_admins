import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!session) return <Navigate to="/" replace />;
  return <>{children}</>;
}
