import { ApolloProvider } from "@apollo/client";
import { lazy, Suspense, type FC, type ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router";

import { LayoutPage } from "@/components/LayoutPage";
import { Loading } from "@/components/Loading";
import { RequireAuth } from "@/components/RequireAuth";
import { Toaster } from "@/components/ui/Sonner";
import apolloClient from "@/lib/apollo";
import { PricingSettingsProvider } from "@/providers/PricingSettingsProvider";
import { SessionProvider } from "@/providers/SessionProvider";
import { UserContextProvider } from "@/providers/UserContextProvider";

const BinderDraft = lazy(() =>
  import("@/pages/BinderDraft").then((module) => ({
    default: module.BinderDraft,
  }))
);
const BinderPage = lazy(() =>
  import("@/pages/BinderPage").then((module) => ({
    default: module.BinderPage,
  }))
);
const Home = lazy(() =>
  import("@/pages/Home").then((module) => ({ default: module.Home }))
);
const Login = lazy(() =>
  import("@/pages/Login").then((module) => ({ default: module.Login }))
);
const Logout = lazy(() => import("@/pages/Logout"));
const MyBinders = lazy(() =>
  import("@/pages/MyBinders").then((module) => ({ default: module.MyBinders }))
);
const NotFound = lazy(() =>
  import("@/pages/NotFound").then((module) => ({ default: module.NotFound }))
);
const SetPassword = lazy(() => import("@/pages/SetPassword"));
const SettingsOrganization = lazy(() =>
  import("@/pages/settings/SettingsOrganization").then((module) => ({
    default: module.SettingsOrganization,
  }))
);
const SettingsUserProfile = lazy(() =>
  import("@/pages/settings/SettingsUserProfile").then((module) => ({
    default: module.SettingsUserProfile,
  }))
);

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

const renderPage = (page: ReactNode) => (
  <Suspense
    fallback={
      <div className="flex flex-1 items-center justify-center p-6">
        <Loading />
      </div>
    }
  >
    {page}
  </Suspense>
);

function App() {
  return (
    <>
      <Providers>
        <BrowserRouter>
          <Routes>
            <Route element={<LayoutPage />}>
              <Route index element={renderPage(<Home />)} />
              <Route
                path="binder/draft"
                element={renderPage(<BinderDraft />)}
              />
              <Route
                path="binder/:shortId"
                element={renderPage(<BinderPage />)}
              />
              <Route path="login" element={renderPage(<Login />)} />
              <Route path="logout" element={renderPage(<Logout />)} />
              <Route
                path="set-password"
                element={renderPage(<SetPassword />)}
              />
              <Route
                path="my-binders"
                element={renderPage(
                  <RequireAuth>
                    <MyBinders />
                  </RequireAuth>
                )}
              />
              <Route
                path="settings/profile"
                element={renderPage(
                  <RequireAuth>
                    <SettingsUserProfile />
                  </RequireAuth>
                )}
              />
              <Route
                path="settings/organization"
                element={renderPage(
                  <RequireAuth>
                    <SettingsOrganization />
                  </RequireAuth>
                )}
              />
              <Route path="*" element={renderPage(<NotFound />)} />
            </Route>
          </Routes>
        </BrowserRouter>
      </Providers>
      <Toaster position="bottom-right" />
    </>
  );
}

export default App;
