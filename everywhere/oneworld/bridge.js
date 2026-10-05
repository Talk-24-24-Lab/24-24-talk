/* 24/24 ONE WORLD — WORLD BRIDGE : la porte d'entrée. © 2026 Sébastien Chevrier. Tous droits réservés.
   « Vous ne parlez pas la même langue ? Parlez quand même. »
   Je choisis ma langue → la langue de l'autre → j'écris ou je dicte → traduction → l'autre comprend → on continue
   (face à face dans EVERYWHERE, ou dans TALK).

   Ce module ne crée AUCUNE nouvelle infrastructure :
   - traduction : OWTraduction (core/traduction.js), qui réutilise les phrases vérifiées et le moteur existant ;
   - voix et dictée : EWMoteur (traduction/moteur.js), le même qu'EVERYWHERE ;
   - langues : les réglages d'EVERYWHERE (clé ew_tr_v1), partagés avec la conversation face à face ;
   - appels et messages : TALK (index.html), ouvert par lien, jamais recopié ;
   - pseudo TALK (invitation) : lu par CONNECT (connect.js) avec la session existante, seulement si la personne le demande.
   La conversation n'est enregistrée nulle part (mémoire de la page seulement). Routes : #/accueil (porte) et #/bridge[/<langue>]. */
(function () {
  "use strict";
  var M = window.EWMoteur, TR = window.OWTraduction;
  var CFG = window.EW_CONFIG || { basePath: "../" };
  var lang = "fr";

  var STR = {
    fr: {
      kicker: "WORLD BRIDGE", h: "Vous ne parlez pas la même langue ?", h2: "Parlez quand même.",
      lead: "Choisissez vos deux langues, écrivez ou dictez, puis montrez la traduction.",
      me: "Ma langue", other: "Sa langue", swap: "Inverser les langues", fav: "★ Favorites",
      text_lbl: "Texte à traduire, en {l}", ph: "Écrivez en {l}…", mic: "Dicter", mic_stop: "Arrêter", go: "Traduire",
      empty: "Écrivez ou dictez d'abord une phrase.", loading: "Traduction en cours…",
      to: "En {l}", listen: "Écouter", copy: "Copier", share: "Partager", reply: "L'autre répond",
      reply_done: "À l'autre personne : écrivez ou dictez en {l}.",
      copied: "Traduction copiée.", copy_fail: "Copie impossible ici : le texte est sélectionné, utilisez « Copier » du téléphone.",
      shared: "Partagé.", share_unsup: "Partage non disponible ici : traduction copiée à la place.",
      no_tts: "La lecture à voix haute n'est pas disponible dans ce navigateur.",
      no_voice: "Aucune voix en {l} sur ce téléphone : la lecture peut être approximative.",
      no_stt: "Dictée vocale indisponible dans ce navigateur : écrivez votre phrase. Sur Android, ouvrez le site dans Chrome.",
      mic_denied: "Le micro est bloqué pour ce site. Autorisez-le dans les réglages du navigateur (cadenas à côté de l'adresse), puis réessayez.",
      mic_nothing: "Je n'ai rien entendu. Touchez « Dicter » et parlez.", mic_fail: "La dictée n'a pas marché. Réessayez ou écrivez.",
      mic_net: "La dictée a besoin d'Internet sur ce téléphone. Écrivez votre phrase.", listening: "J'écoute… parlez en {l}.",
      e_offline: "Hors ligne : sans Internet, seules les phrases intégrées du Voyage (6 langues) sont traduites. Celle-ci attendra le retour du réseau.",
      e_network: "Le service de traduction ne répond pas. Vérifiez votre connexion, puis réessayez.",
      e_quota: "Limite quotidienne du service de traduction gratuit atteinte. Réessayez demain ; les phrases intégrées restent disponibles.",
      e_unavail: "Traduction indisponible pour le moment. Réessayez dans un instant.",
      e_lang: "Cette langue n'est pas proposée. Choisissez-en une autre dans la liste.",
      retry: "Réessayer",
      consent_h: "Envoyer ce texte au service de traduction ?",
      consent_p: "Ce texte n'est pas dans les phrases intégrées. Pour le traduire, il doit être envoyé au service gratuit MyMemory, celui que TALK utilise déjà. Ce service peut conserver les textes : n'envoyez rien de confidentiel.",
      consent_yes: "Autoriser et traduire", consent_no: "Non merci",
      consent_refused: "Traduction en ligne non autorisée : rien n'a été envoyé. Les phrases intégrées du Voyage restent traduites sur l'appareil.",
      consent_on: "Traduction en ligne autorisée (MyMemory).", consent_off: "Traduction en ligne : pas encore autorisée (demandée au premier texte).",
      consent_revoke: "Retirer l'accord", consent_revoked: "Accord retiré : plus aucun texte ne sera envoyé sans vous le redemander.",
      degraded: "Mode dégradé — hors ligne : seules les phrases intégrées sont traduites ; les appels et messages de TALK attendent le réseau.",
      next_h: "Continuer la conversation", face: "Face à face", face_d: "Téléphone posé entre vous, un micro chacun",
      talk: "Continuer dans TALK", talk_d: "Messages et appels traduits", invite: "Inviter", invite_d: "Elle arrive ici, langues déjà choisies",
      learn: "Apprendre {l}", learn_any: "Apprendre une langue", learn_d: "Avec LEARN, puis revenir parler",
      learn_soon: "LEARN propose aujourd'hui : {l}.",
      inv_h: "Créer une invitation", inv_p: "Envoyez ce lien : l'autre personne arrive directement ici, avec {a} ⇄ {b} déjà choisies. Aucun compte n'est demandé.",
      inv_pseudo: "Ajouter mon pseudo TALK (@{p}) pour qu'elle puisse m'écrire ensuite",
      inv_share: "Partager l'invitation", inv_copied: "Lien d'invitation copié. Collez-le dans le message de votre choix.",
      inv_manual: "Copiez ce lien et envoyez-le :", inv_shared: "Invitation partagée.", inv_link: "Lien d'invitation",
      inv_close: "Fermer",
      got_h: "Invitation reçue", got_p: "Quelqu'un qui parle {a} veut vous parler. Écrivez ou dictez en {b} : la traduction s'affiche en {a}.",
      got_talk: "Continuer dans TALK avec @{p}",
      log_h: "Cette conversation (gardée seulement sur cette page)", log_clear: "Effacer",
      verified: "Phrase vérifiée, traduite sur l'appareil, sans envoi."
    },
    en: {
      kicker: "WORLD BRIDGE", h: "Don't speak the same language?", h2: "Talk anyway.",
      lead: "Pick your two languages, type or dictate, then show the translation.",
      me: "My language", other: "Their language", swap: "Swap languages", fav: "★ Favorites",
      text_lbl: "Text to translate, in {l}", ph: "Type in {l}…", mic: "Dictate", mic_stop: "Stop", go: "Translate",
      empty: "Type or dictate a sentence first.", loading: "Translating…",
      to: "In {l}", listen: "Listen", copy: "Copy", share: "Share", reply: "They reply",
      reply_done: "Over to the other person: type or dictate in {l}.",
      copied: "Translation copied.", copy_fail: "Copy is not possible here: the text is selected, use your phone's “Copy”.",
      shared: "Shared.", share_unsup: "Sharing is not available here: translation copied instead.",
      no_tts: "Reading aloud is not available in this browser.",
      no_voice: "No {l} voice on this phone: reading may be approximate.",
      no_stt: "Voice dictation is not available in this browser: type your sentence. On Android, open the site in Chrome.",
      mic_denied: "The microphone is blocked for this site. Allow it in the browser settings (padlock next to the address), then try again.",
      mic_nothing: "I didn't hear anything. Tap “Dictate” and speak.", mic_fail: "Dictation didn't work. Try again or type.",
      mic_net: "Dictation needs the Internet on this phone. Type your sentence.", listening: "Listening… speak in {l}.",
      e_offline: "Offline: without the Internet, only the built-in Travel phrases (6 languages) are translated. This one will wait for the network.",
      e_network: "The translation service is not responding. Check your connection, then try again.",
      e_quota: "The free translation service's daily limit is reached. Try again tomorrow; built-in phrases still work.",
      e_unavail: "Translation is unavailable right now. Try again in a moment.",
      e_lang: "This language is not offered. Pick another one from the list.",
      retry: "Try again",
      consent_h: "Send this text to the translation service?",
      consent_p: "This text is not one of the built-in phrases. To translate it, it must be sent to the free MyMemory service, the one TALK already uses. This service may keep texts: do not send anything confidential.",
      consent_yes: "Allow and translate", consent_no: "No thanks",
      consent_refused: "Online translation not allowed: nothing was sent. Built-in Travel phrases are still translated on the device.",
      consent_on: "Online translation allowed (MyMemory).", consent_off: "Online translation: not allowed yet (asked on the first text).",
      consent_revoke: "Withdraw consent", consent_revoked: "Consent withdrawn: no text will be sent without asking you again.",
      degraded: "Degraded mode — offline: only built-in phrases are translated; TALK calls and messages wait for the network.",
      next_h: "Keep the conversation going", face: "Face to face", face_d: "Phone between you, one mic each",
      talk: "Continue in TALK", talk_d: "Translated messages and calls", invite: "Invite", invite_d: "They land here, languages already set",
      learn: "Learn {l}", learn_any: "Learn a language", learn_d: "With LEARN, then come back and talk",
      learn_soon: "LEARN currently offers: {l}.",
      inv_h: "Create an invitation", inv_p: "Send this link: the other person lands right here, with {a} ⇄ {b} already set. No account needed.",
      inv_pseudo: "Add my TALK username (@{p}) so they can write to me later",
      inv_share: "Share the invitation", inv_copied: "Invitation link copied. Paste it in any message.",
      inv_manual: "Copy this link and send it:", inv_shared: "Invitation shared.", inv_link: "Invitation link",
      inv_close: "Close",
      got_h: "Invitation received", got_p: "Someone who speaks {a} wants to talk with you. Type or dictate in {b}: the translation shows in {a}.",
      got_talk: "Continue in TALK with @{p}",
      log_h: "This conversation (kept only on this page)", log_clear: "Clear",
      verified: "Verified phrase, translated on the device, nothing sent."
    }
  };
  function t(k, v) {
    var s = (STR[lang] && STR[lang][k]) || STR.fr[k] || k;
    if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); });
    return s;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function known(code) { return (M.langs || []).some(function (l) { return l.code === code; }); }
  function L(code) { return M.lang(code); }
  function nameOf(code) { var l = L(code); return (l.flag ? l.flag + " " : "") + l.name; }
  function speechLang(code) { return String(L(code).speech || code); }

  // Langues partagées avec la conversation face à face d'EVERYWHERE (une seule source de vérité : ew_tr_v1).
  function langs() { var p = window.EWEverywhere.prefs(); return { me: p.me, other: p.other }; }
  function setLangs(me, other) { window.EWEverywhere.setLangs(me, other); }

  var S = { root: null, rec: null, busy: false, last: null, log: [], pending: null, pseudo: null, learnLangs: null };
  function $(id) { return S.root ? S.root.querySelector("#" + id) : null; }

  function options(sel) {
    var fav = window.EWProfil ? window.EWProfil.favorites() : [];
    var favs = (M.langs || []).filter(function (l) { return fav.indexOf(l.code) !== -1; });
    var used = false;
    var opt = function (l, inFav) {
      var on = l.code === sel && (inFav || !used);
      if (on && inFav) used = true;
      return '<option value="' + esc(l.code) + '"' + (on ? " selected" : "") + ">" + esc((l.flag ? l.flag + " " : "") + l.name) + "</option>";
    };
    var head = favs.length ? '<optgroup label="' + esc(t("fav")) + '">' + favs.map(function (l) { return opt(l, true); }).join("") + "</optgroup>" : "";
    return head + (M.langs || []).map(function (l) { return opt(l, false); }).join("");
  }

  function html() {
    var g = langs();
    return '<p class="ow-kicker">' + esc(t("kicker")) + "</p>" +
      '<h2 class="ow-h" id="h-bridge">' + esc(t("h")) + " <span>" + esc(t("h2")) + "</span></h2>" +
      '<p class="muted ow-lead">' + esc(t("lead")) + "</p>" +
      '<p class="ow-degraded" id="owDegraded" role="status" hidden>' + esc(t("degraded")) + "</p>" +
      '<div class="ow-got" id="owGot" hidden></div>' +
      '<div class="ow-langs">' +
        '<label class="ow-sel"><span>' + esc(t("me")) + '</span><select id="owMe">' + options(g.me) + "</select></label>" +
        '<button type="button" class="ow-swap" id="owSwap" aria-label="' + esc(t("swap")) + '"><span aria-hidden="true">⇄</span></button>' +
        '<label class="ow-sel"><span>' + esc(t("other")) + '</span><select id="owOther">' + options(g.other) + "</select></label>" +
      "</div>" +
      '<form class="ow-form" id="owForm" novalidate>' +
        '<label class="sr" for="owText" id="owTextLbl"></label>' +
        '<textarea id="owText" rows="3" maxlength="500" autocomplete="off"></textarea>' +
        '<div class="ow-actions">' +
          '<button type="button" class="btn ow-mic" id="owMic" aria-pressed="false"><span aria-hidden="true">🎤</span> <span id="owMicTxt">' + esc(t("mic")) + "</span></button>" +
          '<button type="submit" class="btn primary ow-go" id="owGo">' + esc(t("go")) + "</button>" +
        "</div>" +
      "</form>" +
      '<div class="ow-state" id="owState" aria-live="polite"></div>' +
      '<div class="ow-result" id="owResult" hidden>' +
        '<p class="ow-to" id="owTo"></p>' +
        '<p class="ow-out" id="owOut" tabindex="-1"></p>' +
        '<p class="ow-src" id="owSrc"></p>' +
        '<div class="ow-tools">' +
          '<button type="button" class="btn" id="owListen"><span aria-hidden="true">🔊</span> ' + esc(t("listen")) + "</button>" +
          '<button type="button" class="btn" id="owCopy"><span aria-hidden="true">📋</span> ' + esc(t("copy")) + "</button>" +
          '<button type="button" class="btn" id="owShare"><span aria-hidden="true">↗</span> ' + esc(t("share")) + "</button>" +
          '<button type="button" class="btn" id="owReply"><span aria-hidden="true">⇄</span> ' + esc(t("reply")) + "</button>" +
        "</div>" +
        '<p class="ow-msg" id="owToolMsg" role="status"></p>' +
      "</div>" +
      '<div class="ow-log" id="owLog" hidden></div>' +
      '<h3 class="ow-next-h">' + esc(t("next_h")) + "</h3>" +
      '<div class="ow-next">' +
        '<a class="ow-go-card" id="owFace" href="#/everywhere/face"><b>' + esc(t("face")) + "</b><small>" + esc(t("face_d")) + "</small></a>" +
        '<a class="ow-go-card" id="owTalk" href="' + esc(CFG.basePath + "index.html?ew=1") + '"><b>' + esc(t("talk")) + "</b><small>" + esc(t("talk_d")) + "</small></a>" +
        '<button type="button" class="ow-go-card" id="owInvite" aria-expanded="false" aria-controls="owInvBox"><b>' + esc(t("invite")) + "</b><small>" + esc(t("invite_d")) + "</small></button>" +
        '<a class="ow-go-card" id="owLearn" href="#/learn"><b id="owLearnT">' + esc(t("learn_any")) + "</b><small>" + esc(t("learn_d")) + "</small></a>" +
      "</div>" +
      '<p class="note" id="owLearnNote" hidden></p>' +
      '<div class="ow-inv card" id="owInvBox" hidden></div>' +
      '<p class="note ow-consent-line"><span id="owConsentTxt"></span> <button type="button" class="link-btn" id="owRevoke" hidden>' + esc(t("consent_revoke")) + "</button></p>";
  }

  // ---------- Affichage ----------
  function paintLangs() {
    var g = langs();
    $("owTextLbl").textContent = t("text_lbl", { l: L(g.me).name });
    var ta = $("owText");
    ta.placeholder = t("ph", { l: L(g.me).name });
    ta.setAttribute("lang", speechLang(g.me));
    paintLearn();
    paintConsent();
  }
  function paintConsent() {
    var on = TR.consent();
    $("owConsentTxt").textContent = t(on ? "consent_on" : "consent_off");
    $("owRevoke").hidden = !on;
  }
  function paintOnline() {
    if (!S.root) return;
    $("owDegraded").hidden = navigator.onLine !== false;
  }
  function state(kind, text, retry) {
    var box = $("owState");
    if (!kind) { box.innerHTML = ""; return; }
    if (kind === "loading") { box.innerHTML = '<p class="ow-loading"><span class="spinner" aria-hidden="true"></span> ' + esc(text) + "</p>"; return; }
    box.innerHTML = '<div class="ow-err" role="alert"><p>' + esc(text) + "</p>" +
      (retry ? '<button type="button" class="btn" id="owRetry">' + esc(t("retry")) + "</button>" : "") + "</div>";
  }
  function hideResult() { $("owResult").hidden = true; $("owOut").textContent = ""; $("owSrc").textContent = ""; $("owToolMsg").textContent = ""; S.last = null; }
  function toolMsg(text) { $("owToolMsg").textContent = text || ""; }

  function paintLog() {
    var box = $("owLog");
    if (!S.log.length) { box.hidden = true; box.innerHTML = ""; return; }
    box.hidden = false;
    box.innerHTML = '<div class="ow-log-h"><b>' + esc(t("log_h")) + '</b><button type="button" class="link-btn" id="owLogClear">' + esc(t("log_clear")) + "</button></div>" +
      "<ol>" + S.log.slice(-6).map(function (x) {
        return '<li><span lang="' + esc(speechLang(x.from)) + '">' + esc(L(x.from).flag + " " + x.orig) + '</span><span lang="' + esc(speechLang(x.to)) + '">→ ' + esc(L(x.to).flag + " " + x.tr) + "</span></li>";
      }).join("") + "</ol>";
  }

  // LEARN : ne propose « Apprendre <langue> » que si LEARN a vraiment des leçons dans cette langue (catalogue réel).
  function paintLearn() {
    var a = $("owLearn"), note = $("owLearnNote");
    if (!a) return;
    var other = langs().other;
    var list = S.learnLangs || [];
    var hit = list.filter(function (x) { return x.id === other; })[0];
    if (hit) { $("owLearnT").textContent = t("learn", { l: L(other).name }); a.href = "#/learn/apprendre"; a.setAttribute("data-learn", other); note.hidden = true; }
    else {
      $("owLearnT").textContent = t("learn_any"); a.href = "#/learn"; a.removeAttribute("data-learn");
      if (list.length) { note.textContent = t("learn_soon", { l: list.map(function (x) { return L(x.id).name; }).join(", ") }); note.hidden = false; }
    }
  }
  function loadLearnLangs() {
    if (S.learnLangs || typeof fetch !== "function") return;
    fetch("learn/content/catalogue.json").then(function (r) { return r.ok ? r.json() : null; }).then(function (c) {
      S.learnLangs = c && Array.isArray(c.languages) ? c.languages.filter(function (l) { return l && l.status === "available"; }) : [];
      paintLearn();
    }).catch(function () { S.learnLangs = []; });
  }

  // ---------- Traduire ----------
  function errText(code) {
    return code === "OFFLINE" ? t("e_offline") : code === "NETWORK" ? t("e_network") : code === "QUOTA_PROVIDER" ? t("e_quota")
      : code === "UNSUPPORTED_LANG" ? t("e_lang") : code === "EMPTY" ? t("empty") : t("e_unavail");
  }
  function consentCard(text) {
    $("owState").innerHTML = '<div class="ow-consent" role="alertdialog" aria-labelledby="owConsentH" aria-describedby="owConsentP">' +
      '<p class="ow-consent-h" id="owConsentH"><b>' + esc(t("consent_h")) + '</b></p><p id="owConsentP">' + esc(t("consent_p")) + "</p>" +
      '<div class="ow-actions"><button type="button" class="btn primary" id="owConsentYes">' + esc(t("consent_yes")) + '</button>' +
      '<button type="button" class="btn" id="owConsentNo">' + esc(t("consent_no")) + "</button></div></div>";
    S.pending = text;
    $("owConsentYes").focus();
  }
  function translate(text) {
    var g = langs();
    text = String(text || "").trim();
    hideResult();
    if (!text) { state("error", t("empty")); $("owText").focus(); return; }
    if (!known(g.me) || !known(g.other)) { state("error", t("e_lang")); return; }
    S.busy = true;
    $("owGo").setAttribute("aria-busy", "true");
    state("loading", t("loading"));
    var from = g.me, to = g.other;
    TR.translate(text, from, to).then(function (r) {
      S.busy = false; $("owGo").removeAttribute("aria-busy");
      state(null);
      S.last = { orig: text, tr: r.text, from: from, to: to, source: r.source };
      $("owTo").textContent = t("to", { l: nameOf(to) });
      var out = $("owOut");
      out.textContent = r.text;
      out.setAttribute("lang", speechLang(to));
      $("owSrc").textContent = r.provider === "phrases" ? t("verified") : r.label ? r.label[lang] || r.label.fr : "";
      $("owResult").hidden = false;
      S.log.push(S.last);
      if (S.log.length > 30) S.log.shift();
      paintLog();
      paintConsent();
      out.focus({ preventScroll: false });
    }, function (e) {
      S.busy = false; $("owGo").removeAttribute("aria-busy");
      var code = e && e.message;
      if (code === "CONSENT") { consentCard(text); return; }
      // Jamais de traduction affichée en cas d'erreur : seul le message honnête.
      state("error", errText(code), code !== "UNSUPPORTED_LANG" && code !== "EMPTY");
    });
  }

  // ---------- Dictée ----------
  function stopMic() {
    if (S.rec) { S.rec.stop(); S.rec = null; }
    var b = $("owMic");
    if (b) { b.setAttribute("aria-pressed", "false"); $("owMicTxt").textContent = t("mic"); }
  }
  function startMic() {
    if (S.rec) { stopMic(); return; }
    if (!M.canListen) { state("error", t("no_stt")); return; }
    var g = langs();
    M.askMic().then(function (ok) {
      if (!ok) { state("error", t("mic_denied")); return; }
      var ta = $("owText");
      var rec = M.listen(g.me, {
        interim: function (txt) { if (ta) ta.value = txt; },
        final: function (txt) { ta.value = txt; stopMic(); translate(txt); },
        error: function (code) { stopMic(); state("error", code === "DENIED" ? t("mic_denied") : code === "NO_SPEECH" ? t("mic_nothing") : code === "NETWORK" ? t("mic_net") : t("mic_fail")); },
        end: function () { if (S.rec === rec) stopMic(); }
      });
      if (!rec) { state("error", t("mic_fail")); return; }
      S.rec = rec;
      $("owMic").setAttribute("aria-pressed", "true");
      $("owMicTxt").textContent = t("mic_stop");
      state("loading", t("listening", { l: L(g.me).name }));
    });
  }

  // ---------- Écouter, copier, partager ----------
  function listen() {
    if (!S.last) return;
    if (!M.canSpeak) { toolMsg(t("no_tts")); return; }
    var hasAny = false;
    try { hasAny = window.speechSynthesis.getVoices().length > 0; } catch (e) { hasAny = false; }
    toolMsg(hasAny && !M.voicesFor(S.last.to).length ? t("no_voice", { l: L(S.last.to).name }) : "");
    var p = window.EWEverywhere.prefs();
    M.speak(S.last.tr, S.last.to, p.volume, { rate: p.rate, voice: p.voices[S.last.to] });
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return false; });
    return Promise.resolve(false);
  }
  function selectOut() {
    try { var r = document.createRange(); r.selectNodeContents($("owOut")); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) { /* rien */ }
  }
  function copy() {
    if (!S.last) return;
    copyText(S.last.tr).then(function (ok) { if (ok) toolMsg(t("copied")); else { selectOut(); toolMsg(t("copy_fail")); } });
  }
  function share() {
    if (!S.last) return;
    var text = S.last.tr;
    if (navigator.share) {
      navigator.share({ text: text }).then(function () { toolMsg(t("shared")); }, function (e) {
        if (e && e.name === "AbortError") { toolMsg(""); return; } // annulé par la personne : rien n'est annoncé
        copyText(text).then(function (ok) { if (ok) toolMsg(t("share_unsup")); else { selectOut(); toolMsg(t("copy_fail")); } });
      });
      return;
    }
    copyText(text).then(function (ok) { if (ok) toolMsg(t("share_unsup")); else { selectOut(); toolMsg(t("copy_fail")); } });
  }
  function reply() {
    var g = langs();
    setLangs(g.other, g.me);
    $("owMe").innerHTML = options(g.other);
    $("owOther").innerHTML = options(g.me);
    paintLangs();
    hideResult();
    var ta = $("owText");
    ta.value = "";
    state(null);
    ta.focus();
    $("owState").innerHTML = '<p class="ow-hint">' + esc(t("reply_done", { l: L(g.other).name })) + "</p>";
  }

  // ---------- Invitation ----------
  function siteBase() { return location.href.split("#")[0].split("?")[0].replace(/index\.html$/, ""); }
  function inviteLink(withPseudo) {
    var g = langs();
    return siteBase() + "oneworld/?de=" + encodeURIComponent(g.me) + "&vers=" + encodeURIComponent(g.other) +
      (withPseudo && S.pseudo ? "&p=" + encodeURIComponent(S.pseudo) : "");
  }
  function paintInvite() {
    var g = langs();
    var box = $("owInvBox");
    box.innerHTML = '<h3 class="cx-h">' + esc(t("inv_h")) + "</h3><p>" + esc(t("inv_p", { a: L(g.me).name, b: L(g.other).name })) + "</p>" +
      (S.pseudo ? '<label class="ow-check"><input type="checkbox" id="owInvPseudo"> <span>' + esc(t("inv_pseudo", { p: S.pseudo })) + "</span></label>" : "") +
      '<div class="ow-actions"><button type="button" class="btn primary" id="owInvShare">' + esc(t("inv_share")) + '</button>' +
      '<button type="button" class="btn" id="owInvClose">' + esc(t("inv_close")) + "</button></div>" +
      '<p class="ow-msg" id="owInvMsg" role="status"></p><div id="owInvManual"></div>';
  }
  function toggleInvite() {
    var box = $("owInvBox"), b = $("owInvite");
    var open = box.hidden;
    box.hidden = !open;
    b.setAttribute("aria-expanded", String(open));
    if (!open) return;
    paintInvite();
    $("owInvShare").focus();
    // Pseudo TALK : seulement s'il existe déjà une session TALK sur cet appareil ; jamais envoyé sans la case cochée.
    var hasSession = false;
    try { hasSession = !!localStorage.getItem("lc_net_auth"); } catch (e) { hasSession = false; }
    if (S.pseudo || !hasSession || !window.EWConnect) return;
    window.EWConnect.client().then(function (sb) {
      return sb.auth.getSession().then(function (r) {
        var u = r && r.data && r.data.session && r.data.session.user;
        if (!u) return null;
        return sb.from("profiles").select("pseudo").eq("id", u.id).maybeSingle();
      });
    }).then(function (p) {
      var ps = p && p.data && p.data.pseudo;
      if (ps && /^[a-z0-9_.]{3,20}$/.test(ps)) { S.pseudo = ps; if (!$("owInvBox").hidden) paintInvite(); }
    }).catch(function () { /* invitation sans pseudo */ });
  }
  function shareInvite() {
    var cb = $("owInvPseudo");
    var link = inviteLink(cb && cb.checked);
    var msg = $("owInvMsg"), manual = $("owInvManual");
    manual.innerHTML = "";
    var fallback = function () {
      copyText(link).then(function (ok) {
        if (ok) { msg.textContent = t("inv_copied"); return; }
        msg.textContent = t("inv_manual");
        manual.innerHTML = '<label class="sr" for="owInvUrl">' + esc(t("inv_link")) + '</label><input class="ow-url" id="owInvUrl" readonly value="' + esc(link) + '">';
        var i = $("owInvUrl"); i.focus(); i.select();
      });
    };
    if (navigator.share) {
      navigator.share({ title: "24/24 ONE WORLD", url: link }).then(function () { msg.textContent = t("inv_shared"); }, function (e) {
        if (e && e.name === "AbortError") { msg.textContent = ""; return; }
        fallback();
      });
    } else fallback();
  }

  // Lien reçu : …/everywhere/oneworld/?de=fr&vers=en[&p=pseudo] → …/everywhere/?de=fr&vers=en#/bridge
  function readInvite() {
    var q = location.search || "";
    var de = /[?&]de=([A-Za-z-]{2,8})(?:&|$)/.exec(q), vers = /[?&]vers=([A-Za-z-]{2,8})(?:&|$)/.exec(q), ps = /[?&]p=([a-z0-9_.]{3,20})(?:&|$)/.exec(q);
    if (!de || !vers) return null;
    var inv = { de: de[1], vers: vers[1], p: ps ? ps[1] : null };
    try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) { /* adresse gardée */ }
    if (!known(inv.de) || !known(inv.vers) || inv.de === inv.vers) return { bad: true };
    setLangs(inv.vers, inv.de); // je parle la langue « vers », l'autre la langue « de »
    return inv;
  }
  function paintGot(inv) {
    var box = $("owGot");
    if (!inv) { box.hidden = true; return; }
    if (inv.bad) { box.hidden = false; box.innerHTML = '<p role="alert">' + esc(t("e_lang")) + "</p>"; return; }
    box.hidden = false;
    box.innerHTML = '<p class="ow-got-h"><b>' + esc(t("got_h")) + "</b></p><p>" + esc(t("got_p", { a: L(inv.de).name, b: L(inv.vers).name })) + "</p>" +
      (inv.p ? '<a class="btn" id="owGotTalk" href="' + esc(CFG.basePath + "index.html?ew=1&ajouter=" + encodeURIComponent(inv.p)) + '">' + esc(t("got_talk", { p: inv.p })) + "</a>" : "");
  }

  // ---------- Événements ----------
  function bind() {
    var r = S.root;
    r.addEventListener("submit", function (e) {
      if (e.target.id !== "owForm") return;
      e.preventDefault();
      if (S.busy) return;
      stopMic();
      translate($("owText").value);
    });
    r.addEventListener("change", function (e) {
      var id = e.target.id;
      if (id !== "owMe" && id !== "owOther") return;
      var g = langs(), v = e.target.value;
      if (!known(v)) { state("error", t("e_lang")); return; }
      var me = id === "owMe" ? v : g.me, other = id === "owOther" ? v : g.other;
      if (me === other) { if (id === "owMe") other = g.me; else me = g.other; } // même langue des deux côtés : on inverse
      setLangs(me, other);
      $("owMe").innerHTML = options(me);
      $("owOther").innerHTML = options(other);
      stopMic(); hideResult(); state(null);
      paintLangs();
    });
    r.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("button") : null;
      if (!b || !r.contains(b)) return;
      var id = b.id;
      if (id === "owSwap") { reply(); state(null); }
      else if (id === "owMic") startMic();
      else if (id === "owListen") listen();
      else if (id === "owCopy") copy();
      else if (id === "owShare") share();
      else if (id === "owReply") reply();
      else if (id === "owRetry") translate($("owText").value);
      else if (id === "owConsentYes") { TR.setConsent(true); var p = S.pending; S.pending = null; translate(p); }
      else if (id === "owConsentNo") { S.pending = null; state("error", t("consent_refused")); }
      else if (id === "owRevoke") { TR.setConsent(false); paintConsent(); state("error", t("consent_revoked")); }
      else if (id === "owInvite") toggleInvite();
      else if (id === "owInvShare") shareInvite();
      else if (id === "owInvClose") { toggleInvite(); $("owInvite").focus(); }
      else if (id === "owLogClear") { S.log = []; paintLog(); }
    });
    // Entrée = traduire ; Maj+Entrée = nouvelle ligne.
    r.addEventListener("keydown", function (e) {
      if (e.target.id === "owText" && e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); $("owForm").requestSubmit ? $("owForm").requestSubmit() : translate($("owText").value); }
    });
    window.addEventListener("online", paintOnline);
    window.addEventListener("offline", paintOnline);
  }

  // ---------- Points d'entrée (app.js) ----------
  function mount(root, uiLang) {
    if (!root || !M || !TR || !window.EWEverywhere) return;
    lang = uiLang === "en" ? "en" : "fr";
    S.root = root;
    var inv = readInvite();
    root.innerHTML = html();
    paintLangs();
    paintOnline();
    paintGot(inv);
    if (!M.canListen) $("owMic").setAttribute("aria-describedby", "owMicHelp"), $("owMic").insertAdjacentHTML("afterend", '<span class="sr" id="owMicHelp">' + esc(t("no_stt")) + "</span>");
    bind();
    loadLearnLangs();
  }
  // #/bridge[/<langue de l'autre>] : met la porte au premier plan (lien depuis LEARN, l'accueil, l'invitation).
  function focus(parts) {
    if (!S.root) return;
    var code = (parts || [])[0];
    if (code && known(code)) {
      var g = langs();
      setLangs(g.me === code ? g.other : g.me, code);
      $("owMe").innerHTML = options(langs().me);
      $("owOther").innerHTML = options(langs().other);
      paintLangs();
    }
    try { S.root.scrollIntoView({ block: "start" }); } catch (e) { /* ancien navigateur */ }
    $("owText").focus({ preventScroll: true });
  }
  function leave() { stopMic(); if (M && M.stopSpeaking) M.stopSpeaking(); }

  window.OWBridge = { mount: mount, focus: focus, leave: leave, _strings: STR, _inviteLink: inviteLink };
})();
