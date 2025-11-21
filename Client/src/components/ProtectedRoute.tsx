import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../auth/auth.store";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isLoggedIn = useAuthStore((state) => !!state.user);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const location = useLocation();

  if (isCheckingAuth) {
    return <div>Loading...</div>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/Login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
