// src/pages/userdashboard.jsx
import React, { useEffect, useState } from "react";

import Card from "../components/Card";
import Header from "../components/Header";
import Footer from "../components/footer";
import "../styles/userdashboard.css";
import { Boxes, Store, BrainCircuit, Wallet } from "lucide-react";
import {
  PieChart, Pie, Tooltip, Cell, Legend, LineChart,
  Line, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { API_BASE } from "../lib/api";

// fallback palettes
const COLORS = ["#2a5684", "#c1dfff", "#8699c4", "#667ba5", "#a9b8d9"];

// fallback data (used only if API fails)
const FALLBACK_PIE = [
  { name: "Niche 1", value: 400 },
  { name: "Niche 2", value: 300 },
  { name: "Niche 3", value: 200 },
  { name: "Niche 4", value: 100 },
  { name: "Niche 5", value: 100 },
];
const FALLBACK_LINE = [
  { month: "Jan", thisMonth: 400, lastMonth: 350 },
  { month: "Feb", thisMonth: 300, lastMonth: 280 },
  { month: "Mar", thisMonth: 200, lastMonth: 220 },
  { month: "Apr", thisMonth: 278, lastMonth: 260 },
  { month: "May", thisMonth: 189, lastMonth: 210 },
];

export default function UserDashboard() {
  const [name, setName] = useState("");
  const [pieData, setPieData] = useState(FALLBACK_PIE);
  const [lineData, setLineData] = useState(FALLBACK_LINE);
  const [myBT, setMyBT] = useState(null); // user's business_type label

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

  // fetch analytics (with graceful fallback)
  useEffect(() => {
    (async () => {
      try {
        // Donut: popular categories for THIS month
        const r1 = await fetch(`${API_BASE}/api/analytics/popular-categories/`, {
          credentials: "include",
        });
        if (r1.ok) {
          const j1 = await r1.json();
          const items = Array.isArray(j1?.items) ? j1.items : [];
          if (items.length) setPieData(items.map((it) => ({ name: it.name, value: it.count })));
        }

        // LINE: blue = ALL ideas; green = MY business_type (last N months)
        const r2 = await fetch(`${API_BASE}/api/analytics/monthly-overview/?months=5`, {
          credentials: "include",
        });
        if (r2.ok) {
          const j2 = await r2.json();
          const pts = Array.isArray(j2?.points) ? j2.points : [];
          if (pts.length) setLineData(pts);
          if (j2?.business_type) {
            setMyBT(j2.business_type);
            localStorage.setItem("if_bt", j2.business_type);
          }
        }
      } catch {
        // keep fallbacks
      }
    })();
  }, []);

  const myBTLabel = myBT || localStorage.getItem("if_bt") || "n/a";

  return (
    <>
      <Header />
      <div className="dashboard-app">
        <div className="container">
          {/* Welcome LEFT, username */}
          <div className="dash-welcome">
            <h2>Welcome, {name || "there"} <span aria-hidden>👋</span></h2>
            <p className="dash-sub">Business Insight — Get ahead of your competition</p>
          </div>

          {/* Cards row */}
          <div className="ud-cards" style={{ marginTop: 8, marginBottom: 8 }}>
            <Card icon={Boxes} label="Resource & Services" to="/resources" />
            <Card icon={Store} label="Other Business & Competitors" to="/competitors" />
            <Card icon={Wallet} label="Sponsors and Investors" to="/investors" />
            <Card icon={BrainCircuit} label="My Start up" to="/mystartup" />
          </div>

          {/* Charts */}
          <div className="charts-grid">
            <section className="panel">
              <h3>Popular Niche For The Month</h3>
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
              <h3>Analytics of Monthly Growth Of Niche</h3>
              <div className="panel-body">
                <LineChart width={560} height={320} data={lineData}>
                  <CartesianGrid stroke="#e5e7eb" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {/* BLUE: all ideas */}
                  <Line
                    type="monotone"
                    dataKey="thisMonth"
                    name="All categories"
                    stroke="#6d7dfc"
                    strokeWidth={2}
                    dot={false}
                  />
                  {/* GREEN: user's business_type */}
                  <Line type="monotone" dataKey="lastMonth"  name="My ideas" stroke="#7dd3a1" strokeWidth={2} dot={false} />
                </LineChart>
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
