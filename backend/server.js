const express = require("express");
const cors = require("cors");
const path = require("path");
const PdfPrinter = require("pdfmake");
const { loadExcelData } = require("./dataLoader");

const app = express();
app.use(cors());
app.use(express.json());

/* ==========================================================
   LOAD EXCEL SHEET INTO MEMORY
========================================================== */
let excelData = loadExcelData();

/* ==========================================================
   FILTER UTILITY
========================================================== */
function applyFilters(data, query) {
  let filtered = [...data];
  const keys = ["PF_NO", "BILL_UNIT", "DESIG", "STATION", "BOOTH"];

  keys.forEach((k) => {
    if (query[k]) {
      const q = String(query[k]).toLowerCase();
      filtered = filtered.filter((row) =>
        String(row[k] || "").toLowerCase().includes(q)
      );
    }
  });

  return filtered;
}

/* ==========================================================
   PDFMAKE BUILT-IN HELVETICA FONT (NO FILES REQUIRED)
========================================================== */
const fonts = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};

const printer = new PdfPrinter(fonts);

/* ==========================================================
   GET PAGINATED FILTERED API
========================================================== */
app.get("/api/data", (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const filtered = applyFilters(excelData, req.query);
    const total = filtered.length;

    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));

    const start = (p - 1) * l;
    const sliced = filtered.slice(start, start + l);

    const finalData = sliced.map((row, idx) => ({
      SR_No: start + idx + 1,
      ...row,
    }));

    res.json({ total, page: p, limit: l, data: finalData });
  } catch (err) {
    console.error("DATA API ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ==========================================================
   EXPORT FILTERED PDF (OPTIMIZED + HELVETICA)
========================================================== */
app.get("/api/export/pdf", (req, res) => {
  try {
    const filtered = applyFilters(excelData, req.query);

    const rows = filtered.map((r, i) => ({
      SR_No: i + 1,
      PF_NO: r.PF_NO,
      NAME: r.NAME,
      FATHER_NAME: r.FATHER_NAME,
      BILL_UNIT: r.BILL_UNIT,
      DESIG: r.DESIG,
      MOBILE_NO: r.MOBILE_NO,
      STATION: r.STATION,
      BOOTH: r.BOOTH,
    }));

    const columns = [
      "SR_No",
      "PF_NO",
      "NAME",
      "FATHER_NAME",
      "BILL_UNIT",
      "DESIG",
      "MOBILE_NO",
      "STATION",
      "BOOTH",
    ];

    const widths = [35, 70, 110, 110, 60, 80, 90, 70, 70];

    /* ---------- Build Table Header ---------- */
    const tableHeaders = columns.map((col) => ({
      text: col,
      style: "tableHeader",
    }));

    /* ---------- Build Table Rows (Efficient) ---------- */
    const tableRows = rows.map((r) =>
      columns.map((col) => ({
        text: String(r[col] || ""),
        style: "tableCell",
      }))
    );

    /* ==================================================
       PDF DEFINITION
    ================================================== */
    const docDefinition = {
      pageOrientation: "landscape",
      pageMargins: [40, 70, 40, 50],

      defaultStyle: { font: "Helvetica" }, // ⭐ FIXED FONT FAMILY

      header: {
        text: "WCRMS KOTA — Employee Filtered Data Report",
        alignment: "center",
        margin: [0, 25, 0, 10],
        fontSize: 16,
        bold: true,
      },

      footer: (currentPage, pageCount) => ({
        columns: [
          {
            text: "Created By: M. A. Khan | 9001015311",
            alignment: "left",
            margin: [40, 0, 0, 0],
            fontSize: 10,
            color: "#444",
          },
          {
            text: `Page ${currentPage} of ${pageCount}`,
            alignment: "right",
            margin: [0, 0, 40, 0],
            fontSize: 10,
            color: "#444",
          },
        ],
      }),

      watermark: {
        text: "WCRMS KOTA",
        color: "black",
        opacity: 0.22,
        bold: true,
        angle: -45,
      },

      content: [
        {
          alignment: "center", // ⭐ CENTER TABLE
          table: {
            headerRows: 1,
            widths,
            body: [tableHeaders, ...tableRows],
          },
          layout: {
            fillColor: (rowIndex) =>
              rowIndex % 2 === 0 ? "#f5f5f5" : null,
            hLineWidth: () => 0.7,
            vLineWidth: () => 0.7,
            hLineColor: () => "#bfbfbf",
            vLineColor: () => "#bfbfbf",
          },
        },
      ],

      styles: {
        tableHeader: {
          fillColor: "#0f172a",
          color: "white",
          bold: true,
          fontSize: 10,
          margin: 4,
        },
        tableCell: {
          fontSize: 9,
          margin: 3,
        },
      },
    };

    /* ---------- STREAM PDF SAFELY ---------- */
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=filtered-data.pdf"
    );

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).json({ error: "PDF generation failed" });
  }
});

/* ==========================================================
   ROOT ROUTE
========================================================== */
app.get("/", (req, res) => {
  res.send("🚀 Backend is running successfully!");
});

/* ==========================================================
   START SERVER
========================================================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🔥 Backend running on port ${PORT}`)
);
