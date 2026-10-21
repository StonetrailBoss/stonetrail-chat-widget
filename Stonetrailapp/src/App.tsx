import { lazy, Suspense } from 'react';
import CloudbedsChat from '@/components/CloudbedsChat';
import StonetrailChatWidget from '@/components/StonetrailChatWidget';
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import AiroErrorBoundary from '../export-plugins/AiroErrorBoundary';
import CookieBannerErrorBoundary from '@/components/CookieBannerErrorBoundary';
import RootLayout from './layouts/RootLayout';
import Spinner from './components/Spinner';
import { routes } from './routes';
import { AdminRoute, ProtectedRoute } from '@/lib/auth/auth-client';
import { useOS } from '@/hooks/useOS';
const CookieBanner = lazy(() => import('@/components/CookieBanner').catch(error => {
  console.warn('Failed to load CookieBanner:', error);
  return {
    default: () => null
  };
}));
const StaffLoginPage = lazy(() => import('./pages/staff/login'));
const ForgotPasswordPage = lazy(() => import('./pages/staff/forgot-password'));
const ResetPasswordPage = lazy(() => import('./pages/staff/reset-password'));
const InventoryPage = lazy(() => import('./pages/staff/inventory'));
const TimeclockPage = lazy(() => import('./pages/staff/timeclock'));
const StaffAccessPage = lazy(() => import('./pages/staff/access'));
const WebsiteManagementPage = lazy(() => import('./pages/staff/website'));
const StaffReviewsPage = lazy(() => import('./pages/staff/reviews'));
const NotFoundPage = lazy(() => import('./pages/_404'));
const SpinnerFallback = () => <div className="flex justify-center py-8 h-screen items-center">
    <Spinner />
  </div>;
function PublicLayout() {
  if (import.meta.env.MODE === 'development') {
    return <AiroErrorBoundary>
        <Suspense fallback={<SpinnerFallback />}>
          <RootLayout>
            <Outlet />
          </RootLayout>
        </Suspense>
      </AiroErrorBoundary>;
  }
  return <Suspense fallback={<SpinnerFallback />}>
      <RootLayout>
        <Outlet />
      </RootLayout>
    </Suspense>;
}
const router = createBrowserRouter([
// Staff portal — no public header/footer
{
  path: '/staff/login',
  element: <Suspense fallback={<SpinnerFallback />}>
        <StaffLoginPage />
      </Suspense>
}, {
  path: '/staff/forgot-password',
  element: <Suspense fallback={<SpinnerFallback />}>
        <ForgotPasswordPage />
      </Suspense>
}, {
  path: '/staff/reset-password',
  element: <Suspense fallback={<SpinnerFallback />}>
        <ResetPasswordPage />
      </Suspense>
}, {
  path: '/staff/inventory',
  element: <ProtectedRoute>
        <Suspense fallback={<SpinnerFallback />}>
          <InventoryPage />
        </Suspense>
      </ProtectedRoute>
}, {
  path: '/staff/timeclock',
  element: <AdminRoute>
        <Suspense fallback={<SpinnerFallback />}>
          <TimeclockPage />
        </Suspense>
      </AdminRoute>
}, {
  path: '/staff/access',
  element: <AdminRoute>
        <Suspense fallback={<SpinnerFallback />}>
          <StaffAccessPage />
        </Suspense>
      </AdminRoute>
}, {
  path: '/staff/website',
  element: <AdminRoute>
        <Suspense fallback={<SpinnerFallback />}>
          <WebsiteManagementPage />
        </Suspense>
      </AdminRoute>
}, {
  path: '/staff/reviews',
  element: <AdminRoute>
        <Suspense fallback={<SpinnerFallback />}>
          <StaffReviewsPage />
        </Suspense>
      </AdminRoute>
},
// Public website — with header/footer
{
  path: '/',
  element: <PublicLayout />,
  children: [...routes, {
    path: '*',
    element: <Suspense fallback={<SpinnerFallback />}>
            <NotFoundPage />
          </Suspense>
  }]
}]);
// Renders the staff chat widget on /staff/* pages, Cloudbeds everywhere else.
// Uses window.location so it works outside the router context.
function ChatWidget() {
  const isStaff = typeof window !== 'undefined' && window.location.pathname.startsWith('/staff/');
  return isStaff ? <StonetrailChatWidget /> : <CloudbedsChat />;
}

export default function App() {
  useOS(); // Applies OS/device classes to <html> for CSS targeting
  return <>
      <RouterProvider router={router} />
      <CookieBannerErrorBoundary>
        <Suspense fallback={null}>
          <CookieBanner />
        </Suspense>
      </CookieBannerErrorBoundary>
      <ChatWidget />
    </>;
}
