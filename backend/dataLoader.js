const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

/**
 * Load Excel sheet safely (Render compatible)
 */
function loadExcelData() {
  try {
    // Stable absolute path for Render
    const filePath = path.join(__dirname, "JCCS_FINAL.xlsx");

    // Debug: check if file exists
    if (!fs.existsSync(filePath)) {
      console.error("❌ Excel file NOT FOUND at:", filePath);
      return [];
    }

    console.log("✓ Excel loaded from:", filePath);

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    // Remove SR_No variations
    const cleaned = raw.map(row => {
      const r = { ...row };
      delete r.SR_No;
      delete r.SR_NO;
      delete r.Sr_No;
      return r;
    });

    return cleaned;

  } catch (err) {
    console.error("Excel load error:", err);
    return [];
  }
}

module.exports = { loadExcelData };
