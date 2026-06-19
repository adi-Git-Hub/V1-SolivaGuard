// ── Shared branded email shell (logo banner + amber rule + warm palette) ──
// Public site origin used in emails — must be a PUBLICLY reachable https URL
// (NOT a localhost dev entry, or the logo/links break in mail clients).
const SITE = (process.env.PUBLIC_SITE_URL ||
  (process.env.FRONTEND_URL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .find((u) => /^https:\/\//.test(u)) ||
  'https://solivaguard.com').replace(/\/+$/, '');
const LOGO_URL = `${SITE}/soliva_logo_high_resolution-removebg-preview.png`;

const esc = (v) =>
  String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const brandWrap = ({ heading, intro = '', bodyHtml = '', ctaText, ctaUrl, footnote }) => `
<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF7F3;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F3;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 18px 50px -28px rgba(58,42,34,0.4);">
        <tr><td align="center" style="background:#f4ece1;padding:34px 24px 26px;">
          <img src="${LOGO_URL}" alt="Soliva" height="40" style="height:40px;display:block;border:0;outline:none;" />
          <div style="margin-top:12px;font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#c76600;">Built for movement</div>
        </td></tr>
        <tr><td style="height:3px;background:#c76600;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:38px 40px 28px;font-family:Helvetica,Arial,sans-serif;">
          <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;color:#3a2a22;font-weight:700;">${heading}</h1>
          ${intro ? `<p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#7b6a5f;">${intro}</p>` : ''}
          ${bodyHtml}
          ${ctaText && ctaUrl ? `<div style="margin:30px 0 6px;"><a href="${ctaUrl}" style="display:inline-block;background:#c76600;color:#ffffff;text-decoration:none;font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;padding:14px 30px;border-radius:999px;">${ctaText}</a></div>` : ''}
        </td></tr>
        ${footnote ? `<tr><td style="padding:0 40px 30px;font-family:Helvetica,Arial,sans-serif;"><p style="margin:0;font-size:12px;line-height:1.6;color:#a89a8d;">${footnote}</p></td></tr>` : ''}
        <tr><td style="background:#FAF7F3;padding:22px 40px;border-top:1px solid #efe7dd;font-family:Helvetica,Arial,sans-serif;">
          <p style="margin:0;font-size:11px;color:#a89a8d;">© 2026 Soliva. All rights reserved.</p>
          <p style="margin:6px 0 0;font-size:11px;color:#c2b5a8;">Soliva · India · <a href="${SITE}" style="color:#c76600;text-decoration:none;">solivaguard.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const getOTPTemplate = (otp, type) => {
  const titles = {
    verification: 'Verify your email',
    forgotPassword: 'Reset your password',
  };
  const messages = {
    verification: 'Thank you for joining Soliva. Use the code below to verify your email address. It is valid for 10 minutes.',
    forgotPassword: 'We received a request to reset your password. Use the code below to proceed. It is valid for 10 minutes.',
  };

  return brandWrap({
    heading: titles[type] || 'Your code',
    intro: messages[type] || '',
    bodyHtml: `
      <div style="text-align:center;margin:26px 0 6px;">
        <div style="display:inline-block;padding:16px 32px;background:#f4ece1;border:1px solid #ead9c6;border-radius:12px;font-size:28px;font-weight:bold;letter-spacing:8px;color:#3a2a22;">${esc(otp)}</div>
      </div>`,
    footnote: 'If you did not request this, you can safely ignore this email.',
  });
};

const getWelcomeTemplate = (name) => {
  const first = String(name || '').trim().split(/\s+/)[0] || 'there';
  return brandWrap({
    heading: `Welcome to Soliva, ${esc(first)}.`,
    intro:
      'Your account is ready. From the Soliva team — we are thrilled to have you with us. Thoughtful protection, designed for everyday movement, now begins.',
    bodyHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
        ${['Full face, neck & back coverage', 'Breathable comfort for long hours', 'Built for Indian heat, dust & UV']
          .map(
            (t) => `<tr><td style="padding:6px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#3a2a22;">
              <span style="color:#c76600;font-weight:bold;">✓</span>&nbsp;&nbsp;${t}</td></tr>`,
          )
          .join('')}
      </table>`,
    ctaText: 'Explore the Collection',
    ctaUrl: `${SITE}/collection`,
    footnote: 'Have a question? Just reply to this email — a real person will read it.',
  });
};

const getPasswordChangedTemplate = (name) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4f46e5; margin: 0;">Soliva</h1>
      </div>
      <h2 style="color: #333;">Password Changed Successfully</h2>
      <p style="color: #555; line-height: 1.5;">
        Hi ${name},<br/><br/>
        This is a confirmation that the password for your Soliva account has just been changed.
      </p>
      <p style="color: #555; line-height: 1.5;">
        If you made this change, you can safely ignore this email. If you did not make this change, please contact our support team immediately.
      </p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 11px; text-align: center;">
        &copy; 2026 Soliva Guard. All rights reserved.
      </p>
    </div>
  `;
};

const getOrderConfirmationTemplate = ({ customerName, orderId, orderItems, totalPrice, shippingInfo, trackUrl, invoiceUrl, receiptUrl }) => {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
  const ctaButtons = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:4px 0 30px;">
      <tr><td align="center">
        ${trackUrl ? `<a href="${trackUrl}" style="display:inline-block;margin:5px;padding:13px 26px;background:#3a2a22;color:#fff;text-decoration:none;border-radius:999px;font-family:'Helvetica Neue',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Track Your Order</a>` : ''}
        ${invoiceUrl ? `<a href="${invoiceUrl}" style="display:inline-block;margin:5px;padding:13px 22px;background:#fff;color:#3a2a22;text-decoration:none;border:1px solid rgba(58,42,34,0.2);border-radius:999px;font-family:'Helvetica Neue',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">View Invoice</a>` : ''}
        ${receiptUrl ? `<a href="${receiptUrl}" style="display:inline-block;margin:5px;padding:13px 22px;background:#fff;color:#3a2a22;text-decoration:none;border:1px solid rgba(58,42,34,0.2);border-radius:999px;font-family:'Helvetica Neue',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">View Receipt</a>` : ''}
      </td></tr>
    </table>`;

  const itemRows = (orderItems || []).map((item) => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid rgba(58,42,34,0.06);">
        <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td width="60" style="vertical-align:top;">
            <div style="width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,#F0F4FF,#DBEAFE);overflow:hidden;">
              ${item.image ? `<img src="${item.image}" alt="${item.name}" width="56" height="56" style="display:block;object-fit:cover;border-radius:14px;" />` : ''}
            </div>
          </td>
          <td style="padding-left:16px;vertical-align:middle;">
            <p style="margin:0;font-family:'Georgia',serif;font-size:15px;color:#3a2a22;font-weight:500;">${item.name}</p>
            <p style="margin:4px 0 0;font-family:'Helvetica Neue',sans-serif;font-size:12px;color:#a08f84;letter-spacing:0.5px;">Qty: ${item.quantity}</p>
          </td>
          <td style="text-align:right;vertical-align:middle;">
            <p style="margin:0;font-family:'JetBrains Mono',monospace;font-size:14px;color:#3a2a22;font-weight:500;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</p>
          </td>
        </tr></table>
      </td>
    </tr>
  `).join('');

  const shortOrderId = String(orderId).slice(-8).toUpperCase();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmed — SOLIVA</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f3ee;font-family:'Helvetica Neue','Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Outer wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f7f3ee;">
    <tr><td align="center" style="padding:40px 16px 60px;">

      <!-- Email container -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="580" style="max-width:580px;width:100%;">

        <!-- Brand header -->
        <tr><td style="padding:0 0 40px;text-align:center;">
          <p style="margin:0;font-family:'Georgia','Times New Roman',serif;font-size:28px;font-weight:400;color:#3a2a22;letter-spacing:4px;">SOLIVA</p>
          <p style="margin:6px 0 0;font-family:'Helvetica Neue',sans-serif;font-size:10px;color:#a08f84;letter-spacing:3px;text-transform:uppercase;">Soul · Light · You</p>
        </td></tr>

        <!-- Main card -->
        <tr><td>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:linear-gradient(180deg,#ffffff,#fffdf9);border-radius:24px;border:1px solid rgba(58,42,34,0.06);box-shadow:0 8px 40px -12px rgba(58,42,34,0.08);">

            <!-- Amber accent bar -->
            <tr><td style="height:3px;border-radius:24px 24px 0 0;background:linear-gradient(90deg,rgba(245,130,13,0.15),rgba(245,130,13,0.4),rgba(245,130,13,0.15));"></td></tr>

            <!-- Card content -->
            <tr><td style="padding:44px 40px 48px;">

              <!-- Thank you header -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr><td style="text-align:center;padding-bottom:36px;">
                  <!-- Check icon circle -->
                  <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,rgba(245,130,13,0.08),rgba(245,130,13,0.16));text-align:center;line-height:56px;">
                    <span style="font-size:24px;">✓</span>
                  </div>
                  <h1 style="margin:20px 0 0;font-family:'Georgia','Times New Roman',serif;font-size:24px;font-weight:400;color:#3a2a22;letter-spacing:-0.3px;line-height:1.3;">
                    Thank You For Choosing SOLIVA
                  </h1>
                  <p style="margin:8px 0 0;font-family:'Helvetica Neue',sans-serif;font-size:13px;color:#a08f84;letter-spacing:0.3px;">
                    Order #${shortOrderId}
                  </p>
                </td></tr>
              </table>

              <!-- Greeting -->
              <p style="margin:0 0 6px;font-family:'Helvetica Neue',sans-serif;font-size:15px;color:#3a2a22;line-height:1.7;">
                Hi ${customerName},
              </p>
              <p style="margin:0 0 28px;font-family:'Helvetica Neue',sans-serif;font-size:15px;color:#7b6a5f;line-height:1.7;">
                Your payment has been successfully processed and your order is now confirmed. We're preparing your order with care — you'll receive shipping updates shortly.
              </p>

              <!-- Order status -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:linear-gradient(135deg,#fdfbf7,#f9f5ef);border-radius:16px;border:1px solid rgba(58,42,34,0.04);margin-bottom:32px;">
                <tr><td style="padding:24px 28px;">
                  <p style="margin:0 0 16px;font-family:'Helvetica Neue',sans-serif;font-size:10px;color:#a08f84;letter-spacing:2.5px;text-transform:uppercase;font-weight:600;">Order Status</p>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="padding:6px 0;font-family:'Helvetica Neue',sans-serif;font-size:14px;color:#3a2a22;">
                        <span style="color:#f5820d;">✓</span>&nbsp;&nbsp;Payment Successful
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-family:'Helvetica Neue',sans-serif;font-size:14px;color:#3a2a22;">
                        <span style="color:#f5820d;">✓</span>&nbsp;&nbsp;Order Confirmed
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-family:'Helvetica Neue',sans-serif;font-size:14px;color:#a08f84;">
                        <span style="color:#a08f84;">⏳</span>&nbsp;&nbsp;Preparing for Dispatch
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>

              <!-- Soft divider -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(58,42,34,0.08),transparent);margin:0 0 28px;"></div>

              <!-- Order items -->
              <p style="margin:0 0 16px;font-family:'Helvetica Neue',sans-serif;font-size:10px;color:#a08f84;letter-spacing:2.5px;text-transform:uppercase;font-weight:600;">Your Order</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${itemRows}
              </table>

              <!-- Total -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:20px;">
                <tr>
                  <td style="padding:16px 0 0;border-top:1px solid rgba(58,42,34,0.06);">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="font-family:'Helvetica Neue',sans-serif;font-size:12px;color:#a08f84;letter-spacing:1px;text-transform:uppercase;">Shipping</td>
                        <td style="text-align:right;font-family:'Helvetica Neue',sans-serif;font-size:13px;color:#f5820d;font-weight:500;letter-spacing:1px;text-transform:uppercase;">Free</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 0 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="font-family:'Helvetica Neue',sans-serif;font-size:13px;color:#7b6a5f;">Total</td>
                        <td style="text-align:right;font-family:'Georgia','Times New Roman',serif;font-size:26px;color:#3a2a22;letter-spacing:-0.5px;">₹${totalPrice.toLocaleString('en-IN')}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${shippingInfo ? `
              <!-- Shipping address -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(58,42,34,0.08),transparent);margin:28px 0;"></div>
              <p style="margin:0 0 8px;font-family:'Helvetica Neue',sans-serif;font-size:10px;color:#a08f84;letter-spacing:2.5px;text-transform:uppercase;font-weight:600;">Delivering To</p>
              <p style="margin:0;font-family:'Helvetica Neue',sans-serif;font-size:14px;color:#7b6a5f;line-height:1.7;">
                ${shippingInfo.address}<br/>
                ${shippingInfo.city}, ${shippingInfo.state} — ${shippingInfo.pinCode}<br/>
                ${shippingInfo.country}
              </p>
              ` : ''}

              <!-- Divider -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(58,42,34,0.08),transparent);margin:32px 0;"></div>

              <!-- Track / Invoice / Receipt CTAs -->
              ${ctaButtons}

              <!-- Why SOLIVA -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr><td style="text-align:center;padding-bottom:20px;">
                  <p style="margin:0 0 6px;font-family:'Helvetica Neue',sans-serif;font-size:10px;color:#a08f84;letter-spacing:2.5px;text-transform:uppercase;font-weight:600;">Why SOLIVA</p>
                  <p style="margin:0;font-family:'Helvetica Neue',sans-serif;font-size:13px;color:#7b6a5f;line-height:1.7;">
                    Designed for real daily exposure to sunlight, dust, pollution, heat & long commutes.
                  </p>
                </td></tr>
                <tr><td>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fdfbf7;border-radius:14px;border:1px solid rgba(58,42,34,0.04);">
                    <tr><td style="padding:20px 24px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td style="padding:5px 0;font-family:'Helvetica Neue',sans-serif;font-size:13px;color:#7b6a5f;">
                            <span style="color:#f5820d;margin-right:8px;">·</span>Advanced UV Defense System
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:5px 0;font-family:'Helvetica Neue',sans-serif;font-size:13px;color:#7b6a5f;">
                            <span style="color:#f5820d;margin-right:8px;">·</span>Breathable Dual-Layer Comfort
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:5px 0;font-family:'Helvetica Neue',sans-serif;font-size:13px;color:#7b6a5f;">
                            <span style="color:#f5820d;margin-right:8px;">·</span>Full Coverage Protection
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:5px 0;font-family:'Helvetica Neue',sans-serif;font-size:13px;color:#7b6a5f;">
                            <span style="color:#f5820d;margin-right:8px;">·</span>Everyday Wearability
                          </td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </td></tr>
              </table>

              <!-- Brand message -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(58,42,34,0.08),transparent);margin:32px 0;"></div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr><td style="text-align:center;padding:8px 0 24px;">
                  <p style="margin:0 0 4px;font-family:'Georgia','Times New Roman',serif;font-size:18px;color:#3a2a22;font-style:italic;line-height:1.5;">
                    Thoughtfully layered.<br/>Effortlessly worn.
                  </p>
                  <p style="margin:10px 0 0;font-family:'Helvetica Neue',sans-serif;font-size:12px;color:#a08f84;letter-spacing:0.5px;">
                    Protection. Finally designed for real life.
                  </p>
                </td></tr>
              </table>

              <!-- CTA button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr><td style="text-align:center;padding-top:8px;">
                  <a href="${frontendUrl}/collection" style="display:inline-block;padding:14px 40px;background-color:#3a2a22;color:#f7f3ee;text-decoration:none;border-radius:50px;font-family:'Helvetica Neue',sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">
                    Explore More
                  </a>
                </td></tr>
              </table>

            </td></tr>

            <!-- Bottom accent -->
            <tr><td style="height:2px;border-radius:0 0 24px 24px;background:linear-gradient(90deg,rgba(245,130,13,0.08),rgba(245,130,13,0.2),rgba(245,130,13,0.08));"></td></tr>

          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:36px 0 0;text-align:center;">
          <p style="margin:0 0 8px;font-family:'Helvetica Neue',sans-serif;font-size:12px;color:#a08f84;">
            Need help? Contact us at
            <a href="mailto:support@soliva.in" style="color:#f5820d;text-decoration:none;font-weight:500;">support@soliva.in</a>
          </p>
          <p style="margin:0 0 16px;font-family:'Helvetica Neue',sans-serif;font-size:12px;color:#c4b5a8;">
            <a href="${frontendUrl}" style="color:#a08f84;text-decoration:none;">Instagram</a>
            &nbsp;&nbsp;·&nbsp;&nbsp;
            <a href="${frontendUrl}" style="color:#a08f84;text-decoration:none;">Website</a>
            &nbsp;&nbsp;·&nbsp;&nbsp;
            <a href="mailto:support@soliva.in" style="color:#a08f84;text-decoration:none;">Support</a>
          </p>
          <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(58,42,34,0.06),transparent);margin:0 40px 16px;"></div>
          <p style="margin:0;font-family:'Helvetica Neue',sans-serif;font-size:10px;color:#c4b5a8;letter-spacing:1.5px;text-transform:uppercase;">
            © 2026 SOLIVA — All Rights Reserved
          </p>
        </td></tr>

      </table>

    </td></tr>
  </table>

</body>
</html>
  `;
};

// ── Contact / Support (feedback) emails ──────────────────────────────────
const detailRow = (label, value) =>
  value
    ? `<tr>
        <td style="padding:8px 0;width:130px;vertical-align:top;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#a89a8d;">${esc(label)}</td>
        <td style="padding:8px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#3a2a22;">${esc(value)}</td>
      </tr>`
    : '';

// → Admin: a new enquiry from the /contact form.
const getContactNotificationTemplate = ({ name, email, phone, subject, orderNumber, message }) =>
  brandWrap({
    heading: 'New contact message',
    intro: 'A customer reached out through the Soliva contact form.',
    bodyHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #efe7dd;">
        ${detailRow('Name', name)}
        ${detailRow('Email', email)}
        ${detailRow('Phone', phone)}
        ${detailRow('Subject', subject)}
        ${detailRow('Order #', orderNumber)}
      </table>
      <div style="margin-top:18px;padding:18px 20px;background:#f4ece1;border-radius:12px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:#3a2a22;white-space:pre-wrap;">${esc(message)}</div>`,
    footnote: 'Reply directly to this email to respond to the customer.',
  });

