const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

exports.sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    await transporter.sendMail({
      from: `"${process.env.COMPANY_NAME}" <${process.env.SMTP_USER}>`,
      to, subject, html, attachments,
    });
  } catch (err) {
    logger.error('Email send error:', err);
    throw err;
  }
};
