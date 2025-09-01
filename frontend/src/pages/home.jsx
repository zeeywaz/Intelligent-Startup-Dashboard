import React from 'react';
import { Code, BarChart, Package, Mail, Phone, MapPin } from 'lucide-react';

// Utility function for conditional classes
function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Navbar Component
interface NavbarProps {
  className?: string;
}

function Navbar({ className }: NavbarProps) {
  return (
    <nav className={cn(
      "w-full bg-white relative z-10",
      className
    )}>
      <div className="max-w-[1440px] mx-auto px-11 py-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="font-outfit text-[50px] font-bold text-ideaforge-primary leading-[70px]">
              IdeaForge
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-16">
            <a 
              href="#about" 
              className="font-roboto text-[30px] font-normal text-ideaforge-primary hover:text-ideaforge-button transition-colors duration-200"
            >
              About Us
            </a>
            <a 
              href="#contact" 
              className="font-roboto text-[30px] font-normal text-ideaforge-primary hover:text-ideaforge-button transition-colors duration-200"
            >
              Contact
            </a>
          </div>

          {/* Login Button */}
          <div className="flex-shrink-0">
            <button className="relative group">
              {/* Button Background with Shadow */}
              <div className="absolute inset-0 bg-ideaforge-accent rounded-[22px] shadow-[0_4px_4px_rgba(0,0,0,0.25)] border border-black/50 border-opacity-50 group-hover:shadow-[0_6px_6px_rgba(0,0,0,0.3)] transition-all duration-200"></div>
              
              {/* Button Content */}
              <div className="relative px-12 py-4 bg-ideaforge-accent rounded-[22px] border border-black/50 border-opacity-50">
                <span className="font-roboto text-[30px] font-bold text-ideaforge-primary tracking-[2.4px] [-webkit-text-stroke:0.4px_rgba(0,0,0,0.5)]">
                  Log In
                </span>
              </div>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="inline-flex items-center justify-center p-2 rounded-md text-ideaforge-primary hover:text-ideaforge-button hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ideaforge-button">
              <span className="sr-only">Open main menu</span>
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            <a 
              href="#about" 
              className="block px-3 py-2 text-base font-roboto text-ideaforge-primary hover:text-ideaforge-button hover:bg-gray-50"
            >
              About Us
            </a>
            <a 
              href="#contact" 
              className="block px-3 py-2 text-base font-roboto text-ideaforge-primary hover:text-ideaforge-button hover:bg-gray-50"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Main IdeaForge Component
export default function IdeaForge() {
  return (
    <>
      {/* CSS Styles */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Roboto:wght@300;400;500;600;700&family=Inter:wght@400;600;700;800&display=swap");

        :root {
          --background: 0 0% 100%;
          --foreground: 222.2 84% 4.9%;
          --card: 0 0% 100%;
          --card-foreground: 222.2 84% 4.9%;
          --popover: 0 0% 100%;
          --popover-foreground: 222.2 84% 4.9%;
          --primary: 222.2 47.4% 11.2%;
          --primary-foreground: 210 40% 98%;
          --secondary: 210 40% 96.1%;
          --secondary-foreground: 222.2 47.4% 11.2%;
          --muted: 210 40% 96.1%;
          --muted-foreground: 215.4 16.3% 46.9%;
          --accent: 210 40% 96.1%;
          --accent-foreground: 222.2 47.4% 11.2%;
          --destructive: 0 84.2% 60.2%;
          --destructive-foreground: 210 40% 98%;
          --border: 214.3 31.8% 91.4%;
          --input: 214.3 31.8% 91.4%;
          --ring: 222.2 84% 4.9%;
          --radius: 0.5rem;
          
          /* IdeaForge Brand Colors */
          --ideaforge-primary: 217 47% 27%; /* #2E4069 */
          --ideaforge-button: 220 64% 67%; /* #7091E6 */
          --ideaforge-accent: 220 33% 75%; /* #ACBBDA */
          --ideaforge-gray: 0 0% 85%; /* #D9D9D9 */
          --ideaforge-section-bg: 272 33% 93%; /* #EEE8F4 */
          
          --sidebar-background: 0 0% 98%;
          --sidebar-foreground: 240 5.3% 26.1%;
          --sidebar-primary: 240 5.9% 10%;
          --sidebar-primary-foreground: 0 0% 98%;
          --sidebar-accent: 240 4.8% 95.9%;
          --sidebar-accent-foreground: 240 5.9% 10%;
          --sidebar-border: 220 13% 91%;
          --sidebar-ring: 217.2 91.2% 59.8%;
        }

        .dark {
          --background: 222.2 84% 4.9%;
          --foreground: 210 40% 98%;
          --card: 222.2 84% 4.9%;
          --card-foreground: 210 40% 98%;
          --popover: 222.2 84% 4.9%;
          --popover-foreground: 210 40% 98%;
          --primary: 210 40% 98%;
          --primary-foreground: 222.2 47.4% 11.2%;
          --secondary: 217.2 32.6% 17.5%;
          --secondary-foreground: 210 40% 98%;
          --muted: 217.2 32.6% 17.5%;
          --muted-foreground: 215 20.2% 65.1%;
          --accent: 217.2 32.6% 17.5%;
          --accent-foreground: 210 40% 98%;
          --destructive: 0 62.8% 30.6%;
          --destructive-foreground: 210 40% 98%;
          --border: 217.2 32.6% 17.5%;
          --input: 217.2 32.6% 17.5%;
          --ring: 212.7 26.8% 83.9%;
          --sidebar-background: 240 5.9% 10%;
          --sidebar-foreground: 240 4.8% 95.9%;
          --sidebar-primary: 224.3 76.3% 48%;
          --sidebar-primary-foreground: 0 0% 100%;
          --sidebar-accent: 240 3.7% 15.9%;
          --sidebar-accent-foreground: 240 4.8% 95.9%;
          --sidebar-border: 240 3.7% 15.9%;
          --sidebar-ring: 217.2 91.2% 59.8%;
        }

        * {
          border-color: hsl(var(--border));
        }

        body {
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          font-family: 'Inter', sans-serif;
        }

        /* Custom utility classes */
        .font-outfit { font-family: 'Outfit', sans-serif; }
        .font-roboto { font-family: 'Roboto', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        
        .text-ideaforge-primary { color: hsl(var(--ideaforge-primary)); }
        .text-ideaforge-button { color: hsl(var(--ideaforge-button)); }
        .bg-ideaforge-button { background-color: hsl(var(--ideaforge-button)); }
        .bg-ideaforge-accent { background-color: hsl(var(--ideaforge-accent)); }
        .bg-ideaforge-gray { background-color: hsl(var(--ideaforge-gray)); }
        .bg-ideaforge-section-bg { background-color: hsl(var(--ideaforge-section-bg)); }
        
        /* Responsive utilities */
        .max-md\\:flex-col { @media (max-width: 768px) { flex-direction: column; } }
        .max-md\\:gap-0 { @media (max-width: 768px) { gap: 0; } }
        .max-md\\:ml-0 { @media (max-width: 768px) { margin-left: 0; } }
        .max-md\\:w-full { @media (max-width: 768px) { width: 100%; } }
        
        /* Shadow utilities */
        .shadow-\\[0_4px_4px_rgba\\(0\\,0\\,0\\,0\\.25\\)\\] { box-shadow: 0 4px 4px rgba(0,0,0,0.25); }
        .shadow-\\[0_6px_6px_rgba\\(0\\,0\\,0\\,0\\.3\\)\\] { box-shadow: 0 6px 6px rgba(0,0,0,0.3); }
        .shadow-\\[10px_14px_4px_rgba\\(0\\,0\\,0\\,0\\.25\\)\\] { box-shadow: 10px 14px 4px rgba(0,0,0,0.25); }
        .shadow-\\[12px_16px_6px_rgba\\(0\\,0\\,0\\,0\\.3\\)\\] { box-shadow: 12px 16px 6px rgba(0,0,0,0.3); }
        .shadow-\\[5px_7px_4px_rgba\\(0\\,0\\,0\\,0\\.25\\)\\] { box-shadow: 5px 7px 4px rgba(0,0,0,0.25); }
        .shadow-\\[7px_9px_6px_rgba\\(0\\,0\\,0\\,0\\.3\\)\\] { box-shadow: 7px 9px 6px rgba(0,0,0,0.3); }
        
        /* Drop shadow utilities */
        .drop-shadow-\\[0_4px_4px_rgba\\(0\\,0\\,0\\,0\\.25\\)\\] { filter: drop-shadow(0 4px 4px rgba(0,0,0,0.25)); }
        
        /* Opacity utilities */
        .bg-ideaforge-accent\\/43 { background-color: hsl(var(--ideaforge-accent) / 0.43); }
        .border-black\\/50 { border-color: rgb(0 0 0 / 0.5); }
        .border-opacity-50 { --tw-border-opacity: 0.5; }
        
        /* Webkit text stroke */
        .\\[-webkit-text-stroke\\:0\\.4px_rgba\\(0\\,0\\,0\\,0\\.5\\)\\] {
          -webkit-text-stroke: 0.4px rgba(0,0,0,0.5);
        }
        
        /* Letter spacing */
        .tracking-\\[2\\.4px\\] { letter-spacing: 2.4px; }
        .tracking-\\[2\\.5px\\] { letter-spacing: 2.5px; }
        .tracking-\\[1\\.4px\\] { letter-spacing: 1.4px; }
        .tracking-\\[0\\.9px\\] { letter-spacing: 0.9px; }
        
        /* Line height */
        .leading-\\[118\\%\\] { line-height: 118%; }
        .leading-\\[140\\%\\] { line-height: 140%; }
        .leading-\\[70px\\] { line-height: 70px; }
        
        /* Transform utilities */
        .rotate-12 { transform: rotate(12deg); }
        .origin-center { transform-origin: center; }
        
        /* Positioning utilities */
        .left-\\[108px\\] { left: 108px; }
        .top-\\[93px\\] { top: 93px; }
        .w-\\[958px\\] { width: 958px; }
        .h-\\[653px\\] { height: 653px; }
        .w-\\[341px\\] { width: 341px; }
        .w-\\[325px\\] { width: 325px; }
        .w-\\[375px\\] { width: 375px; }
        .h-\\[361px\\] { height: 361px; }
        .h-\\[404px\\] { height: 404px; }
        .h-\\[522px\\] { height: 522px; }
        .h-\\[623px\\] { height: 623px; }
        .w-\\[1234px\\] { width: 1234px; }
        .w-\\[67\\%\\] { width: 67%; }
        .max-w-\\[586px\\] { max-width: 586px; }
        .min-w-\\[100px\\] { min-width: 100px; }
        .my-\\[100px\\] { margin-top: 100px; margin-bottom: 100px; }
        .-mb-\\[3px\\] { margin-bottom: -3px; }
        .pr-\\[30px\\] { padding-right: 30px; }
        .pr-\\[5px\\] { padding-right: 5px; }
        .pr-\\[94px\\] { padding-right: 94px; }
        .pl-16 { padding-left: 4rem; }
        
        /* Text sizes */
        .text-\\[85px\\] { font-size: 85px; }
        .text-\\[50px\\] { font-size: 50px; }
        .text-\\[49px\\] { font-size: 49px; }
        .text-\\[48px\\] { font-size: 48px; }
        .text-\\[39px\\] { font-size: 39px; }
        .text-\\[38px\\] { font-size: 38px; }
        .text-\\[37px\\] { font-size: 37px; }
        .text-\\[30px\\] { font-size: 30px; }
        .text-\\[28px\\] { font-size: 28px; }
        .text-\\[24px\\] { font-size: 24px; }
        .text-\\[21px\\] { font-size: 21px; }
        .text-\\[20px\\] { font-size: 20px; }
        .text-\\[18px\\] { font-size: 18px; }
        .text-\\[16px\\] { font-size: 16px; }
        .text-\\[56px\\] { font-size: 56px; }
        
        /* Border radius */
        .rounded-\\[27px\\] { border-radius: 27px; }
        .rounded-\\[22px\\] { border-radius: 22px; }
        .rounded-\\[20px\\] { border-radius: 20px; }
        .rounded-\\[11px\\] { border-radius: 11px; }
        
        /* Border width */
        .border-\\[3px\\] { border-width: 3px; }
        
        /* Colors */
        .text-\\[\\#1D2F59\\] { color: #1D2F59; }
        
        /* Z-index */
        .z-0 { z-index: 0; }
        .z-10 { z-index: 10; }
        
        /* Responsive grid */
        .md\\:grid-cols-3 { @media (min-width: 768px) { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        .lg\\:grid-cols-2 { @media (min-width: 1024px) { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        
        /* Flexbox utilities */
        .w-1\\/2 { width: 50%; }
        .ml-5 { margin-left: 1.25rem; }
        .gap-5 { gap: 1.25rem; }
        .mt-10 { margin-top: 2.5rem; }
        .mt-8 { margin-top: 2rem; }
        .mb-auto { margin-bottom: auto; }
        
        /* Animation utilities */
        .transition-all { transition-property: all; }
        .transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; }
        .duration-200 { transition-duration: 200ms; }
        
        /* Hover utilities */
        .group:hover .group-hover\\:shadow-\\[0_6px_6px_rgba\\(0\\,0\\,0\\,0\\.3\\)\\] { box-shadow: 0 6px 6px rgba(0,0,0,0.3); }
        .group:hover .group-hover\\:shadow-\\[12px_16px_6px_rgba\\(0\\,0\\,0\\,0\\.3\\)\\] { box-shadow: 12px 16px 6px rgba(0,0,0,0.3); }
        .group:hover .group-hover\\:shadow-\\[7px_9px_6px_rgba\\(0\\,0\\,0\\,0\\.3\\)\\] { box-shadow: 7px 9px 6px rgba(0,0,0,0.3); }
        
        /* Utility classes for layout */
        .min-h-screen { min-height: 100vh; }
        .bg-white { background-color: rgb(255 255 255); }
        .relative { position: relative; }
        .absolute { position: absolute; }
        .max-w-\\[1440px\\] { max-width: 1440px; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
        .px-11 { padding-left: 2.75rem; padding-right: 2.75rem; }
        .px-16 { padding-left: 4rem; padding-right: 4rem; }
        .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
        .py-12 { padding-top: 3rem; padding-bottom: 3rem; }
        .py-20 { padding-top: 5rem; padding-bottom: 5rem; }
        .pt-32 { padding-top: 8rem; }
        .pb-20 { padding-bottom: 5rem; }
        .pt-8 { padding-top: 2rem; }
        .mb-16 { margin-bottom: 4rem; }
        .mb-8 { margin-bottom: 2rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mt-12 { margin-top: 3rem; }
        .ml-auto { margin-left: auto; }
        .mr-auto { margin-right: auto; }
        .flex { display: flex; }
        .grid { display: grid; }
        .hidden { display: none; }
        .block { display: block; }
        .inline-flex { display: inline-flex; }
        .flex-col { flex-direction: column; }
        .flex-row { flex-direction: row; }
        .items-center { align-items: center; }
        .items-start { align-items: flex-start; }
        .justify-center { justify-content: center; }
        .justify-between { justify-content: space-between; }
        .justify-end { justify-content: flex-end; }
        .gap-4 { gap: 1rem; }
        .gap-6 { gap: 1.5rem; }
        .gap-8 { gap: 2rem; }
        .gap-12 { gap: 3rem; }
        .gap-16 { gap: 4rem; }
        .space-x-16 > * + * { margin-left: 4rem; }
        .space-y-1 > * + * { margin-top: 0.25rem; }
        .space-y-8 > * + * { margin-top: 2rem; }
        .space-y-12 > * + * { margin-top: 3rem; }
        .self-stretch { align-self: stretch; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .font-normal { font-weight: 400; }
        .font-bold { font-weight: 700; }
        .text-black { color: rgb(0 0 0); }
        .text-white { color: rgb(255 255 255); }
        .bg-gray-100 { background-color: rgb(243 244 246); }
        .bg-gray-50 { background-color: rgb(249 250 251); }
        .border { border-width: 1px; }
        .border-t { border-top-width: 1px; }
        .border-black { border-color: rgb(0 0 0); }
        .border-gray-200 { border-color: rgb(229 231 235); }
        .rounded-md { border-radius: 0.375rem; }
        .rounded-full { border-radius: 9999px; }
        .p-2 { padding: 0.5rem; }
        .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .px-12 { padding-left: 3rem; padding-right: 3rem; }
        .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
        .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
        .px-20 { padding-left: 5rem; padding-right: 5rem; }
        .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
        .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
        .px-10 { padding-left: 2.5rem; padding-right: 2.5rem; }
        .pr-10 { padding-right: 2.5rem; }
        .w-6 { width: 1.5rem; }
        .h-6 { width: 1.5rem; }
        .w-9 { width: 2.25rem; }
        .h-8 { height: 2rem; }
        .h-10 { height: 2.5rem; }
        .h-7 { height: 1.75rem; }
        .w-12 { width: 3rem; }
        .h-12 { height: 3rem; }
        .w-\\[125px\\] { width: 125px; }
        .h-\\[119px\\] { height: 119px; }
        .w-full { width: 100%; }
        .h-20 { height: 5rem; }
        .flex-shrink-0 { flex-shrink: 0; }
        .max-w-4xl { max-width: 56rem; }
        .max-w-5xl { max-width: 64rem; }
        .mt-1 { margin-top: 0.25rem; }
        .mt-2 { margin-top: 0.5rem; }
        .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }
        .hover\\:text-ideaforge-button:hover { color: hsl(var(--ideaforge-button)); }
        .hover\\:bg-gray-50:hover { background-color: rgb(249 250 251); }
        .focus\\:outline-none:focus { outline: 2px solid transparent; outline-offset: 2px; }
        .focus\\:ring-2:focus { --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color); box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000); }
        .focus\\:ring-inset:focus { --tw-ring-inset: inset; }
        .focus\\:ring-ideaforge-button:focus { --tw-ring-color: hsl(var(--ideaforge-button)); }
        
        /* Medium screen utilities */
        @media (min-width: 768px) {
          .md\\:flex { display: flex; }
          .md\\:hidden { display: none; }
        }
        
        /* Large screen utilities */
        @media (min-width: 1024px) {
          .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        
        /* Small screen utilities */
        @media (min-width: 640px) {
          .sm\\:flex-row { flex-direction: row; }
          .sm\\:px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
        }
      `}</style>

      <div className="min-h-screen bg-white">
        {/* Navbar */}
        <Navbar />

        {/* Hero Section */}
        <section className="relative max-w-[1440px] mx-auto px-6 py-20 bg-white">
          {/* Large background rectangle */}
          <div className="absolute left-[108px] top-[93px] w-[958px] h-[653px] bg-ideaforge-accent/43 border border-black rounded-[27px] z-0"></div>
          
          <div className="relative z-10">
            {/* Main Heading */}
            <div className="text-center pt-32 pb-20">
              <h1 className="font-outfit text-[85px] font-bold text-[#1D2F59] leading-[118%] tracking-[2.4px] drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] mb-4">
                Welcome To<br />
                <span className="text-[85px]">IdeaForge</span>
              </h1>
              <p className="font-outfit text-[48px] font-bold text-[#1D2F59] leading-[118%] tracking-[2.4px]">
                Where Ideas Turn Into Reality
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
              <button className="group relative">
                <div className="absolute inset-0 bg-ideaforge-button rounded-[20px] shadow-[10px_14px_4px_rgba(0,0,0,0.25)] group-hover:shadow-[12px_16px_6px_rgba(0,0,0,0.3)] transition-all duration-200"></div>
                <div className="relative bg-ideaforge-button rounded-[20px] px-12 py-6 text-center">
                  <span className="font-outfit text-[28px] font-bold text-white tracking-[1.4px]">
                    Get Started
                  </span>
                </div>
              </button>

              <button className="group relative">
                <div className="absolute inset-0 bg-ideaforge-button rounded-[20px] shadow-[10px_14px_4px_rgba(0,0,0,0.25)] group-hover:shadow-[12px_16px_6px_rgba(0,0,0,0.3)] transition-all duration-200"></div>
                <div className="relative bg-ideaforge-button rounded-[20px] px-20 py-6 text-center">
                  <span className="font-outfit text-[28px] font-bold text-white tracking-[1.4px]">
                    Learn More
                  </span>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Introduction Section */}
        <section className="max-w-[1440px] mx-auto px-16 py-20">
          <Code className="w-12 h-12 text-black mt-2" strokeWidth={1.5} />
          <div>
            <div className="flex gap-5 max-md:flex-col max-md:gap-0">
              <div className="flex flex-col w-1/2 max-md:ml-0 max-md:w-full">
                <div className="text-black tracking-[2.5px] mb-6 font-outfit text-[50px] font-bold leading-[140%]">
                  Empower Your Ideas with AI Assistance
                </div>
                <div className="text-black mb-8 font-roboto text-[20px] font-normal leading-[140%]">
                  our AI platform transforms your ideas into actionable plans by connecting you with potential sponsors, competitors, and essential resources. With a user-friendly dashboard. you can easily track your progress and gain valuable insights through analytics
                </div>
                <div className="mb-auto">
                  <div className="flex items-start gap-4">
                    <div></div>
                  </div>
                  <div className="flex gap-6 mt-8">
                    <button className="group relative">
                      <div className="absolute inset-0 bg-ideaforge-button rounded-[11px] shadow-[5px_7px_4px_rgba(0,0,0,0.25)] group-hover:shadow-[7px_9px_6px_rgba(0,0,0,0.3)] transition-all duration-200"></div>
                      <div className="relative bg-ideaforge-button rounded-[11px] px-6 py-3 text-center">
                        <span className="font-outfit text-[18px] font-bold text-white tracking-[0.9px]">
                          Learn More
                        </span>
                      </div>
                    </button>

                    <button className="group relative">
                      <div className="absolute inset-0 bg-ideaforge-button rounded-[11px] shadow-[5px_7px_4px_rgba(0,0,0,0.25)] group-hover:shadow-[7px_9px_6px_rgba(0,0,0,0.3)] transition-all duration-200"></div>
                      <div className="relative bg-ideaforge-button rounded-[11px] px-6 py-3 text-center">
                        <span className="font-outfit text-[18px] font-bold text-white tracking-[0.9px]">
                          Get Started
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col w-1/2 ml-5 max-md:ml-0 max-md:w-full">
                <div className="flex flex-col relative mt-10 h-[404px]"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Overview Section */}
        <section className="max-w-[1440px] mx-auto px-16 py-20">
          <div className="text-center mb-16">
            <h2 className="font-roboto text-[49px] font-bold text-black mb-4">
              Empower Your Ideas Today
            </h2>
            <p className="font-roboto text-[21px] font-normal text-black">
              Connect with sponsors to fuel your vision.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-[341px] h-[361px] bg-ideaforge-gray border-[3px] border-black mx-auto mb-8 flex items-center justify-center">
                <div className="text-center">
                  <Package className="w-12 h-12 text-black mx-auto mb-6" strokeWidth={1.5} />
                  <h3 className="font-roboto text-[39px] font-bold text-black mb-4">
                    Find the Right Sponsors
                  </h3>
                  <p className="font-roboto text-[20px] font-bold text-black">
                    Get matched with potential investors and supporters
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-[325px] h-[361px] bg-ideaforge-gray border-[3px] border-black mx-auto mb-8 flex items-center justify-center">
                <div className="text-center">
                  <BarChart className="w-12 h-12 text-black mx-auto mb-6" strokeWidth={1.5} />
                  <h3 className="font-roboto text-[38px] font-bold text-black mb-4">
                    Analyze your Competition
                  </h3>
                  <p className="font-roboto text-[20px] font-bold text-black">
                    Understand the market dynamics and competitive landscape
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="text-center pr-10">
              <div className="w-[375px] h-[361px] bg-ideaforge-gray border-[3px] border-black mx-auto mb-8 flex items-center justify-center px-10 pr-[5px]">
                <div className="text-center">
                  <Package className="w-12 h-12 text-black mx-auto mb-6" strokeWidth={1.5} />
                  <h3 className="font-roboto text-[38px] font-bold text-black mb-4">
                    Access valuable Resources
                  </h3>
                  <p className="font-roboto text-[20px] font-bold text-black">
                    Utilize tools and insights to launch successfully
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Instructions Section */}
        <section className="max-w-[1440px] mx-auto px-16 py-20">
          <div className="text-center mb-16">
            <h2 className="font-outfit text-[49px] font-bold text-black mb-6">
              Transform Your Idea into Reality with AI
            </h2>
            <p className="font-roboto text-[21px] font-normal text-black max-w-4xl mx-auto">
              Simply input your idea into our platform, and our AI will guide you through the next steps. From finding sponsors to tracking competitors, we provide all the resources you need to succeed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-left">
              <div className="w-[375px] h-[361px] bg-ideaforge-gray border-[3px] border-black mb-8 pr-[30px]"></div>
              <h3 className="font-roboto text-[38px] font-bold text-black mb-4">
                Step 1: Input Your Idea
              </h3>
              <p className="font-roboto text-[20px] font-bold text-black">
                Share your concept with our intuitive interface
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-[375px] h-[361px] bg-ideaforge-gray border-[3px] border-black mb-8 mx-auto pr-10"></div>
              <h3 className="font-roboto text-[38px] font-bold text-black mb-4">
                Step 2: Discover Resources and Sponsors
              </h3>
              <p className="font-roboto text-[20px] font-bold text-black">
                Our AI connects you with potential sponsors and resources
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-right">
              <div className="w-[375px] h-[361px] bg-ideaforge-gray border-[3px] border-black mb-8 ml-auto pr-10"></div>
              <h3 className="font-roboto text-[38px] font-bold text-black mb-4">
                Step 3: Track Your Progress
              </h3>
              <p className="font-roboto text-[20px] font-bold text-black">
                Utilize our dashboard for analytiocs and insights
              </p>
            </div>
          </div>

          <div className="text-right mt-12">
            <button className="group relative">
              <div className="absolute inset-0 bg-ideaforge-button rounded-[20px] shadow-[10px_14px_4px_rgba(0,0,0,0.25)] group-hover:shadow-[12px_16px_6px_rgba(0,0,0,0.3)] transition-all duration-200"></div>
              <div className="relative bg-ideaforge-button rounded-[20px] px-12 py-6 text-center">
                <span className="font-outfit text-[28px] font-bold text-white tracking-[1.4px]">
                  Get Started
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="max-w-[1440px] mx-auto px-16 py-20">
          <div className="text-center">
            {/* Wind Icon */}
            <div className="flex justify-center mb-8">
              <svg width="80" height="70" viewBox="0 0 80 70" fill="none" className="text-black">
                <path d="M31.967 13.3875C32.7413 12.7059 33.6962 12.2023 34.7466 11.9214C35.797 11.6406 36.9104 11.5911 37.9879 11.7775C39.0654 11.9639 40.0736 12.3803 40.9228 12.9898C41.7721 13.5993 42.4361 14.383 42.8558 15.2711C43.2754 16.1592 43.4379 17.1243 43.3285 18.0806C43.2192 19.0369 42.8416 19.9548 42.2292 20.7526C41.6168 21.5504 40.7886 22.2034 39.8182 22.6537C38.8478 23.1039 37.7653 23.3374 36.667 23.3334H6.66699M41.967 56.6125C42.7413 57.2941 43.6962 57.7977 44.7466 58.0786C45.797 58.3595 46.9104 58.4089 47.9879 58.2226C49.0654 58.0362 50.0736 57.6197 50.9228 57.0102C51.7721 56.4007 52.4361 55.6171 52.8558 54.729C53.2754 53.8408 53.4379 52.8757 53.3285 51.9194C53.2192 50.9631 52.8416 50.0453 52.2292 49.2475C51.6168 48.4497 50.7886 47.7966 49.8182 47.3464C48.8478 46.8961 47.7653 46.6627 46.667 46.6667H6.66699M59.1003 22.5459C60.0698 21.6997 61.2627 21.0756 62.5734 20.7288C63.8842 20.382 65.2724 20.3232 66.6153 20.5575C67.9582 20.7919 69.2144 21.3122 70.2728 22.0724C71.3312 22.8326 72.1592 23.8094 72.6836 24.9162C73.2079 26.0231 73.4125 27.2259 73.2791 28.4184C73.1458 29.6109 72.6787 30.7563 71.9191 31.7532C71.1595 32.7501 70.1308 33.5679 68.9241 34.1342C67.7173 34.7005 66.3697 34.9979 65.0003 35H6.66699" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <h2 className="font-roboto text-[37px] font-bold text-black mb-8">
              Webflow
            </h2>

            <blockquote className="font-roboto text-[37px] font-bold text-black mb-8 max-w-5xl mx-auto">
              "This platform tansformed my idea into a viable business. The suppor and resources provided were invaluable in my journey."
            </blockquote>

            {/* Profile */}
            <div className="flex flex-col items-center mb-16">
              <div className="w-[125px] h-[119px] bg-ideaforge-gray rounded-full mb-6"></div>
              <p className="font-inter text-[21px] font-normal text-black">Jane Doe</p>
              <p className="font-inter text-[21px] font-normal text-black">Founder, Startup Inc</p>
            </div>

            <div className="border-t border-black mb-16"></div>

            {/* Call to Action */}
            <div className="text-left max-w-4xl">
              <h3 className="font-outfit text-[50px] font-bold text-black mb-6">
                Transform Your Ideas into Reality
              </h3>
              <p className="font-roboto text-[24px] font-normal text-black mb-8">
                Join our platform today and unlock the resources to bring your vision to life
              </p>
              
              <button className="group relative">
                <div className="absolute inset-0 bg-ideaforge-button rounded-[20px] shadow-[10px_14px_4px_rgba(0,0,0,0.25)] group-hover:shadow-[12px_16px_6px_rgba(0,0,0,0.3)] transition-all duration-200"></div>
                <div className="relative bg-ideaforge-button rounded-[20px] px-12 py-6 text-center">
                  <span className="font-outfit text-[28px] font-bold text-white tracking-[1.4px]">
                    Get Started
                  </span>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="max-w-[1440px] mx-auto px-16 py-20">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Left Content */}
            <div className="space-y-8">
              <div>
                <p className="font-roboto text-[16px] font-bold text-black mb-2">Connect</p>
                <h2 className="font-roboto text-[56px] font-bold text-black mb-4">Get in Touch</h2>
                <p className="font-roboto text-[16px] font-bold text-black">
                  We are here to assist you with any inquiries
                </p>
              </div>

              {/* Contact Details */}
              <div className="space-y-12">
                <div className="flex items-start gap-4">
                  <Mail className="w-9 h-10 text-black mt-1" strokeWidth={1.5} />
                  <div>
                    <h3 className="font-roboto text-[18px] font-bold text-black mb-2">Email</h3>
                    <p className="font-roboto text-[18px] font-normal text-black">
                      Reach us at:<br />
                      <br />
                      support@IDEAFORGE.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone className="w-9 h-8 text-black mt-1" strokeWidth={1.5} />
                  <div>
                    <h3 className="font-roboto text-[18px] font-bold text-black mb-2">Phone</h3>
                    <p className="font-roboto text-[18px] font-normal text-black">
                      Call us anytime:<br />
                      <br />
                      +94 123456789
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-7 text-black mt-1" />
                  <div>
                    <h3 className="font-roboto text-[18px] font-bold text-black mb-2">Office</h3>
                    <p className="font-roboto text-[18px] font-normal text-black">
                      123, sample St. Colombo 10<br />
                      <br />
                      Get Directions &gt;
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Contact Form Placeholder */}
            <div className="w-full h-[623px] bg-ideaforge-gray"></div>
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-[1440px] mx-auto py-12 pl-16 pr-[94px]">
          <div className="border-t border-black pt-8">
            <div className="flex justify-end gap-8">
              <a href="#" className="font-roboto text-[21px] font-normal text-black hover:text-ideaforge-button transition-colors">
                Get started
              </a>
              <a href="#" className="font-roboto text-[21px] font-normal text-black hover:text-ideaforge-button transition-colors">
                Our Services
              </a>
              <a href="#contact" className="font-roboto text-[21px] font-normal text-black hover:text-ideaforge-button transition-colors">
                Contact Us
              </a>
              <a href="#about" className="font-roboto text-[21px] font-normal text-black hover:text-ideaforge-button transition-colors">
                About Us
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
