import { ApolloProvider } from "@apollo/client";
import type { FC, ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router";

import { LayoutPage } from "@/components/LayoutPage";
import { RequireAuth } from "@/components/RequireAuth";
import { Toaster } from "@/components/ui/Sonner";
import apolloClient from "@/lib/apollo";
import { BinderDraft } from "@/pages/BinderDraft";
import { BinderPage } from "@/pages/BinderPage";
import { Home } from "@/pages/Home";
import { Login } from "@/pages/Login";
import Logout from "@/pages/Logout";
import { MyBinders } from "@/pages/MyBinders";
import { NotFound } from "@/pages/NotFound";
import SetPassword from "@/pages/SetPassword";
import { SettingsOrganization } from "@/pages/settings/SettingsOrganization";
import { SettingsUserProfile } from "@/pages/settings/SettingsUserProfile";
import { PricingSettingsProvider } from "@/providers/PricingSettingsProvider";
import { SessionProvider } from "@/providers/SessionProvider";
import { UserContextProvider } from "@/providers/UserContextProvider";

interface ProvidersProps {
  children: ReactNode;
}

const Providers: FC<ProvidersProps> = ({ children }) => {
  return (
    <UserContextProvider>
      <ApolloProvider client={apolloClient}>
        <PricingSettingsProvider>
          <SessionProvider>{children}</SessionProvider>
        </PricingSettingsProvider>
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
            <Route element={<LayoutPage />}>
              <Route index element={<Home />} />
              <Route path="binder/draft" element={<BinderDraft />} />
              <Route path="binder/:shortId" element={<BinderPage />} />
              <Route path="login" element={<Login />} />
              <Route path="logout" element={<Logout />} />
              <Route path="set-password" element={<SetPassword />} />
              <Route
                path="my-binders"
                element={
                  <RequireAuth>
                    <MyBinders />
                  </RequireAuth>
                }
              />
              <Route
                path="settings/profile"
                element={
                  <RequireAuth>
                    <SettingsUserProfile />
                  </RequireAuth>
                }
              />
              <Route
                path="settings/organization"
                element={
                  <RequireAuth>
                    <SettingsOrganization />
                  </RequireAuth>
                }
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
