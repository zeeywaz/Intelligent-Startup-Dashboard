import React from "react";
import "../styles/home.css";
import { Code, BarChart, Package, Mail, Phone, MapPin } from "lucide-react";

/** Join class names safely */
function classNames(...list) {
  return list.filter(Boolean).join(" ");
}

/** Reusable Button with variants & sizes */
function Button({
  as: Component = "button",
  variant = "primary",
  size = "lg",
  className,
  children,
  ...props
}) {
  const variantClass = {
    primary: "btn--primary",
    secondary: "btn--secondary",
    ghost: "btn--ghost",
  }[variant];

  const sizeClass = {
    sm: "btn--sm",
    md: "btn--md",
    lg: "btn--lg",
  }[size];

  return (
    <Component className={classNames("btn group", variantClass, sizeClass, className)} {...props}>
      <span className="btn__inner">
        <span className="btn__label">{children}</span>
      </span>
    </Component>
  );
}

/** Top navigation */
function Header({ className }) {
  return (
    <header className={classNames("navbar", className)}>
      <div className="container">
        <nav className="navbar__row" aria-label="Primary">
          {/* Brand */}
          <a href="#top" className="navbar__brand" aria-label="IdeaForge home">
            <span className="logo">IdeaForge</span>
          </a>

          {/* Desktop nav */}
          <ul className="nav md:flex hidden" role="list">
            <li><a href="#about" className="nav__link">About Us</a></li>
            <li><a href="#contact" className="nav__link">Contact</a></li>
          </ul>

          {/* Auth */}
          <div className="navbar__actions">
            <Button variant="secondary" size="md" aria-label="Log in">Log In</Button>
          </div>
        </nav>
      </div>
    </header>
  );
}

/** Feature card */
function FeatureCard({ icon: Icon, title, children }) {
  return (
    <div className="card">
      <div className="card__icon" aria-hidden>
        <Icon className="w-12 h-12" strokeWidth={1.5} />
      </div>
      <h3 className="card__title">{title}</h3>
      <p className="card__desc">{children}</p>
    </div>
  );
}

