import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Menu, X, LogIn as LogInIcon, Info, Mail, Code,
  Handshake, Radar, Rocket,
  Sparkles, ShieldCheck, GaugeCircle, Phone, MapPin
} from "lucide-react";
import "../styles/home.css";

const cx = (...l) => l.filter(Boolean).join(" ");

function Button({
  as: Comp = "button",
  variant = "primary",        // primary | outline | ghost
  size = "lg",                // sm | md | lg
  className,
  children,
  ...props
}) {
  return (
    <Comp
      className={cx("ifx-btn", `ifx-btn--${variant}`, `ifx-btn--${size}`, className)}
      {...props}
    >
      <span className="ifx-btn__label">{children}</span>
      {variant === "primary" && <div className="ifx-btn__shimmer" />}
    </Comp>
  );
}

function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="ifx-navbar">
      <div className="ifx-bar">
        <nav className="ifx-navbar__row" aria-label="Primary">
          {/* Logo */}
          <Link to="/" className="ifx-navbar__brand" aria-label="IdeaForge home">
            <img src="/logo-black.png" alt="IdeaForge" className="ifx-logo-img" />
          </Link>

          {/* Right cluster */}
          <div className="ifx-navbar__right">
            <button
              className="ifx-nav__toggle"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen(v => !v)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>

            <ul className={cx("ifx-nav", open && "is-open")} role="list">
              <li className="ifx-nav__item">
                <Info size={18} aria-hidden />
                <NavLink to="/about" className="ifx-nav__link">About Us</NavLink>
              </li>
              <li className="ifx-nav__item">
                <Mail size={18} aria-hidden />
                <NavLink to="/contact" className="ifx-nav__link">Contact</NavLink>
              </li>
              {/* Mobile login */}
              <li className="ifx-nav__login--mobile">
                <Link to="/login" className="ifx-nav__link ifx-nav__link--login">
                  <LogInIcon size={20} aria-hidden /> Log In
                </Link>
              </li>
            </ul>

            {/* Desktop login */}
            <div className="ifx-navbar__actions ifx-login--desktop">
              <Link to="/login" className="ifx-nav__link ifx-nav__link--login">
                <LogInIcon size={20} aria-hidden /> Log In
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

function FeatureCard({ icon: Icon, title, children }) {
  return (
    <article className="ifx-card" role="listitem">
      <div className="ifx-card__icon" aria-hidden>
        <Icon size={42} strokeWidth={1.5} />
      </div>
      <h3 className="ifx-card__title">{title}</h3>
      <p className="ifx-card__desc">{children}</p>
      {/* arrow removed per request */}
    </article>
  );
}

function Stat({ icon: Icon, label }) {
  return (
    <div className="ifx-stat">
      <Icon size={18} aria-hidden />
      <span>{label}</span>
    </div>
  );
}

