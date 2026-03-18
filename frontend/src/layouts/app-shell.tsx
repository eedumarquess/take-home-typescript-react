import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard', note: 'baseline' },
  { to: '/products', label: 'Produtos', note: 'catalogo' },
  { to: '/orders', label: 'Pedidos', note: 'lifecycle' },
  { to: '/delivery-persons', label: 'Entregadores', note: 'fleet' },
  { to: '/reports', label: 'Relatorios', note: 'analytics' },
];

const formattedToday = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'full',
}).format(new Date());

export function AppShell() {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

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
          <h1>Kitchen pass para operacao, catalogo e entrega.</h1>
          <p className="app-brand__body">
            O shell do sprint 01 organiza os modulos e fixa o comportamento de acesso antes do CRUD
            real entrar em cena.
          </p>
        </div>

        <nav className="app-nav" aria-label="Navegacao principal">
          {navigationItems.map((item) => (
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
            <p className="app-topbar__eyebrow">Sprint 01</p>
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
