import { Navigate, useLocation } from "react-router";

import { useSession } from "@/providers/SessionContext.tsx";

interface RequireAuthProps {
  children?: React.ReactNode;
}
export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const location = useLocation();
  const { isLoading, session } = useSession();

  if (isLoading) {
    return null;
  }

  if (!session) {
    const nextUrl = `/login?next=${encodeURIComponent(location.pathname)}`;
    if (location.pathname !== "/login") {
      return <Navigate to={nextUrl} replace />;
    }
  }
  return <>{children}</>;
};
