import { apiBaseUrl } from '../services/api';

const readinessCards = [
  {
    title: 'Catalogo sob controle',
    body: 'Produtos entram com validacao estrita, filtros operacionais e bloqueios coerentes para itens ligados a pedidos ativos.',
  },
  {
    title: 'Fila de pedidos viva',
    body: 'A operacao acompanha transicoes de status, atribuicao manual e optimize-assignment sem sair do mesmo fluxo.',
  },
  {
    title: 'Leitura analitica',
    body: 'Receita, distribuicao de status e tempo medio de entrega saem direto do backend com recorte por periodo.',
  },
];

const operationalTracks = [
  'Monitore gargalos entre pending, preparing, ready e delivering sem trocar de contexto.',
  'Revise disponibilidade de produtos e impacto imediato em novos pedidos antes de publicar mudancas.',
  'Aplique optimize-assignment com entregadores ativos e acompanhe o reflexo nos relatorios.',
];

export function DashboardPage() {
  return (
    <section className="page page--dashboard">
      <header className="dashboard-hero">
        <div>
          <p className="page-header__eyebrow">Operations Board</p>
          <h1>Central de operacoes pronta para catalogo, fila e distribuicao.</h1>
          <p className="page-header__summary">
            O dashboard resume a superficie administrativa real do FastMeals: ambiente conectado,
            modulos operacionais e a base analitica que sustenta decisao diaria.
          </p>
        </div>

        <div className="dashboard-hero__terminal">
          <span>API alvo</span>
          <code>{apiBaseUrl}</code>
        </div>
      </header>

      <div className="dashboard-grid">
        {readinessCards.map((card) => (
          <article key={card.title} className="sheet">
            <p className="sheet__eyebrow">Panorama</p>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
          </article>
        ))}
      </div>

      <div className="dashboard-grid dashboard-grid--secondary">
        <article className="sheet sheet--wide">
          <p className="sheet__eyebrow">Checklist operacional</p>
          <ul className="sheet__list">
            {operationalTracks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="callout">
          <p className="callout__eyebrow">Leitura rapida</p>
          <strong>
            O pacote entregue cobre login, CRUDs, analytics e optimize-assignment sem copy de sprint
            interna.
          </strong>
        </article>
      </div>
    </section>
  );
}
