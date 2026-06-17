import {
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

import { handleError } from "@/lib/error";

import {
  setGlobalUserContext,
  type UserContext,
  UserContextContext,
  type UserContextState,
} from "./UserContextContext";

const USER_CONTEXT_KEY = "user-context";

interface UserContextProviderProps {
  children: ReactNode;
}

export const UserContextProvider: FC<UserContextProviderProps> = ({
  children,
}) => {
  const [currentContext, setCurrentContext] = useState<UserContext | null>(
    null
  );

  const handleSetContext = useCallback(
    (newContext: UserContext | null, saveInLocalStorage?: boolean) => {
      setCurrentContext(newContext);
      setGlobalUserContext(newContext);
      if (!saveInLocalStorage) return;
      if (newContext) {
        localStorage.setItem(USER_CONTEXT_KEY, JSON.stringify(newContext));
      } else {
        localStorage.removeItem(USER_CONTEXT_KEY);
      }
    },
    []
  );

  const clearContext = useCallback(() => {
    handleSetContext(null, true);
  }, [handleSetContext]);

  const getOrganizationIdOrThrow = (): string => {
    if (!currentContext?.organizationId) {
      throw new Error("No organization context available");
    }
    return currentContext.organizationId;
  };

  useEffect(() => {
    const savedContext = localStorage.getItem(USER_CONTEXT_KEY);
    if (savedContext) {
      try {
        handleSetContext(JSON.parse(savedContext));
      } catch (error) {
        handleError(error);
        localStorage.removeItem(USER_CONTEXT_KEY);
      }
    }
  }, [handleSetContext]);

  const value: UserContextState = {
    currentContext,
    setContext: handleSetContext,
    clearContext,
    getOrganizationIdOrThrow,
  };

  return (
    <UserContextContext.Provider value={value}>
      {children}
    </UserContextContext.Provider>
  );
};
