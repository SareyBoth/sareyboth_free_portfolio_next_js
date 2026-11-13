import nodemailer from "nodemailer";

export function getEmailTransporter() {
  const host = process.env.SMTP_HOST || "localhost";
  const port = Number(process.env.SMTP_PORT || 1025);
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const auth = user && pass ? { user, pass } : undefined;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth,
  });
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}) {
  const transporter = getEmailTransporter();
  const from = process.env.SMTP_FROM || "noreply@example.com";

  await transporter.sendMail({
    from,
    to,
    subject: "Reset your SareyBothPortfolio password",
    text: `You requested a password reset for your SareyBothPortfolio account. Click the link below to set a new password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2dfd7; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #18181b; font-size: 20px; font-weight: 700; margin-top: 0;">Reset your SareyBothPortfolio password</h2>
        <p style="color: #595965; font-size: 14px; line-height: 1.6;">You requested a password reset for your SareyBothPortfolio staff account. Click the button below to set a new password:</p>
        <div style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #3d4f73; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #8c8f99; font-size: 12px; line-height: 1.5; margin-bottom: 0;">If you did not request this reset, you can safely ignore this message. This link will expire shortly.</p>
      </div>
    `,
  });
}
