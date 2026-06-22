/*
 * POST /api/webhook — Stripe calls this when a subscription changes.
 * It writes the user's plan + status into Supabase so no device can fake it.
 *
 * Env (Vercel):
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET       (Stripe → Developers → Webhooks → your endpoint)
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (server only)
 *
 * The function needs the RAW body to verify the signature, hence bodyParser:false.
 */
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function readRaw(req) {
  return new Promise((resolve) => {
    let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => resolve(Buffer.from(d)));
  });
}

async function patchProfile(match, fields) {
  // match: { id } or { email }; update by whichever we have.
  let q = admin.from("profiles").update(fields);
  q = match.id ? q.eq("id", match.id) : q.eq("email", match.email);
  await q;
}

export default async function handler(req, res) {
  let event;
  try {
    const raw = await readRaw(req);
    event = stripe.webhooks.constructEvent(raw, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`); return;
  }

  try {
    const obj = event.data.object;

    if (event.type === "checkout.session.completed") {
      const id = obj.client_reference_id || obj.metadata?.userId || null;
      const email = obj.customer_email || obj.customer_details?.email || obj.metadata?.email || null;
      const plan = obj.metadata?.plan || "plus";
      await patchProfile(id ? { id } : { email }, {
        plan,
        sub_status: "active",
        stripe_customer_id: obj.customer || null,
      });
      if (email) await admin.from("trial_ledger").upsert({ email }, { onConflict: "email" });
    }

    else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
      const status = obj.status; // trialing | active | past_due | canceled | unpaid
      const plan = obj.items?.data?.[0]?.price?.id === process.env.STRIPE_PRICE_UNLIMITED ? "unlimited" : "plus";
      const live = status === "active" || status === "trialing";
      const email = obj.metadata?.email || null;
      const match = obj.metadata?.userId ? { id: obj.metadata.userId } : (email ? { email } : null);
      if (match) {
        await patchProfile(match, {
          plan: live ? plan : "",
          sub_status: status,
          current_period_end: obj.current_period_end ? new Date(obj.current_period_end * 1000).toISOString() : null,
          stripe_customer_id: obj.customer || null,
        });
      }
    }

    else if (event.type === "customer.subscription.deleted") {
      const match = obj.metadata?.userId ? { id: obj.metadata.userId } : (obj.metadata?.email ? { email: obj.metadata.email } : null);
      if (match) await patchProfile(match, { plan: "", sub_status: "canceled" });
    }

    res.status(200).json({ received: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
