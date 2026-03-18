import { apiBaseUrl } from '../services/api';

const readinessCards = [
  {
    title: 'Backend modular',
    body: 'Health, auth, users e os boundaries de dominio ja existem no monolito modular.',
  },
  {
    title: 'Contratos transversais',
    body: 'Validacao estrita, rate limit global e shape unico de erro foram fixados na API.',
  },
  {
    title: 'Shell autenticado',
    body: 'O frontend deixou a landing para tras e agora navega por areas protegidas e publicas.',
  },
];

const unlockedSprints = [
  'Sprint 02 pode entrar em seguranca sem rediscutir bootstrap.',
  'Sprint 03 herda queries e filtros base para produtos e entregadores.',
  'Sprint 04 pode focar no lifecycle de pedidos com o shell e os guards ja prontos.',
];

export function DashboardPage() {
  return (
    <section className="page page--dashboard">
      <header className="dashboard-hero">
        <div>
          <p className="page-header__eyebrow">Operations Board</p>
          <h1>Fundacao do FastMeals pronta para receber negocio de verdade.</h1>
          <p className="page-header__summary">
            O dashboard desta sprint funciona como uma mesa de controle do bootstrap: ambiente,
            contratos, navegacao e autenticacao ja organizados para a proxima leva de features.
          </p>
        </div>

        <div className="dashboard-hero__terminal">
          <span>endpoint alvo</span>
          <code>{apiBaseUrl}</code>
        </div>
      </header>

      <div className="dashboard-grid">
        {readinessCards.map((card) => (
          <article key={card.title} className="sheet">
            <p className="sheet__eyebrow">Sprint checkpoint</p>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
          </article>
        ))}
      </div>

      <div className="dashboard-grid dashboard-grid--secondary">
        <article className="sheet sheet--wide">
          <p className="sheet__eyebrow">Destravado para as proximas sprints</p>
          <ul className="sheet__list">
            {unlockedSprints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="callout">
          <p className="callout__eyebrow">Leitura rapida</p>
          <strong>
            A base ja sobe como app administrativo e nao mais como landing de demonstração.
          </strong>
        </article>
      </div>
    </section>
  );
}
