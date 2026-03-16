type StackCardProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function StackCard({ eyebrow, title, description }: StackCardProps) {
  return (
    <article className="stack-card">
      <span className="stack-card__eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </article>
  );
}
