const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

/**
 * Email Configuration
 */
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
};

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@startup-ai.com';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Startup AI Platform';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@startup-ai.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Create email transporter
 */
const createTransporter = () => {
  try {
    return nodemailer.createTransport(EMAIL_CONFIG);
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    throw new Error('Email service configuration error');
  }
};

/**
 * Verify email connection
 */
const verifyConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email service is ready to send messages');
    return true;
  } catch (error) {
    console.error('Email service connection failed:', error);
    return false;
  }
};

/**
 * Base email template with styling
 */
const getBaseTemplate = (content, title = '') => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 30px 40px;
        }
        .content p {
          margin: 16px 0;
          font-size: 15px;
        }
        .button {
          display: inline-block;
          padding: 14px 32px;
          margin: 20px 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          transition: transform 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
        }
        .info-box {
          background: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 16px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .warning-box {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 16px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px 40px;
          text-align: center;
          font-size: 13px;
          color: #6c757d;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
        }
        .divider {
          border: 0;
          height: 1px;
          background: #e9ecef;
          margin: 24px 0;
        }
        .text-muted {
          color: #6c757d;
          font-size: 14px;
        }
        .text-center {
          text-align: center;
        }
        .mt-20 {
          margin-top: 20px;
        }
        @media only screen and (max-width: 600px) {
          .content {
            padding: 20px;
          }
          .footer {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 ${FROM_NAME}</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>This is an automated message from ${FROM_NAME}.</p>
          <p>
            Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
          </p>
          <p class="mt-20 text-muted">
            © ${new Date().getFullYear()} ${FROM_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send email with retry logic
 */
const sendEmail = async (options, retries = 3) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || stripHtml(options.html)
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${options.to}: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error(`Email send attempt ${attempt} failed:`, error.message);

      if (attempt === retries) {
        console.error(`Failed to send email to ${options.to} after ${retries} attempts`);
        throw new Error(`Email delivery failed: ${error.message}`);
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

/**
 * Strip HTML tags for plain text version
 */
const stripHtml = (html) => {
  return html
    .replace(/<style[^>]*>.*<\/style>/gm, '')
    .replace(/<script[^>]*>.*<\/script>/gm, '')
    .replace(/<[^>]+>/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Validate email address
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Send welcome email to new users
 * @param {string} email - User email
 * @param {string} name - User name
 */
const sendWelcomeEmail = async (email, name) => {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email address');
  }

  const content = `
    <h2>Welcome to ${FROM_NAME}! 🎉</h2>
    <p>Hi ${name},</p>
    <p>
      Thank you for joining our platform! We're excited to have you on board and help you 
      automate your startup workflows with our AI-powered agents.
    </p>
    
    <div class="info-box">
      <strong>🚀 Get Started:</strong>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Create your first project</li>
        <li>Explore AI agents for idea validation, market research, and more</li>
        <li>Generate pitch decks, business plans, and legal documents</li>
      </ul>
    </div>

    <div class="text-center">
      <a href="${FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
    </div>

    <hr class="divider" />

    <p class="text-muted">
      If you have any questions or need assistance, don't hesitate to reach out to our support team.
    </p>
  `;

  const html = getBaseTemplate(content, 'Welcome to ' + FROM_NAME);

  return await sendEmail({
    to: email,
    subject: `Welcome to ${FROM_NAME}! 🎉`,
    html
  });
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {string} resetUrl - Password reset URL with token
 */
const sendPasswordResetEmail = async (email, name, resetUrl) => {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email address');
  }

  const content = `
    <h2>Password Reset Request 🔐</h2>
    <p>Hi ${name},</p>
    <p>
      We received a request to reset your password. Click the button below to create a new password:
    </p>

    <div class="text-center">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>

    <div class="warning-box">
      <strong>⚠️ Important:</strong>
      <p style="margin: 8px 0 0 0;">
        This link will expire in <strong>30 minutes</strong> for security reasons.
      </p>
    </div>

    <p class="text-muted">
      If you didn't request a password reset, you can safely ignore this email. 
      Your password will remain unchanged.
    </p>

    <hr class="divider" />

    <p class="text-muted" style="font-size: 12px;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
    </p>
  `;

  const html = getBaseTemplate(content, 'Reset Your Password');

  return await sendEmail({
    to: email,
    subject: 'Password Reset Request',
    html
  });
};

/**
 * Send password changed confirmation email
 * @param {string} email - User email
 * @param {string} name - User name
 */
const sendPasswordChangedEmail = async (email, name) => {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email address');
  }

  const content = `
    <h2>Password Changed Successfully ✅</h2>
    <p>Hi ${name},</p>
    <p>
      This is to confirm that your password has been changed successfully. 
      You can now log in with your new password.
    </p>

    <div class="info-box">
      <strong>🔒 Security Information:</strong>
      <p style="margin: 8px 0 0 0;">
        For your security, you have been logged out of all devices. 
        Please log in again with your new password.
      </p>
    </div>

    <div class="text-center">
      <a href="${FRONTEND_URL}/login" class="button">Log In Now</a>
    </div>

    <hr class="divider" />

    <div class="warning-box">
      <strong>⚠️ Didn't change your password?</strong>
      <p style="margin: 8px 0 0 0;">
        If you didn't make this change, please contact our support team immediately at 
        <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
      </p>
    </div>
  `;

  const html = getBaseTemplate(content, 'Password Changed');

  return await sendEmail({
    to: email,
    subject: 'Your Password Has Been Changed',
    html
  });
};

/**
 * Send email changed notification
 * @param {string} oldEmail - Old email address
 * @param {string} newEmail - New email address
 * @param {string} name - User name
 */
const sendEmailChangedNotification = async (oldEmail, newEmail, name) => {
  if (!isValidEmail(oldEmail) || !isValidEmail(newEmail)) {
    throw new Error('Invalid email address');
  }

  const content = `
    <h2>Email Address Changed 📧</h2>
    <p>Hi ${name},</p>
    <p>
      This is to confirm that your email address has been changed from 
      <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>.
    </p>

    <div class="info-box">
      <strong>📝 Important:</strong>
      <p style="margin: 8px 0 0 0;">
        From now on, use your new email address (<strong>${newEmail}</strong>) to log in 
        and receive notifications.
      </p>
    </div>

    <div class="text-center">
      <a href="${FRONTEND_URL}/profile" class="button">View Profile</a>
    </div>

    <hr class="divider" />

    <div class="warning-box">
      <strong>⚠️ Didn't make this change?</strong>
      <p style="margin: 8px 0 0 0;">
        If you didn't request this change, please contact support immediately at 
        <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
      </p>
    </div>
  `;

  const html = getBaseTemplate(content, 'Email Address Changed');

  // Send to both old and new email addresses
  const promises = [
    sendEmail({
      to: oldEmail,
      subject: 'Your Email Address Has Been Changed',
      html
    }),
    sendEmail({
      to: newEmail,
      subject: 'Your Email Address Has Been Changed',
      html
    })
  ];

  return await Promise.allSettled(promises);
};

/**
 * Send account locked notification
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {Date} lockedUntil - Lock expiration time
 */
const sendAccountLockedEmail = async (email, name, lockedUntil) => {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email address');
  }

  const lockDuration = Math.ceil((lockedUntil - new Date()) / (1000 * 60));

  const content = `
    <h2>Account Temporarily Locked 🔒</h2>
    <p>Hi ${name},</p>
    <p>
      Your account has been temporarily locked due to multiple failed login attempts.
    </p>

    <div class="warning-box">
      <strong>⏱️ Lock Duration:</strong>
      <p style="margin: 8px 0 0 0;">
        Your account will be automatically unlocked in approximately 
        <strong>${lockDuration} minutes</strong>.
      </p>
    </div>

    <p>
      This is a security measure to protect your account from unauthorized access.
    </p>

    <div class="info-box">
      <strong>🔓 Need Immediate Access?</strong>
      <p style="margin: 8px 0 0 0;">
        You can unlock your account immediately by resetting your password.
      </p>
    </div>

    <div class="text-center">
      <a href="${FRONTEND_URL}/forgot-password" class="button">Reset Password</a>
    </div>

    <hr class="divider" />

    <p class="text-muted">
      If you believe this was a mistake or need assistance, please contact our support team.
    </p>
  `;

  const html = getBaseTemplate(content, 'Account Locked');

  return await sendEmail({
    to: email,
    subject: 'Your Account Has Been Temporarily Locked',
    html
  });
};

/**
 * Send account unlocked notification
 * @param {string} email - User email
 * @param {string} name - User name
 */
const sendAccountUnlockedEmail = async (email, name) => {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email address');
  }

  const content = `
    <h2>Account Unlocked ✅</h2>
    <p>Hi ${name},</p>
    <p>
      Good news! Your account has been unlocked and you can now log in again.
    </p>

    <div class="info-box">
      <strong>🔐 Security Tips:</strong>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Use a strong, unique password</li>
        <li>Enable two-factor authentication (coming soon)</li>
        <li>Never share your password with anyone</li>
      </ul>
    </div>

    <div class="text-center">
      <a href="${FRONTEND_URL}/login" class="button">Log In Now</a>
    </div>

    <hr class="divider" />

    <p class="text-muted">
      If you're having trouble accessing your account, please contact support.
    </p>
  `;

  const html = getBaseTemplate(content, 'Account Unlocked');

  return await sendEmail({
    to: email,
    subject: 'Your Account Has Been Unlocked',
    html
  });
};

/**
 * Send account deactivated notification
 * @param {string} email - User email
 * @param {string} name - User name
 */
const sendAccountDeactivatedEmail = async (email, name) => {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email address');
  }

  const content = `
    <h2>Account Deactivated</h2>
    <p>Hi ${name},</p>
    <p>
      Your account has been deactivated as requested. We're sorry to see you go!
    </p>

    <div class="info-box">
      <strong>💡 What This Means:</strong>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Your account data is preserved</li>
        <li>You cannot log in until reactivation</li>
        <li>You can reactivate anytime</li>
      </ul>
    </div>

    <p>
      If you change your mind, you can reactivate your account at any time by 
      logging in with your credentials.
    </p>

    <div class="text-center">
      <a href="${FRONTEND_URL}/reactivate" class="button">Reactivate Account</a>
    </div>

    <hr class="divider" />

    <p class="text-muted">
      If you didn't request this deactivation, please contact support immediately.
    </p>
  `;

  const html = getBaseTemplate(content, 'Account Deactivated');

  return await sendEmail({
    to: email,
    subject: 'Your Account Has Been Deactivated',
    html
  });
};

/**
 * Send account reactivated notification
 * @param {string} email - User email
 * @param {string} name - User name
 */
const sendAccountReactivatedEmail = async (email, name) => {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email address');
  }

  const content = `
    <h2>Welcome Back! 🎉</h2>
    <p>Hi ${name},</p>
    <p>
      Your account has been successfully reactivated. We're glad to have you back!
    </p>

    <div class="info-box">
      <strong>✅ You're All Set:</strong>
      <p style="margin: 8px 0 0 0;">
        Your account is now active and you can access all features of the platform.
      </p>
    </div>

    <div class="text-center">
      <a href="${FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
    </div>

    <hr class="divider" />

    <p>
      If you need any help getting started again, our support team is here to assist you.
    </p>
  `;

  const html = getBaseTemplate(content, 'Account Reactivated');

  return await sendEmail({
    to: email,
    subject: 'Welcome Back! Your Account is Active',
    html
  });
};

/**
 * Send login notification (optional security feature)
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {object} metadata - Login metadata (IP, location, device)
 */
const sendLoginNotificationEmail = async (email, name, metadata = {}) => {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email address');
  }

  const { ipAddress, userAgent, location, timestamp } = metadata;
  const loginTime = timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString();

  const content = `
    <h2>New Login Detected 🔔</h2>
    <p>Hi ${name},</p>
    <p>
      We detected a new login to your account. If this was you, no action is needed.
    </p>

    <div class="info-box">
      <strong>📊 Login Details:</strong>
      <ul style="margin: 10px 0; padding-left: 20px; list-style: none;">
        <li><strong>Time:</strong> ${loginTime}</li>
        ${ipAddress ? `<li><strong>IP Address:</strong> ${ipAddress}</li>` : ''}
        ${location ? `<li><strong>Location:</strong> ${location}</li>` : ''}
        ${userAgent ? `<li><strong>Device:</strong> ${userAgent}</li>` : ''}
      </ul>
    </div>

    <div class="warning-box">
      <strong>⚠️ Wasn't You?</strong>
      <p style="margin: 8px 0 0 0;">
        If you don't recognize this login, please change your password immediately 
        and contact our support team.
      </p>
    </div>

    <div class="text-center">
      <a href="${FRONTEND_URL}/change-password" class="button">Change Password</a>
    </div>

    <hr class="divider" />

    <p class="text-muted">
      This is an automated security notification to help protect your account.
    </p>
  `;

  const html = getBaseTemplate(content, 'New Login Detected');

  return await sendEmail({
    to: email,
    subject: 'New Login to Your Account',
    html
  });
};

