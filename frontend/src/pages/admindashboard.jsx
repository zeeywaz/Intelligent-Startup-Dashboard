// src/pages/admindashboard.jsx
import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import Header from "../components/Header";
import Footer from "../components/footer";
import "../styles/userdashboard.css";
import { Boxes, Store, BrainCircuit, Wallet } from "lucide-react";
import { API_BASE } from "../lib/api";

export default function AdminDashboard() {
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

  return (
    <>
      <Header />
      <div className="dashboard-app">
        <div className="container">
          {/* Welcome section */}
          <div className="dash-welcome">
            <h2>
              Welcome, {name || "there"} <span aria-hidden>👋</span>
            </h2>
            <p className="dash-sub">
              Admin Dashboard — Manage resources, competitors, and users
            </p>
          </div>

          {/* Cards row */}
          <div className="ud-cards" style={{ marginTop: 8, marginBottom: 8 }}>
            <Card icon={Boxes} label="Edit Resource & Services" to="/resources" />
            <Card icon={Store} label="Edit Other Business & Competitors" to="/competitors" />
            <Card icon={Wallet} label="Edit Sponsors and Investors" to="/investors" />
            <Card icon={BrainCircuit} label="User Management" to="/admin_user" />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
