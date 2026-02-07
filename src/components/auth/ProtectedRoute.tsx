import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "super_admin" | "admin" | "hr_manager" | "recruiter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  minRole?: AppRole;
}

export function ProtectedRoute({ children, minRole }: ProtectedRouteProps) {
  const { user, loading, hasMinRole } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (minRole && !hasMinRole(minRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
