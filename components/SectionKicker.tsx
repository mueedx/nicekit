export function SectionKicker({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <h2 className="kicker">
      <span className="text-accent">{number}</span>
      <span className="mx-2 text-border">/</span>
      {title}
    </h2>
  );
}
