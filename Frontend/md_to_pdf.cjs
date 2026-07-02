const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { marked } = require('marked');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// Absolute file paths
const mdPath = path.join(__dirname, '..', 'PROJECT_DOCUMENTATION.md');
const pdfPath = path.join(__dirname, '..', 'PROJECT_DOCUMENTATION.pdf');
const solivaLogoPath = '/root/Soliva-final-repo/soliva details (18 x 24 in).png';
const tatveinLogoPath = '/root/Soliva-final-repo/download.png';

async function generatePDF() {
  console.log('[PDF] Starting PDF generation flow...');

  // 1. Read files
  if (!fs.existsSync(mdPath)) {
    throw new Error(`Markdown documentation not found at: ${mdPath}`);
  }
  if (!fs.existsSync(solivaLogoPath)) {
    throw new Error(`Soliva logo file not found at: ${solivaLogoPath}`);
  }
  if (!fs.existsSync(tatveinLogoPath)) {
    throw new Error(`TATVEIN logo file not found at: ${tatveinLogoPath}`);
  }

  const mdText = fs.readFileSync(mdPath, 'utf8');
  
  // Convert logos to base64 Data URLs for HTML embedding
  const solivaLogoBase64 = fs.readFileSync(solivaLogoPath).toString('base64');
  const solivaLogoDataUrl = `data:image/png;base64,${solivaLogoBase64}`;
  
  const tatveinLogoBase64 = fs.readFileSync(tatveinLogoPath).toString('base64');
  const tatveinLogoDataUrl = `data:image/png;base64,${tatveinLogoBase64}`;

  // 2. Prepare HTML content
  const parts = mdText.split(/\r?\n---\r?\n/);
  const contentMd = parts.slice(1).join('\n---\n');

  const processedContentMd = contentMd
    .replace(/file:\/\/\/root\/Soliva-final-repo\/soliva%20details%20\(18%20x%2024%20in\)\.png/g, solivaLogoDataUrl)
    .replace(/file:\/\/\/root\/Soliva-final-repo\/soliva\s+details\s+\(18\s+x\s+24\s+in\)\.png/g, solivaLogoDataUrl)
    .replace(/file:\/\/\/root\/Soliva-final-repo\/download\.png/g, tatveinLogoDataUrl);

  const contentHtml = await marked.parse(processedContentMd);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Soliva Guard Project Handover Documentation</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700&display=swap');
        
        @page {
          size: A4;
          margin-top: 3.5cm;
          margin-bottom: 3.5cm;
          margin-left: 2cm;
          margin-right: 2cm;
        }
        
        @page :first {
          margin: 0px !important;
        }

        body {
          font-family: 'Inter', sans-serif;
          color: #0f172a;
          line-height: 1.6;
          font-size: 10.5pt;
          margin: 0;
          padding: 0;
          background: #ffffff;
        }

        .cover-page {
          height: 100vh;
          padding: 3.5cm 2cm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-start;
          background: #ffffff;
          page-break-after: always;
        }

        .content-container {
          padding: 0;
        }

        h1, h2, h3, h4 {
          font-family: 'Montserrat', sans-serif;
          color: #0f172a;
          page-break-inside: avoid;
        }
        
        h2 {
          font-size: 16pt;
          font-weight: 700;
          color: #0f172a;
          margin-top: 2cm;
          border-bottom: 2px solid #ff7a00;
          padding-bottom: 8px;
          page-break-before: always;
        }
        h2:first-of-type {
          page-break-before: avoid;
        }

        h3 {
          font-size: 12pt;
          font-weight: 600;
          color: #0f172a;
          margin-top: 1cm;
          margin-bottom: 0.4cm;
        }

        p, li {
          color: #334155;
          font-size: 10.5pt;
          text-align: justify;
        }
        ul, ol {
          padding-left: 20px;
          margin: 10px 0;
        }
        li {
          margin-bottom: 6px;
        }
        ul {
          list-style-type: square;
        }
        li::marker {
          color: #ff7a00;
        }

        a {
          color: #ff7a00;
          text-decoration: none;
          font-weight: 500;
        }
        a:hover {
          text-decoration: underline;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 24px 0;
          font-size: 9.5pt;
          page-break-inside: auto;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        th, td {
          border: 1px solid #e2e8f0;
          padding: 10px 14px;
          text-align: left;
          vertical-align: middle;
        }
        th {
          background-color: #0f172a;
          color: #ffffff;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 8.5pt;
          letter-spacing: 0.5px;
          border: 1px solid #0f172a;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }

        code {
          font-family: 'Courier New', Courier, monospace;
          background: #f1f5f9;
          padding: 2px 5px;
          border-radius: 4px;
          font-size: 8.5pt;
          color: #0f172a;
        }

        .center-text {
          text-align: center;
        }
        .logo-container {
          text-align: center;
          margin: 1.5cm 0;
          page-break-inside: avoid;
        }
        .logo-container img {
          max-width: 220px;
          height: auto;
        }
      </style>
    </head>
    <body>
      <!-- Custom Cover Page -->
      <div class="cover-page">
        <!-- Top Left: Soliva Guard Logo -->
        <div class="cover-logo-container" style="text-align: left; width: 100%;">
          <img src="${solivaLogoDataUrl}" alt="Soliva Guard Logo" style="max-height: 80px; width: auto; object-fit: contain;"/>
        </div>
        
        <!-- Main Title and Subtitle -->
        <div class="cover-title-container" style="text-align: left; width: 100%; margin-top: 2.5cm; margin-bottom: 2.5cm;">
          <h1 style="font-family: 'Montserrat', sans-serif; font-size: 36pt; font-weight: 700; color: #0f172a; margin: 0; line-height: 1.15; letter-spacing: -0.5px; text-transform: uppercase;">
            <span style="color: #ff7a00;">Soliva Guard</span><br/>
            <span style="font-size: 24pt; font-weight: 500; color: #475569; letter-spacing: 0px; text-transform: none;">E-Commerce Platform</span>
          </h1>
          <div style="width: 80px; height: 4px; background-color: #ff7a00; margin-top: 20px; margin-bottom: 20px;"></div>
          <h2 style="font-family: 'Montserrat', sans-serif; font-size: 16pt; font-weight: 600; color: #0f172a; margin: 0; letter-spacing: 1.5px; text-transform: uppercase;">
            Project Handover Documentation
          </h2>
        </div>
        
        <!-- Metadata -->
        <div class="cover-metadata-container" style="width: 100%; display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto;">
          <div style="border-left: 3px solid #ff7a00; padding-left: 20px; font-size: 10.5pt; color: #334155; line-height: 1.6;">
            <p style="margin: 4px 0;"><span style="color: #64748b; font-weight: 500;">Prepared For:</span> <strong style="color: #0f172a;">Soliva Guard</strong></p>
            <p style="margin: 4px 0;"><span style="color: #64748b; font-weight: 500;">Developed By:</span> <strong style="color: #0f172a;">TATVEIN Technologies</strong></p>
            <p style="margin: 4px 0;"><span style="color: #64748b; font-weight: 500;">Version:</span> <strong style="color: #0f172a;">1.0</strong></p>
            <p style="margin: 4px 0;"><span style="color: #64748b; font-weight: 500;">Status:</span> <strong style="color: #ff7a00; font-weight: 600;">Production Ready & Delivered</strong></p>
            <p style="margin: 4px 0;"><span style="color: #64748b; font-weight: 500;">Date:</span> <strong style="color: #0f172a;">June 2026</strong></p>
          </div>
          <!-- Cover Page Footer (Right bottom) -->
          <div style="text-align: right; line-height: 1.4;">
            <span style="font-size: 7.5pt; color: #94a3b8; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Powered By</span><br/>
            <img src="${tatveinLogoDataUrl}" style="height: 35px; width: auto; object-fit: contain; margin-top: 5px;"/>
          </div>
        </div>
      </div>

      <!-- Main Document Content -->
      <div class="content-container">
        ${contentHtml}
      </div>
    </body>
    </html>
  `;

  // 3. Launch Puppeteer
  console.log('[PDF] Launching browser container...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Set HTML payload
  console.log('[PDF] Loading HTML payload...');
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  // Print raw PDF without headers/footers. We will draw them manually on page 2 onwards.
  console.log('[PDF] Generating raw PDF content...');
  const rawPdfBytes = await page.pdf({
    format: 'A4',
    displayHeaderFooter: false,
    printBackground: true,
    preferCSSPageSize: true
  });

  await browser.close();

  // 4. Use pdf-lib to load and stamp headers/footers
  console.log('[PDF] Loading generated PDF into pdf-lib...');
  const pdfDoc = await PDFDocument.load(rawPdfBytes);
  const pages = pdfDoc.getPages();
  
  // Embed logos
  const solivaLogoBytes = fs.readFileSync(solivaLogoPath);
  const tatveinLogoBytes = fs.readFileSync(tatveinLogoPath);
  const solivaImage = await pdfDoc.embedPng(solivaLogoBytes);
  const tatveinImage = await pdfDoc.embedPng(tatveinLogoBytes);

  // Calculate dynamic widths keeping aspect ratio
  const solivaScale = 15 / solivaImage.height;
  const solivaWidth = solivaImage.width * solivaScale;

  const tatveinScale = 12 / tatveinImage.height;
  const tatveinWidth = tatveinImage.width * tatveinScale;

  // Embed Helvetica fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  console.log(`[PDF] Stamping headers and footers on ${pages.length - 1} content pages...`);
  
  // Loop through pages, skipping the cover page (index 0)
  for (let i = 1; i < pages.length; i++) {
    const currentPage = pages[i];
    const { width, height } = currentPage.getSize();
    
    // LEFT MARGIN: 2cm = 56.7 points
    // RIGHT MARGIN: 2cm = 56.7 points
    const leftX = 56.7;
    const rightBoundary = width - 56.7;

    // ---------------- HEADER ----------------
    // Draw Soliva logo at top left
    currentPage.drawImage(solivaImage, {
      x: leftX,
      y: height - 42,
      width: solivaWidth,
      height: 15
    });

    // Draw Title in center
    const titleText = 'Soliva Guard E-Commerce Platform';
    const titleWidth = boldFont.widthOfTextAtSize(titleText, 7.5);
    currentPage.drawText(titleText, {
      x: (width - titleWidth) / 2,
      y: height - 37,
      size: 7.5,
      font: boldFont,
      color: rgb(15/255, 23/255, 42/255) // Dark Navy (#0f172a)
    });

    // Draw Doc Name at top right
    const docText = 'Project Documentation';
    const docTextWidth = boldFont.widthOfTextAtSize(docText, 7.5);
    currentPage.drawText(docText, {
      x: rightBoundary - docTextWidth,
      y: height - 37,
      size: 7.5,
      font: boldFont,
      color: rgb(255/255, 122/255, 0/255) // Soliva Orange (#ff7a00)
    });

    // Draw divider line under header
    currentPage.drawLine({
      start: { x: leftX, y: height - 52 },
      end: { x: rightBoundary, y: height - 52 },
      thickness: 0.5,
      color: rgb(226/255, 232/255, 240/255) // Light gray (#e2e8f0)
    });

    // ---------------- FOOTER ----------------
    // Draw divider line above footer
    currentPage.drawLine({
      start: { x: leftX, y: 52 },
      end: { x: rightBoundary, y: 52 },
      thickness: 0.5,
      color: rgb(226/255, 232/255, 240/255) // Light gray (#e2e8f0)
    });

    // Draw "Powered By" text and TATVEIN logo on the left
    currentPage.drawText('Powered by', {
      x: leftX,
      y: 35,
      size: 6.5,
      font: boldFont,
      color: rgb(148/255, 163/255, 184/255) // (#94a3b8)
    });

    currentPage.drawImage(tatveinImage, {
      x: leftX + 45,
      y: 29,
      width: tatveinWidth,
      height: 12
    });

    // Draw TATVEIN partner credentials in the center
    const partnerTitle = 'TATVEIN Technologies';
    const pTitleWidth = boldFont.widthOfTextAtSize(partnerTitle, 7.5);
    currentPage.drawText(partnerTitle, {
      x: (width - pTitleWidth) / 2,
      y: 37,
      size: 7.5,
      font: boldFont,
      color: rgb(184/255, 132/255, 69/255) // TATVEIN Gold (#b88445)
    });

    const partnerSubtitle = 'Technology Partner | Development Company | Engineering Team';
    const pSubtitleWidth = font.widthOfTextAtSize(partnerSubtitle, 6);
    currentPage.drawText(partnerSubtitle, {
      x: (width - pSubtitleWidth) / 2,
      y: 28,
      size: 6,
      font: font,
      color: rgb(148/255, 163/255, 184/255) // (#94a3b8)
    });

    // Draw Page Numbering on the right
    const pageText = `Page ${i + 1} of ${pages.length}`;
    const pageTextWidth = font.widthOfTextAtSize(pageText, 7.5);
    currentPage.drawText(pageText, {
      x: rightBoundary - pageTextWidth,
      y: 35,
      size: 7.5,
      font: font,
      color: rgb(100/255, 116/255, 139/255) // (#64748b)
    });
  }

  console.log('[PDF] Saving final stamped PDF file...');
  const stampedPdfBytes = await pdfDoc.save();
  fs.writeFileSync(pdfPath, stampedPdfBytes);
  console.log(`[PDF] Success! PDF file saved at: ${pdfPath}`);
}

generatePDF().catch(err => {
  console.error('[PDF ERROR] PDF generation failed:', err);
  process.exit(1);
});
