import { getSettings } from "@/lib/settings";
// SMTP via EMAIL_SERVER (e.g. smtps://user:pass@host:465). Best-effort: failures are swallowed and message content is never logged.
export async function notifyAdmin(name: string, email: string, company: string | undefined, message: string) {
  const to = (await getSettings()).notifyEmail || process.env.ADMIN_NOTIFY_EMAIL;
  if (!process.env.EMAIL_SERVER || !process.env.EMAIL_FROM || !to) return;
  try { const nm = (await import("nodemailer")).default; const clean = (x: string) => x.replace(/[\r\n]+/g, " ").slice(0, 80);
    await nm.createTransport(process.env.EMAIL_SERVER).sendMail({ from: process.env.EMAIL_FROM, to, replyTo: email, subject: `New VYOMA ROUTE contact: ${clean(name)}`, text: `From: ${clean(name)} <${email}>${company ? `\nCompany: ${clean(company)}` : ""}\n\n${message}` });
  } catch { console.error("contact notification failed"); }
}

export async function sendAdminEmail(subject: string, text: string) {
  const to = (await getSettings()).notifyEmail || process.env.ADMIN_NOTIFY_EMAIL; if (!process.env.EMAIL_SERVER || !process.env.EMAIL_FROM || !to) return false;
  try { const nm = (await import("nodemailer")).default; await nm.createTransport(process.env.EMAIL_SERVER).sendMail({ from: process.env.EMAIL_FROM, to, subject, text }); return true; } catch { return false; }
}

// ── Transactional mail for sellers (verification / password reset), over the same SMTP settings as above ──
// In development with no SMTP configured, the message is printed to the server console so you can click the link locally.
// In production a missing configuration is an error, so a reset or verification email is never silently dropped.
export async function sendEmail(m: { to: string; subject: string; text: string; html: string }) {
  if (!process.env.EMAIL_SERVER || !process.env.EMAIL_FROM) {
    if (process.env.NODE_ENV !== "production") { console.log(`\n[email:dev] To: ${m.to}\nSubject: ${m.subject}\n${m.text}\n`); return; }
    throw new Error("Email is not configured (EMAIL_SERVER / EMAIL_FROM).");
  }
  const nm = (await import("nodemailer")).default;
  await nm.createTransport(process.env.EMAIL_SERVER).sendMail({ from: process.env.EMAIL_FROM, to: m.to, subject: m.subject, text: m.text, html: m.html });
}
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
export const actionEmail = (o: { name: string; heading: string; intro: string; button: string; url: string; note: string }) => ({
  text: `Hi ${o.name},\n\n${o.intro}\n\n${o.button}: ${o.url}\n\n${o.note}\n\nVyoma Route`,
  html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#111"><h2 style="margin:0 0 12px">${esc(o.heading)}</h2><p>Hi ${esc(o.name)},</p><p>${esc(o.intro)}</p><p style="margin:24px 0"><a href="${esc(o.url)}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">${esc(o.button)}</a></p><p style="color:#555;font-size:13px">${esc(o.note)}</p><p style="color:#999;font-size:12px">If the button does not work, paste this link into your browser:<br>${esc(o.url)}</p></div>`,
});
