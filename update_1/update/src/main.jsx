import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import PlaybookU from "./PlaybookU.jsx";
import { hasSupabase, supabase, signUpWithPassword, signInWithPassword, sendPasswordReset, getProfile, startTrial, startCheckout } from "./lib/supabase.js";
import { TERMS_TEXT, PRIVACY_TEXT } from "./legal.js";

/* ───────────────────────────────────────────────────────────────────────────
 * Playbook U runs the same app two ways:
 *
 *  • No backend configured  → everything persists on the device (localStorage).
 *    This is the instant, free-to-host web build (Phase 1).
 *
 *  • Supabase + Stripe configured → real passwordless accounts, the plan and the
 *    one-free-trial-per-email come from the server (a device can't fake or reset
 *    them), playbooks sync across devices, and paid plans go through Stripe.
 *
 * The app itself is untouched: it reads/writes through `window.storage`, so we
 * simply point that at the server when a backend exists.
 * ────────────────────────────────────────────────────────────────────────── */

function installLocalStorage() {
  if (window.storage) return;
  window.storage = {
    async get(k) { try { const v = localStorage.getItem(k); return v == null ? null : { key: k, value: v }; } catch { return null; } },
    async set(k, v) { try { localStorage.setItem(k, v); return { key: k, value: v }; } catch { return null; } },
    async delete(k) { try { localStorage.removeItem(k); return { key: k, deleted: true }; } catch { return null; } },
  };
}

const SPECIAL = new Set(["playbook:account", "playbook:access", "playbook:trial"]);

/* Let the app send a play straight to a phone/tablet via the hosted sender
 * (/api/send-play). When this is present, the in-app Share sheet delivers
 * automatically instead of just opening Messages/Mail. */
function installSender() {
  if (typeof window === "undefined") return;
  window.playbookSend = async ({ to, channel, link, title }) => {
    try {
      const r = await fetch("/api/send-play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, channel, link, title }),
      });
      return await r.json();
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };
}
installSender();

/* When someone opens a shared-play link, let them watch it without an account,
 * and give the in-app "Sign up to build your own" button a way to leave preview. */
