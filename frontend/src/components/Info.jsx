export default function Info({ icon, title, text }) {
  return (
    <div className="info">
      {icon}
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
