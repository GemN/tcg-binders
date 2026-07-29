import { Navigate, useLocation } from "react-router";

import { Loading } from "@/components/Loading";
import { cn } from "@/lib/utils";
import { useSession } from "@/providers/SessionContext.tsx";

interface RequireAuthProps {
  children?: React.ReactNode;
  loadingClassName?: string;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  loadingClassName,
}) => {
  const location = useLocation();
  const { isLoading, session } = useSession();

  if (isLoading) {
    if (!loadingClassName) return null;

    return (
      <div
        className={cn(
          "flex flex-1 items-center justify-center p-6",
          loadingClassName
        )}
      >
        <Loading />
      </div>
    );
  }

  if (!session) {
    const requestedPath = `${location.pathname}${location.search}`;
    const nextUrl = `/login?next=${encodeURIComponent(requestedPath)}`;
    if (location.pathname !== "/login") {
      return <Navigate to={nextUrl} replace />;
    }
  }
  return <>{children}</>;
};
