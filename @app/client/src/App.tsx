import { ApolloProvider } from "@apollo/client";
import { type FC, lazy, type ReactNode, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router";

import { LayoutPage } from "@/components/LayoutPage";
import { Loading } from "@/components/Loading";
import { RequireAuth } from "@/components/RequireAuth";
import { Toaster } from "@/components/ui/Sonner";
import apolloClient from "@/lib/apollo";
import { Home } from "@/pages/Home";
import { Login } from "@/pages/Login";
import { OAuthCallback } from "@/pages/OAuthCallback";
import { CartProvider } from "@/providers/CartProvider";
import { PricingSettingsProvider } from "@/providers/PricingSettingsProvider";
import { SessionProvider } from "@/providers/SessionProvider";
import { UserContextProvider } from "@/providers/UserContextProvider";

const Cart = lazy(() =>
  import("@/pages/Cart").then((module) => ({ default: module.Cart }))
);
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
const CardPage = lazy(() =>
  import("@/pages/CardPage").then((module) => ({
    default: module.CardPage,
  }))
);
const CardAllListingsPage = lazy(() =>
  import("@/pages/CardAllListingsPage").then((module) => ({
    default: module.CardAllListingsPage,
  }))
);
const CardVariantsPage = lazy(() =>
  import("@/pages/CardVariantsPage").then((module) => ({
    default: module.CardVariantsPage,
  }))
);
const ForgotPassword = lazy(() =>
  import("@/pages/ForgotPassword").then((module) => ({
    default: module.ForgotPassword,
  }))
);
const Logout = lazy(() => import("@/pages/Logout"));
const MyBinders = lazy(() =>
  import("@/pages/MyBinders").then((module) => ({ default: module.MyBinders }))
);
const NotFound = lazy(() =>
  import("@/pages/NotFound").then((module) => ({ default: module.NotFound }))
);
const Onboarding = lazy(() =>
  import("@/pages/Onboarding").then((module) => ({
    default: module.Onboarding,
  }))
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
const UserProfile = lazy(() =>
  import("@/pages/UserProfile").then((module) => ({
    default: module.UserProfile,
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
          <SessionProvider>
            <CartProvider>{children}</CartProvider>
          </SessionProvider>
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
            <Route path="login" element={<Login />} />
            <Route path="auth/callback" element={<OAuthCallback />} />
            <Route
              path="onboarding"
              element={renderPage(
                <RequireAuth>
                  <Onboarding />
                </RequireAuth>
              )}
            />
            <Route
              path="forgot-password"
              element={renderPage(<ForgotPassword />)}
            />
            <Route element={<LayoutPage />}>
              <Route index element={<Home />} />
              <Route
                path="binder/draft"
                element={renderPage(<BinderDraft />)}
              />
              <Route
                path="binder/:shortId"
                element={renderPage(<BinderPage />)}
              />
              <Route path="card/:cardId" element={renderPage(<CardPage />)} />
              <Route
                path="card/:cardId/listings"
                element={renderPage(<CardAllListingsPage />)}
              />
              <Route
                path="card/:cardId/variants"
                element={renderPage(<CardVariantsPage />)}
              />
              <Route
                path="user/:nickname"
                element={renderPage(<UserProfile />)}
              />
              <Route path="cart" element={renderPage(<Cart />)} />
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
