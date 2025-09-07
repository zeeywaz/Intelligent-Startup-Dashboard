import Card from "../components/Card";
import Header from "../components/header";
import Footer from "../components/footer";
import { Pickaxe, ChartBarIncreasing, DollarSign, Lightbulb } from "lucide-react";
import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import "../components/Card.css";

export default function App() {
  const pieData = [
    { name: "Resource & Services", value: 400 },
    { name: "Competitors", value: 300 },
    { name: "Investors", value: 200 },
    { name: "Startup", value: 100 },
  ];

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

  const lineData = [
    { month: "Jan", uv: 400 },
    { month: "Feb", uv: 300 },
    { month: "Mar", uv: 200 },
    { month: "Apr", uv: 278 },
    { month: "May", uv: 189 },
  ];

  return (
    <>
      <Header />
      <div className="container">
        <div className="cards">
          <Card icon={Pickaxe} label="Resource & Services" />
          <Card icon={ChartBarIncreasing} label="Other Business & Competitors" />
          <Card icon={DollarSign} label="Sponsors and Investors" />
          <Card icon={Lightbulb} label="My Start up" />
        </div>

        <div
          style={{
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              marginTop: "2rem",
              padding: "2rem 4rem",   // vertical 2rem, horizontal 4rem
              borderRadius: "20px",
              backgroundColor: "#f9f9f9",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              width: "100%",          // span parent
              maxWidth: "1200px"      // optional cap, remove if you want edge-to-edge
          }}
          
        >
          <PieChart width={300} height={300}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>

          <LineChart width={400} height={300} data={lineData}>
            <CartesianGrid stroke="#ccc" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="uv" stroke="#8884d8" />
          </LineChart>
        </div>
      </div>
      <Footer />
    </>
  );
}
