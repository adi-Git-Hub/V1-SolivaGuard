const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const company = require('../config/companyInfo');
const logger = require('../utils/logger');

const DOCS_DIR = path.join(__dirname, '..', 'uploads', 'invoices');
fs.mkdirSync(DOCS_DIR, { recursive: true });

// Page geometry (A4). Bordered box matching the template.
const L = 40;   // left edge
const R = 555;  // right edge
const W = R - L;

const inr = (n) =>
  'Rs. ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function financialYear(date = new Date()) {
  const y = date.getFullYear();
  const start = date.getMonth() >= 3 ? y : y - 1; // FY starts in April
  return `${String(start).slice(-2)}-${String(start + 1).slice(-2)}`;
}

function docNumber(prefix, order, date) {
  return `${prefix}/${financialYear(date)}/${String(order._id).slice(-6).toUpperCase()}`;
}

// Price is GST-inclusive (CGST 5% + SGST 5% = 10%).
function taxBreakup(total) {
  const taxable = total / (1 + company.gstRate);
  const gst = total - taxable;
  return { taxable, cgst: gst / 2, sgst: gst / 2 };
}

/* Indian-format amount in words (rupees). */
function numToWords(num) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (n) => (n < 20 ? a[n] : b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : ''));
  const three = (n) => (Math.floor(n / 100) ? a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + two(n % 100) : '') : two(n % 100));
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  if (rupees === 0 && paise === 0) return 'Zero Rupees Only';
  let n = rupees, out = '';
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  if (crore) out += three(crore) + ' Crore ';
  if (lakh) out += two(lakh) + ' Lakh ';
  if (thousand) out += two(thousand) + ' Thousand ';
  if (n) out += three(n);
  out = out.trim() + ' Rupees';
  if (paise) out += ' and ' + two(paise) + ' Paise';
  return out + ' Only';
}

function writeFile(doc, filename) {
  return new Promise((resolve, reject) => {
    const full = path.join(DOCS_DIR, filename);
    const stream = fs.createWriteStream(full);
    doc.pipe(stream);
    stream.on('finish', () => resolve(`/uploads/invoices/${filename}`));
    stream.on('error', reject);
    doc.end();
  });
}

// Drawing helpers
const box = (doc, x, y, w, h) => doc.rect(x, y, w, h).strokeColor('#000').lineWidth(0.8).stroke();
const hline = (doc, y, x1 = L, x2 = R) => doc.moveTo(x1, y).lineTo(x2, y).strokeColor('#000').lineWidth(0.8).stroke();
const vline = (doc, x, y1, y2) => doc.moveTo(x, y1).lineTo(x, y2).strokeColor('#000').lineWidth(0.8).stroke();

