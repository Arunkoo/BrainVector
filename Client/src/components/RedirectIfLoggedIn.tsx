import { Navigate } from "react-router-dom";
import { useAuthUser } from "../auth/auth.store";
interface ProtectedRouteProps {
  children: React.ReactNode;
}
const RedirectIfLoggedIn: React.FC<ProtectedRouteProps> = ({ children }) => {
  const user = useAuthUser();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RedirectIfLoggedIn;
