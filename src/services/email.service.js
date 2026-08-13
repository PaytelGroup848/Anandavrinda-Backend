const nodemailer = require('nodemailer');

// ─── Brand config ─────────────────────────────────────────────────────────────
const BRAND_NAME = process.env.BRAND_NAME || 'QubanHC';
const BRAND_COLOR = process.env.BRAND_COLOR || '#0d9488'; // teal-600
const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER;

class EmailService {
  constructor() {
    this._transporter = null;
    this._ready = false;
    this._init();
  }

  // ── Build transporter once ──────────────────────────────────────────────────
  _init() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
      console.warn('  SMTP_USER / SMTP_PASS not set — emails will be logged only');
      this._logOnly = true;
      return;
    }

    this._transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });

    // Verify connection on startup
    this._transporter.verify((err) => {
      if (err) {
        console.error(' SMTP connection failed:', err.message);
        this._logOnly = true;
      } else {
        console.log(' SMTP connected — emails ready');
        this._ready = true;
      }
    });
  }

  // ── Core send ───────────────────────────────────────────────────────────────
  async sendEmail({ to, subject, html }) {
    // Always log in dev
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n ===== EMAIL =====`);
      console.log(`To:      ${to}`);
      console.log(`Subject: ${subject}`);
      // Extract OTP from html for easy dev access
      const otp = html.match(/\b\d{6}\b/)?.[0];
      if (otp) console.log(`OTP:     ${otp}`);
      console.log(`===================\n`);
    }

    // If no SMTP configured, just log and return
    if (this._logOnly) {
      return { messageId: 'log-only' };
    }

    try {
      const info = await this._transporter.sendMail({
        from: `"${BRAND_NAME}" <${FROM_EMAIL}>`,
        to,
        subject,
        html,
      });
      console.log(` Email sent to ${to} — messageId: ${info.messageId}`);
      return info;
    } catch (err) {
      console.error(` Failed to send email to ${to}:`, err.message);
      // Don't crash the app — just warn
      if (process.env.NODE_ENV !== 'production') return { messageId: 'failed-dev' };
      throw err;
    }
  }

  // ── Shared HTML wrapper ─────────────────────────────────────────────────────
  _wrap(bodyHtml) {
    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:100%;">
            <!-- Header -->
            <tr>
              <td style="background:${BRAND_COLOR};padding:24px 32px;text-align:center;">
                <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${BRAND_NAME}</span>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:32px;">
                ${bodyHtml}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;color:#9ca3af;">
                  &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.<br>
                  If you didn't request this email, you can safely ignore it.
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>`;
  }

  // ── OTP box HTML helper ─────────────────────────────────────────────────────
  _otpBox(otp) {
    return `
    <div style="margin:24px 0;text-align:center;">
      <div style="display:inline-block;background:#f0fdfa;border:2px solid ${BRAND_COLOR};border-radius:12px;padding:16px 40px;">
        <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:${BRAND_COLOR};">${otp}</span>
      </div>
      <p style="margin:12px 0 0;font-size:13px;color:#6b7280;">Valid for <strong>10 minutes</strong></p>
    </div>`;
  }

  // ── 1. Email Verification OTP ───────────────────────────────────────────────
  async sendVerificationEmail(email, name, otp) {
    const html = this._wrap(`
      <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Verify your email </h2>
      <p style="margin:0 0 4px;font-size:15px;color:#374151;">Hello <strong>${name}</strong>,</p>
      <p style="margin:0 0 16px;font-size:15px;color:#6b7280;">
        Welcome to ${BRAND_NAME}! Use the OTP below to verify your email address and activate your account.
      </p>
      ${this._otpBox(otp)}
      <p style="font-size:14px;color:#6b7280;margin:0;">
        Did not create an account? You can safely ignore this email.
      </p>
    `);

    return this.sendEmail({
      to: email,
      subject: `${otp} is your ${BRAND_NAME} verification code`,
      html,
    });
  }

  // ── 2. Password Reset OTP ───────────────────────────────────────────────────
  async sendPasswordResetEmail(email, name, otp) {
    const html = this._wrap(`
    <div
style="
background:#fef2f2;
border-left:4px solid #ef4444;
padding:16px;
margin-top:24px;
border-radius:8px;
">

<h3
style="
margin:0;
color:#b91c1c;
font-size:16px;
">
Security Notice
</h3>

<p
style="
margin-top:10px;
color:#7f1d1d;
font-size:14px;
line-height:1.7;
">
If you did not request this password reset, someone may be trying to access your account.

We recommend changing your password immediately if you suspect unauthorized activity.

For assistance, please contact the QubanHC Support Team.
</p>

</div>


<div style="text-align:center;margin-top:28px;">

<a
href="mailto:support@qubanhc.com"
style="
background:#111827;
color:white;
padding:12px 22px;
border-radius:8px;
text-decoration:none;
font-weight:700;
display:inline-block;
">

Contact Support

</a>

</div>



    `);

    return this.sendEmail({
      to: email,
      subject: `${otp} is your ${BRAND_NAME} password reset code`,
      html,
    });
  }

  // ── 3. Email Change OTP ─────────────────────────────────────────────────────
  async sendEmailChangeOtp(newEmail, name, otp) {
    const html = this._wrap(`
      <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Confirm your new email ✉️</h2>
      <p style="margin:0 0 4px;font-size:15px;color:#374151;">Hello <strong>${name}</strong>,</p>
      <p style="margin:0 0 16px;font-size:15px;color:#6b7280;">
        You requested to change your ${BRAND_NAME} account email. Enter the OTP below to confirm:
      </p>
      ${this._otpBox(otp)}
      <p style="font-size:14px;color:#ef4444;margin:0;">
         If you did not request this, please secure your account immediately.
      </p>
    `);

    return this.sendEmail({
      to: newEmail,
      subject: `${otp} is your ${BRAND_NAME} email change code`,
      html,
    });
  }

  // ── 4. Welcome email (after verification) ───────────────────────────────────
  async sendWelcomeEmail(email, name) {
    const html = this._wrap(`
      <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Welcome to ${BRAND_NAME}! 🎉</h2>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;">Hello <strong>${name}</strong>,</p>
      <p style="margin:0 0 16px;font-size:15px;color:#6b7280;">
        Your email has been verified successfully. Your account is now active — start exploring our range of care products.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/products"
           style="display:inline-block;background:${BRAND_COLOR};color:#fff;font-weight:700;font-size:15px;padding:12px 28px;border-radius:8px;text-decoration:none;">
          Start Shopping
        </a>
      </div>
    `);

    return this.sendEmail({
      to: email,
      subject: `Welcome to ${BRAND_NAME} — Account Verified!`,
      html,
    });
  }
}

module.exports = new EmailService();