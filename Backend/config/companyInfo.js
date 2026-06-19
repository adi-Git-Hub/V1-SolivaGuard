// Single source of truth for legal/company details printed on invoices &
// receipts. Mirrors the Tax Invoice template (root: "Tax Invoice.numbers").
module.exports = {
  legalName: 'Soliva Guard Pvt Ltd',
  brand: 'SOLIVA',
  gstin: '27ABSCS3485P1Z6',
  pan: 'ABSCS3485P', // derived from GSTIN (chars 3–12)
  addressLines: [
    'D-12, Shourya Estate, Suman Sankul, Beltarodi,',
    'Nagpur, Maharashtra - 440034',
  ],
  email: 'admin@solivaguard.com',
  phone: '+91 73506 40608',
  website: 'www.solivaguard.com',
  placeOfSupply: 'Maharashtra (27)',
  state: 'Maharashtra',
  stateCode: '27',
  // Template prints CGST 5% + SGST 5% — i.e. 10% GST total, treated as
  // included in the listed price so the grand total equals what was charged.
  gstRate: 0.10,
  hsn: '6505', // HSN/SAC for headwear / made-up textile articles
};
