/*
 * POST /api/send-play
 * Body: { to, channel: "email" | "sms", link, title }
 * Sends the play link straight to someone's phone/tablet so it shows up on their
 * device — no tapping "send" on your end.
 *
 * Email  → Resend  (env: RESEND_API_KEY, RESEND_FROM e.g. "Playbook U <plays@yourdomain.com>")
 * SMS    → Twilio  (env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM e.g. "+15551234567")
 *
 * Configure whichever channels you want; the other simply returns a helpful error.
 * Uses the global fetch built into the Vercel Node runtime (no SDK needed).
 */
export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "Method not allowed" }); return; }
  try {
    const { to, channel, link, title } = req.body || {};
    if (!to || !link) { res.status(400).json({ ok: false, error: "Missing recipient or link" }); return; }
    const name = title || "A play";

    if (channel === "email") {
      if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
        res.status(200).json({ ok: false, error: "Email isn't set up yet (add RESEND_API_KEY)" }); return;
      }
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.RESEND_FROM,
          to: [to],
          subject: `${name} — a Playbook U play for you`,
          html: `<p>A coach sent you a play on <b>Playbook&nbsp;U</b>.</p>
                 <p><a href="${link}" style="background:#46a05a;color:#06120a;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">▶ Watch the play</a></p>
                 <p style="color:#667">Or paste this link into your browser:<br>${link}</p>`,
          text: `A coach sent you a play on Playbook U — open it here:\n${link}`,
        }),
      });
      if (!r.ok) { const t = await r.text(); res.status(200).json({ ok: false, error: `Email failed: ${t.slice(0, 120)}` }); return; }
      res.status(200).json({ ok: true }); return;
    }

    // default: SMS via Twilio
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM } = process.env;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) {
      res.status(200).json({ ok: false, error: "Texting isn't set up yet (add TWILIO_ keys)" }); return;
    }
    const num = String(to).replace(/[^0-9+]/g, "");
    const body = new URLSearchParams({
      To: num.startsWith("+") ? num : `+1${num}`,
      From: TWILIO_FROM,
      Body: `A coach sent you a play on Playbook U — tap to watch it:\n${link}`,
    });
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!r.ok) { const t = await r.text(); res.status(200).json({ ok: false, error: `Text failed: ${t.slice(0, 120)}` }); return; }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(200).json({ ok: false, error: err.message });
  }
}
