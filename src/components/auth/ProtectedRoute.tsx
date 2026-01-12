
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  requiresAdmin?: boolean;
}

const ProtectedRoute = ({ requiresAdmin = false }: ProtectedRouteProps) => {
  const { isLoggedIn, isLoading, userRole } = useAuth();

  // Show nothing while loading to prevent flash of redirect
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-council-primary"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (requiresAdmin && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
