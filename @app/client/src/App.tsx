import { ApolloProvider } from "@apollo/client";
import { type FC, lazy, type ReactNode, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { AuthPageLayout } from "@/components/AuthPageLayout";
import { LayoutPage } from "@/components/LayoutPage";
import { Loading } from "@/components/Loading";
import { RequireAuth } from "@/components/RequireAuth";
import { Toaster } from "@/components/ui/Sonner";
import { NAVBAR_CONTENT_OFFSET_CLASS_NAME } from "@/config/layout";
import apolloClient from "@/lib/apollo";
import { cn } from "@/lib/utils";
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
const CardPrintingsPage = lazy(() =>
  import("@/pages/CardPrintingsPage").then((module) => ({
    default: module.CardPrintingsPage,
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

interface RouteLoadingProps {
  className?: string;
}

const RouteLoading: FC<RouteLoadingProps> = ({ className }) => (
  <div className={cn("flex flex-1 items-center justify-center p-6", className)}>
    <Loading />
  </div>
);

const renderPage = (page: ReactNode) => (
  <Suspense fallback={<RouteLoading />}>{page}</Suspense>
);

const renderLayoutPage = (page: ReactNode) => (
  <Suspense
    fallback={<RouteLoading className={NAVBAR_CONTENT_OFFSET_CLASS_NAME} />}
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
            <Route element={<AuthPageLayout />}>
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
              <Route
                path="set-password"
                element={renderPage(<SetPassword />)}
              />
            </Route>
            <Route element={<LayoutPage />}>
              <Route index element={<Home />} />
              <Route
                path="binder/draft"
                element={renderLayoutPage(<BinderDraft />)}
              />
              <Route
                path="binder/:shortId"
                element={renderLayoutPage(<BinderPage />)}
              />
              <Route
                path="card/:cardId"
                element={renderLayoutPage(<CardPage />)}
              />
              <Route
                path="card/:cardId/listings"
                element={renderLayoutPage(<CardAllListingsPage />)}
              />
              <Route
                path="card/:cardId/printings"
                element={renderLayoutPage(<CardPrintingsPage />)}
              />
              <Route
                path="card/:cardId/variants"
                element={<Navigate to="../printings" replace relative="path" />}
              />
              <Route
                path="user/:nickname"
                element={renderLayoutPage(<UserProfile />)}
              />
              <Route path="cart" element={renderLayoutPage(<Cart />)} />
              <Route path="logout" element={renderLayoutPage(<Logout />)} />
              <Route
                path="my-binders"
                element={renderLayoutPage(
                  <RequireAuth
                    loadingClassName={NAVBAR_CONTENT_OFFSET_CLASS_NAME}
                  >
                    <MyBinders />
                  </RequireAuth>
                )}
              />
              <Route
                path="settings/profile"
                element={renderLayoutPage(
                  <RequireAuth
                    loadingClassName={NAVBAR_CONTENT_OFFSET_CLASS_NAME}
                  >
                    <SettingsUserProfile />
                  </RequireAuth>
                )}
              />
              <Route
                path="settings/organization"
                element={renderLayoutPage(
                  <RequireAuth
                    loadingClassName={NAVBAR_CONTENT_OFFSET_CLASS_NAME}
                  >
                    <SettingsOrganization />
                  </RequireAuth>
                )}
              />
              <Route path="*" element={renderLayoutPage(<NotFound />)} />
            </Route>
          </Routes>
        </BrowserRouter>
      </Providers>
      <Toaster position="bottom-right" />
    </>
  );
}

export default App;
