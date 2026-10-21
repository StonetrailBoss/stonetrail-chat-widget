import { renderToString } from 'react-dom/server';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { Suspense } from 'react';
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from "react-router";
import { Outlet } from "react-router";
import RootLayout from './layouts/RootLayout';
import { routes } from './routes';
import NotFoundPage from './pages/_404';
type RenderResult = {
  html: string;
  head: string;
  status: number;
  redirect?: string;
};

// Staff pages use client-side auth (useSession suspends during SSR).
// Return an empty shell — the client bundle hydrates and handles auth/redirect.
function StaffShell() {
  return null;
}
function PublicLayout() {
  return <Suspense fallback={null}>
      <RootLayout>
        <Outlet />
      </RootLayout>
    </Suspense>;
}
const ssrRoutes = [{
  path: '/staff/login',
  element: <StaffShell />
}, {
  path: '/staff/inventory',
  element: <StaffShell />
}, {
  path: '/staff/timeclock',
  element: <StaffShell />
}, {
  path: '/',
  element: <PublicLayout />,
  children: [...routes, {
    path: '*',
    element: <NotFoundPage />
  }]
}];
export async function render(url: string): Promise<RenderResult> {
  const helmetContext: Record<string, unknown> = {};
  const handler = createStaticHandler(ssrRoutes);
  const request = new Request(`http://localhost${url}`, {
    method: 'GET'
  });
  const context = await handler.query(request);

  // Handle redirects
  if (context instanceof Response) {
    return {
      html: '',
      head: '',
      status: context.status,
      redirect: context.headers.get('Location') ?? undefined
    };
  }
  const router = createStaticRouter(handler.dataRoutes, context);
  const html = renderToString(<HelmetProvider context={helmetContext}>
      <StaticRouterProvider router={router} context={context} />
    </HelmetProvider>);
  type HelmetData = {
    title?: {
      toString(): string;
    };
    meta?: {
      toString(): string;
    };
    link?: {
      toString(): string;
    };
    script?: {
      toString(): string;
    };
  };
  const helmet = (helmetContext as {
    helmet?: HelmetData;
  }).helmet;
  const head = helmet ? [helmet.title?.toString() ?? '', helmet.meta?.toString() ?? '', helmet.link?.toString() ?? '', helmet.script?.toString() ?? ''].join('') : '';
  return {
    html,
    head,
    status: context.statusCode ?? 200
  };
}
