// src/components/ProtectedRoute.tsx

import { useAuth } from '../contexts/auth-context';
import { Redirect } from 'wouter';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Profil betöltése...</div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;