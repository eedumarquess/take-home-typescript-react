import { Outlet } from 'react-router-dom';
import { apiBaseUrl } from '../services/api';

const promisePoints = [
  'JWT com access token curto e refresh via cookie httpOnly.',
  'Base de validacao, rate limit e tratamento de erro unificados no backend.',
  'Shell navegavel para dashboard, produtos, pedidos, entregadores e relatorios.',
];

export function PublicShell() {
  return (
    <div className="login-shell">
      <section className="login-hero">
        <p className="login-hero__eyebrow">FastMeals Ops Console</p>
        <h1>Painel administrativo para operar catalogo, fila e distribuicao.</h1>
        <p className="login-hero__body">
          O acesso centraliza o fluxo real do desafio: login com refresh seguro, modulos protegidos
          por perfil e uma superficie pronta para administrar produtos, pedidos e relatorios.
        </p>

        <ul className="login-hero__list">
          {promisePoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>

        <div className="login-hero__endpoint">
          <span>API base</span>
          <code>{apiBaseUrl}</code>
        </div>
      </section>

      <section className="login-panel">
        <Outlet />
      </section>
    </div>
  );
}
