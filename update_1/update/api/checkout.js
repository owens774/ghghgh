/*
 * POST /api/checkout
 * Body: { plan: "plus" | "unlimited", email, userId }
 * Returns: { url }  -> redirect the browser there to pay.
 *
 * Vercel serverless function. Env vars (Vercel → Settings → Environment Variables):
 *   STRIPE_SECRET_KEY
 *   STRIPE_PRICE_PLUS         (Price ID of the $9.99/mo product)
 *   STRIPE_PRICE_UNLIMITED    (Price ID of the $17.99/mo product)
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (server only)
 *   PUBLIC_URL                (e.g. https://playbooku.com)
 */
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  try {
    const { plan, email, userId } = req.body || {};
    const price = plan === "unlimited" ? process.env.STRIPE_PRICE_UNLIMITED : process.env.STRIPE_PRICE_PLUS;
    if (!price) { res.status(400).json({ error: "Unknown plan" }); return; }

    // One free trial per email, enforced server-side: only attach the Stripe trial
    // if this email has never used one (ledger row absent).
    let trialUsed = true;
    if (email) {
      const { data } = await admin.from("trial_ledger").select("email").eq("email", email).maybeSingle();
      trialUsed = !!data;
    }

    const base = process.env.PUBLIC_URL || "";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      customer_email: email,
      client_reference_id: userId || undefined,
      subscription_data: trialUsed ? {} : { trial_period_days: 1 },
      metadata: { plan, userId: userId || "", email: email || "" },
      success_url: `${base}/?checkout=success&plan=${plan}`,
      cancel_url: `${base}/?checkout=cancel`,
    });

    // If we're granting the trial here, burn the ledger entry now so it can't be reused.
    if (!trialUsed && email) {
      await admin.from("trial_ledger").upsert({ email }, { onConflict: "email" });
    }

    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
