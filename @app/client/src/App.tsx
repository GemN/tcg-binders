import { ApolloProvider } from "@apollo/client";
import type { FC, ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { LayoutPage } from "@/components/LayoutPage";
import { RequireAuth } from "@/components/RequireAuth";
import { Toaster } from "@/components/ui/Sonner";
import apolloClient from "@/lib/apollo";
import { Dashboard } from "@/pages/Dashboard";
import { Login } from "@/pages/Login";
import Logout from "@/pages/Logout";
import { NotFound } from "@/pages/NotFound";
import SetPassword from "@/pages/SetPassword";
import { SettingsOrganization } from "@/pages/settings/SettingsOrganization";
import { SettingsUserProfile } from "@/pages/settings/SettingsUserProfile";
import { SessionProvider } from "@/providers/SessionProvider";
import { UserContextProvider } from "@/providers/UserContextProvider";

interface ProvidersProps {
  children: ReactNode;
}

const Providers: FC<ProvidersProps> = ({ children }) => {
  return (
    <UserContextProvider>
      <ApolloProvider client={apolloClient}>
        <SessionProvider>{children}</SessionProvider>
      </ApolloProvider>
    </UserContextProvider>
  );
};

function App() {
  return (
    <>
      <Providers>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/set-password" element={<SetPassword />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <LayoutPage />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="/settings/profile"
                element={<SettingsUserProfile />}
              />
              <Route
                path="/settings/organization"
                element={<SettingsOrganization />}
              />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </Providers>
      <Toaster position="bottom-right" />
    </>
  );
}

export default App;
