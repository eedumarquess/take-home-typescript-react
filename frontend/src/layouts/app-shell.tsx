import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard', note: 'visao geral' },
  { to: '/products', label: 'Produtos', note: 'catalogo' },
  { to: '/orders', label: 'Pedidos', note: 'operacao' },
  { adminOnly: true, to: '/delivery-persons', label: 'Entregadores', note: 'frota' },
  { to: '/reports', label: 'Relatorios', note: 'analytics' },
];

export function AppShell() {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const formattedToday = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
  }).format(new Date());
  const visibleNavigationItems = navigationItems.filter(
    (item) => !item.adminOnly || user?.role === 'admin',
  );

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="app-frame">
      <aside className="app-sidebar">
        <div className="app-brand">
          <p className="app-brand__eyebrow">FastMeals Admin</p>
          <h1>Operacao, catalogo e distribuicao no mesmo cockpit.</h1>
          <p className="app-brand__body">
            Produtos, pedidos, entregadores e relatorios compartilham o mesmo shell autenticado com
            RBAC e recuperacao de sessao por refresh cookie.
          </p>
        </div>

        <nav className="app-nav" aria-label="Navegacao principal">
          {visibleNavigationItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                isActive ? 'app-nav__link app-nav__link--active' : 'app-nav__link'
              }
              to={item.to}
            >
              <span>{item.label}</span>
              <small>{item.note}</small>
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar__footer">
          <p className="app-sidebar__eyebrow">Sessao</p>
          <strong>{user?.email}</strong>
          <span>{user?.role === 'admin' ? 'Administrador' : 'Visualizador'}</span>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div>
            <p className="app-topbar__eyebrow">Operacao FastMeals</p>
            <strong>{formattedToday}</strong>
          </div>

          <button
            className="button button--ghost"
            disabled={isSigningOut}
            onClick={() => {
              void handleSignOut();
            }}
            type="button"
          >
            {isSigningOut ? 'Encerrando...' : 'Sair'}
          </button>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
