// Single source of truth for legal/company details printed on invoices &
// receipts. Mirrors the Tax Invoice template (Backend/templates/Tax Invoice.numbers).
module.exports = {
  legalName: 'Solivaguard Private Limited',
  brand: 'SOLIVA',
  gstin: '27ABSCS3485P1Z6',
  addressLines: [
    'D-12, Shourya Estate, Suman Sankul,',
    'Beltarodi, Pipla, Nagpur,',
    'Maharashtra - 440034, India',
  ],
  email: 'admin@solivaguard.com',
  phone: '+91 73506 40608',
  website: 'www.solivaguard.com',
  state: 'Maharashtra',
  stateCode: '27',
  // GST is included in the listed price; the rate is used only to show the
  // tax break-up on documents (CGST + SGST for intra-state, Maharashtra).
  gstRate: 0.05,
  hsn: '6505', // HSN for headwear / made-up textile articles
};
