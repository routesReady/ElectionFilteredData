import React, { useEffect, useState } from "react";
import axios from "axios";
import Banner from "./components/Banner";
import FilterForm from "./components/FilterForm";
import DataTable from "./components/DataTable";
import Footer from "./components/Footer";

export default function App() {
  const [filters, setFilters] = useState({ PF_NO: "", BILL_UNIT: "", DESIG: "", STATION: "", BOOTH: "" });
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const limit = 10;

  const fetchData = async (p = 1, useLoading = true) => {
    try {
      if (useLoading) setLoading(true);
      const params = { ...filters, page: p, limit };
      const q = new URLSearchParams(params).toString();
      const res = await axios.get(`http://localhost:5000/api/data?${q}`);
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
      setPage(res.data.page || p);
      setSelectedRow(null); // reset selection on new data
    } catch (e) {
      console.error(e);
    } finally {
      if (useLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
    // eslint-disable-next-line
  }, []);

  return (
    <div className="app-root">
      <Banner />

      <main className="main-container">
        {/* <header className="page-header">
          <h1>Filter System</h1>
          <p className="subtitle">Filter records by PF, Unit, Designation, Station and Booth — export as PDF. Toggle dark mode with switch.</p>
        </header> */}

        {/* Sticky filter bar */}
        <div className="sticky-filter">
          <div className="filter-container card">
            <FilterForm
              filters={filters}
              setFilters={setFilters}
              onSearch={() => fetchData(1)}
            />
          </div>
        </div>

        <section className="card result-card">
          <div className="result-header">
            <div className="hint">Showing {data.length} records on this page • Total: {total}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={() => {
                const q = new URLSearchParams(filters).toString();
                window.open(`http://localhost:5000/api/export/pdf?${q}`, "_blank");
              }}>
                ⤓ Download PDF
              </button>
            </div>
          </div>

          <div className="table-area">
            <DataTable
              data={data}
              page={page}
              total={total}
              onPageChange={(p) => fetchData(p)}
              filters={filters}
              limit={limit}
              loading={loading}
              selectedRow={selectedRow}
              setSelectedRow={setSelectedRow}
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
