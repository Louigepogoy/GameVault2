import nodemailer from 'nodemailer';

// SMTP is optional. Without it, reset links are printed to the server console,
// which is enough for local development.
const transport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : null;

export async function sendPasswordResetEmail({ to, name, link }) {
  if (!transport) {
    console.log(`\n[password reset] SMTP not configured. Reset link for ${to}:\n${link}\n`);
    return;
  }

  await transport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: 'Reset your GameVault password',
    text:
      `Hi ${name},\n\n` +
      `Someone asked to reset the password for your GameVault account.\n` +
      `Open this link within 1 hour to choose a new password:\n\n${link}\n\n` +
      `If you didn't ask for this, you can ignore this email.`,
  });
}
