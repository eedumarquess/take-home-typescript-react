type ModulePlaceholderProps = {
  eyebrow: string;
  title: string;
  summary: string;
  checklist: string[];
  callout: string;
  contract: string[];
};

export function ModulePlaceholder({
  eyebrow,
  title,
  summary,
  checklist,
  callout,
  contract,
}: ModulePlaceholderProps) {
  return (
    <section className="page">
      <header className="page-header">
        <p className="page-header__eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-header__summary">{summary}</p>
      </header>

      <div className="page-grid">
        <article className="sheet">
          <p className="sheet__eyebrow">Entrega desta base</p>
          <ul className="sheet__list">
            {checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="sheet sheet--accent">
          <p className="sheet__eyebrow">Contrato ja preparado</p>
          <ul className="sheet__list">
            {contract.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <article className="callout">
        <p className="callout__eyebrow">Proximo passo</p>
        <strong>{callout}</strong>
      </article>
    </section>
  );
}
