#!/usr/bin/env node
/* 24/24 ONE WORLD — © 2026 Sébastien Chevrier. Tous droits réservés.
 * Recopie tests/langues/phrases-pro.tsv (phrases professionnelles, langues commerciales) dans index.html,
 * entre les repères PRO_PACK_DEBUT et PRO_PACK_FIN. Après une correction d'un relecteur natif :
 *   1. corriger la case dans phrases-pro.tsv ;  2. node tests/langues/pack-pro.mjs ;  3. publier.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, "../..");
const lignes = fs.readFileSync(path.join(ICI, "phrases-pro.tsv"), "utf8").split("\n").filter((l) => l.trim());
const entete = lignes[0].split("\t").map((s) => s.trim());
if (entete[0] !== "fr") throw new Error("La première colonne doit être fr");
const phrases = lignes.slice(1).map((l, n) => {
  const c = l.split("\t");
  if (c.length !== entete.length) throw new Error(`Ligne ${n + 2} : ${c.length} colonnes au lieu de ${entete.length}`);
  const o = {}; entete.forEach((k, i) => { o[k] = c[i].trim(); if (!o[k]) throw new Error(`Ligne ${n + 2} : case ${k} vide`); });
  return o;
});
const bloc = "// PRO_PACK_DEBUT — généré par tests/langues/pack-pro.mjs depuis tests/langues/phrases-pro.tsv : ne pas modifier ici.\n" +
  "// Phrases professionnelles (hôtel, restaurant, commerce, transport, santé) traduites avec soin pour les langues\n" +
  "// commerciales. Relecture par des locuteurs natifs en cours : l'appli les affiche comme « phrase pro », pas « vérifiée ».\n" +
  "const PRO_LANGS = " + JSON.stringify(entete.slice(1)) + ";\n" +
  "const PRO_PACK = [\n" + phrases.map((p) => "  " + JSON.stringify(p)).join(",\n") + "\n];\n" +
  "// PRO_PACK_FIN";
const fichier = path.join(RACINE, "index.html");
let html = fs.readFileSync(fichier, "utf8");
const a = html.indexOf("// PRO_PACK_DEBUT"), b = html.indexOf("// PRO_PACK_FIN");
if (a < 0 || b < 0) throw new Error("Repères PRO_PACK introuvables dans index.html");
html = html.slice(0, a) + bloc + html.slice(b + "// PRO_PACK_FIN".length);
fs.writeFileSync(fichier, html);
console.log(`${phrases.length} phrases × ${entete.length - 1} langues recopiées dans index.html`);