function companyHeader(doc, title) {
  let y = 40;
  box(doc, L, y, W, 18);
  doc.fillColor('#000').font('Helvetica').fontSize(10).text(title, L, y + 5, { width: W, align: 'center' });
  y += 18;
  // company block
  box(doc, L, y, W, 62);
  doc.font('Helvetica-Bold').fontSize(17).text(company.legalName, L, y + 7, { width: W, align: 'center' });
  doc.font('Helvetica').fontSize(8.5).text(company.addressLines.join('\n'), L, y + 30, { width: W, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(9).text(`GSTIN ${company.gstin}`, L, y + 51, { width: W, align: 'center' });
  return y + 62;
}

function footerBlock(doc, order, total, y) {
  // Amount in words
  box(doc, L, y, W, 30);
  doc.font('Helvetica').fontSize(8).text('Amount Chargeable (in words)', L + 6, y + 5);
  doc.font('Helvetica-Bold').fontSize(9.5).text(numToWords(total), L + 6, y + 16, { width: W - 12 });
  y += 30;
  // PAN + signatory
  box(doc, L, y, W, 56);
  vline(doc, 330, y, y + 56);
  doc.font('Helvetica').fontSize(8.5).text(`Entity's PAN: `, L + 6, y + 8, { continued: true }).font('Helvetica-Bold').text(company.pan);
  doc.font('Helvetica').fontSize(7.5).fillColor('#444').text('Declaration: We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.', L + 6, y + 24, { width: 280 });
  doc.fillColor('#000').font('Helvetica-Bold').fontSize(9).text(`For ${company.legalName}`, 340, y + 8, { width: 209, align: 'right' });
  doc.font('Helvetica').fontSize(8.5).text('Authorised Signatory', 340, y + 42, { width: 209, align: 'right' });
  return y + 56;
}

async function generateInvoice(order, user) {
  const date = new Date();
  const invoiceNumber = docNumber('INV', order, date);
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  let y = companyHeader(doc, 'TAX INVOICE');

  // Meta row: Bill to | Place of Supply | INVOICE No | Dated
  const mh = 92;
  box(doc, L, y, W, mh);
  vline(doc, 220, y, y + mh);
  vline(doc, 350, y, y + mh);
  vline(doc, 450, y, y + mh);
  // top labels for the right two columns
  hline(doc, y + 18, 350, R);
  doc.font('Helvetica-Bold').fontSize(8.5);
  doc.text('Bill to', L + 6, y + 5);
  doc.text('Place of Supply', 226, y + 5);
  doc.text('INVOICE No', 356, y + 5, { width: 94, align: 'center' });
  doc.text('Dated', 456, y + 5, { width: 93, align: 'center' });
  // values
  const ship = order.shippingInfo || {};
  doc.font('Helvetica-Bold').fontSize(10).text(ship.fullName || (user && user.name) || '—', L + 6, y + 22, { width: 205 });
  const billAddr = [
    [ship.houseNo, ship.buildingName].filter(Boolean).join(', '),
    [ship.street, ship.landmark].filter(Boolean).join(', '),
    `${ship.city || ''}, ${ship.state || ''} - ${ship.pincode || ship.pinCode || ''}`,
    ship.phone ? `Ph: ${ship.phone}` : '',
    'GSTIN No.: -',
  ].filter(Boolean);
  doc.font('Helvetica').fontSize(8.5).text(billAddr.join('\n'), L + 6, y + 38, { width: 205 });
  doc.font('Helvetica').fontSize(9).text(company.placeOfSupply, 226, y + 22, { width: 118 });
  doc.font('Helvetica-Bold').fontSize(9).text(invoiceNumber, 356, y + 30, { width: 94, align: 'center' });
  doc.font('Helvetica').fontSize(9).text(date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 456, y + 30, { width: 93, align: 'center' });
  y += mh;

  // Items header
  const ih = 18;
  box(doc, L, y, W, ih);
  vline(doc, 350, y, y + ih);
  vline(doc, 450, y, y + ih);
  doc.font('Helvetica-Bold').fontSize(8.5);
  doc.text('Description of Services', L + 6, y + 5);
  doc.text('HSN / SAC', 356, y + 5, { width: 94, align: 'center' });
  doc.text('Amount', 456, y + 5, { width: 93, align: 'right' });
  y += ih;

  // Items body (fixed tall block like the template)
  const bodyH = 230;
  box(doc, L, y, W, bodyH);
  vline(doc, 350, y, y + bodyH);
  vline(doc, 450, y, y + bodyH);
  let iy = y + 8;
  (order.orderItems || []).forEach((it) => {
    const amount = (it.price || 0) * (it.quantity || 1);
    doc.font('Helvetica').fontSize(9.5).fillColor('#000').text(`${it.name}  x ${it.quantity || 1}`, L + 6, iy, { width: 300 });
    doc.fontSize(9).text(company.hsn, 356, iy, { width: 94, align: 'center' });
    doc.text(inr(amount), 456, iy, { width: 93, align: 'right' });
    iy += 20;
  });
  y += bodyH;

  // Totals block
  const { taxable, cgst, sgst } = taxBreakup(order.totalPrice);
  const rows = [
    ['Total', '', inr(taxable), true],
    ['ADD CGST 5%', '5%', inr(cgst), false],
    ['ADD SGST 5%', '5%', inr(sgst), false],
  ];
  rows.forEach(([label, pct, amt, bold]) => {
    const rh = 18;
    box(doc, L, y, W, rh);
    vline(doc, 350, y, y + rh);
    vline(doc, 450, y, y + rh);
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica-Bold').fontSize(9).text(label, L + 6, y + 5);
    doc.font('Helvetica').text(pct, 356, y + 5, { width: 94, align: 'center' });
    doc.font('Helvetica-Bold').text(amt, 456, y + 5, { width: 93, align: 'right' });
    y += rh;
  });
  // Grand total
  const gh = 22;
  doc.rect(L, y, W, gh).fillAndStroke('#F2EAdf', '#000');
  vline(doc, 450, y, y + gh);
  doc.fillColor('#000').font('Helvetica-Bold').fontSize(10.5).text('Total', L + 6, y + 6);
  doc.text(inr(order.totalPrice), 456, y + 6, { width: 93, align: 'right' });
  y += gh;

  footerBlock(doc, order, order.totalPrice, y + 4);

  const filename = `invoice-${order._id}-${Date.now().toString(36)}.pdf`;
  const url = await writeFile(doc, filename);
  return { url, invoiceNumber };
}

async function generateReceipt(order, user) {
  const date = new Date();
  const receiptNumber = docNumber('RCPT', order, date);
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  let y = companyHeader(doc, 'PAYMENT RECEIPT');

  // PAID stamp
  doc.save().rotate(-12, { origin: [430, y + 50] });
  doc.roundedRect(360, y + 30, 150, 34, 6).lineWidth(2).strokeColor('#1f7a4d').stroke();
  doc.fillColor('#1f7a4d').font('Helvetica-Bold').fontSize(16).text('PAID', 360, y + 40, { width: 150, align: 'center' });
  doc.restore();

  // Meta
  const mh = 88;
  box(doc, L, y, W, mh);
  vline(doc, 300, y, y + mh);
  const left = [
    ['Receipt No.', receiptNumber],
    ['Order ID', String(order._id)],
    ['Received From', order.shippingInfo?.fullName || (user && user.name) || '—'],
  ];
  const right = [
    ['Receipt Date', date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
    ['Payment Method', 'Razorpay'],
    ['Payment ID', order.paymentInfo?.razorpay_payment_id || '—'],
  ];
  const draw = (pairs, x, w) => {
    let yy = y + 8;
    pairs.forEach(([k, v]) => {
      doc.fillColor('#555').font('Helvetica').fontSize(8).text(k.toUpperCase(), x + 6, yy);
      doc.fillColor('#000').font('Helvetica-Bold').fontSize(9.5).text(String(v), x + 6, yy + 10, { width: w - 12 });
      yy += 26;
    });
  };
  draw(left, L, 260);
  draw(right, 300, 255);
  y += mh;

  // Amount paid line
  box(doc, L, y, W, 22);
  vline(doc, 450, y, y + 22);
  doc.fillColor('#000').font('Helvetica-Bold').fontSize(9).text('Description', L + 6, y + 6);
  doc.text('Amount', 456, y + 6, { width: 93, align: 'right' });
  y += 22;
  box(doc, L, y, W, 30);
  vline(doc, 450, y, y + 30);
  doc.font('Helvetica').fontSize(9.5).text('Order Payment — ' + (order.orderItems || []).map((i) => i.name).join(', '), L + 6, y + 9, { width: 400 });
  doc.font('Helvetica-Bold').text(inr(order.totalPrice), 456, y + 9, { width: 93, align: 'right' });
  y += 30;
  doc.rect(L, y, W, 24).fillAndStroke('#F2EAdf', '#000');
  vline(doc, 450, y, y + 24);
  doc.fillColor('#000').font('Helvetica-Bold').fontSize(11).text('Amount Paid', L + 6, y + 7);
  doc.text(inr(order.totalPrice), 456, y + 7, { width: 93, align: 'right' });
  y += 24;

  footerBlock(doc, order, order.totalPrice, y + 4);

  const filename = `receipt-${order._id}-${Date.now().toString(36)}.pdf`;
  const url = await writeFile(doc, filename);
  return { url, receiptNumber };
}

/**
 * Generate BOTH documents for a paid order. Never throws — logs and returns
 * what it could so a PDF hiccup never blocks order confirmation.
 */
async function generateOrderDocuments(order, user) {
  const out = {};
  try {
    const inv = await generateInvoice(order, user);
    out.invoiceUrl = inv.url;
    out.invoiceNumber = inv.invoiceNumber;
  } catch (e) {
    logger.error(`[PDF] Invoice generation failed for ${order._id}: ${e.message}`);
  }
  try {
    const rec = await generateReceipt(order, user);
    out.receiptUrl = rec.url;
    out.receiptNumber = rec.receiptNumber;
  } catch (e) {
    logger.error(`[PDF] Receipt generation failed for ${order._id}: ${e.message}`);
  }
  return out;
}

module.exports = { generateInvoice, generateReceipt, generateOrderDocuments };
