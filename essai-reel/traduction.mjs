// Essai réel de la traduction en ligne (MyMemory), avec la MÊME règle de choix que l'appli (mmBest de index.html).
// Écrit un tableau : phrase, langues, réponse brute, réponse choisie par l'appli, alerte.
import fs from "node:fs";
const cfg = JSON.parse(fs.readFileSync(new URL("./traduction.json", import.meta.url)));
function mmBest(data) {
  const rd = data && data.responseData, tr = rd && rd.translatedText, exact = rd && Number(rd.match) >= 1;
  const mt = !exact && Array.isArray(data && data.matches) ? data.matches.find((m) => m && m["created-by"] === "MT!" && m.translation) : null;
  return mt ? mt.translation : tr;
}
const rows = []; let alertes = 0;
for (const [q, pair] of cfg.phrases) {
  let raw = "", best = "", match = "", err = "";
  try {
    const r = await fetch("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(q) + "&langpair=" + pair);
    const d = await r.json();
    raw = d?.responseData?.translatedText || ""; match = d?.responseData?.match; best = mmBest(d) || "";
  } catch (e) { err = String(e); }
  const bad = !best || err || /XXX|MYMEMORY|QUOTA/i.test(best) || best.trim().toLowerCase() === q.trim().toLowerCase();
  if (bad) alertes++;
  rows.push(`| ${q} | ${pair} | ${raw} | ${match} | ${best} | ${bad ? "⚠️ " + err : "OK"} |`);
  console.log((bad ? "ALERTE" : "OK    ") + "  " + pair + "  " + q + "  →  brut: " + raw + "  |  appli: " + best + " (match " + match + ")");
  await new Promise((r) => setTimeout(r, 400));
}
const md = `## Traduction réelle (MyMemory, règle de l'appli)\n\n${rows.length - alertes}/${rows.length} sans alerte\n\n| Phrase | Langues | Brut | match | Choisi par l'appli | État |\n|---|---|---|---|---|---|\n${rows.join("\n")}\n`;
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
console.log(`\n${rows.length - alertes} / ${rows.length} sans alerte`);
