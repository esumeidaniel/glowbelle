export default function DashboardStatsCard({ label, value, icon: Icon, helper }) {
  return (
    <div className="dash-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <p>{label}</p>
        {Icon && <Icon size={18} style={{ color: 'var(--brand)' }} />}
      </div>
      <h2>{value}</h2>
      {helper && <span>{helper}</span>}
    </div>
  );
}
