const fs = require('fs');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ErrorHandler = require('../utils/errorHandler');
const sendEmail = require('../utils/sendEmail');
const logger = require('../utils/logger');
const {
  getContactNotificationTemplate,
  getFeedbackNotificationTemplate,
  getInboundConfirmationTemplate,
} = require('../utils/emailTemplates');

const ADMIN_EMAIL = process.env.CONTACT_EMAIL || 'admin@solivaguard.com';

const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// POST /api/v1/contact — general "Send us a message" form.
exports.submitContact = catchAsyncErrors(async (req, res, next) => {
  const { name, email, phone, subject, orderNumber, message } = req.body || {};

  if (!name || !isEmail(email) || !message) {
    return next(new ErrorHandler('Please provide your name, a valid email, and a message.', 400));
  }

  // 1) Notify the team (reply-to the customer so a reply lands in their inbox).
  await sendEmail({
    email: ADMIN_EMAIL,
    subject: `New contact message — ${subject || 'General enquiry'}`,
    html: getContactNotificationTemplate({ name, email, phone, subject, orderNumber, message }),
    replyTo: email,
  });

  // 2) Confirm to the customer (best-effort — never fail the request on this).
  try {
    await sendEmail({
      email,
      subject: 'We received your message — Soliva',
      html: getInboundConfirmationTemplate(name, 'message'),
    });
  } catch (err) {
    logger.warn(`[CONTACT] confirmation email to ${email} failed: ${err.message}`);
  }

  res.status(200).json({ success: true, message: 'Your message has reached us successfully.' });
});

// POST /api/v1/contact/feedback — support form (multipart, optional image attachments).
exports.submitFeedback = catchAsyncErrors(async (req, res, next) => {
  const { name, email, subject, category, message } = req.body || {};
  const files = Array.isArray(req.files) ? req.files : [];

  if (!name || !isEmail(email) || !message) {
    files.forEach((f) => fs.unlink(f.path, () => {}));
    return next(new ErrorHandler('Please provide your name, a valid email, and a message.', 400));
  }

  const attachments = files.map((f) => ({ filename: f.originalname, path: f.path }));

  try {
    // 1) Notify the team with the attachments.
    await sendEmail({
      email: ADMIN_EMAIL,
      subject: `New support feedback — ${subject || category || 'Support'}`,
      html: getFeedbackNotificationTemplate({
        name,
        email,
        category,
        subject,
        message,
        fileCount: files.length,
      }),
      replyTo: email,
      attachments,
    });

    // 2) Confirm to the customer.
    try {
      await sendEmail({
        email,
        subject: 'Your feedback reached us — Soliva',
        html: getInboundConfirmationTemplate(name, 'feedback'),
      });
    } catch (err) {
      logger.warn(`[FEEDBACK] confirmation email to ${email} failed: ${err.message}`);
    }

    res.status(200).json({ success: true, message: 'Your feedback has reached us successfully.' });
  } finally {
    // Clean up the temporary uploaded files once they've been attached/sent.
    files.forEach((f) => fs.unlink(f.path, () => {}));
  }
});
