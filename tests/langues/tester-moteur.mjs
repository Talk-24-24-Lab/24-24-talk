#!/usr/bin/env node
/* 24/24 ONE WORLD — © 2026 Sébastien Chevrier. Tous droits réservés.
 *
 * Teste la traduction réelle de l'appli dans les 112 langues, avec les mêmes règles que l'appli :
 *   1. dictionnaire de phrases vérifiées (PHRASEBOOK de index.html) s'il connaît la phrase ;
 *   2. sinon moteur MyMemory (français → langue), puis retour (langue → français) pour un premier contrôle.
 *
 * Le contrôle automatique (« aller-retour ») ne prouve pas qu'une traduction est bonne : il repère seulement
 * les cas suspects (texte laissé en français, langue non prise en charge, sens perdu au retour). La validation
 * finale se fait par un locuteur natif, dans les colonnes « verdict_natif », « correction » et « relecteur »
 * du fichier CSV produit.
 *
 * Utilisation :
 *   node tests/langues/tester-moteur.mjs                     → les 112 langues (attention au quota MyMemory)
 *   node tests/langues/tester-moteur.mjs --langues=mg,sw,ht  → quelques langues
 *   node tests/langues/tester-moteur.mjs --lot=1             → lot de 20 langues (lots 1 à 6)
 *   node tests/langues/tester-moteur.mjs --simuler           → sans réseau, pour vérifier le script lui-même
 * Variable facultative MYMEMORY_EMAIL : relève le quota gratuit de MyMemory (environ 5 000 → 50 000 caractères/jour).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, "../..");
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, "").split("=");
  return [k, v === undefined ? true : v];
}));
const SIMULER = !!args.simuler;
const PAUSE_MS = SIMULER ? 0 : Number(args.pause || 1200);
const TAILLE_LOT = 20;

// ---------- Ce que l'appli utilise vraiment : liste des langues et dictionnaire vérifié ----------
const html = fs.readFileSync(path.join(RACINE, "index.html"), "utf8");
function bloc(debut, fin) {
  const a = html.indexOf(debut);
  if (a < 0) throw new Error("Introuvable dans index.html : " + debut);
  const b = html.indexOf(fin, a);
  if (b < 0) throw new Error("Introuvable dans index.html : " + fin);
  return html.slice(a, b);
}
function fonctionComplete(nom) {
  const a = html.indexOf("function " + nom);
  let i = html.indexOf("{", a), d = 0;
  for (; i < html.length; i++) { if (html[i] === "{") d++; else if (html[i] === "}" && --d === 0) break; }
  return html.slice(a, i + 1);
}
const codeAppli =
  bloc("const LANGUAGES = [", "function langByCode") +
  bloc("const PHRASEBOOK = {", "function lookupPhrasebook") +
  fonctionComplete("lookupPhrasebook") +
  "\nreturn { LANGUAGES, lookupPhrasebook, PHRASEBOOK };";
const { LANGUAGES, lookupPhrasebook, PHRASEBOOK } = new Function(codeAppli)();

const { phrases } = JSON.parse(fs.readFileSync(path.join(ICI, "phrases.json"), "utf8"));

// ---------- Choix des langues ----------
let langues = LANGUAGES.filter((l) => l.code !== "fr");
if (args.langues) {
  const voulues = String(args.langues).split(",").map((s) => s.trim()).filter(Boolean);
  langues = voulues.map((c) => langues.find((l) => l.code === c) || { code: c, name: c + " (inconnue de l'appli)" });
} else if (args.lot) {
  const n = Number(args.lot);
  langues = langues.slice((n - 1) * TAILLE_LOT, n * TAILLE_LOT);
}

// ---------- Moteur MyMemory (mêmes contrôles que l'appli) ----------
function decoder(x) {
  return x.replace(/&(#x?[0-9a-f]+|quot|amp|lt|gt|apos);/gi, (m, e) => {
    const k = e.toLowerCase();
    if (k === "quot") return '"'; if (k === "amp") return "&"; if (k === "lt") return "<"; if (k === "gt") return ">"; if (k === "apos") return "'";
    const n = k[1] === "x" ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
    return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
  });
}
class Quota extends Error {}
async function moteur(texte, de, vers) {
  if (SIMULER) return de === "fr" ? "[" + vers + "] " + texte : texte.replace(/^\[[^\]]+\] /, "");
  let url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(texte) +
    "&langpair=" + encodeURIComponent(de) + "|" + encodeURIComponent(vers);
  if (process.env.MYMEMORY_EMAIL) url += "&de=" + encodeURIComponent(process.env.MYMEMORY_EMAIL);
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (res.status === 429) throw new Quota("quota");
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  const tr = data && data.responseData && data.responseData.translatedText;
  const st = Number(data && data.responseStatus) || 0;
  const note = String((data && data.responseDetails) || "") + " " + String(tr || "");
  if ((data && data.quotaFinished) || st === 429 || /MYMEMORY WARNING|ALL AVAILABLE FREE TRANSLATIONS|QUOTA/i.test(note)) throw new Quota("quota");
  if (st && st !== 200) throw new Error(String((data && data.responseDetails) || "statut " + st).slice(0, 120));
  if (!tr) throw new Error("réponse vide");
  return decoder(String(tr));
}
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Contrôle automatique ----------
function mots(s) {
  return new Set(String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 1));
}
function proximite(a, b) {
  const A = mots(a), B = mots(b);
  if (!A.size || !B.size) return 0;
  let commun = 0; A.forEach((w) => { if (B.has(w)) commun++; });
  return commun / new Set([...A, ...B]).size;
}
function verdictAuto(ligne) {
  if (ligne.source === "dictionnaire") return "dictionnaire vérifié";
  if (ligne.erreur) return "échec : " + ligne.erreur;
  if (mots(ligne.traduction).size && proximite(ligne.francais, ligne.traduction) > 0.8) return "suspect : laissé en français";
  if (ligne.proximite >= 0.5) return "aller-retour proche";
  if (ligne.proximite >= 0.25) return "aller-retour partiel";
  return "à vérifier : sens perdu au retour";
}

// ---------- Exécution ----------
const date = new Date().toISOString().slice(0, 10);
const dossier = path.join(ICI, "resultats");
fs.mkdirSync(dossier, { recursive: true });
const suffixe = SIMULER ? "-simulation" : "";
const fichierEtat = path.join(dossier, `etat-${date}${suffixe}.json`);
const etat = fs.existsSync(fichierEtat) ? JSON.parse(fs.readFileSync(fichierEtat, "utf8")) : {};
let arretQuota = false;

for (const lang of langues) {
  if (arretQuota) break;
  for (const p of phrases) {
    const cle = lang.code + "|" + p.id;
    if (etat[cle] && !etat[cle].erreur) continue; // déjà fait (reprise après une coupure de quota)
    const ligne = { code: lang.code, langue: lang.name, id: p.id, domaine: p.domaine, francais: p.fr, traduction: "", retour: "", source: "moteur", proximite: 0, erreur: "" };
    const hit = lookupPhrasebook(p.fr, "fr", lang.code);
    try {
      if (hit) {
        ligne.traduction = hit.text; ligne.source = "dictionnaire"; ligne.proximite = 1;
      } else {
        ligne.traduction = await moteur(p.fr, "fr", lang.code);
        await pause(PAUSE_MS);
        ligne.retour = await moteur(ligne.traduction, lang.code, "fr");
        await pause(PAUSE_MS);
        ligne.proximite = Math.round(proximite(p.fr, ligne.retour) * 100) / 100;
      }
    } catch (e) {
      if (e instanceof Quota) { arretQuota = true; console.log(`\nQuota MyMemory atteint pendant ${lang.code} : relancez demain, le travail fait est gardé.`); break; }
      ligne.erreur = String(e.message || e).slice(0, 120);
    }
    ligne.verdict_auto = verdictAuto(ligne);
    etat[cle] = ligne;
    fs.writeFileSync(fichierEtat, JSON.stringify(etat, null, 1));
  }
  process.stdout.write(lang.code + " ");
}
console.log("");

// ---------- Fichiers produits : grille CSV (à relire par des natifs) et résumé ----------
const lignes = Object.values(etat);
const colonnes = ["code", "langue", "id", "domaine", "francais", "traduction", "retour", "source", "proximite", "verdict_auto", "verdict_natif", "correction", "relecteur"];
const csvCase = (v) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
const csv = "﻿" + colonnes.join(";") + "\n" + lignes.map((l) => colonnes.map((c) => csvCase(l[c])).join(";")).join("\n") + "\n";
fs.writeFileSync(path.join(dossier, `grille-${date}${suffixe}.csv`), csv);

const parLangue = {};
for (const l of lignes) {
  const r = (parLangue[l.code] ||= { langue: l.langue, total: 0, dico: 0, proche: 0, partiel: 0, douteux: 0, echec: 0 });
  r.total++;
  if (l.verdict_auto === "dictionnaire vérifié") r.dico++;
  else if (l.verdict_auto === "aller-retour proche") r.proche++;
  else if (l.verdict_auto === "aller-retour partiel") r.partiel++;
  else if (l.verdict_auto.startsWith("échec")) r.echec++;
  else r.douteux++;
}
const dicoLangues = Object.keys(PHRASEBOOK).length;
let md = `# Test de traduction — ${date}${SIMULER ? " (SIMULATION, sans réseau)" : ""}\n\n` +
  `${phrases.length} phrases types × ${Object.keys(parLangue).length} langues testées. ` +
  `Dictionnaire vérifié de l'appli : ${dicoLangues} langues.\n\n` +
  `**Attention** : le contrôle automatique compare la phrase d'origine avec sa traduction retour en français. ` +
  `Il repère les problèmes évidents, il ne prouve pas qu'une traduction est juste. Seule la relecture par un ` +
  `locuteur natif (colonnes à remplir dans la grille CSV) valide une langue.\n\n` +
  `| Code | Langue | Dictionnaire | Aller-retour proche | Partiel | À vérifier | Échec |\n|---|---|---|---|---|---|---|\n`;
for (const [code, r] of Object.entries(parLangue).sort((a, b) => (b[1].echec + b[1].douteux) - (a[1].echec + a[1].douteux))) {
  md += `| ${code} | ${r.langue} | ${r.dico} | ${r.proche} | ${r.partiel} | ${r.douteux} | ${r.echec} |\n`;
}
fs.writeFileSync(path.join(dossier, `resume-${date}${suffixe}.md`), md);
console.log(`Fait : ${lignes.length} traductions. Voir ${path.relative(RACINE, dossier)}/`);
if (arretQuota) process.exitCode = 3;
