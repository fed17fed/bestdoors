import { Resend } from "resend";
import { env } from "./env";

export type Email = { to: string | string[]; subject: string; html: string; text: string; replyTo?: string };
export type SendEmail = (email: Email) => Promise<void>;

let resend: Resend | undefined;

const sendWithResend: SendEmail = async (email) => {
  const key = env().RESEND_API_KEY;
  if (!key) {
    console.warn(`[mailer] RESEND_API_KEY is not set, email not sent: "${email.subject}"`);
    return;
  }
  resend ??= new Resend(key);
  const { error } = await resend.emails.send({ from: env().EMAIL_FROM, ...email });
  if (error) throw new Error(`Resend: ${error.name}: ${error.message}`);
};

let sender: SendEmail = sendWithResend;

/** Sends an email. Never throws: a failed email must not break an order. */
export async function sendEmail(email: Email): Promise<boolean> {
  try {
    await sender(email);
    return true;
  } catch (err) {
    console.error("[mailer] could not send email:", err);
    return false;
  }
}

/** Tests replace the sender. Pass undefined to restore Resend. */
export function setEmailSender(next: SendEmail | undefined) {
  sender = next ?? sendWithResend;
}
