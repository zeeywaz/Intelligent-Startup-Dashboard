import Card from "../components/Card";
import Header from "../components/Header";
import Footer from "../components/footer";
import "../styles/userdashboard.css"
import { ChartBarIncreasing, DollarSign, Lightbulb } from "lucide-react";
import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  Legend,
  
} from "recharts";

export default function App() {
  const pieData = [
    { name: "Niche 1", value: 400 },
    { name: "Niche 2", value: 300 },
    { name: "Niche 3", value: 200 },
    { name: "Niche 4", value: 100 },
    { name: "Niche 5", value: 100 },
  ];

  const COLORS = ["#2a5684ff", "#c1dfff", "#8699c4", "#667ba5ff", "#a9b8d9"];
  

  return (
    <>
      <Header />
      <div className="container">
        {/* === Added Section Above Cards === */}
        <div style={{ textAlign: "left", margin: "2rem 0" }}>
          <h2 style={{ fontSize: "3.1rem", fontWeight: "bold", marginTop: "1rem" , marginBottom: "1rem"}}>
            Welcome, Adam 👋
          </h2>
        </div>
        {/* ================================= */}

        <div className="cards">
          <Card icon={ChartBarIncreasing} label="Businesses & Startups" />
          <Card icon={DollarSign} label="Sponsors and Investors" />
          <Card icon={Lightbulb} label="My Interests" />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            alignItems: "flex-start",
            marginTop: "3rem",
            marginBottom: "12rem",
            padding: "2rem 4rem",
            borderRadius: "20px",
            backgroundColor: "#f9f9f9",
            boxShadow: "1 14px 8px rgba(255, 61, 61, 0.1)",
            width: "100%",
            maxWidth: "1200px",
            height: "100%",
            maxHeight : "600px",
          }}
        >
          {/* Pie Chart Section */}
          <div style={{ textAlign: "center" }}>
            <h3 style={{ fontSize: "1.6rem", fontWeight: "10", marginBottom: "2rem" }}>
              Popular Niche For The Month
            </h3>
            <PieChart width={400} height={400} style={{filter: "drop-shadow(0px 4px 8px rgba(7, 7, 7, 0.15))"}}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={140}
                innerRadius={70}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ paddingTop: "30px" }}/>
            </PieChart>
          </div>

          
        </div>
      </div>
      <Footer />
    </>
  );
}


