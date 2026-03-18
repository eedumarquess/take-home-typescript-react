import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth-context';

export function PublicRoute() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="auth-route-shell">
        <p className="auth-route-shell__eyebrow">FastMeals Session</p>
        <h1>Checando o acesso persistido.</h1>
        <p>Se houver refresh token valido, o app retorna direto para a area protegida.</p>
      </div>
    );
  }

  if (status === 'authenticated') {
    return <Navigate replace to="/dashboard" />;
  }

  return <Outlet />;
}
