
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  requiresAdmin?: boolean;
}

const ProtectedRoute = ({ requiresAdmin = false }: ProtectedRouteProps) => {
  const { isLoggedIn, userRole } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  if (requiresAdmin && userRole !== 'admin') {
    return <Navigate to="/" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
