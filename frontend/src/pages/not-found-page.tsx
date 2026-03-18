import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="not-found">
      <p className="page-header__eyebrow">404</p>
      <h1>Essa rota nao faz parte da operacao.</h1>
      <p className="page-header__summary">
        O shell do FastMeals ja conhece as areas principais. Se voce caiu aqui, a navegacao precisa
        voltar para o fluxo oficial.
      </p>
      <Link className="button" to="/dashboard">
        Voltar ao painel
      </Link>
    </section>
  );
}
