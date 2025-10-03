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

// fallbacks (only used if API fails)
const FALLBACK_PIE = [
  { name: "Niche 1", value: 400 },
  { name: "Niche 2", value: 300 },
  { name: "Niche 3", value: 200 },
  { name: "Niche 4", value: 100 },
  { name: "Niche 5", value: 100 },
];
const FALLBACK_LINE = [
  { month: "Jun", allCount: 20, myCatCount: 2 },
  { month: "Jul", allCount: 15, myCatCount: 4 },
  { month: "Aug", allCount: 85, myCatCount: 3 },
  { month: "Sep", allCount: 50, myCatCount: 1 },
  { month: "Oct", allCount: 180, myCatCount: 0 },
];

export default function UserDashboard() {
  const [name, setName] = useState("");
  const [pieData, setPieData] = useState(FALLBACK_PIE);
  const [lineData, setLineData] = useState(FALLBACK_LINE);
  const [myCategoryName, setMyCategoryName] = useState(""); // user's BusinessIdea category (derived server-side)

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

  // fetch analytics (pie + lines)
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
      } catch {
        // keep fallback pie
      }

      try {
        // We need two series:
        // BLUE: all ideas (across DB) per month
        // GREEN: ideas per month for the user's own BusinessIdea category
        const months = 5;

        const [rAll, rCat] = await Promise.all([
          fetch(`${API_BASE}/api/analytics/monthly-overview/?months=${months}`, {
            credentials: "include",
          }),
          // No category params needed: backend picks latest idea's category for this user
          fetch(`${API_BASE}/api/analytics/category-trend/?months=${months}`, {
            credentials: "include",
          }),
        ]);

        // Build base map by month using the BLUE series
        let base = [];
        if (rAll.ok) {
          const jAll = await rAll.json();
          const pts = Array.isArray(jAll?.points) ? jAll.points : [];
          // monthly-overview returns { month, thisMonth (all), lastMonth (my ideas count) }
          base = pts.map((p) => ({
            month: p.month,
            allCount: Number(p.thisMonth) || 0,
            myCatCount: 0, // fill after we load the category series
          }));
        }

        // Overlay GREEN series using category-trend 'thisMonth' values
        if (rCat.ok && base.length) {
          const jCat = await rCat.json();
          setMyCategoryName(jCat?.category || "");

          const catPts = Array.isArray(jCat?.points) ? jCat.points : [];
          const catByMonth = Object.fromEntries(
            catPts.map((p) => [String(p.month), Number(p.thisMonth) || 0])
          );

          const merged = base.map((row) => ({
            ...row,
            myCatCount: catByMonth[row.month] ?? 0,
          }));

          setLineData(merged);
        } else if (base.length) {
          // if category trend failed, at least show the blue series
          setLineData(base);
        }
      } catch {
        // keep fallback line
      }
    })();
  }, []);

  const greenSeriesName = myCategoryName
    ? `My ideas (${myCategoryName})`
    : "My ideas";

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
                  {/* BLUE: all ideas (unchanged) */}
                  <Line
                    type="monotone"
                    dataKey="allCount"
                    name="All categories"
                    stroke="#6d7dfc"
                    strokeWidth={2}
                    dot={false}
                  />
                  {/* GREEN: ideas in the user's category */}
                  <Line
                    type="monotone"
                    dataKey="myCatCount"
                    name={greenSeriesName}
                    stroke="#7dd3a1"
                    strokeWidth={2}
                    dot={false}
                  />
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
