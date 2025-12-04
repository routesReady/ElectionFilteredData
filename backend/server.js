const express = require("express");
const cors = require("cors");
const path = require("path");
const PdfPrinter = require("pdfmake");
const { loadExcelData } = require("./dataLoader");

const app = express();
app.use(cors());
app.use(express.json());

/* -----------------------------------------
   LOAD EXCEL DATA (CommonJS Safe)
----------------------------------------- */
let excelData = loadExcelData();

/* -----------------------------------------
   FILTERING FUNCTION
----------------------------------------- */
function applyFilters(data, query) {
  let filtered = [...data];
  const keys = ["PF_NO", "BILL_UNIT", "DESIG", "STATION", "BOOTH"];

  keys.forEach(k => {
    if (query[k]) {
      const q = String(query[k]).toLowerCase();
      filtered = filtered.filter(row =>
        String(row[k] || "").toLowerCase().includes(q)
      );
    }
  });

  return filtered;
}

/* -----------------------------------------
   PDFMAKE FONTS (RENDER COMPATIBLE)
----------------------------------------- */
const fonts = {
  Roboto: {
    normal: path.join(__dirname, "fonts/Roboto-Regular.ttf"),
    bold: path.join(__dirname, "fonts/Roboto-Bold.ttf"),
    italics: path.join(__dirname, "fonts/Roboto-Italic.ttf"),
    bolditalics: path.join(__dirname, "fonts/Roboto-BoldItalic.ttf")
  }
};

const printer = new PdfPrinter(fonts);

/* -----------------------------------------
   API: GET FILTERED DATA WITH PAGINATION
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
      ...row
    }));

    res.json({
      total,
      page: p,
      limit: l,
      data: finalData
    });
  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* -----------------------------------------
   API: EXPORT FILTERED PDF (FINAL)
----------------------------------------- */
app.get("/api/export/pdf", (req, res) => {
  try {
    const filtered = applyFilters(excelData, req.query);

    // Prepare rows with auto SR_No
    const rows = filtered.map((r, i) => ({
      SR_No: i + 1,
      PF_NO: r.PF_NO,
      NAME: r.NAME,
      FATHER_NAME: r.FATHER_NAME,
      BILL_UNIT: r.BILL_UNIT,
      DESIG: r.DESIG,
      MOBILE_NO: r.MOBILE_NO,
      STATION: r.STATION,
      BOOTH: r.BOOTH
    }));

    // Column order
    const columns = [
      "SR_No",
      "PF_NO",
      "NAME",
      "FATHER_NAME",
      "BILL_UNIT",
      "DESIG",
      "MOBILE_NO",
      "STATION",
      "BOOTH"
    ];

    // Column widths (landscape fit)
    const widths = [35, 70, 110, 110, 60, 80, 90, 70, 70];

    // Header row
    const tableHeaders = columns.map(col => ({
      text: col,
      style: "tableHeader"
    }));

    // Table body rows
    const tableRows = rows.map(r =>
      columns.map(col => ({
        text: String(r[col] || ""),
        style: "tableCell"
      }))
    );

    // PDF Document Definition
    const docDefinition = {
      pageOrientation: "landscape",
      pageMargins: [25, 35, 25, 35],

      watermark: {
        text: "WCRMS KOTA",
        color: "black",
        opacity: 0.22,
        bold: true,
        angle: -45
      },

      content: [
        { text: "Filtered Data List", style: "title", margin: [0, 0, 0, 12] },
        {
          table: {
            headerRows: 1,
            widths,
            body: [tableHeaders, ...tableRows]
          },
          layout: {
            fillColor: row => (row % 2 === 0 ? "#f2f2f2" : null),
            hLineWidth: () => 0.7,
            vLineWidth: () => 0.7,
            hLineColor: () => "#b5b5b5",
            vLineColor: () => "#b5b5b5"
          }
        }
      ],

      styles: {
        title: {
          fontSize: 16,
          bold: true,
          alignment: "center"
        },
        tableHeader: {
          fillColor: "#1e293b",
          color: "white",
          bold: true,
          margin: 3,
          fontSize: 10
        },
        tableCell: {
          margin: 3,
          fontSize: 9,
          color: "#000"
        }
      }
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=filtered-data.pdf"
    );

    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ error: "PDF generation failed" });
  }
});

/* -----------------------------------------
   ROOT ROUTE
----------------------------------------- */
app.get("/", (req, res) => {
  res.send("🚀 Backend is running successfully!");
});

/* -----------------------------------------
   START SERVER (Render Compatible)
----------------------------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));
