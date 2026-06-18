export default function PageHero({ title, text, icon }) {
  return (
    <section className="page-hero">
      <div>
        {icon}
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </section>
  );
}
