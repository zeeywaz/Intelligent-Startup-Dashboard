
import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/footer";
import Card from "../components/Card";
import { Store, BrainCircuit, Wallet } from "lucide-react";
import { PieChart, Pie, Tooltip, Cell, Legend } from "recharts";
import "../styles/investor_dashboard.css";
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
  { id: 1, title: "EcoPack" },
  { id: 2, title: "Farm2Door" },
  { id: 3, title: "Tutorly" },
  { id: 4, title: "SafeRide" },
  { id: 5, title: "SolarHive" },
];

// small helpers
const fmtDate = (s) => {
  if (!s) return "";
  const d = new Date(s);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
};

export default function InvestorDashboard() {
  const [name, setName] = useState("");

  // analytics
  const [pieData, setPieData] = useState(FALLBACK_PIE);

  // popular businesses (ideas first, else competitors)
  const [popularBiz, setPopularBiz] = useState([]);
  const [popularKind, setPopularKind] = useState("ideas"); // "ideas" | "competitors"
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [popularErr, setPopularErr] = useState("");

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

  
  // 1) try latest ideas for current month
  // 2) if none, fallback to latest competitors
  useEffect(() => {
    (async () => {
      try {
        setLoadingPopular(true);
        setPopularErr("");

        // Try ideas first
        const r1 = await fetch(`${API_BASE}/api/analytics/popular-businesses/?kind=ideas&limit=5`, {
          credentials: "include",
        });

        if (r1.ok) {
          const j1 = await r1.json();
          const items = Array.isArray(j1?.items) ? j1.items : [];
          if (items.length) {
            setPopularBiz(items);
            setPopularKind("ideas");
            setLoadingPopular(false);
            return;
          }
        }

        // Fallback to competitors
        const r2 = await fetch(`${API_BASE}/api/analytics/popular-businesses/?kind=competitors&limit=5`, {
          credentials: "include",
        });
        if (r2.ok) {
          const j2 = await r2.json();
          const items = Array.isArray(j2?.items) ? j2.items : [];
          if (items.length) {
            setPopularBiz(items);
            setPopularKind("competitors");
            setLoadingPopular(false);
            return;
          }
        }

        // absolute fallback
        setPopularBiz(FALLBACK_BIZ);
        setPopularKind("ideas");
        setLoadingPopular(false);
      } catch {
        setPopularBiz(FALLBACK_BIZ);
        setPopularKind("ideas");
        setLoadingPopular(false);
        setPopularErr("Showing sample data until analytics loads.");
      }
    })();
  }, []);

  return (
    <>
      <Header />

      {/* SAME wrappers as user dashboard */}
      <div className="dashboard-app">
        <div className="container">
          {/* Welcome */}
          <div className="dash-welcome">
            <h2>
              Welcome, {name || "there"} <span aria-hidden>👋</span>
            </h2>
            <p className="dash-sub">Business Insight — Get ahead of your competition</p>
          </div>

          {/* Quick links */}
          <div className="ud-cards" style={{ marginTop: 8, marginBottom: 8 }}>
            <Card icon={Store} label="Business & Startups" to="/competitors" />
            <Card icon={Wallet} label="Sponsors and Investors" to="/investors" />
            <Card icon={BrainCircuit} label="My interest" to="/interests" />
          </div>

          {/* -------- Sleek Analysis Section  -------- */}
          <div className="charts-grid charts-grid--sleek">
            {/* Donut */}
            <section className="panel">
              <div className="panel-head">
                <h3>Popular Niches For The Month</h3>
              </div>
              <div className="panel-body panel-body--center">
                <PieChart width={440} height={330}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={70}
                    dataKey="value"
                    paddingAngle={1}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: 12 }} />
                </PieChart>
              </div>
            </section>

            {/* Popular Businesses */}
            <section className="panel">
              <div className="panel-head">
                <h3>
                  Popular Businesses{" "}
                  {popularKind === "ideas" ? "(This Month — Latest Ideas)" : "(Latest Competitors)"}
                </h3>
                <div className="panel-sub">Name • Owner • Added date</div>
              </div>

              <div className="panel-body">
                {loadingPopular ? (
                  <ul className="id-list" role="list">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <li className="id-list__item is-skeleton" key={i}>
                        <span className="id-avatar shimmer" />
                        <div className="id-list__body">
                          <div className="id-title shimmer" />
                          <div className="id-meta shimmer" />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="id-list" role="list">
                    {popularBiz.map((biz, i) => {
                      const title = biz.title || biz.name || `Item #${biz.id ?? i + 1}`;
                      const added = biz.submission_date || biz.created_at || biz.created || null;
                      const byUser = biz.user?.username || biz.owner?.username || "Unknown";

                      return (
                        <li className="id-list__item is-compact" key={biz.id || i}>
                          <span className="id-avatar" aria-hidden />
                          <div className="id-list__body">
                            <div className="id-title">{title}</div>
                            <div className="id-meta">
                              <span>by {byUser}</span>
                              {added && <span> • Added {fmtDate(added)}</span>}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {popularErr && <div className="inline-hint">{popularErr}</div>}
              </div>
            </section>
          </div>
          
        </div>
      </div>

      <Footer />
    </>
  );
}