function hasSharedPlay() {
  try { return /[#&?]p=/.test((window.location.hash || "") + (window.location.search || "")); } catch { return false; }
}
if (typeof window !== "undefined") {
  window.playbookGoSignup = () => {
    try { const clean = window.location.origin + window.location.pathname; if (window.location.href !== clean) window.location.href = clean; else window.location.reload(); } catch (e) {}
  };
}

/* Point window.storage at Supabase. Account/plan/trial are derived from the
 * server profile; everything else (playbooks, saved plays) syncs to user_data. */
function installServerStorage(user, profile, cache) {
  const uid = user.id;
  const email = user.email;
  const name = (user.user_metadata && (user.user_metadata.name || user.user_metadata.full_name)) || email.split("@")[0];
  const tms = profile.trial_started_at ? Date.parse(profile.trial_started_at) : 0;

  const accessVal = () => JSON.stringify({ entered: !!profile.plan, plan: profile.plan || "", trialStart: tms, welcomed: true });
  const accountVal = () => JSON.stringify({ email, name, at: Date.now(), agreedAt: Date.now(), termsVersion: "1.0" });
  const trialVal = () => JSON.stringify(profile.trial_used ? { [email]: tms || 1 } : {});

  window.storage = {
    async get(k) {
      if (k === "playbook:account") return { key: k, value: accountVal() };
      if (k === "playbook:access") return { key: k, value: accessVal() };
      if (k === "playbook:trial") return { key: k, value: trialVal() };
      if (cache.has(k)) { const v = cache.get(k); return v == null ? null : { key: k, value: v }; }
      try {
        const { data } = await supabase.from("user_data").select("value").eq("user_id", uid).eq("key", k).single();
        const v = data ? data.value : null; cache.set(k, v);
        return v == null ? null : { key: k, value: v };
      } catch { return null; }
    },
    async set(k, v) {
      if (k === "playbook:account") {
        if (v === "null" || v == null) { await supabase.auth.signOut(); location.reload(); }
        return { key: k, value: v };
      }
      if (k === "playbook:access") {
        let o = {}; try { o = JSON.parse(v) || {}; } catch {}
        if (o.plan === "trial") {
          const r = await startTrial();            // server-enforced one-per-email
          if (r === "already_used") location.reload();
        } else if (o.plan === "plus" || o.plan === "unlimited") {
          try { await startCheckout(o.plan, email, uid); } catch (e) {}  // → Stripe
        }
        return { key: k, value: v };
      }
      if (k === "playbook:trial") return { key: k, value: v };  // server owns it
      cache.set(k, v);
      supabase.from("user_data").upsert({ user_id: uid, key: k, value: v }, { onConflict: "user_id,key" }).then(() => {}, () => {});
      return { key: k, value: v };
    },
    async delete(k) {
      cache.delete(k);
      if (!SPECIAL.has(k)) supabase.from("user_data").delete().eq("user_id", uid).eq("key", k).then(() => {}, () => {});
      return { key: k, deleted: true };
    },
  };
}

const wrap = { minHeight: "100vh", display: "grid", placeItems: "center", background: "#0a120d", color: "#e8efe9", fontFamily: "system-ui, sans-serif", padding: 24 };

function Splash() {
  return <div style={wrap}><div style={{ textAlign: "center", opacity: .85 }}><div style={{ fontSize: 30, letterSpacing: 2, fontWeight: 800 }}>PLAYBOOK&nbsp;U</div><div style={{ marginTop: 10, color: "#9fb0a4" }}>Loading your playbook…</div></div></div>;
}

const inputStyle = { width: "100%", padding: "13px 14px", borderRadius: 11, border: "1px solid #2a3a30", background: "#0e1812", color: "#e8efe9", fontSize: 15, boxSizing: "border-box", marginTop: 10 };
const btnStyle = { width: "100%", marginTop: 14, padding: 14, borderRadius: 11, border: "none", background: "#46a05a", color: "#06120a", fontWeight: 800, fontSize: 15, cursor: "pointer" };
const linkStyle = { background: "none", border: "none", color: "#7fc08e", fontSize: 13, cursor: "pointer", padding: 4 };
const legalLink = { background: "none", border: "none", color: "#7fc08e", cursor: "pointer", padding: 0, font: "inherit", textDecoration: "underline" };

function LegalModal({ view, onClose }) {
  if (!view) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", display: "grid", placeItems: "center", padding: 16, zIndex: 60 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#0e1812", border: "1px solid #2a3a30", borderRadius: 14, maxWidth: 660, width: "100%", maxHeight: "84vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #1e2a23", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <b style={{ color: "#e8efe9" }}>{view === "terms" ? "Terms of Service" : "Privacy Policy"}</b>
          <button onClick={onClose} style={{ ...legalLink, fontSize: 20, textDecoration: "none", color: "#9fb0a4" }}>✕</button>
        </div>
        <div style={{ padding: 18, overflowY: "auto", whiteSpace: "pre-wrap", fontSize: 12.5, lineHeight: 1.55, color: "#c7d3cb" }}>{view === "terms" ? TERMS_TEXT : PRIVACY_TEXT}</div>
      </div>
    </div>
  );
}

function SignIn() {
  const [mode, setMode] = useState("signin"); // signin | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [legalView, setLegalView] = useState("");

  const reset = () => { setErr(""); setMsg(""); };
  const go = async () => {
    reset();
    const em = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { setErr("Please enter a valid email."); return; }
    setBusy(true);
    try {
      if (mode === "forgot") {
        await sendPasswordReset(em);
        setMsg("If that email has an account, a password-reset link is on its way.");
      } else if (mode === "signup") {
        if (!first.trim() || !last.trim()) { setErr("Please enter your first and last name."); setBusy(false); return; }
        if (password.length < 6) { setErr("Password must be at least 6 characters."); setBusy(false); return; }
        if (!agreed) { setErr("Please agree to the Terms of Service and Privacy Policy."); setBusy(false); return; }
        const { data, error } = await signUpWithPassword(em, password, { first: first.trim(), last: last.trim() });
        if (error) setErr(error.message);
        else if (data && data.session) { /* auto signed-in; onAuthStateChange takes over */ }
        else { setMsg("Account created! Check your email to verify your address, then sign in below."); setMode("signin"); }
      } else {
        const { error } = await signInWithPassword(em, password);
        if (error) setErr(/Email not confirmed/i.test(error.message) ? "Please verify your email first — check your inbox for the confirmation link." : "Wrong email or password.");
      }
    } catch (e) { setErr(e.message || "Something went wrong."); }
    setBusy(false);
  };

  return (
    <div style={wrap}>
      <div style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
        <div style={{ fontSize: 30, letterSpacing: 2, fontWeight: 800 }}>★ PLAYBOOK&nbsp;U ★</div>
        <p style={{ color: "#9fb0a4", marginTop: 8 }}>
          {mode === "signup" ? "Create your account." : mode === "forgot" ? "Reset your password." : "Sign in to your account."}
        </p>
        <div style={{ marginTop: 18, textAlign: "left" }}>
          {mode === "signup" && (
            <div style={{ display: "flex", gap: 8 }}>
              <input value={first} onChange={(e) => setFirst(e.target.value)} placeholder="First name" style={{ ...inputStyle, marginTop: 0 }} />
              <input value={last} onChange={(e) => setLast(e.target.value)} placeholder="Last name" style={{ ...inputStyle, marginTop: 0 }} />
            </div>
          )}
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" type="email" autoComplete="email" style={inputStyle} />
          {mode !== "forgot" && (
            <input value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} placeholder="Password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} style={inputStyle} />
          )}
          {err && <div style={{ color: "#e06b6b", fontSize: 13, marginTop: 10 }}>{err}</div>}
          {msg && <div style={{ color: "#7fc08e", fontSize: 13, marginTop: 10 }}>{msg}</div>}
          {mode === "signup" && (
            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 12, fontSize: 12, color: "#9fb0a4", cursor: "pointer" }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 2, flex: "0 0 auto" }} />
              <span>I agree to the <button type="button" style={legalLink} onClick={(e) => { e.preventDefault(); setLegalView("terms"); }}>Terms of Service</button> and <button type="button" style={legalLink} onClick={(e) => { e.preventDefault(); setLegalView("privacy"); }}>Privacy Policy</button>, including automatic monthly billing until I cancel.</span>
            </label>
          )}
          <button onClick={go} disabled={busy} style={{ ...btnStyle, opacity: busy ? 0.6 : 1 }}>
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in →"}
          </button>
        </div>
        <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {mode === "signin" ? (
            <>
              <button style={linkStyle} onClick={() => { reset(); setMode("forgot"); }}>Forgot password?</button>
              <button style={linkStyle} onClick={() => { reset(); setMode("signup"); }}>Create an account</button>
            </>
          ) : (
            <button style={linkStyle} onClick={() => { reset(); setMode("signin"); }}>← Back to sign in</button>
          )}
        </div>
        <div style={{ marginTop: 18, fontSize: 11.5, color: "#5f7066" }}>
          <button style={{ ...legalLink, color: "#5f7066", fontSize: 11.5 }} onClick={() => setLegalView("terms")}>Terms of Service</button>
          <span> · </span>
          <button style={{ ...legalLink, color: "#5f7066", fontSize: 11.5 }} onClick={() => setLegalView("privacy")}>Privacy Policy</button>
        </div>
      </div>
      <LegalModal view={legalView} onClose={() => setLegalView("")} />
    </div>
  );
}

function Root() {
  const [phase, setPhase] = useState(hasSupabase ? "loading" : "local");

  useEffect(() => {
    if (!hasSupabase) { installLocalStorage(); return; }
    if (hasSharedPlay()) { installLocalStorage(); setPhase("local"); return; } // watch a shared play without an account
    let cancelled = false;
    const boot = async (u) => {
      let profile = await getProfile(u.id);
      if (!profile) profile = { plan: "", trial_used: false, trial_started_at: null, sub_status: "" };
      const cache = new Map();
      try { const { data } = await supabase.from("user_data").select("key,value").eq("user_id", u.id); (data || []).forEach((r) => cache.set(r.key, r.value)); } catch {}
      installServerStorage(u, profile, cache);
      if (!cancelled) setPhase("ready");
    };
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) await boot(session.user); else setPhase("signin");
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setPhase((p) => (p === "ready" ? p : (boot(session.user), "loading")));
      else setPhase("signin");
    });
    return () => { cancelled = true; sub && sub.subscription && sub.subscription.unsubscribe(); };
  }, []);

  if (phase === "loading") return <Splash />;
  if (phase === "signin") return <SignIn />;
  return <PlaybookU />; // "local" and "ready" both render the app
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
