import React from "react";

export default function DataTable({ data, page, total, onPageChange, filters, limit, loading, selectedRow, setSelectedRow }) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || 10)));

  if (loading) {
    return (
      <div className="loader-wrap">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <div className="table-area">
        {data && data.length > 0 ? (
          <table className="table" role="table">
            <thead>
              <tr>
                {Object.keys(data[0]).map((k) => <th key={k} className={k === "SR_No" ? "sr" : ""}>{k}</th>)}
              </tr>
            </thead>

            <tbody>
              {data.map((row, idx) => {
                const rowKey = row.SR_No || idx;
                const isSelected = selectedRow === rowKey;
                return (
                  <tr key={idx} className={isSelected ? "selected" : ""} onClick={() => setSelectedRow(isSelected ? null : rowKey)} style={{ cursor: "pointer" }}>
                    {Object.keys(row).map((c) => <td key={c}>{row[c]}</td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p style={{ padding: 18, color: "var(--muted)", textAlign: "center" }}>No records found</p>
        )}
      </div>

      <div className="pagination" role="navigation">
        <button className="page-btn" onClick={() => onPageChange(1)} disabled={page === 1}>First</button>
        <button className="page-btn" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>‹ Prev</button>
        <div className="page-info">Page {page} of {totalPages}</div>
        <button className="page-btn" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>Next ›</button>
        <button className="page-btn" onClick={() => onPageChange(totalPages)} disabled={page === totalPages}>Last</button>
      </div>
    </>
  );
}
