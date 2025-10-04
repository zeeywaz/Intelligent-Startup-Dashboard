// investordashboard.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/footer";
import Card from "../components/Card";
import { Store, BrainCircuit, Wallet } from "lucide-react";
import { PieChart, Pie, Tooltip, Cell, Legend } from "recharts";
import "../styles/investor_dashboard.css";      // 👈 reuse the same theme
import { API_BASE } from "../lib/api";

// fallback palettes
const COLORS = ["#2a5684", "#c1dfff", "#8699c4", "#667ba5", "#a9b8d9"];

// fallbacks (only used if API fails)
const FALLBACK_PIE = [
  { name: "Niche 1", value: 40 },
  { name: "Niche 2", value: 25 },
  { name: "Niche 3", value: 15 },
  { name: "Niche 4", value: 12 },
  { name: "Niche 5", value: 8 },
];

// temporary sample businesses to show until API provides real data
const FALLBACK_BIZ = [
  {
    id: 1,
    title: "EcoPack",
    tagline: "Sustainable packaging for SMEs",
    description: "Subscription-based biodegradable packaging for small and medium enterprises.",
  },
  {
    id: 2,
    title: "Farm2Door",
    tagline: "Fresh local produce delivered",
    description: "On-demand delivery connecting local farmers with urban customers.",
  },
  {
    id: 3,
    title: "Tutorly",
    tagline: "Personalized learning on demand",
    description: "AI-assisted tutoring marketplace focusing on STEM subjects.",
  },
  {
    id: 4,
    title: "SafeRide",
    tagline: "Community-driven transport",
    description: "A ride-sharing platform built for college campuses and small towns.",
  },
  {
    id: 5,
    title: "SolarHive",
    tagline: "Affordable micro-solar solutions",
    description: "Low-cost solar installations and pay-as-you-go energy for remote homes.",
  },
];

export default function InvestorDashboard() {
  const [name, setName] = useState("");

  // analytics
  const [pieData, setPieData] = useState(FALLBACK_PIE);

  // popular businesses (latest business_idea items)
  const [popularBiz, setPopularBiz] = useState(FALLBACK_BIZ);

  // fetch name
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/me/`, { credentials: "include" });
        const j = await r.json().catch(() => ({}));
        const uname = (j?.user?.username || j?.user?.firstName || "").trim();
        if (uname) localStorage.setItem("if_name", uname);
        setName(uname || localStorage.getItem("if_name") || "");
      } catch {
        setName(localStorage.getItem("if_name") || "");
      }
    })();
  }, []);

  // fetch popular categories (pie)
  useEffect(() => {
    (async () => {
      try {
        const r1 = await fetch(`${API_BASE}/api/analytics/popular-categories/`, {
          credentials: "include",
        });
        if (r1.ok) {
          const j1 = await r1.json();
          const items = Array.isArray(j1?.items) ? j1.items : [];
          if (items.length) setPieData(items.map((it) => ({ name: it.name, value: it.count })));
        }
      } catch {
        // keep fallback pie
      }
    })();
  }, []);

  // fetch latest business ideas for "Popular Businesses For The Month"
  useEffect(() => {
    (async () => {
      try {
        // NOTE: endpoint name is a best-effort guess. If your API uses a different route,
        // update this path to match your backend (e.g. /api/business_ideas/ or /api/ideas/).
        const r = await fetch(`${API_BASE}/api/business-ideas/?limit=5`, {
          credentials: "include",
        });
        if (r.ok) {
          const j = await r.json();
          // expect either array or { results: [] }
          const items = Array.isArray(j) ? j : Array.isArray(j?.results) ? j.results : [];
          setPopularBiz(items.slice(0, 5));
        } else {
          // keep fallback
        }
      } catch {
        // keep fallback
      }
    })();
  }, []);

  return (
    <>
      <Header />

      {/* SAME wrappers as user dashboard */}
      <div className="dashboard-app">
        <div className="container">
          {/* Same welcome styling */}
          <div className="dash-welcome">
            <h2>Welcome, {name || "there"} <span aria-hidden>👋</span></h2>
            <p className="dash-sub">Business Insight — Get ahead of your competition</p>
          </div>

          {/* Same cards row + your shared Card component */}
          <div className="ud-cards" style={{ marginTop: 8, marginBottom: 8 }}>
            <Card icon={Store} label="Business & Startups" to="/competitors" />
            <Card icon={Wallet} label=" Sponsors and Investors" to="/investors" />
            <Card icon={BrainCircuit} label="My interest" to="/interests" />
          </div>

          {/* Panel grid: Pie + Popular Businesses */}
          <div className="charts-grid">
            <section className="panel">
              <h3>Popular Niches For The Month</h3>
              <div className="panel-body">
                <PieChart width={420} height={320}>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={120} innerRadius={65} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: 18 }} />
                </PieChart>
              </div>
            </section>

            <section className="panel">
              <h3>Popular Businesses For The Month</h3>
              <div className="panel-body">
                <ul className="id-list" role="list">
                  {popularBiz.length ? (
                    popularBiz.map((biz, i) => (
                      <li className="id-list__item" key={biz.id || i}>
                        <div className="id-avatar" aria-hidden />
                        <div className="id-list__body">
                          <div className="id-quote">{biz.tagline || biz.summary || '“Great idea”'}</div>
                          <div className="id-title">{biz.title || biz.name || 'Untitled'}</div>
                          <div className="id-desc">{biz.description || biz.short_description || ''}</div>
                        </div>
                      </li>
                    ))
                  ) : (
                    // fallback: show 3 placeholders
                    Array.from({ length: 3 }).map((_, i) => (
                      <li className="id-list__item" key={i}>
                        <div className="id-avatar" aria-hidden />
                        <div className="id-list__body">
                          <div className="id-quote">“Quote”</div>
                          <div className="id-title">Title</div>
                          <div className="id-desc">Description</div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </section>

          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
