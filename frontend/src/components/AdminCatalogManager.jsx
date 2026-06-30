import { Archive, ImagePlus, Plus, Scissors } from 'lucide-react';
import { MASTER_CATEGORIES } from '../catalog.js';
import { SERVICE_CATEGORIES, SERVICE_SUGGESTIONS, serviceCategoryLabel } from '../serviceCategories.js';
import { money } from '../utils.js';

export default function AdminCatalogManager({
  services,
  serviceForm,
  setServiceForm,
  serviceBusy,
  saveService,
  editService,
  removeService,
  applySuggestedService,
  resetService,
}) {
  const liveServices = services.length ? services : [];
  const categories = MASTER_CATEGORIES;

  return (
    <div className="catalog-manager">
      <section className="catalog-overview">
        <div>
          <span className="dashboard-kicker">Master service catalog</span>
          <h3>Admin controls the services stylists can offer.</h3>
          <p>Categories and service templates stay global. Stylists select from this catalog, add their own price, images and availability, then customers only see active approved offerings.</p>
        </div>
        <div className="catalog-summary-grid">
          <div><strong>{categories.length}</strong><span>Categories</span></div>
          <div><strong>{liveServices.length}</strong><span>Service templates</span></div>
          <div><strong>{liveServices.filter(item => item.isFeatured).length}</strong><span>Featured</span></div>
        </div>
      </section>

      <section className="catalog-category-panel">
        <h3>Global categories</h3>
        <div className="catalog-category-grid">
          {categories.map(category => (
            <article className="catalog-category-card" key={category.id}>
              <img src={category.imageUrl} alt="" />
              <div>
                <strong>{category.title}</strong>
                <small>{category.serviceCount} services · Published</small>
              </div>
              <button type="button"><ImagePlus size={14} /> Image</button>
            </article>
          ))}
        </div>
      </section>

      <div className="dash-grid">
        <section>
          <h3>{serviceForm._id ? 'Edit service template' : 'Add service template'}</h3>
          <div className="note-box prep" style={{ marginBottom: 12 }}>Create the admin-approved service or skill that stylists can select. Customers only see it once at least one stylist activates and is approved for it.</div>
          <div className="suggestion-panel">
            <strong>Quick catalog templates</strong>
            <p>Tap one to prefill the form, then adjust images, range, duration or status.</p>
            <div className="suggestion-chips">
              {SERVICE_SUGGESTIONS.map(suggestion => <button type="button" key={suggestion.title} onClick={() => applySuggestedService(suggestion)}>{suggestion.title}</button>)}
            </div>
          </div>
          <form onSubmit={saveService} className="catalog-form">
            <div className="two-col">
              <input required placeholder="Service name, e.g. Knotless Braids" value={serviceForm.title} onChange={e => setServiceForm(current => ({ ...current, title: e.target.value }))} />
              <input placeholder="Icon" value={serviceForm.emoji} onChange={e => setServiceForm(current => ({ ...current, emoji: e.target.value }))} />
            </div>
            <div className="two-col">
              <select value={serviceForm.category} onChange={e => setServiceForm(current => ({ ...current, category: e.target.value }))}>
                {SERVICE_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <input required type="number" min="0" placeholder="Default/starting price in Naira" value={serviceForm.price} onChange={e => setServiceForm(current => ({ ...current, price: e.target.value }))} />
            </div>
            <div className="two-col">
              <input type="number" min="0" placeholder="Minimum stylist price" value={serviceForm.minPrice} onChange={e => setServiceForm(current => ({ ...current, minPrice: e.target.value }))} />
              <input type="number" min="0" placeholder="Maximum stylist price" value={serviceForm.maxPrice} onChange={e => setServiceForm(current => ({ ...current, maxPrice: e.target.value }))} />
            </div>
            <div className="two-col">
              <input required type="number" min="5" placeholder="Estimated duration in minutes" value={serviceForm.durationMinutes} onChange={e => setServiceForm(current => ({ ...current, durationMinutes: e.target.value }))} />
              <input placeholder="Service image URL" value={serviceForm.imageUrl} onChange={e => setServiceForm(current => ({ ...current, imageUrl: e.target.value }))} />
            </div>
            <textarea placeholder="Customer-facing service description" value={serviceForm.shortDescription} onChange={e => setServiceForm(current => ({ ...current, shortDescription: e.target.value }))} />
            <div className="catalog-switches">
              <label><input type="checkbox" checked={serviceForm.isFeatured} onChange={e => setServiceForm(current => ({ ...current, isFeatured: e.target.checked }))} /> Featured on homepage</label>
              <label><input type="checkbox" checked={serviceForm.isActive} onChange={e => setServiceForm(current => ({ ...current, isActive: e.target.checked }))} /> Published for stylists</label>
            </div>
            <div className="catalog-actions">
              <button disabled={serviceBusy}><Plus size={15} /> {serviceBusy ? 'Saving...' : serviceForm._id ? 'Save service' : 'Publish service'}</button>
              {serviceForm._id && <button type="button" className="secondary" onClick={resetService}>Cancel edit</button>}
            </div>
          </form>
        </section>

        <section>
          <h3>Service templates</h3>
          {liveServices.length === 0 && <div className="empty-state"><Scissors /><h3>No catalog services yet</h3><p>Use the templates to publish your first admin-approved services.</p></div>}
          {liveServices.map(service => (
            <div className="catalog-service-row" key={service._id || service.id || service.code}>
              <img src={service.imageUrl || service.displayImageUrl} alt="" />
              <div>
                <strong>{service.emoji} {service.title || service.name}</strong>
                <p>{serviceCategoryLabel(service.category || service.categoryId)} · {money(service.minPrice ?? service.price)} - {money(service.maxPrice ?? service.price)} · {service.durationMinutes || service.durationMin || 60} min</p>
                <small>{service.providerCount || service.stylistCount || 0} stylists offering · {service.isActive === false ? 'Unpublished' : 'Published'} {service.isFeatured ? '· Featured' : ''}</small>
              </div>
              <div>
                <button onClick={() => editService(service)}>Edit</button>
                <button className="secondary" onClick={() => removeService(service)}><Archive size={14} /> Archive</button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
