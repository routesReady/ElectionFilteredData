const express = require("express");
const cors = require("cors");
const path = require("path");
const PdfPrinter = require("pdfmake");
const { loadExcelData } = require("./dataLoader");

const app = express();
app.use(cors());
app.use(express.json());

/* -----------------------------------------
   LOAD EXCEL DATA
----------------------------------------- */
let excelData = loadExcelData();

/* -----------------------------------------
   FILTER FUNCTION
----------------------------------------- */
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

/* -----------------------------------------
   PDFMAKE DEFAULT BUILT-IN FONT (NO FILES)
----------------------------------------- */
const fonts = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};

const printer = new PdfPrinter(fonts);

/* -----------------------------------------
   GET FILTERED DATA API
----------------------------------------- */
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
    console.error("API error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* -----------------------------------------
   EXPORT FILTERED PDF (CLEAN + CONTINUOUS)
----------------------------------------- */
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

    const widths = [30, 70, 110, 110, 55, 80, 70, 60, 60];

    const header = columns.map((col) => ({
      text: col,
      style: "tableHeader",
      alignment: "center",
    }));

    const bodyRows = rows.map((r) =>
      columns.map((c) => ({
        text: String(r[c] || ""),
        style: "tableCell",
      }))
    );

    const docDefinition = {
      pageOrientation: "landscape",
      pageMargins: [15, 25, 15, 25],

      header: {
        text: "WCRMS KOTA — Filtered Data List",
        style: "headerStyle",
        margin: [0, 10],
      },

      footer: (currentPage, pageCount) => ({
        text: `Page ${currentPage} of ${pageCount}`,
        alignment: "center",
        margin: [0, 10],
      }),

      content: [
        {
          table: {
            headerRows: 1,
            widths,
            body: [header, ...bodyRows],
          },
          layout: {
            fillColor: (rowIndex) =>
              rowIndex === 0 ? "#1e293b" : rowIndex % 2 === 0 ? "#f3f3f3" : null,
            hLineWidth: () => 0.4,
            vLineWidth: () => 0.4,
            hLineColor: () => "#b5b5b5",
            vLineColor: () => "#b5b5b5",
          },
        },
      ],

      styles: {
        headerStyle: {
          fontSize: 14,
          bold: true,
          alignment: "center",
        },
        tableHeader: {
          bold: true,
          color: "white",
          fontSize: 9,
          margin: [2, 2],
        },
        tableCell: {
          margin: [2, 2],
          fontSize: 8.5,
        },
      },

      defaultStyle: {
        font: "Helvetica",
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=filtered-data.pdf");

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) {
    console.error("PDF error:", err);
    res.status(500).json({ error: "PDF generation failed" });
  }
});

/* -----------------------------------------
   ROOT ROUTE
----------------------------------------- */
app.get("/", (req, res) => {
  res.send("🚀 Backend is running!");
});

/* -----------------------------------------
   START SERVER
----------------------------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🔥 Server running on port ${PORT}`)
);
