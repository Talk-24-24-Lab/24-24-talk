// 24/24 ONE WORLD — essai RÉEL sur la base de TEST (tbynnefrrxzxufcptijc), lancé par GitHub Actions.
// Étape « demander » : envoie un code de connexion par e-mail à deux adresses d'essai.
// Étape « verifier » : se connecte avec les codes, crée deux profils, ouvre une discussion, envoie des messages,
// vérifie la réception (lecture + temps réel), l'ordre, l'absence de doublon, la traduction, puis supprime les deux comptes.
// Clé publique (publishable) uniquement : elle est déjà dans la page publique du site de test. Aucun secret.
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
const URL = "https://tbynnefrrxzxufcptijc.supabase.co", KEY = "sb_publishable_zNyy7HYlbwtdNjewaxcKdA_uF_vlskR";
const cfg = JSON.parse(fs.readFileSync(new URL_("./essai.json", import.meta.url)));
function URL_(p, b) { return new globalThis.URL(p, b); }
const out = [];
const ok = (n, c, d) => { out.push((c ? "OK    " : "ÉCHEC ") + n + (d ? " — " + d : "")); console.log(out[out.length - 1]); return c; };
const client = () => createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const A = cfg.a, B = cfg.b;

if (cfg.etape === "demander") {
  for (const e of [A, B]) {
    const c = client();
    const { error } = await c.auth.signInWithOtp({ email: e, options: { shouldCreateUser: true, data: { email_lang: "fr" } } });
    ok("Code envoyé à " + e, !error, error ? error.message : "");
  }
} else if (cfg.etape === "verifier") {
  const ca = client(), cb = client();
  const va = await ca.auth.verifyOtp({ email: A, token: String(cfg.code_a), type: "email" });
  const vb = await cb.auth.verifyOtp({ email: B, token: String(cfg.code_b), type: "email" });
  ok("Connexion A avec le code reçu par e-mail", !va.error && va.data.session, va.error && va.error.message);
  ok("Connexion B avec le code reçu par e-mail", !vb.error && vb.data.session, vb.error && vb.error.message);
  if (va.error || vb.error) process.exit(1);
  const ua = va.data.user, ub = vb.data.user, ts = Date.now().toString(36);
  ok("Comptes confirmés, non anonymes", !ua.is_anonymous && !ub.is_anonymous && !!ua.email_confirmed_at && !!ub.email_confirmed_at);
  const pa = "essai.a" + ts, pb = "essai.b" + ts;
  let r = await ca.from("profiles").insert({ id: ua.id, pseudo: pa, lang: "fr", nom: "Essai A" });
  ok("Profil A créé (français)", !r.error, r.error && r.error.message);
  r = await cb.from("profiles").insert({ id: ub.id, pseudo: pb, lang: "es", nom: "Essai B" });
  ok("Profil B créé (espagnol)", !r.error, r.error && r.error.message);
  const sc = await ca.rpc("start_conversation", { other_pseudo: pb });
  const conv = typeof sc.data === "string" ? sc.data : sc.data && (sc.data.id || sc.data.conversation_id || sc.data);
  ok("A ouvre une discussion avec B", !sc.error && !!conv, sc.error ? sc.error.message : JSON.stringify(sc.data));
  // B écoute en temps réel avant l'envoi
  const recus = [];
  await cb.realtime.setAuth(vb.data.session.access_token);
  const ch = cb.channel("essai-" + ts).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p) => recus.push(p.new));
  const etat = await new Promise((res) => { ch.subscribe((s, err) => { if (s === "SUBSCRIBED" || s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") res(s + (err ? " " + err.message : "")); }); setTimeout(() => res("pas de réponse en 15 s"), 15000); });
  ok("B est abonné au temps réel", etat === "SUBSCRIBED", etat);
  await new Promise((res) => setTimeout(res, 1500));
  const textes = ["Bonjour, comment vas-tu ?", "Message 2", "Message 3", "Message 4", "Message 5"];
  for (const t of textes) {
    const m = await ca.from("messages").insert({ conversation_id: conv, body: t, lang: "fr", kind: "text" }).select("id,created_at").single();
    if (m.error) ok("Envoi « " + t + " »", false, m.error.message);
  }
  for (let i = 0; i < 20 && recus.length < 5; i++) await new Promise((res) => setTimeout(res, 500));
  const lus = await cb.from("messages").select("id,body,lang,sender_id,created_at").eq("conversation_id", conv).order("created_at", { ascending: true });
  const corps = (lus.data || []).map((m) => m.body);
  ok("B reçoit les 5 messages (lecture)", corps.length === 5, corps.length + " lus");
  ok("Ordre respecté", JSON.stringify(corps) === JSON.stringify(textes), corps.join(" | "));
  ok("Aucun doublon", new Set((lus.data || []).map((m) => m.id)).size === corps.length);
  ok("B reçoit les messages en temps réel", recus.filter((m) => m.conversation_id === conv).length === 5, recus.length + " reçus en direct");
  const tr = await fetch("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(textes[0]) + "&langpair=fr|es").then((x) => x.json()).catch((e) => ({ err: String(e) }));
  const txt = tr && tr.responseData && tr.responseData.translatedText;
  ok("Traduction français → espagnol (service MyMemory utilisé par l'appli)", !!txt && txt !== textes[0], txt || JSON.stringify(tr).slice(0, 120));
  // Un compte tiers (C = anonyme récent) ne peut pas lire la discussion
  const cc = client(); const an = await cc.auth.signInAnonymously();
  if (!an.error) {
    const spy = await cc.from("messages").select("id").eq("conversation_id", conv);
    ok("Un inconnu ne voit pas la discussion", !spy.error ? (spy.data || []).length === 0 : true, spy.error ? spy.error.message : (spy.data || []).length + " ligne(s)");
    const spam = await cc.from("profiles").insert({ id: an.data.user.id, pseudo: "spam" + ts, lang: "fr" });
    ok("Compte anonyme sans e-mail : profil refusé (e-mail obligatoire)", !!spam.error, spam.error ? spam.error.message : "ACCEPTÉ");
  } else ok("Connexion anonyme (pour l'essai d'intrusion)", false, an.error.message);
  await cb.removeChannel(ch);
  // Ménage : suppression des deux comptes d'essai par la fonction de l'appli
  for (const [n, c] of [["A", ca], ["B", cb]]) {
    const d = await c.rpc("supprimer_mon_compte");
    ok("Suppression du compte " + n, !d.error, d.error && d.error.message);
  }
}
fs.writeFileSync("essai-reel/resultat.txt", out.join("\n") + "\n");
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, "```\n" + out.join("\n") + "\n```\n");
process.exit(out.some((l) => l.startsWith("ÉCHEC")) ? 1 : 0);
