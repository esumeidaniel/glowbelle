import MarketplaceServiceCard from './MarketplaceServiceCard.jsx';

export default function ServiceGrid({ items, setPage }) {
  return (
    <div className="market-service-grid">
      {items.map(item => (
        <MarketplaceServiceCard key={item.code || item.id || item._id || item.title} service={item} setPage={setPage} />
      ))}
    </div>
  );
}
