import type { Locale } from "@bestdoors/shared";
import type { Email } from "../lib/mailer";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** "Forgot password" email with a one-time link (English only). */
export function passwordResetEmail(to: { email: string; name: string; locale: Locale }, link: string, minutes: number): Email {
  const t = {
    subject: "Reset your Mr.Door password",
    hello: `Hello, ${to.name}!`,
    intro: "We received a request to reset your password. Click the button to choose a new one.",
    button: "Choose a new password",
    expires: `The link works for ${minutes} minutes and only once.`,
    ignore: "If you did not ask for this, just ignore this email. Your password will not change.",
  };
  const html = `<!doctype html>
<html lang="${to.locale}"><body style="margin:0;background:#faf8f4;font-family:Arial,Helvetica,sans-serif;color:#1d2320">
<div style="max-width:600px;margin:0 auto;padding:24px">
  <p style="font-size:22px;font-weight:800;margin:0 0 24px">Best<span style="color:#1f4d3a">Doors</span></p>
  <div style="background:#ffffff;border-radius:12px;padding:24px;line-height:1.5">
    <h1 style="font-size:20px;margin:0 0 8px">${esc(t.hello)}</h1>
    <p style="margin:0 0 20px">${esc(t.intro)}</p>
    <p style="margin:0 0 20px"><a href="${esc(link)}" style="display:inline-block;background:#1f4d3a;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px">${esc(t.button)}</a></p>
    <p style="margin:0 0 8px;font-size:13px;color:#5d6661">${esc(t.expires)}</p>
    <p style="margin:0 0 8px;font-size:13px;color:#5d6661">${esc(t.ignore)}</p>
    <p style="margin:16px 0 0;font-size:12px;color:#5d6661;word-break:break-all">${esc(link)}</p>
  </div>
</div></body></html>`;
  const text = [t.hello, "", t.intro, "", link, "", t.expires, t.ignore].join("\n");
  return { to: to.email, subject: t.subject, html, text };
}
