import React from "react";
import "../styles/home.css";
import { Code, BarChart, Package, Mail, Phone, MapPin } from "lucide-react";

/**
 * Utility: safely join class names.
 * Ignores falsy values.
 */
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Top navigation bar.
 * - Logo
 * - Desktop links
 * - Login button
 * - Static mobile links (no JS toggle to keep output identical)
 */
function Navbar({ className }) {
  return (
    <nav className={cn("w-full bg-white relative z-10 if-navbar", className)} aria-label="Primary">
      <div className="max-w-[1440px] mx-auto px-11 py-8 if-navbar__container">
        <div className="flex items-center justify-between h-20 if-navbar__row">
          {/* Brand */}
          <div className="flex-shrink-0 if-navbar__brand">
            <h1 className="font-outfit text-[50px] font-bold text-ideaforge-primary leading-[70px] if-navbar__brand-text">
              IdeaForge
            </h1>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-16 if-navbar__links">
            <a
              href="#about"
              className="font-roboto text-[30px] font-normal text-ideaforge-primary hover:text-ideaforge-button transition-colors duration-200 if-navbar__link"
            >
              About Us
            </a>
            <a
              href="#contact"
              className="font-roboto text-[30px] font-normal text-ideaforge-primary hover:text-ideaforge-button transition-colors duration-200 if-navbar__link"
            >
              Contact
            </a>
          </div>

          {/* Login */}
          <div className="flex-shrink-0 if-navbar__auth">
            <button className="relative group if-button if-button--login" type="button" aria-label="Log in">
              <div className="absolute inset-0 bg-ideaforge-accent rounded-[22px] shadow-[0_4px_4px_rgba(0,0,0,0.25)] border border-black/50 border-opacity-50 group-hover:shadow-[0_6px_6px_rgba(0,0,0,0.3)] transition-all duration-200 if-button__shadow" />
              <div className="relative px-12 py-4 bg-ideaforge-accent rounded-[22px]/50 border-opacity-50 if-button__body">
                <span className="font-roboto text-[30px] font-bold text-ideaforge-primary tracking-[2.4px] [-webkit-text-stroke:0.4px_rgba(0,0,0,0.5)] if-button__label">
                  Log In
                </span>
              </div>
            </button>
          </div>

          {/* Mobile menu icon (static demo button) */}
          <div className="md:hidden if-navbar__menu">
            <button
              className="inline-flex items-center justify-center p-2 rounded-md text-ideaforge-primary hover:text-ideaforge-button hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ideaforge-button if-navbar__menu-button"
              type="button"
              aria-label="Open main menu"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav (always rendered, matches original behavior) */}
        <div className="md:hidden if-navbar__mobile">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200 if-navbar__mobile-panel">
            <a
              href="#about"
              className="block px-3 py-2 text-base font-roboto text-ideaforge-primary hover:text-ideaforge-button hover:bg-gray-50 if-navbar__mobile-link"
            >
              About Us
            </a>
            <a
              href="#contact"
              className="block px-3 py-2 text-base font-roboto text-ideaforge-primary hover:text-ideaforge-button hover:bg-gray-50 if-navbar__mobile-link"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

/**
 * Home page
 * - Styles moved to home.css (global utilities + brand tokens)
 * - Markup preserved to keep visuals identical
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-white if-app">
      {/* Navbar */}
      <Navbar />

      {/* Hero */}
      <section className="relative max-w-[1440px] mx-auto px-6 py-20 bg-white if-hero">
        {/* Decorative background panel */}
        <div className="absolute left-[108px] top-[93px] w-[958px] h-[653px] bg-ideaforge-accent/43 border border-black rounded-[27px] z-0 if-hero__bg" />

        <div className="relative z-10 if-hero__content">
          <div className="text-center pt-32 pb-20 if-hero__heading">
            <h1 className="font-outfit text-[85px] font-bold text-[#1D2F59] leading-[118%] tracking-[2.4px] drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] mb-4 if-hero__title">
              Welcome To
              <br />
              <span className="text-[85px]">IdeaForge</span>
            </h1>
            <p className="font-outfit text-[48px] font-bold text-[#1D2F59] leading-[118%] tracking-[2.4px] if-hero__subtitle">
              Where Ideas Turn Into Reality
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center if-hero__ctas">
            <button className="group relative if-button if-button--primary" type="button">
              <div className="absolute inset-0 bg-ideaforge-button rounded-[20px] shadow-[10px_14px_4px_rgba(0,0,0,0.25)] group-hover:shadow-[12px_16px_6px_rgba(0,0,0,0.3)] transition-all duration-200 if-button__shadow" />
              <div className="relative bg-ideaforge-button rounded-[20px] px-12 py-6 text-center if-button__body">
                <span className="font-outfit text-[28px] font-bold text-white tracking-[1.4px] if-button__label">Get Started</span>
              </div>
            </button>

            <button className="group relative if-button if-button--secondary" type="button">
              <div className="absolute inset-0 bg-ideaforge-button rounded-[20px] shadow-[10px_14px_4px_rgba(0,0,0,0.25)] group-hover:shadow-[12px_16px_6px_rgba(0,0,0,0.3)] transition-all duration-200 if-button__shadow" />
              <div className="relative bg-ideaforge-button rounded-[20px] px-20 py-6 text-center if-button__body">
                <span className="font-outfit text-[28px] font-bold text-white tracking-[1.4px] if-button__label">Learn More</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="max-w-[1440px] mx-auto px-16 py-20 if-intro">
        <Code className="w-12 h-12 text-black mt-2" strokeWidth={1.5} />
        <div>
          <div className="flex gap-5 max-md:flex-col max-md:gap-0">
            {/* Left column */}
            <div className="flex flex-col w-1/2 max-md:ml-0 max-md:w-full if-intro__col">
              <div className="text-black tracking-[2.5px] mb-6 font-outfit text-[50px] font-bold leading-[140%] if-intro__title">
                Empower Your Ideas with AI Assistance
              </div>
              <div className="text-black mb-8 font-roboto text-[20px] font-normal leading-[140%] if-intro__desc">
                our AI platform transforms your ideas into actionable plans by connecting you with potential sponsors, competitors, and essential resources. With a user-friendly dashboard. you can easily track your progress and gain valuable insights through analytics
              </div>
              <div className="mb-auto if-intro__actions">
                <div className="flex items-start gap-4">
                  <div />
                </div>
                <div className="flex gap-6 mt-8 if-intro__buttons">
                  <button className="group relative if-button if-button--secondary" type="button">
                    <div className="absolute inset-0 bg-ideaforge-button rounded-[11px] shadow-[5px_7px_4px_rgba(0,0,0,0.25)] group-hover:shadow-[7px_9px_6px_rgba(0,0,0,0.3)] transition-all duration-200 if-button__shadow" />
                    <div className="relative bg-ideaforge-button rounded-[11px] px-6 py-3 text-center if-button__body">
                      <span className="font-outfit text-[18px] font-bold text-white tracking-[0.9px] if-button__label">Learn More</span>
                    </div>
                  </button>

                  <button className="group relative if-button if-button--primary" type="button">
                    <div className="absolute inset-0 bg-ideaforge-button rounded-[11px] shadow-[5px_7px_4px_rgba(0,0,0,0.25)] group-hover:shadow-[7px_9px_6px_rgba(0,0,0,0.3)] transition-all duration-200 if-button__shadow" />
                    <div className="relative bg-ideaforge-button rounded-[11px] px-6 py-3 text-center if-button__body">
                      <span className="font-outfit text-[18px] font-bold text-white tracking-[0.9px] if-button__label">Get Started</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right column (visual placeholder) */}
            <div className="flex flex-col w-1/2 ml-5 max-md:ml-0 max-md:w-full if-intro__visual">
              <div className="flex flex-col relative mt-10 h-[404px]" />
            </div>
          </div>
        </div>
      </section>

      {/* Overview / Features */}
      <section className="max-w-[1440px] mx-auto px-16 py-20 if-overview">
        <div className="text-center mb-16 if-section__header">
          <h2 className="font-roboto text-[49px] font-bold text-black mb-4 if-section__title">Empower Your Ideas Today</h2>
          <p className="font-roboto text-[21px] font-normal text-black if-section__subtitle">Connect with sponsors to fuel your vision.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 if-features">
          {/* Feature 1 */}
          <div className="text-center if-feature">
            <div className="w-[341px] h-[361px] bg-ideaforge-gray border-[3px] border-black mx-auto mb-8 flex items-center justify-center if-feature__card">
              <div className="text-center if-feature__content">
                <Package className="w-12 h-12 text-black mx-auto mb-6" strokeWidth={1.5} />
                <h3 className="font-roboto text-[39px] font-bold text-black mb-4 if-feature__title">Find the Right Sponsors</h3>
                <p className="font-roboto text-[20px] font-bold text-black if-feature__desc">Get matched with potential investors and supporters</p>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="text-center if-feature">
            <div className="w-[325px] h-[361px] bg-ideaforge-gray border-[3px] border-black mx-auto mb-8 flex items-center justify-center if-feature__card">
              <div className="text-center if-feature__content">
                <BarChart className="w-12 h-12 text-black mx-auto mb-6" strokeWidth={1.5} />
                <h3 className="font-roboto text-[38px] font-bold text-black mb-4 if-feature__title">Analyze your Competition</h3>
                <p className="font-roboto text-[20px] font-bold text-black if-feature__desc">Understand the market dynamics and competitive landscape</p>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="text-center pr-10 if-feature">
            <div className="w-[375px] h-[361px] bg-ideaforge-gray border-[3px] border-black mx-auto mb-8 flex items-center justify-center px-10 pr-[5px] if-feature__card">
              <div className="text-center if-feature__content">
                <Package className="w-12 h-12 text-black mx-auto mb-6" strokeWidth={1.5} />
                <h3 className="font-roboto text-[38px] font-bold text-black mb-4 if-feature__title">Access valuable Resources</h3>
                <p className="font-roboto text-[20px] font-bold text-black if-feature__desc">Utilize tools and insights to launch successfully</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-[1440px] mx-auto px-16 py-20 if-how-it-works">
        <div className="text-center mb-16 if-section__header">
          <h2 className="font-outfit text-[49px] font-bold text-black mb-6 if-section__title">Transform Your Idea into Reality with AI</h2>
          <p className="font-roboto text-[21px] font-normal text-black max-w-4xl mx-auto if-section__subtitle">
            Simply input your idea into our platform, and our AI will guide you through the next steps. From finding sponsors to tracking
            competitors, we provide all the resources you need to succeed.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 if-steps">
          {/* Step 1 */}
          <div className="text-left if-step">
            <div className="w-[375px] h-[361px] bg-ideaforge-gray border-[3px] border-black mb-8 pr-[30px] if-step__media" />
            <h3 className="font-roboto text-[38px] font-bold text-black mb-4 if-step__title">Step 1: Input Your Idea</h3>
            <p className="font-roboto text-[20px] font-bold text-black if-step__desc">Share your concept with our intuitive interface</p>
          </div>

          {/* Step 2 */}
          <div className="text-center if-step">
            <div className="w-[375px] h-[361px] bg-ideaforge-gray border-[3px] border-black mb-8 mx-auto pr-10 if-step__media" />
            <h3 className="font-roboto text-[38px] font-bold text-black mb-4 if-step__title">Step 2: Discover Resources and Sponsors</h3>
            <p className="font-roboto text-[20px] font-bold text-black if-step__desc">Our AI connects you with potential sponsors and resources</p>
          </div>

          {/* Step 3 */}
          <div className="text-right if-step">
            <div className="w-[375px] h-[361px] bg-ideaforge-gray border-[3px] border-black mb-8 ml-auto pr-10 if-step__media" />
            <h3 className="font-roboto text-[38px] font-bold text-black mb-4 if-step__title">Step 3: Track Your Progress</h3>
            <p className="font-roboto text-[20px] font-bold text-black if-step__desc">Utilize our dashboard for analytiocs and insights</p>
          </div>
        </div>

        <div className="text-right mt-12 if-how-it-works__cta">
          <button className="group relative if-button if-button--primary" type="button">
            <div className="absolute inset-0 bg-ideaforge-button rounded-[20px] shadow-[10px_14px_4px_rgba(0,0,0,0.25)] group-hover:shadow-[12px_16px_6px_rgba(0,0,0,0.3)] transition-all duration-200 if-button__shadow" />
            <div className="relative bg-ideaforge-button rounded-[20px] px-12 py-6 text-center if-button__body">
              <span className="font-outfit text-[28px] font-bold text-white tracking-[1.4px] if-button__label">Get Started</span>
            </div>
          </button>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-[1440px] mx-auto px-16 py-20 if-testimonials">
        <div className="text-center">
          {/* Decorative icon */}
          <div className="flex justify-center mb-8 if-testimonials__icon" aria-hidden="true">
            <svg width="80" height="70" viewBox="0 0 80 70" fill="none" className="text-black">
              <path
                d="M31.967 13.3875C32.7413 12.7059 33.6962 12.2023 34.7466 11.9214C35.797 11.6406 36.9104 11.5911 37.9879 11.7775C39.0654 11.9639 40.0736 12.3803 40.9228 12.9898C41.7721 13.5993 42.4361 14.383 42.8558 15.2711C43.2754 16.1592 43.4379 17.1243 43.3285 18.0806C43.2192 19.0369 42.8416 19.9548 42.2292 20.7526C41.6168 21.5504 40.7886 22.2034 39.8182 22.6537C38.8478 23.1039 37.7653 23.3374 36.667 23.3334H6.66699M41.967 56.6125C42.7413 57.2941 43.6962 57.7977 44.7466 58.0786C45.797 58.3595 46.9104 58.4089 47.9879 58.2226C49.0654 58.0362 50.0736 57.6197 50.9228 57.0102C51.7721 56.4007 52.4361 55.6171 52.8558 54.729C53.2754 53.8408 53.4379 52.8757 53.3285 51.9194C53.2192 50.9631 52.8416 50.0453 52.2292 49.2475C51.6168 48.4497 50.7886 47.7966 49.8182 47.3464C48.8478 46.8961 47.7653 46.6627 46.667 46.6667H6.66699M59.1003 22.5459C60.0698 21.6997 61.2627 21.0756 62.5734 20.7288C63.8842 20.382 65.2724 20.3232 66.6153 20.5575C67.9582 20.7919 69.2144 21.3122 70.2728 22.0724C71.3312 22.8326 72.1592 23.8094 72.6836 24.9162C73.2079 26.0231 73.4125 27.2259 73.2791 28.4184C73.1458 29.6109 72.6787 30.7563 71.9191 31.7532C71.1595 32.7501 70.1308 33.5679 68.9241 34.1342C67.7173 34.7005 66.3697 34.9979 65.0003 35H6.66699"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h2 className="font-roboto text-[37px] font-bold text-black mb-8 if-testimonials__brand">Webflow</h2>

          <blockquote className="font-roboto text-[37px] font-bold text-black mb-8 max-w-5xl mx-auto if-testimonials__quote">
            "This platform tansformed my idea into a viable business. The suppor and resources provided were invaluable in my journey."
          </blockquote>

          {/* Profile */}
          <div className="flex flex-col items-center mb-16 if-testimonials__profile">
            <div className="w-[125px] h-[119px] bg-ideaforge-gray rounded-full mb-6 if-testimonials__avatar" />
            <p className="font-inter text-[21px] font-normal text-black if-testimonials__name">Jane Doe</p>
            <p className="font-inter text-[21px] font-normal text-black if-testimonials__role">Founder, Startup Inc</p>
          </div>

          <div className="border-t border-black mb-16 if-divider" />

          {/* CTA */}
          <div className="text-left max-w-4xl if-testimonials__cta">
            <h3 className="font-outfit text-[50px] font-bold text-black mb-6 if-testimonials__cta-title">Transform Your Ideas into Reality</h3>
            <p className="font-roboto text-[24px] font-normal text-black mb-8 if-testimonials__cta-desc">
              Join our platform today and unlock the resources to bring your vision to life
            </p>

            <button className="group relative if-button if-button--primary" type="button">
              <div className="absolute inset-0 bg-ideaforge-button rounded-[20px] shadow-[10px_14px_4px_rgba(0,0,0,0.25)] group-hover:shadow-[12px_16px_6px_rgba(0,0,0,0.3)] transition-all duration-200 if-button__shadow" />
              <div className="relative bg-ideaforge-button rounded-[20px] px-12 py-6 text-center if-button__body">
                <span className="font-outfit text-[28px] font-bold text-white tracking-[1.4px] if-button__label">Get Started</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="max-w-[1440px] mx-auto px-16 py-20 if-contact">
        <div className="grid lg:grid-cols-2 gap-16 if-contact__grid">
          {/* Left: details */}
          <div className="space-y-8 if-contact__left">
            <div>
              <p className="font-roboto text-[16px] font-bold text-black mb-2 if-contact__eyebrow">Connect</p>
              <h2 className="font-roboto text-[56px] font-bold text-black mb-4 if-contact__title">Get in Touch</h2>
              <p className="font-roboto text-[16px] font-bold text-black if-contact__subtitle">We are here to assist you with any inquiries</p>
            </div>

            <div className="space-y-12 if-contact__details">
              <div className="flex items-start gap-4 if-contact__row">
                <Mail className="w-9 h-10 text-black mt-1" strokeWidth={1.5} />
                <div>
                  <h3 className="font-roboto text-[18px] font-bold text-black mb-2">Email</h3>
                  <p className="font-roboto text-[18px] font-normal text-black">
                    Reach us at:
                    <br />
                    <br />
                    support@IDEAFORGE.com
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 if-contact__row">
                <Phone className="w-9 h-8 text-black mt-1" strokeWidth={1.5} />
                <div>
                  <h3 className="font-roboto text-[18px] font-bold text-black mb-2">Phone</h3>
                  <p className="font-roboto text-[18px] font-normal text-black">
                    Call us anytime:
                    <br />
                    <br />
                    +94 123456789
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 if-contact__row">
                <MapPin className="w-6 h-7 text-black mt-1" />
                <div>
                  <h3 className="font-roboto text-[18px] font-bold text-black mb-2">Office</h3>
                  <p className="font-roboto text-[18px] font-normal text-black">
                    123, sample St. Colombo 10
                    <br />
                    <br />
                    Get Directions &gt;
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: form placeholder */}
          <div className="w-full h-[623px] bg-ideaforge-gray if-contact__form" />
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-[1440px] mx-auto py-12 pl-16 pr-[94px] if-footer">
        <div className="border-t border-black pt-8 if-footer__top">
          <div className="flex justify-end gap-8 if-footer__links">
            <a href="#" className="font-roboto text-[21px] font-normal text-black hover:text-ideaforge-button transition-colors if-footer__link">
              Get started
            </a>
            <a href="#" className="font-roboto text-[21px] font-normal text-black hover:text-ideaforge-button transition-colors if-footer__link">
              Our Services
            </a>
            <a href="#contact" className="font-roboto text-[21px] font-normal text-black hover:text-ideaforge-button transition-colors if-footer__link">
              Contact Us
            </a>
            <a href="#about" className="font-roboto text-[21px] font-normal text-black hover:text-ideaforge-button transition-colors if-footer__link">
              About Us
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}