// investordashboard.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/footer";
import Card from "../components/Card";
import { Store, BrainCircuit, Wallet } from "lucide-react";
import { PieChart, Pie, Tooltip, Cell, Legend } from "recharts";
import "../styles/investor_dashboard.css";      // 👈 reuse the same theme
// (Optionally keep investor-specific css for the right list only)
// import "../styles/investor_dashboard.css";
import { API_BASE } from "../lib/api";


export default function InvestorDashboard() {
  const [name, setName] = useState("");

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

  const pieData = [
    { name: "Niche 1", value: 40 },
    { name: "Niche 2", value: 25 },
    { name: "Niche 3", value: 15 },
    { name: "Niche 4", value: 12 },
    { name: "Niche 5", value: 8 },
  ];
  const COLORS = ["#2a5684", "#c1dfff", "#8699c4", "#667ba5", "#a9b8d9"];

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

          {/* Same panel grid */}
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
              {/* This list uses a tiny bit of investor-specific CSS below */}
              <ul className="id-list" role="list">
                {Array.from({ length: 3 }).map((_, i) => (
                  <li className="id-list__item" key={i}>
                    <div className="id-avatar" aria-hidden />
                    <div className="id-list__body">
                      <div className="id-quote">“Quote”</div>
                      <div className="id-title">Title</div>
                      <div className="id-desc">Description</div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
