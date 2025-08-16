const fs = require("fs");
const PDFDocument = require("pdfkit");
const path = require("path");

async function generatePDF({
  fullName,
  phoneNumber,
  planName,
  amount,
  username,
  password,
  duration,
}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A5", // 📄 Format portrait par défaut
      layout: "portrait",
      margin: 40,
    });

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");
    const cleanName = fullName.trim().split(" ")[0].replace(/[^a-zA-Z0-9]/g, "");
    const receiptName = `${dateStr}_${timeStr}_${cleanName}.pdf`;

    const receiptsDir = path.join(__dirname, "public", "receipts");
    const filePath = path.join(receiptsDir, receiptName);

    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    const bleu = "#0a174e";
    const jaune = "#f5d042";

    // 🔷 Titre
    doc.font("Helvetica-Bold").fontSize(16).fillColor(bleu).text("RISITI YA MALIPO YA WI-FI", {
      align: "center",
    });

    doc.moveDown(1);

    // 🔹 Infos
    const ligne = (labelSw, labelEn, value) => {
      doc.font("Helvetica-Bold").fontSize(10).fillColor(bleu).text(labelSw, { continued: true });
      doc.font("Helvetica").fillColor("#000000").text(` ${value}`);
      if (labelEn) {
        doc.fontSize(8).fillColor("#666666").text(`(${labelEn})`);
      }
      doc.moveDown(0.4);
    };

    ligne("Jina:", null, fullName);
    ligne("Namba:", null, phoneNumber);
    ligne("Username:", "Wi-Fi Username", username);
    ligne("Password:", null, password);
    ligne("Kifurushi:", "Package", planName);
    ligne("Bei:", "Amount", `${amount} TZS`);
    ligne("Kuanzia:", "Start Date", now.toLocaleDateString());
    ligne("Mwisho:", "Expiry", new Date(now.getTime() + convertirDurée(duration)).toLocaleDateString());

    doc.moveDown(1);
    doc.rect(40, doc.y, 355, 25).fill(bleu);
    doc
      .fillColor(jaune)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Asante kwa kutumia huduma yetu", 40, doc.y + 7, {
        width: 355,
        align: "center",
      });

    doc.end();

    writeStream.on("finish", () => resolve(filePath));
    writeStream.on("error", reject);
  });
}

function convertirDurée(duration) {
  const map = {
    "1d": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "1h": 60 * 60 * 1000,
  };
  return map[duration] || 0;
}

module.exports = generatePDF;
