const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const company = require('../config/companyInfo');
const logger = require('../utils/logger');

const DOCS_DIR = path.join(__dirname, '..', 'uploads', 'invoices');
fs.mkdirSync(DOCS_DIR, { recursive: true });

// Brand palette
const INK = '#2D241E';
const MUTED = '#7b6a5f';
const ACCENT = '#c76600';
const LINE = '#E6DED3';

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

// Price on the storefront is GST-inclusive; derive the taxable value + tax.
function taxBreakup(total) {
  const taxable = total / (1 + company.gstRate);
  const gst = total - taxable;
  return { taxable, cgst: gst / 2, sgst: gst / 2, gst };
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

function header(doc, title) {
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(22).text(company.brand, 50, 50);
  doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(9).text('THOUGHTFUL SUN PROTECTION', 50, 76);
  doc
    .fillColor(MUTED)
    .font('Helvetica')
    .fontSize(8.5)
    .text(company.legalName, 300, 50, { align: 'right' })
    .text(company.addressLines.join('\n'), 300, 64, { align: 'right' })
    .text(`GSTIN: ${company.gstin}`, 300, 104, { align: 'right' })
    .text(`${company.email}  |  ${company.website}`, 300, 116, { align: 'right' });

  doc.moveTo(50, 140).lineTo(545, 140).strokeColor(LINE).lineWidth(1).stroke();
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(15).text(title, 50, 152);
}

function metaRow(doc, leftPairs, rightPairs, y) {
  const draw = (pairs, x) => {
    let yy = y;
    pairs.forEach(([k, v]) => {
      doc.fillColor(MUTED).font('Helvetica').fontSize(8.5).text(k.toUpperCase(), x, yy);
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(10).text(String(v), x, yy + 11, { width: 230 });
      yy += 32;
    });
    return yy;
  };
  const l = draw(leftPairs, 50);
  const r = draw(rightPairs, 320);
  return Math.max(l, r);
}

function billTo(doc, ship, y) {
  doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8.5).text('BILL TO / SHIP TO', 50, y);
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(11).text(ship.fullName || '—', 50, y + 13);
  const addr = [
    [ship.houseNo, ship.buildingName].filter(Boolean).join(', '),
    [ship.street, ship.landmark].filter(Boolean).join(', '),
    `${ship.city || ''}, ${ship.state || ''} ${ship.pincode || ship.pinCode || ''}`,
    ship.country || 'India',
    ship.phone ? `Phone: ${ship.phone}` : '',
  ].filter(Boolean);
  doc.fillColor(MUTED).font('Helvetica').fontSize(9).text(addr.join('\n'), 50, y + 28, { width: 260 });
  return y + 28 + addr.length * 12 + 14;
}

function itemsTable(doc, items, y) {
  const cols = { name: 50, hsn: 300, qty: 360, rate: 410, amt: 480 };
  doc.rect(50, y, 495, 22).fill('#F6EFE4');
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(8.5);
  doc.text('ITEM', cols.name + 6, y + 7);
  doc.text('HSN', cols.hsn, y + 7);
  doc.text('QTY', cols.qty, y + 7);
  doc.text('RATE', cols.rate, y + 7);
  doc.text('AMOUNT', cols.amt, y + 7, { width: 60, align: 'right' });
  let yy = y + 28;
  items.forEach((it) => {
    const amount = (it.price || 0) * (it.quantity || 1);
    doc.fillColor(INK).font('Helvetica').fontSize(9.5).text(it.name, cols.name + 6, yy, { width: 240 });
    doc.fillColor(MUTED).fontSize(9);
    doc.text(company.hsn, cols.hsn, yy);
    doc.text(String(it.quantity || 1), cols.qty, yy);
    doc.text(inr(it.price), cols.rate, yy, { width: 60 });
    doc.fillColor(INK).font('Helvetica-Bold').text(inr(amount), cols.amt, yy, { width: 60, align: 'right' });
    yy += 22;
    doc.moveTo(50, yy - 4).lineTo(545, yy - 4).strokeColor(LINE).lineWidth(0.5).stroke();
  });
  return yy + 6;
}

