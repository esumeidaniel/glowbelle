import { ChevronLeft, ChevronRight, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { HERO_SLIDES } from '../catalog.js';

export default function HeroSlider({ setPage, slides = HERO_SLIDES }) {
  const [active, setActive] = useState(0);
  const slide = slides[active] || slides[0];

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const id = window.setInterval(() => setActive(current => (current + 1) % slides.length), 4500);
    return () => window.clearInterval(id);
  }, [slides.length]);

  function move(direction) {
    setActive(current => (current + direction + slides.length) % slides.length);
  }

  if (!slide) return null;

  return (
    <section className="hero-slider" aria-label="GlowBelle marketplace hero">
      {slides.map((item, index) => (
        <img
          key={item.id}
          className={index === active ? 'hero-slide-image active' : 'hero-slide-image'}
          src={item.image}
          alt=""
          aria-hidden={index !== active}
        />
      ))}
      <div className="hero-slide-overlay" />
      <div className="hero-slide-content">
        <span className="hero-announcement"><Sparkles size={15} /> Verified salon marketplace</span>
        <h1>{slide.title}</h1>
        <p>{slide.subtitle}</p>
        <div className="hero-slide-actions">
          <button onClick={() => setPage('services')}>{slide.ctaText || 'Book a Service'}</button>
          <button className="secondary" onClick={() => setPage('stylist-apply')}>{slide.secondaryText || 'Join as a Stylist'}</button>
        </div>
        <div className="hero-market-search">
          <button onClick={() => setPage('services')}><Search size={16} /><span>Search services</span></button>
          <button onClick={() => setPage('stylists')}><ShieldCheck size={16} /><span>Verified stylists</span></button>
          <button onClick={() => setPage('booking')}><ChevronRight size={16} /><span>Book now</span></button>
        </div>
      </div>
      <button className="hero-arrow prev" onClick={() => move(-1)} aria-label="Previous hero slide"><ChevronLeft size={22} /></button>
      <button className="hero-arrow next" onClick={() => move(1)} aria-label="Next hero slide"><ChevronRight size={22} /></button>
      <div className="hero-dots" aria-label="Hero slide controls">
        {slides.map((item, index) => (
          <button
            key={item.id}
            className={index === active ? 'active' : ''}
            onClick={() => setActive(index)}
            aria-label={`Show slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