/**
 * Send test email to verify configuration
 * @param {string} email - Test recipient email
 */
const sendTestEmail = async (email) => {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email address');
  }

  const content = `
    <h2>Email Service Test ✅</h2>
    <p>
      This is a test email to verify that the email service is configured correctly.
    </p>

    <div class="info-box">
      <strong>Configuration Details:</strong>
      <ul style="margin: 10px 0; padding-left: 20px; list-style: none;">
        <li><strong>Host:</strong> ${EMAIL_CONFIG.host}</li>
        <li><strong>Port:</strong> ${EMAIL_CONFIG.port}</li>
        <li><strong>Secure:</strong> ${EMAIL_CONFIG.secure ? 'Yes' : 'No'}</li>
        <li><strong>From:</strong> ${FROM_EMAIL}</li>
      </ul>
    </div>

    <p>
      If you received this email, the email service is working correctly! 🎉
    </p>
  `;

  const html = getBaseTemplate(content, 'Email Service Test');

  return await sendEmail({
    to: email,
    subject: 'Email Service Test - ' + FROM_NAME,
    html
  });
};

/**
 * Send bulk emails (for announcements, etc.)
 * @param {Array} recipients - Array of email addresses
 * @param {string} subject - Email subject
 * @param {string} content - Email content (HTML)
 */
const sendBulkEmail = async (recipients, subject, content) => {
  const validRecipients = recipients.filter(email => isValidEmail(email));

  if (validRecipients.length === 0) {
    throw new Error('No valid email addresses provided');
  }

  const html = getBaseTemplate(content, subject);

  const promises = validRecipients.map(email =>
    sendEmail({
      to: email,
      subject,
      html
    }).catch(error => ({
      email,
      error: error.message
    }))
  );

  const results = await Promise.allSettled(promises);

  return {
    total: validRecipients.length,
    successful: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
    results
  };
};

// Initialize and verify connection on module load
verifyConnection().catch(error => {
  console.error('Email service initialization failed:', error.message);
});

module.exports = {
  // Core email functions
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendEmailChangedNotification,
  sendAccountLockedEmail,
  sendAccountUnlockedEmail,
  sendAccountDeactivatedEmail,
  sendAccountReactivatedEmail,
  sendLoginNotificationEmail,
  
  // Utility functions
  sendTestEmail,
  sendBulkEmail,
  verifyConnection,
  isValidEmail,
  
  // Template utilities
  getBaseTemplate,
  stripHtml
};