function totals(doc, order, y) {
  const { taxable, cgst, sgst } = taxBreakup(order.totalPrice);
  const rows = [
    ['Taxable Value', inr(taxable)],
    [`CGST (${(company.gstRate * 50).toFixed(1)}%)`, inr(cgst)],
    [`SGST (${(company.gstRate * 50).toFixed(1)}%)`, inr(sgst)],
    ['Shipping', order.shippingPrice ? inr(order.shippingPrice) : 'FREE'],
  ];
  let yy = y;
  rows.forEach(([k, v]) => {
    doc.fillColor(MUTED).font('Helvetica').fontSize(9.5).text(k, 330, yy);
    doc.fillColor(INK).text(v, 460, yy, { width: 85, align: 'right' });
    yy += 18;
  });
  doc.rect(330, yy + 2, 215, 26).fill(INK);
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(11).text('GRAND TOTAL', 338, yy + 10);
  doc.text(inr(order.totalPrice), 460, yy + 10, { width: 79, align: 'right' });
  doc.fillColor(MUTED).font('Helvetica').fontSize(7.5).text('(Inclusive of all taxes)', 330, yy + 32);
  return yy + 46;
}

function footer(doc) {
  const y = 760;
  doc.moveTo(50, y).lineTo(545, y).strokeColor(LINE).lineWidth(1).stroke();
  doc
    .fillColor(MUTED)
    .font('Helvetica')
    .fontSize(7.5)
    .text(
      `This is a computer-generated document and does not require a signature.  ${company.legalName}  |  GSTIN ${company.gstin}  |  ${company.website}`,
      50,
      y + 8,
      { width: 495, align: 'center' }
    );
}

async function generateInvoice(order, user) {
  const date = new Date();
  const invoiceNumber = docNumber('INV', order, date);
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  header(doc, 'TAX INVOICE');
  let y = metaRow(
    doc,
    [
      ['Invoice No.', invoiceNumber],
      ['Order ID', String(order._id)],
    ],
    [
      ['Invoice Date', date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
      ['Payment Status', (order.paymentInfo?.status || 'paid').toUpperCase()],
    ],
    178
  );
  y = billTo(doc, order.shippingInfo || {}, y + 6);
  y = itemsTable(doc, order.orderItems || [], y);
  totals(doc, order, y);
  footer(doc);
  const filename = `invoice-${order._id}-${Date.now().toString(36)}.pdf`;
  const url = await writeFile(doc, filename);
  return { url, invoiceNumber };
}

async function generateReceipt(order, user) {
  const date = new Date();
  const receiptNumber = docNumber('RCPT', order, date);
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  header(doc, 'PAYMENT RECEIPT');

  // Big PAID badge
  doc.roundedRect(420, 152, 125, 30, 6).fill('#1f7a4d');
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(13).text('PAYMENT RECEIVED', 420, 160, { width: 125, align: 'center' });

  let y = metaRow(
    doc,
    [
      ['Receipt No.', receiptNumber],
      ['Order ID', String(order._id)],
      ['Customer', order.shippingInfo?.fullName || user?.name || '—'],
    ],
    [
      ['Receipt Date', date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
      ['Payment Method', 'Razorpay'],
      ['Payment ID', order.paymentInfo?.razorpay_payment_id || '—'],
    ],
    200
  );

  doc.rect(50, y + 6, 495, 22).fill('#F6EFE4');
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(8.5);
  doc.text('DESCRIPTION', 56, y + 13);
  doc.text('AMOUNT', 485, y + 13, { width: 60, align: 'right' });
  doc.fillColor(INK).font('Helvetica').fontSize(10).text('Order Payment — ' + (order.orderItems || []).map((i) => i.name).join(', '), 56, y + 38, { width: 360 });
  doc.font('Helvetica-Bold').text(inr(order.totalPrice), 485, y + 38, { width: 60, align: 'right' });

  doc.rect(330, y + 70, 215, 28).fill(INK);
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(11).text('AMOUNT PAID', 338, y + 80);
  doc.text(inr(order.totalPrice), 460, y + 80, { width: 79, align: 'right' });

  footer(doc);
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
