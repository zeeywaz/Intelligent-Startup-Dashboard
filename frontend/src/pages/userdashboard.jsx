import Card from "../components/Card";
import Header from "../components/Header";
import Footer from "../components/footer";
import "../styles/userdashboard.css";
import { Boxes, Store, BrainCircuit, Wallet } from "lucide-react";
import {
  PieChart, Pie, Tooltip, Cell, Legend, LineChart,
  Line, XAxis, YAxis, CartesianGrid,
} from "recharts";

export default function UserDashboard() {
  const pieData = [
    { name: "Niche 1", value: 400 },
    { name: "Niche 2", value: 300 },
    { name: "Niche 3", value: 200 },
    { name: "Niche 4", value: 100 },
    { name: "Niche 5", value: 100 },
  ];
  const COLORS = ["#2a5684ff", "#c1dfff", "#8699c4", "#667ba5ff", "#a9b8d9"];
  const lineData = [
    { month: "Jan", thisMonth: 400, lastMonth: 350 },
    { month: "Feb", thisMonth: 300, lastMonth: 280 },
    { month: "Mar", thisMonth: 200, lastMonth: 220 },
    { month: "Apr", thisMonth: 278, lastMonth: 260 },
    { month: "May", thisMonth: 189, lastMonth: 210 },
  ];

  return (
    <>
      <Header />
      <div className="dashboard-app">
        <div className="container">
          <div className="dash-welcome">
            <h2>Welcome, Adam 👋</h2>
          </div>

          {/* Cards → navigation */}
          <div className="cards">
            <Card icon={Boxes} label="Resource & Services" to="/resources" />
            <Card icon={Store} label="Other Business & Competitors" to="/competitors" />
            <Card icon={Wallet} label="Sponsors and Investors" to="/investors" />
            <Card icon={BrainCircuit} label="My Start up" to="/mystartup" />
          </div>

          {/* Charts */}
          <div className="charts-box">
            <div className="chart-col">
              <h3>Popular Niche For The Month</h3>
              <PieChart width={400} height={400}>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={140} innerRadius={70} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ paddingTop: 30 }} />
              </PieChart>
            </div>

            <div className="chart-col">
              <h3>Analytics of Monthly Growth Of Niche</h3>
              <LineChart width={600} height={400} data={lineData}>
                <CartesianGrid stroke="#ccc" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="thisMonth" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="lastMonth"  stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
