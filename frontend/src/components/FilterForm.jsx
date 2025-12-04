import React from "react";
import { FaIdBadge, FaBuilding, FaBriefcase, FaMapMarkerAlt, FaMapSigns, FaSun, FaMoon } from "react-icons/fa";

export default function FilterForm({ filters, setFilters, onSearch }) {
  const handleChange = (k, v) => setFilters({ ...filters, [k]: v });
  const submit = (e) => { e && e.preventDefault(); onSearch(); };

  // theme toggle (body class)
  const toggleTheme = () => {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", isDark ? "1" : "0");
  };

  // ensure toggle matches stored value on first render (if user toggled before)
  React.useEffect(() => {
    const stored = localStorage.getItem("darkMode");
    if (stored === "1") document.body.classList.add("dark");
  }, []);

  return (
    <form className="filter-row" onSubmit={submit} aria-label="Filter form">
      <div className="input">
        <label>PF_NO</label>
        <div className="input-inner">
          <span className="icon"><FaIdBadge /></span>
          <input value={filters.PF_NO} onChange={(e) => handleChange("PF_NO", e.target.value)} placeholder="e.g. 45436403391" />
        </div>
      </div>

      <div className="input">
        <label>BILL_UNIT</label>
        <div className="input-inner">
          <span className="icon"><FaBuilding /></span>
          <input value={filters.BILL_UNIT} onChange={(e) => handleChange("BILL_UNIT", e.target.value)} placeholder="e.g. 3604908" />
        </div>
      </div>

      <div className="input">
        <label>DESIG</label>
        <div className="input-inner">
          <span className="icon"><FaBriefcase /></span>
          <input value={filters.DESIG} onChange={(e) => handleChange("DESIG", e.target.value)} placeholder="e.g. T/MAN" />
        </div>
      </div>

      <div className="input">
        <label>STATION</label>
        <div className="input-inner">
          <span className="icon"><FaMapMarkerAlt /></span>
          <input value={filters.STATION} onChange={(e) => handleChange("STATION", e.target.value)} placeholder="e.g. AKLA" />
        </div>
      </div>

      <div className="input">
        <label>BOOTH</label>
        <div className="input-inner">
          <span className="icon"><FaMapSigns /></span>
          <input value={filters.BOOTH} onChange={(e) => handleChange("BOOTH", e.target.value)} placeholder="e.g. SSE/PW/N/KOTA" />
        </div>
      </div>

      <div className="controls" style={{ marginLeft: 8 }}>
        <button className="btn" type="submit">Search</button>
        <button className="btn ghost" type="button" onClick={() => { setFilters({ PF_NO: "", BILL_UNIT: "", DESIG: "", STATION: "", BOOTH: "" }); onSearch(); }}>Reset</button>

        {/* Theme toggle */}
        <div className="theme-toggle" onClick={toggleTheme} title="Toggle dark mode">
          <div className="toggle-switch"><div className="toggle-dot" /></div>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>{document.body.classList.contains("dark") ? <FaMoon /> : <FaSun />}</span>
        </div>
      </div>
    </form>
  );
}
