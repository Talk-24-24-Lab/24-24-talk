// Pack Hôtel : traduit un lot de phrases françaises vers une langue avec MyMemory (gratuit),
// puis retraduit vers le français pour mesurer la fidélité. Écrit resultats/<langue>-<lot>.json.
import fs from "node:fs";
const [lang, lot, nLots, mode] = process.argv.slice(2);
const src = JSON.parse(fs.readFileSync(new URL("./source_fr.json", import.meta.url)));
const per = Math.ceil(src.length / Number(nLots));
const part = src.slice(Number(lot) * per, (Number(lot) + 1) * per);
const done = mode === "retour" ? JSON.parse(fs.readFileSync(new URL(`./llm/${lang}.json`, import.meta.url))) : null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let quota = false;
async function mm(q, from, to) {
  if (quota) return { err: "quota" };
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${encodeURIComponent(from)}|${encodeURIComponent(to)}`);
      if (r.status === 429) { await sleep(5000 * (i + 1)); continue; }
      const j = await r.json();
      const t = String((j.responseData && j.responseData.translatedText) || "");
      if (/MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID LANGUAGE/i.test(t)) { if (/WARNING/.test(t)) quota = true; return { err: t.slice(0, 80) }; }
      return { text: t.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&") };
    } catch (e) { await sleep(3000); }
  }
  return { err: "réseau" };
}
const out = [];
for (const it of part) {
  let text;
  if (done) {
    const v = (done[it.key] || []).find((x) => x.register === it.register);
    text = v && v.text;
    if (!text) { out.push({ ...it, err: "absent" }); continue; }
  } else {
    const a = await mm(it.fr, "fr", lang); await sleep(800);
    if (a.err) { out.push({ ...it, err: a.err }); continue; }
    text = a.text;
  }
  const b = await mm(text, lang, "fr"); await sleep(800);
  out.push({ ...it, text, back: b.text || null, err: b.err || null });
}
fs.mkdirSync("resultats", { recursive: true });
fs.writeFileSync(`resultats/${lang}-${lot}.json`, JSON.stringify({ lang, lot: Number(lot), mode: mode || "aller", out }, null, 0));
console.log(lang, lot, "ok", out.filter((x) => !x.err).length, "/", out.length, quota ? "QUOTA" : "");
