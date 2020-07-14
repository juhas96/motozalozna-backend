const fs = require("fs");
const PDFDocument = require("pdfkit");

function createInvoice(invoice, path) {
  let doc = new PDFDocument({ margin: 50 });

  generateHeader(doc);
  generateCustomerInformation(doc, invoice);
  generateInvoiceTable(doc, invoice);
  generateFooter(doc);

  doc.end();
  doc.pipe(fs.createWriteStream(path));
}

function generateHeader(doc) {
    doc
      .fillColor("#444444")
      .fontSize(20)
      .text("Motozalozna", 110, 57)
      .fontSize(10)
      .text("123 Adresa 1", 200, 65, { align: "right" })
      .text("321 Adresa 2, PSC", 200, 80, { align: "right" })
      .moveDown();
  }
  
  function generateFooter(doc) {
    doc
      .fontSize(10)
      .text(
        "Ďakujeme za Vašu požiadavku. V prípade otázok nás kontaktujte na info@motozalozna.sk",
        50,
        780,
        { align: "center", width: 500 }
      );
  }
  