function Step({ title, children, align = "left", image, alt = "" }) {
  return (
    <div className={cx("ifx-step", align === "center" && "is-center", align === "right" && "is-right")}>
      <div className="ifx-step__box">
        <figure className="ifx-step__media">
          {image ? (
            <img src={image} alt={alt} loading="lazy" width="720" height="450" />
          ) : (
            <div aria-hidden />
          )}
        </figure>
        <div className="ifx-step__content">
          <h3 className="ifx-step__title">{title}</h3>
          <p className="ifx-step__desc">{children}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="ifx-app">
      <Header />

      <main>
        {/* HERO - Dark Veil */}
        <section className="ifx-hero ifx-hero--dark-veil" aria-labelledby="hero-title">
          <div className="ifx-hero__background">
            <div className="ifx-hero__veil" aria-hidden />
            <div className="ifx-hero__particles" aria-hidden />
          </div>
          <div className="ifx-container">
            <div className="ifx-hero__wrap">
              <h1 id="hero-title" className="ifx-hero__title">
                Build & Launch With <br />
                <span className="ifx-hero__brand">IdeaForge</span>
              </h1>
              <p className="ifx-hero__subtitle">
                Turn ideas into reality—from funding to analytics—beautifully orchestrated.
              </p>

              <div className="ifx-hero__ctas">
                <Button as={Link} to="/signup" variant="primary" size="lg">Get Started</Button>
                <Button as="a" href="#features" variant="outline" size="lg">Explore Features</Button>
              </div>

              <div className="ifx-hero__stats" aria-label="Highlights">
                <Stat icon={Sparkles} label="Smart AI Guidance" />
                <Stat icon={ShieldCheck} label="Private & Secure" />
                <Stat icon={GaugeCircle} label="Realtime Insights" />
              </div>
            </div>
          </div>
        </section>

        {/* INTRO */}
        <section id="about" className="ifx-section">
          <div className="ifx-container ifx-split">
            <div className="ifx-split__left">
              <div className="ifx-eyebrow"><Code size={34} strokeWidth={1.5} /></div>
              <h2 className="ifx-section__title">Your AI Co-founder for Market Readiness</h2>
              <p className="ifx-section__body">
                IdeaForge connects you to sponsors, maps competitors, and surfaces resources so
                you can launch decisively. A unified dashboard tracks traction and converts
                signals into action.
              </p>
              <div className="ifx-actions">
                <Button as={Link} to="/signup" variant="primary" size="md">Create Free Account</Button>
                <Button as="a" href="#contact" variant="ghost" size="md">Talk to us</Button>
              </div>
            </div>
            <div className="ifx-split__right">
              <div className="ifx-visual">
                <img 
                  src="/main2.png" 
                  alt="IdeaForge Platform Dashboard" 
                  className="ifx-visual__image"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="ifx-section ifx-section--alt">
          <div className="ifx-container">
            <header className="ifx-section__header">
              <h2 className="ifx-section__title">Everything you need to ship</h2>
              <p className="ifx-section__subtitle">Best-practice tooling wrapped in a clean workflow.</p>
            </header>
            <div className="ifx-grid" role="list">
              <FeatureCard icon={Handshake} title="Sponsor Matching">
                Instantly find aligned sponsors and streamline outreach with warm intros.
              </FeatureCard>
              <FeatureCard icon={Radar} title="Competition Radar">
                Track competitors, spot whitespace, and plan moves with confidence.
              </FeatureCard>
              <FeatureCard icon={Rocket} title="Launch Resources">
                Curated vendors, SaaS, and services to build faster with less risk.
              </FeatureCard>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="ifx-section">
          <div className="ifx-container">
            <header className="ifx-section__header">
              <h2 className="ifx-section__title">From idea to traction—step by step</h2>
              <p className="ifx-section__subtitle">A clear, guided path—no chaos, just momentum.</p>
            </header>
            <div className="ifx-grid ifx-grid--steps">
              <Step title="1) Describe your idea" image="/Typing.jpg" alt="Typing your idea">
                Our AI frames the opportunity and validates assumptions.
              </Step>
              <Step align="center" title="2) Discover resources & sponsors" image="/Process.jpg" alt="Discovery process">
                Matches surface instantly—reach out in one click.
              </Step>
              <Step align="right" title="3) Track progress & iterate" image="/Results.jpg" alt="Results dashboard">
                Dashboards highlight wins, gaps, and next moves.
              </Step>
            </div>
            <div className="ifx-cta--right">
              <Button as={Link} to="/signup" variant="primary" size="md">Start Building</Button>
            </div>
          </div>
        </section>

        {/* TESTIMONIAL - Blue fade */}
        <section className="ifx-section ifx-testimonials ifx-testimonials--bluefade" aria-labelledby="testimonials-title">
          <div className="ifx-container">
            <h2 id="testimonials-title" className="ifx-section__title">Loved by founders</h2>
            <blockquote className="ifx-quote">
              "IdeaForge turned our sketch into a funded roadmap in weeks. The sponsor matches
              were eerily accurate—and the dashboard became our team's daily compass."
            </blockquote>
            <figure className="ifx-profile">
              <img 
                src="/profile-avatar.png" 
                alt="Jane Doe" 
                className="ifx-profile__avatar"
                width="80"
                height="80"
                loading="lazy"
              />
              <figcaption className="ifx-profile__meta">
                <p className="ifx-profile__name">Jane Doe</p>
                <p className="ifx-profile__role">Founder, Sparrow Labs</p>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="ifx-section">
          <div className="ifx-container ifx-contact">
            <div>
              <p className="ifx-eyebrow">Connect</p>
              <h2 className="ifx-section__title">Get in touch</h2>
              <p className="ifx-section__subtitle">We'll help you choose the fastest path to launch.</p>
              <ul className="ifx-contact__list" role="list">
                <li className="ifx-contact__row">
                  <Mail className="ifx-contact__icon" strokeWidth={1.5} aria-hidden />
                  <div>
                    <h3 className="ifx-contact__label">Email</h3>
                    <p className="ifx-contact__value">
                      <a href="mailto:ideaforgesrilanka@gmai.com" className="ifx-link">ideaforgesrilanka@gmai.com</a>
                    </p>
                  </div>
                </li>
                <li className="ifx-contact__row">
                  <Phone className="ifx-contact__icon" strokeWidth={1.5} aria-hidden />
                  <div>
                    <h3 className="ifx-contact__label">Phone</h3>
                    <p className="ifx-contact__value">
                      <a href="tel:+94123456789" className="ifx-link">+94 123 456 789</a>
                    </p>
                  </div>
                </li>
                <li className="ifx-contact__row">
                  <MapPin className="ifx-contact__icon" aria-hidden />
                  <div>
                    <h3 className="ifx-contact__label">Office</h3>
                    <p className="ifx-contact__value">
                      123, Sample St. Colombo 10 — <a href="#" className="ifx-link">Get Directions →</a>
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="ifx-form ifx-mapcard">
              <iframe
                title="IdeaForge Office Map"
                className="ifx-map-embed"
                src="https://www.openstreetmap.org/export/embed.html?bbox=79.8542%2C6.9251%2C79.8682%2C6.9351&layer=mapnik&marker=6.9301%2C79.8612"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="ifx-map-footer">
                <a
                  className="ifx-link"
                  href="https://www.openstreetmap.org/?mlat=6.9301&mlon=79.8612#map=18/6.9301/79.8612"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in OpenStreetMap →
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="ifx-footer">
        <div className="ifx-container">
          <nav aria-label="Footer">
            <ul className="ifx-footer__links" role="list">
              <li><a href="#features" className="ifx-nav__link">Features</a></li>
              <li><a href="#contact" className="ifx-nav__link">Contact</a></li>
              <li><a href="/about" className="ifx-nav__link">About</a></li>
              <li><Link to="/signup" className="ifx-nav__link">Get Started</Link></li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
