import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  createMemoryRouter,
  Navigate,
  Outlet,
  type RouteObject,
} from 'react-router-dom';
import { ProtectedRoute } from '../features/auth/protected-route';
import { PublicRoute } from '../features/auth/public-route';
import { AppShell } from '../layouts/app-shell';
import { PublicShell } from '../layouts/public-shell';

const DashboardPage = lazy(async () => {
  const module = await import('../pages/dashboard-page');
  return { default: module.DashboardPage };
});

const DeliveryPersonsPage = lazy(async () => {
  const module = await import('../pages/delivery-persons-page');
  return { default: module.DeliveryPersonsPage };
});

const LoginPage = lazy(async () => {
  const module = await import('../pages/login-page');
  return { default: module.LoginPage };
});

const NotFoundPage = lazy(async () => {
  const module = await import('../pages/not-found-page');
  return { default: module.NotFoundPage };
});

const OrdersPage = lazy(async () => {
  const module = await import('../pages/orders-page');
  return { default: module.OrdersPage };
});

const ProductsPage = lazy(async () => {
  const module = await import('../pages/products-page');
  return { default: module.ProductsPage };
});

const ReportsPage = lazy(async () => {
  const module = await import('../pages/reports-page');
  return { default: module.ReportsPage };
});

function withRouteFallback(element: React.ReactNode) {
  return <Suspense fallback={<div className="page">Carregando...</div>}>{element}</Suspense>;
}

export const appRoutes: RouteObject[] = [
  {
    element: <PublicRoute />,
    children: [
      {
        element: <PublicShell />,
        children: [
          {
            path: '/login',
            element: withRouteFallback(<LoginPage />),
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <Navigate replace to="/dashboard" />,
          },
          {
            path: '/dashboard',
            element: withRouteFallback(<DashboardPage />),
          },
          {
            path: '/products',
            element: withRouteFallback(<ProductsPage />),
          },
          {
            path: '/orders',
            element: withRouteFallback(<OrdersPage />),
          },
          {
            path: '/delivery-persons',
            element: withRouteFallback(<DeliveryPersonsPage />),
          },
          {
            path: '/reports',
            element: withRouteFallback(<ReportsPage />),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: withRouteFallback(<NotFoundPage />),
  },
];

export const appRouter = createBrowserRouter(appRoutes);

export function createAppMemoryRouter(initialEntries: string[] = ['/']) {
  return createMemoryRouter(appRoutes, {
    initialEntries,
  });
}

export function AppRouteOutlet() {
  return <Outlet />;
}
