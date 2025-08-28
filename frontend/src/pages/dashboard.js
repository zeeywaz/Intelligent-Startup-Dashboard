import React, { useEffect, useState } from "react";

function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/dashboard/")  // Django API
      .then((res) => res.json())
      .then((data) => setData(data));
  }, []);

  if (!data) return <p>Loading...</p>;

  return (
    <div className="dashboard">
      <h1>Welcome, {data.user} 👋</h1>
      <h2>Popular Niches For The Month</h2>
      <ul>
        {Object.entries(data.popular_niches).map(([label, value]) => (
          <li key={label}>{label}: {value}%</li>
        ))}
      </ul>
      <h2>Analytics</h2>
      <ul>
        {data.analytics.map((item, idx) => (
          <li key={idx}>{item.month}: {item.businesses}</li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
