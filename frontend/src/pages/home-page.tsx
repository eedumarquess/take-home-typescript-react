import { StackCard } from '../components/stack-card';
import { apiBaseUrl } from '../services/api';

const stackItems = [
  {
    eyebrow: 'Frontend',
    title: 'React + Vite',
    description:
      'Base pronta com TypeScript, plugin React, porta 3000 e leitura das variaveis do arquivo .env da raiz.',
  },
  {
    eyebrow: 'Backend',
    title: 'NestJS + Prisma',
    description:
      'API preparada para rodar em /api, com ConfigModule global, CORS para o frontend e schema Prisma voltado ao desafio.',
  },
  {
    eyebrow: 'Banco',
    title: 'PostgreSQL',
    description:
      'Datasource apontando para PostgreSQL, scripts de generate, db push e seed no backend para acelerar o bootstrap.',
  },
];

export function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="hero__copy">
          <span className="hero__tag">FastMeals Admin</span>
          <h1>Monorepo inicial configurado para React, NestJS e Prisma.</h1>
          <p>
            O projeto ja sobe com as portas esperadas pelo desafio e usa uma base unica de variaveis
            para conectar frontend e backend durante o desenvolvimento.
          </p>
        </div>

        <div className="hero__panel">
          <span className="hero__label">API alvo</span>
          <code>{apiBaseUrl}</code>
        </div>
      </section>

      <section className="stack-grid" aria-label="Resumo da stack configurada">
        {stackItems.map((item) => (
          <StackCard key={item.title} {...item} />
        ))}
      </section>
    </main>
  );
}
