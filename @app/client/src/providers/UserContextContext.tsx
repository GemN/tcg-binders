import { createContext, useContext } from "react";

export interface UserContext {
  organizationId: string;
  organizationName: string;
  role: string;
}

export interface UserContextState {
  currentContext: UserContext | null;
  setContext: (
    context: UserContext | null,
    saveInLocalStorage?: boolean
  ) => void;
  clearContext: () => void;
  getOrganizationIdOrThrow: () => string;
}

export let globalUserContext: UserContext | null = null;

export const setGlobalUserContext = (context: UserContext | null): void => {
  globalUserContext = context;
};

export const getGlobalUserContext = (): UserContext | null => {
  return globalUserContext;
};

export const UserContextContext = createContext<UserContextState | undefined>(
  undefined
);

export const useUserContext = (): UserContextState => {
  const context = useContext(UserContextContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserContextProvider");
  }
  return context;
};
