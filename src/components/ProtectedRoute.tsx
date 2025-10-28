// src/components/ProtectedRoute.tsx

import { useAuth } from '../contexts/AuthContext'; // Ellenőrizd az import útvonalát!
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // Amíg a sessiont ellenőrizzük, mutass egy töltőképernyőt
    return <div>Profil betöltése...</div>; 
  }

  if (!user) {
    // Ha nincs bejelentkezett felhasználó, irányítsd át a login oldalra
    return <Navigate to="/login" replace />;
  }

  // Ha van felhasználó, jelenítsd meg a védett tartalmat (pl. az admin oldalt)
  return <Outlet />;
};

export default ProtectedRoute;