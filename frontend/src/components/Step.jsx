export default function Step({ n, title, children }) {
  return (
    <section className="step">
      <h3><span>{n}</span>{title}</h3>
      {children}
    </section>
  );
}
