import { AlertCircle, ImagePlus, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import { assetUrl } from '../api.js';
import { fallbackCategories } from '../catalog.js';
import { serviceCategoryLabel } from '../serviceCategories.js';
import { money } from '../utils.js';

export default function StylistServiceSelector({ services, offerings, setOffering, updateOffering, saveOfferings, uploadServiceImage }) {
  const [errors, setErrors] = useState({});
  const categories = fallbackCategories();
  const grouped = useMemo(() => {
    return categories.map(category => ({
      ...category,
      services: services.filter(service => (service.category || service.categoryId) === category.id && service.isActive !== false),
    })).filter(category => category.services.length);
  }, [categories, services]);

  function validatePrice(service, value) {
    const price = Number(value);
    const min = Number(service.minPrice ?? service.price ?? 0);
    const max = Number(service.maxPrice ?? service.price ?? Infinity);
    const valid = price >= min && price <= max;
    setErrors(current => ({
      ...current,
      [service._id || service.id || service.code]: valid ? '' : `Price must be between ${money(min)} and ${money(max)}.`,
    }));
    return valid;
  }

  function save() {
    const nextErrors = {};
    services.forEach(service => {
      const id = service._id || service.id || service.code;
      const offering = offerings.find(item => item.serviceId === id);
      if (offering && !validatePrice(service, offering.price)) nextErrors[id] = `Price must be between ${money(service.minPrice ?? service.price)} and ${money(service.maxPrice ?? service.price)}.`;
    });
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    saveOfferings();
  }

  return (
    <section className="stylist-service-selector">
      <div className="note-box prep">
        Select from admin-published services only. Add your own price, duration, image, description and availability. Customers see only active approved services.
      </div>
      {grouped.map(category => (
        <div className="stylist-service-group" key={category.id}>
          <div className="stylist-service-group-head">
            <div>
              <h3>{category.title}</h3>
              <p>{category.description}</p>
            </div>
            <span>{category.services.length} skills</span>
          </div>
          {category.services.map(service => {
            const id = service._id || service.id || service.code;
            const offering = offerings.find(item => item.serviceId === id);
            return (
              <div className="stylist-catalog-service" key={id}>
                <label className="offering-toggle">
                  <input type="checkbox" checked={Boolean(offering)} onChange={event => setOffering(service, event.target.checked)} />
                  <span>
                    <strong>{service.title || service.name}</strong>
                    <small>{serviceCategoryLabel(service.category || service.categoryId)} · allowed {money(service.minPrice ?? service.price)} - {money(service.maxPrice ?? service.price)}</small>
                  </span>
                </label>
                {offering && (
                  <div className="offering-fields">
                    <label className="offering-field">
                      <span>Your price</span>
                      <input
                        type="number"
                        min={service.minPrice ?? 0}
                        max={service.maxPrice ?? undefined}
                        value={offering.price}
                        onChange={event => {
                          updateOffering(id, 'price', event.target.value);
                          validatePrice(service, event.target.value);
                        }}
                        placeholder="Price in Naira"
                      />
                    </label>
                    <label className="offering-field">
                      <span>Your duration</span>
                      <input type="number" min="5" value={offering.durationMinutes} onChange={event => updateOffering(id, 'durationMinutes', event.target.value)} placeholder="Minutes" />
                    </label>
                    <label className="mini-upload">
                      <ImagePlus size={14} /> Service photo
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => uploadServiceImage(id, event.target.files?.[0])} />
                    </label>
                    {offering.imageUrl && <img className="offering-image-preview" src={assetUrl(offering.imageUrl)} alt={`${service.title} preview`} />}
                    <label className="notification-row compact">
                      <input type="checkbox" checked={offering.isActive !== false} onChange={event => updateOffering(id, 'isActive', event.target.checked)} />
                      <span><strong>Active</strong><small>Show this service publicly after approval.</small></span>
                    </label>
                    <label className="offering-field full">
                      <span>Customer description</span>
                      <textarea value={offering.description || ''} onChange={event => updateOffering(id, 'description', event.target.value)} placeholder="Describe what customers get, preparation, hair length or package details." />
                    </label>
                    {errors[id] && <div className="promo-error full"><AlertCircle size={15} /> {errors[id]}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      <button onClick={save}><Save size={16} /> Save services and prices</button>
    </section>
  );
}
