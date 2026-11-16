// Pack complet : contrôle des phrases écrites pour compléter les packs Hôtel et Business.
// Retraduit chaque phrase vers le français avec MyMemory (gratuit) ; l'assemblage garde celles dont la retraduction est fidèle.
import fs from "node:fs";
const [lang, lot, nLots, mode] = process.argv.slice(2);
const suf = { r2: "2", r3: "3", r4: "4", r5: "5" }[mode] || "";
const all = JSON.parse(fs.readFileSync(new URL(`./a-verifier${suf}/${lang}.json`, import.meta.url)));
const per = Math.ceil(all.length / Number(nLots));
const part = all.slice(Number(lot) * per, (Number(lot) + 1) * per);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const src = lang === "es-MX" ? "es" : lang;
let quota = false;
async function mm(q, from, to) {
  if (quota) return { err: "quota" };
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${encodeURIComponent(from)}|${encodeURIComponent(to)}`);
      if (r.status === 429) { await sleep(5000 * (i + 1)); continue; }
      const j = await r.json();
      const t = String((j.responseData && j.responseData.translatedText) || "");
      if (/MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID (TARGET |SOURCE )?LANGUAGE/i.test(t)) { if (/WARNING/.test(t)) quota = true; return { err: t.slice(0, 80) }; }
      return { text: t.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&") };
    } catch (e) { await sleep(3000); }
  }
  return { err: "réseau" };
}
// Secours gratuit quand MyMemory ne connaît pas la langue (javanais, tongien…) : point d'accès public de Google Traduction, sans clé.
const GT = { jv: "jw", "es-MX": "es" };
async function gt(q, from) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${GT[from] || from}&tl=fr&dt=t&q=${encodeURIComponent(q)}`);
      if (r.status === 429) { await sleep(5000 * (i + 1)); continue; }
      const j = await r.json();
      return { text: (j[0] || []).map((x) => x[0]).join(""), moteur: "google" };
    } catch (e) { await sleep(3000); }
  }
  return { err: "réseau" };
}
const out = [];
for (const it of part) {
  let b = mode === "r4" ? await gt(it.text, lang) : await mm(it.text, src, "fr"); await sleep(mode === "r4" ? 300 : 700);
  if ((b.err && /INVALID/i.test(b.err)) || (!b.err && !b.text.trim())) b = await gt(it.text, lang);
  out.push({ ...it, back: b.text || null, err: b.err || null, moteur: b.moteur || "mymemory" });
  if (mode === "r5" && b.moteur !== "google") { const g = await gt(it.text, lang); await sleep(300); out.push({ ...it, back: g.text || null, err: g.err || null, moteur: "google" }); }
}
fs.mkdirSync("resultats", { recursive: true });
fs.writeFileSync(`resultats/${lang}-${suf ? mode + "-" : ""}${lot}.json`, JSON.stringify({ lang, lot: Number(lot), out }, null, 0));
console.log(lang, lot, "ok", out.filter((x) => !x.err).length, "/", out.length, quota ? "QUOTA" : "");
