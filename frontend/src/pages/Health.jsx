import { useEffect, useState } from "react";
import { getDbHealth } from "../lib/api";

export default function Health() {
  const [status, setStatus] = useState("loading...");

  useEffect(() => {
    getDbHealth()
      .then((d) => setStatus(d.db))
      .catch((e) => setStatus("error: " + e.message));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Database Health</h1>
      <p>Status: {status}</p>
    </div>
  );
}
