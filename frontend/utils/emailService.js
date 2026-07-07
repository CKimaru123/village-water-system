// utils/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

/**
 * Send email notification to clients
 * @param {string|Array} to - Recipient email(s)
 * @param {string} subject - Email subject
 * @param {string} html - HTML body content
 * @returns {Promise} - Resolves when sent
 */
const sendNotification = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Village Water System" <${process.env.GMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html
    });
    console.log(`Notification sent to: ${to}`);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = { sendNotification };