// → Admin: new feedback from the /support form (may carry attachments).
const getFeedbackNotificationTemplate = ({ name, email, category, subject, message, fileCount = 0 }) =>
  brandWrap({
    heading: 'New support feedback',
    intro: 'A customer submitted the Soliva support form.',
    bodyHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #efe7dd;">
        ${detailRow('Name', name)}
        ${detailRow('Email', email)}
        ${detailRow('Category', category)}
        ${detailRow('Subject', subject)}
        ${detailRow('Attachments', fileCount ? `${fileCount} file(s) attached` : 'None')}
      </table>
      <div style="margin-top:18px;padding:18px 20px;background:#f4ece1;border-radius:12px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:#3a2a22;white-space:pre-wrap;">${esc(message)}</div>`,
    footnote: 'Reply directly to this email to respond to the customer.',
  });

// → User: confirmation their message/feedback arrived.
const getInboundConfirmationTemplate = (name, kind = 'message') =>
  brandWrap({
    heading: `Your ${kind === 'feedback' ? 'feedback' : 'message'} reached us.`,
    intro: `Thank you${name ? `, ${esc(String(name).trim().split(/\s+/)[0])}` : ''}. Your ${kind === 'feedback' ? 'feedback' : 'message'} has reached the Soliva team successfully — we typically respond within 24 hours.`,
    bodyHtml: `<p style="margin:0;font-size:14px;line-height:1.7;color:#7b6a5f;font-family:Helvetica,Arial,sans-serif;">In the meantime, feel free to explore the collection or browse our help guides.</p>`,
    ctaText: 'Back to Soliva',
    ctaUrl: SITE,
    footnote: 'This is an automated confirmation — but a real person will follow up.',
  });

module.exports = {
  getOTPTemplate,
  getWelcomeTemplate,
  getPasswordChangedTemplate,
  getOrderConfirmationTemplate,
  getContactNotificationTemplate,
  getFeedbackNotificationTemplate,
  getInboundConfirmationTemplate,
};