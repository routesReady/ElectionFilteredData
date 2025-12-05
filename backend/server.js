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
   PDFMAKE FONTS (Render Compatible)
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
   API: GET FILTERED DATA + PAGINATION
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

/* ------------------------------------------------------------------
   STREAM-OPTIMIZED PDF EXPORT (NO 502 ERROR)
   Supports 8,844+ rows without crashing Render
------------------------------------------------------------------ */
app.get("/api/export/pdf", (req, res) => {
  try {
    const filtered = applyFilters(excelData, req.query);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=filtered-data.pdf"
    );

    const doc = printer.createPdfKitDocument({
      pageOrientation: "landscape",
      pageMargins: [20, 40, 20, 40],
      watermark: {
        text: "WCRMS KOTA",
        opacity: 0.22,
        bold: true,
        color: "black",
        angle: -35
      }
    });

    doc.pipe(res);

    // Title
    doc.fontSize(15).font("Roboto-Bold").text("Filtered Data List", { align: "center" });
    doc.moveDown(1);

    // Columns & widths
    const columns = [
      "SR_No", "PF_NO", "NAME", "FATHER_NAME",
      "BILL_UNIT", "DESIG", "MOBILE_NO",
      "STATION", "BOOTH"
    ];
    const colWidths = [35, 70, 120, 120, 60, 80, 90, 70, 70];

    // Draw header row
    let headerY = doc.y;
    columns.forEach((col, i) => {
      const x = 20 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc
        .rect(x, headerY, colWidths[i], 18)
        .fill("#1e293b");
      doc
        .fillColor("white")
        .font("Roboto-Bold")
        .fontSize(9)
        .text(col, x + 3, headerY + 4, { width: colWidths[i] });
    });

    doc.moveDown(2);
    let y = doc.y;

    /* STREAM ROWS ONE-BY-ONE (Memory Efficient) */
    filtered.forEach((row, idx) => {
      const rowData = [
        idx + 1,
        row.PF_NO,
        row.NAME,
        row.FATHER_NAME,
        row.BILL_UNIT,
        row.DESIG,
        row.MOBILE_NO,
        row.STATION,
        row.BOOTH
      ];

      // Row shading
      if (idx % 2 === 0) {
        doc.rect(20, y - 2, colWidths.reduce((a, b) => a + b, 0), 16)
          .fillOpacity(0.12)
          .fill("#dbeafe")
          .fillOpacity(1);
      }

      // Write row data
      rowData.forEach((cell, i) => {
        const x = 20 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc
          .font("Roboto-Regular")
          .fontSize(8.5)
          .fillColor("#000")
          .text(String(cell || ""), x + 3, y, { width: colWidths[i] });
      });

      y += 16;

      // Page break logic
      if (y > 530) {
        doc.addPage({ pageOrientation: "landscape", margin: 40 });
        y = 60;

        // redraw header
        const newHeaderY = y - 20;
        columns.forEach((col, i) => {
          const x = 20 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          doc.rect(x, newHeaderY, colWidths[i], 18).fill("#1e293b");
          doc.fillColor("white").font("Roboto-Bold").fontSize(9).text(col, x + 3, newHeaderY + 4);
        });

        y += 20;
      }
    });

    doc.end();

  } catch (err) {
    console.error("PDF Error:", err);
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
   START SERVER (Render Compatible)
----------------------------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));
