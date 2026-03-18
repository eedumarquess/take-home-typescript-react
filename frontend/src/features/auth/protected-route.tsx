import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './auth-context';

export function ProtectedRoute() {
  const location = useLocation();
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="auth-route-shell">
        <p className="auth-route-shell__eyebrow">FastMeals Session</p>
        <h1>Restaurando a sessao operacional.</h1>
        <p>Validando o refresh token antes de abrir o painel administrativo.</p>
      </div>
    );
  }

  if (status === 'anonymous') {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
}