/** Step block */
function ProcessStep({ align = "left", title, children }) {
  const alignClass = align === "right" ? "step--right" : align === "center" ? "step--center" : "";
  return (
    <div className={classNames("step", alignClass)}>
      <div className="step__media" aria-hidden />
      <h3 className="step__title">{title}</h3>
      <p className="step__desc">{children}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div id="top" className="app">
      <Header />

      <main>
        {/* Hero */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="container">
            <div className="hero__bg" aria-hidden />
            <div className="hero__content">
              <header className="hero__header">
                <h1 id="hero-title" className="hero__title">
                  Welcome To
                  <br />
                  <span className="hero__brand">IdeaForge</span>
                </h1>
                <p className="hero__subtitle">Where Ideas Turn Into Reality</p>
              </header>

              <div className="hero__ctas">
                <Button variant="primary" size="lg">Get Started</Button>
                <Button variant="primary" size="lg">Learn More</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Introduction */}
        <section id="about" className="section intro" aria-labelledby="intro-title">
          <div className="container">
            <div className="section__eyebrow" aria-hidden>
              <Code className="w-9 h-9" strokeWidth={1.5} />
            </div>

            <div className="split">
              <div className="split__left">
                <h2 id="intro-title" className="section__title">Empower Your Ideas with AI Assistance</h2>
                <p className="section__body">
                  Our AI platform transforms your ideas into actionable plans by connecting you with potential sponsors,
                  competitors, and essential resources. With a user-friendly dashboard, you can track progress and gain analytics.
                </p>
                <div className="actions">
                  <Button variant="primary" size="md">Get Started</Button>
                  <Button variant="secondary" size="md">Learn More</Button>
                </div>
              </div>
              <div className="split__right" aria-hidden>
                <div className="visual" />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="section" aria-labelledby="features-title">
          <div className="container">
            <header className="section__header">
              <h2 id="features-title" className="section__title">Empower Your Ideas Today</h2>
              <p className="section__subtitle">Connect with sponsors to fuel your vision.</p>
            </header>

            <div className="grid">
              <FeatureCard icon={Package} title="Find the Right Sponsors">
                Get matched with potential investors and supporters.
              </FeatureCard>

              <FeatureCard icon={BarChart} title="Analyze Your Competition">
                Understand market dynamics and the competitive landscape.
              </FeatureCard>

              <FeatureCard icon={Package} title="Access Valuable Resources">
                Utilize tools and insights to launch successfully.
              </FeatureCard>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="section how" aria-labelledby="how-title">
          <div className="container">
            <header className="section__header">
              <h2 id="how-title" className="section__title">Transform Your Idea into Reality with AI</h2>
              <p className="section__subtitle max-w-4xl mx-auto">
                Input your idea and our AI guides you. From sponsors to competitor tracking, get all the resources you need.
              </p>
            </header>

            <div className="grid grid--steps">
              <ProcessStep align="left" title="Step 1: Input Your Idea">Share your concept with our intuitive interface.</ProcessStep>
              <ProcessStep align="center" title="Step 2: Discover Resources & Sponsors">AI connects you with sponsors and resources.</ProcessStep>
              <ProcessStep align="right" title="Step 3: Track Your Progress">Use the dashboard for analytics and insights.</ProcessStep>
            </div>

            <div className="cta--right">
              <Button variant="primary" size="lg">Get Started</Button>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="section testimonials" aria-labelledby="testimonials-title">
          <div className="container">
            <div className="quote__icon" aria-hidden>
              <svg width="80" height="70" viewBox="0 0 80 70" fill="none" aria-hidden="true">
                <path d="M31.967 13.3875C32.7413 12.7059 33.6962 12.2023 34.7466 11.9214C35.797 11.6406 36.9104 11.5911 37.9879 11.7775C39.0654 11.9639 40.0736 12.3803 40.9228 12.9898C41.7721 13.5993 42.4361 14.383 42.8558 15.2711C43.2754 16.1592 43.4379 17.1243 43.3285 18.0806C43.2192 19.0369 42.8416 19.9548 42.2292 20.7526C41.6168 21.5504 40.7886 22.2034 39.8182 22.6537C38.8478 23.1039 37.7653 23.3374 36.667 23.3334H6.66699M41.967 56.6125C42.7413 57.2941 43.6962 57.7977 44.7466 58.0786C45.797 58.3595 46.9104 58.4089 47.9879 58.2226C49.0654 58.0362 50.0736 57.6197 50.9228 57.0102C51.7721 56.4007 52.4361 55.6171 52.8558 54.729C53.2754 53.8408 53.4379 52.8757 53.3285 51.9194C53.2192 50.9631 52.8416 50.0453 52.2292 49.2475C51.6168 48.4497 50.7886 47.7966 49.8182 47.3464C48.8478 46.8961 47.7653 46.6627 46.667 46.6667H6.66699M59.1003 22.5459C60.0698 21.6997 61.2627 21.0756 62.5734 20.7288C63.8842 20.382 65.2724 20.3232 66.6153 20.5575C67.9582 20.7919 69.2144 21.3122 70.2728 22.0724C71.3312 22.8326 72.1592 23.8094 72.6836 24.9162C73.2079 26.0231 73.4125 27.2259 73.2791 28.4184C73.1458 29.6109 72.6787 30.7563 71.9191 31.7532C71.1595 32.7501 70.1308 33.5679 68.9241 34.1342C67.7173 34.7005 66.3697 34.9979 65.0003 35H6.66699" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h2 id="testimonials-title" className="section__title">What People Say</h2>

            <blockquote className="quote">
              “This platform transformed my idea into a viable business. The support and resources provided were invaluable in my journey.”
            </blockquote>

            <figure className="profile">
              <div className="profile__avatar" aria-hidden />
              <figcaption className="profile__meta">
                <p className="profile__name">Jane Doe</p>
                <p className="profile__role">Founder, Startup Inc.</p>
              </figcaption>
            </figure>

            <hr className="divider" />

            <div className="cta">
              <h3 className="cta__title">Transform Your Ideas into Reality</h3>
              <p className="cta__desc">Join our platform today and unlock the resources to bring your vision to life.</p>
              <Button variant="primary" size="lg">Get Started</Button>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="section contact" aria-labelledby="contact-title">
          <div className="container grid lg:grid-cols-2 gap-16">
            <div className="space-y-8">
              <header>
                <p className="eyebrow">Connect</p>
                <h2 id="contact-title" className="section__title">Get in Touch</h2>
                <p className="section__subtitle">We are here to assist you with any inquiries.</p>
              </header>

              <ul className="contact__list" role="list">
                <li className="contact__row">
                  <Mail className="w-9 h-10" strokeWidth={1.5} aria-hidden />
                  <div>
                    <h3 className="contact__label">Email</h3>
                    <p className="contact__value">
                      Reach us at:
                      <br />
                      <a href="mailto:support@ideaforge.com" className="link">support@ideaforge.com</a>
                    </p>
                  </div>
                </li>

                <li className="contact__row">
                  <Phone className="w-9 h-8" strokeWidth={1.5} aria-hidden />
                  <div>
                    <h3 className="contact__label">Phone</h3>
                    <p className="contact__value">
                      Call us:
                      <br />
                      <a href="tel:+94123456789" className="link">+94 123 456 789</a>
                    </p>
                  </div>
                </li>

                <li className="contact__row">
                  <MapPin className="w-6 h-7" aria-hidden />
                  <div>
                    <h3 className="contact__label">Office</h3>
                    <p className="contact__value">
                      123, Sample St. Colombo 10
                      <br />
                      <a href="#" className="link">Get Directions →</a>
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="form" aria-hidden />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer" aria-labelledby="footer-title">
        <div className="container">
          <hr className="divider" />
          <nav aria-label="Footer">
            <ul className="footer__links" role="list">
              <li><a href="#" className="nav__link">Get Started</a></li>
              <li><a href="#" className="nav__link">Our Services</a></li>
              <li><a href="#contact" className="nav__link">Contact Us</a></li>
              <li><a href="#about" className="nav__link">About Us</a></li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
