/* 24/24 EVERYWHERE — parler avec quelqu'un qui ne parle pas ma langue. © 2026 Sébastien Chevrier. Tous droits réservés.
   Interface EVERYWHERE de 24/24 ONE WORLD (une application, un compte, trois interfaces : TALK, EVERYWHERE, LEARN).
   Écrans (routes du portail) :
     #/everywhere            accueil : conversation côte à côte, appeler sur TALK, mes langues, configurations
     #/everywhere/face       mode A : écran coupé en deux (haut et bas, même sens de lecture), un micro par personne
     #/everywhere/appel      mode B : contacts TALK, inviter un contact, appel traduit (celui de TALK, sans autre infrastructure)
     #/everywhere/langues    mes langues
     #/everywhere/reglages   configurations (son, volume, taille du texte)
   Aucune fonction d'apprentissage ici (LEARN) ; les appels restent ceux de TALK.
   Réglages gardés sur cet appareil (clé ew_tr_v1). La conversation côte à côte n'est enregistrée nulle part. */
(function () {
  "use strict";
  var M = window.EWMoteur;
  var CFG = window.EW_CONFIG || { basePath: "../" };
  var KEY = "ew_tr_v1";
  var lang = "fr";

  var STR = {
    fr: {
      title: "EVERYWHERE", sub: "Traduire et connecter partout.",
      face: "Conversation côte à côte", face_d: "Téléphone posé entre vous deux", call: "Appeler sur TALK", call_d: "Appel traduit avec un contact",
      my_langs: "Mes langues", settings: "Configurations", settings_d: "Son, volume, texte", back: "← EVERYWHERE",
      p1: "Personne 1", p2: "Personne 2", speak: "Parler", speak_in: "Parler en {l}", type: "Écrire", type_in: "Écrire en {l}", send: "Traduire",
      listening: "J'écoute…", translating: "Traduction…", empty: "Touchez le micro et parlez. La traduction s'affiche dans l'autre moitié et peut être lue à voix haute.",
      langs_btn: "Langues", sound_btn: "Son", text_btn: "Texte", swap: "Inverser les langues",
      sound_on: "Lecture à voix haute activée", sound_off: "Lecture à voix haute coupée",
      no_stt: "Le micro n'est pas disponible dans ce navigateur : utilisez « Écrire ». Sur Android, ouvrez le site dans Chrome.",
      mic_denied: "Le micro est bloqué pour ce site. Autorisez-le dans les réglages du navigateur (cadenas à côté de l'adresse), puis réessayez.",
      no_speech: "Je n'ai rien entendu. Touchez le micro et parlez.", net_err: "Pas de connexion : la traduction a besoin d'Internet.",
      stt_fail: "L'écoute n'a pas marché. Réessayez.", busy: "Un seul micro à la fois : attendez la fin de l'autre phrase.",
      tr_err: "Traduction impossible ({m}). Réessayez.", quota: "Limite quotidienne du service de traduction gratuit atteinte. Réessayez demain.",
      tr_hint: "Traduction automatique : vérifiez les informations importantes.",
      lang_me: "Ma langue", lang_other: "Langue de la personne en face", lang_note: "La personne 1 (en bas) parle votre langue, la personne 2 (en haut) la langue de la personne en face. Le pseudo et la langue de votre profil TALK restent réglés dans TALK.",
      save: "Enregistrer", saved: "Enregistré.", close: "Fermer",
      set_sound: "Lire la traduction à voix haute", set_volume: "Volume", set_size: "Taille du texte (côte à côte)", sizes: "Normal|Grand|Très grand",
      set_note: "Ces réglages restent sur cet appareil. Thème et contraste : Paramètres de 24/24 ONE WORLD.", a11y_link: "Ouvrir les Paramètres",
      c_search: "Rechercher un contact", c_invite: "📨 Inviter un contact", c_invite_d: "Le lien TALK part par SMS, WhatsApp ou e-mail. Dès que la personne a choisi son pseudo, elle apparaît ici.",
      c_call: "Appeler", c_loading: "Lecture de vos contacts TALK…", c_none: "Pas encore de contact. Invitez quelqu'un : il apparaîtra ici dès qu'il aura choisi son pseudo.",
      c_nomatch: "Aucun contact ne correspond.", c_err: "Impossible de lire vos contacts pour le moment.", retry: "Réessayer",
      c_off: "La messagerie de TALK n'est pas activée sur ce site.", c_noprof: "Il faut d'abord un profil TALK (un pseudo et votre langue, sans e-mail ni numéro).",
      c_create: "Créer mon profil dans TALK", c_link_copied: "Lien copié : collez-le dans un SMS ou WhatsApp.", c_link_txt: "Copiez ce lien et envoyez-le : {u}",
      c_before: "Appeler @{p}", c_i_speak: "Je parle", c_i_read: "Je lis et j'écoute", c_go: "📞 Appeler @{p}", cancel: "Annuler",
      c_how: "L'appel s'ouvre dans TALK, avec la traduction : chacun parle sa langue, l'autre lit et entend la traduction. À la fin, vous revenez ici.",
      c_lang_of: "Parle {l}"
    },
    en: {
      title: "EVERYWHERE", sub: "Translate and connect everywhere.",
      face: "Side-by-side conversation", face_d: "Phone placed between you", call: "Call on TALK", call_d: "Translated call with a contact",
      my_langs: "My languages", settings: "Settings", settings_d: "Sound, volume, text", back: "← EVERYWHERE",
      p1: "Person 1", p2: "Person 2", speak: "Speak", speak_in: "Speak in {l}", type: "Type", type_in: "Type in {l}", send: "Translate",
      listening: "Listening…", translating: "Translating…", empty: "Tap the mic and speak. The translation appears in the other half and can be read aloud.",
      langs_btn: "Languages", sound_btn: "Sound", text_btn: "Text", swap: "Swap languages",
      sound_on: "Read aloud on", sound_off: "Read aloud off",
      no_stt: "The mic isn't available in this browser: use “Type”. On Android, open the site in Chrome.",
      mic_denied: "The mic is blocked for this site. Allow it in the browser settings (padlock next to the address), then try again.",
      no_speech: "I didn't hear anything. Tap the mic and speak.", net_err: "No connection: translation needs the Internet.",
      stt_fail: "Listening didn't work. Try again.", busy: "One mic at a time: wait for the other sentence to finish.",
      tr_err: "Translation failed ({m}). Try again.", quota: "Daily limit of the free translation service reached. Try again tomorrow.",
      tr_hint: "Automatic translation: check important information.",
      lang_me: "My language", lang_other: "Language of the person in front", lang_note: "Person 1 (bottom) speaks your language, person 2 (top) the other person's language. Your TALK username and language stay set in TALK.",
      save: "Save", saved: "Saved.", close: "Close",
      set_sound: "Read the translation aloud", set_volume: "Volume", set_size: "Text size (side by side)", sizes: "Normal|Large|Extra large",
      set_note: "These settings stay on this device. Theme and contrast: 24/24 ONE WORLD Settings.", a11y_link: "Open Settings",
      c_search: "Search a contact", c_invite: "📨 Invite a contact", c_invite_d: "The TALK link goes by SMS, WhatsApp or email. As soon as the person picks a username, they appear here.",
      c_call: "Call", c_loading: "Reading your TALK contacts…", c_none: "No contact yet. Invite someone: they'll appear here as soon as they pick a username.",
      c_nomatch: "No matching contact.", c_err: "Your contacts can't be read right now.", retry: "Try again",
      c_off: "TALK messaging is not enabled on this site.", c_noprof: "You need a TALK profile first (a username and your language, no email or phone number).",
      c_create: "Create my profile in TALK", c_link_copied: "Link copied: paste it in an SMS or WhatsApp.", c_link_txt: "Copy this link and send it: {u}",
      c_before: "Call @{p}", c_i_speak: "I speak", c_i_read: "I read and listen in", c_go: "📞 Call @{p}", cancel: "Cancel",
      c_how: "The call opens in TALK, with translation: each person speaks their language, the other reads and hears the translation. At the end, you come back here.",
      c_lang_of: "Speaks {l}"
    }
  };
  function t(k, v) {
    var s = (STR[lang] && STR[lang][k]) || STR.fr[k] || k;
    if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); });
    return s;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* réglage pour cette visite seulement */ } }
  };

  // ---------- Réglages (sur cet appareil) ----------
  var mem = null;
  function defMe() {
    var p = store.get("lc_uilang");
    var l = (p && p !== "auto" ? p : (navigator.language || "fr")).slice(0, 2).toLowerCase();
    return M.lang(l).name !== l ? l : "fr";
  }
  function prefs() {
    if (mem) return mem;
    var p = {};
    try { p = JSON.parse(store.get(KEY) || "{}") || {}; } catch (e) { p = {}; }
    var me = M.lang(p.me).name !== p.me ? p.me : defMe();
    var other = M.lang(p.other).name !== p.other ? p.other : (me === "en" ? "fr" : "en");
    mem = { me: me, other: other, sound: p.sound !== false, volume: typeof p.volume === "number" ? Math.max(0, Math.min(1, p.volume)) : 1,
      size: [0, 1, 2].indexOf(p.size) !== -1 ? p.size : 0 };
    return mem;
  }
  function savePrefs() { store.set(KEY, JSON.stringify(mem)); }

  function langOptions(sel) {
    return M.langs.map(function (l) {
      return '<option value="' + esc(l.code) + '"' + (l.code === sel ? " selected" : "") + ">" + esc((l.flag ? l.flag + " " : "") + l.name) + "</option>";
    }).join("");
  }
  function langName(code) { var l = M.lang(code); return l.name; }
  function backLink() { return '<a class="tr-back" href="#/everywhere">' + esc(t("back")) + "</a>"; }

  // ---------- Accueil EVERYWHERE ----------
  var ICON = {
    face: '<path d="M4 12h16"/><rect x="6" y="3" width="12" height="18" rx="2.5"/><path d="M10 7.5h4M10 16.5h4"/>',
    call: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>',
    kb: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>'
  };
  function ic(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[n] + "</svg>"; }
  function home(root) {
    var p = prefs();
    root.innerHTML = '<div class="tr-head"><span class="tr-logo" aria-hidden="true">' + ic("globe") + '</span><div><h1 id="h-tr">' + esc(t("title")) + '</h1><p class="muted">' + esc(t("sub")) + "</p></div></div>" +
      '<a class="tr-big face" id="trGoFace" href="#/everywhere/face"><span class="tr-big-ic">' + ic("face") + "</span><span><b>" + esc(t("face")) + "</b><small>" + esc(t("face_d")) + "</small></span></a>" +
      '<a class="tr-big call" id="trGoCall" href="#/everywhere/appel"><span class="tr-big-ic">' + ic("call") + "</span><span><b>" + esc(t("call")) + "</b><small>" + esc(t("call_d")) + "</small></span></a>" +
      '<a class="tr-row" href="#/everywhere/langues"><b>' + esc(t("my_langs")) + "</b><span>" + esc(langName(p.me)) + " ⇄ " + esc(langName(p.other)) + "</span></a>" +
      '<a class="tr-row" href="#/everywhere/reglages"><b>' + esc(t("settings")) + "</b><span>" + esc(t("settings_d")) + "</span></a>";
  }

  // ---------- Mode A : côte à côte ----------
  var face = null; // { lines:[{from:1|2, orig, tr, err}], listening: 1|2|0, rec, root }
  function halfLang(who) { var p = prefs(); return who === 1 ? p.me : p.other; }
  function faceScreen(root) {
    var p = prefs();
    face = { lines: [], listening: 0, rec: null, root: root, typing: 0 };
    root.innerHTML = '<h1 class="sr" id="h-tr">' + esc(t("face")) + "</h1>" +
      '<div class="tr-face" id="trFace" data-size="' + p.size + '">' +
        halfHtml(2) +
        '<div class="tr-mid" role="toolbar" aria-label="' + esc(t("face")) + '">' +
          '<button type="button" class="tr-tool" id="trSwap" aria-label="' + esc(t("swap")) + '">⇅ ' + esc(t("langs_btn")) + "</button>" +
          '<button type="button" class="tr-tool" id="trSound" role="switch" aria-checked="' + p.sound + '">' + (p.sound ? "🔊" : "🔇") + " " + esc(t("sound_btn")) + "</button>" +
          '<button type="button" class="tr-tool" id="trSize">A+ ' + esc(t("text_btn")) + "</button>" +
          '<a class="tr-tool" href="#/everywhere/reglages" aria-label="' + esc(t("settings")) + '">⚙</a>' +
        "</div>" +
        halfHtml(1) +
      "</div>" +
      '<p class="sr" role="status" id="trFaceSr"></p>';
    paintFace();
  }
  function halfHtml(who) {
    var code = halfLang(who);
    return '<section class="tr-half p' + who + '" data-who="' + who + '" aria-label="' + esc(t(who === 1 ? "p1" : "p2")) + '">' +
      '<label class="tr-who"><span>' + esc(t(who === 1 ? "p1" : "p2")) + ' · </span><select data-lang-of="' + who + '" aria-label="' + esc(t(who === 1 ? "lang_me" : "lang_other")) + '">' + langOptions(code) + "</select></label>" +
      '<div class="tr-log" data-log="' + who + '" aria-live="polite"></div>' +
      '<p class="tr-msg" data-msg="' + who + '" role="alert"></p>' +
      '<form class="tr-type" data-type="' + who + '" hidden><input type="text" data-input="' + who + '" autocomplete="off" lang="' + esc(code) + '"><button type="submit" class="btn primary">' + esc(t("send")) + "</button></form>" +
      '<div class="tr-acts"><button type="button" class="tr-mic" data-mic="' + who + '" aria-label="' + esc(t("speak_in", { l: langName(code) })) + '">' + ic("mic") + "</button>" +
      '<button type="button" class="tr-kb" data-kb="' + who + '" aria-label="' + esc(t("type_in", { l: langName(code) })) + '">' + ic("kb") + "</button></div>" +
      "</section>";
  }
  function paintFace() {
    if (!face) return;
    var root = face.root;
    [1, 2].forEach(function (who) {
      var code = halfLang(who);
      var log = root.querySelector('[data-log="' + who + '"]');
      if (!log) return;
      if (!face.lines.length) { log.innerHTML = '<p class="tr-empty">' + esc(t("empty")) + "</p>"; }
      else {
        // Chaque moitié lit tout dans sa propre langue : en grand ce qui est dit (ou traduit) pour elle, en petit l'autre langue.
        log.innerHTML = face.lines.slice(-4).map(function (l) {
          var mine = l.from === who;
          var big = mine ? l.orig : (l.tr || (l.err ? "" : "…"));
          var small = mine ? (l.tr || (l.err ? "" : "…")) : l.orig;
          return '<div class="tr-line' + (mine ? " mine" : "") + '"><p class="tr-big-txt" lang="' + esc(code) + '">' + esc(big) + "</p>" +
            (small ? '<p class="tr-small-txt">' + esc(small) + "</p>" : "") + (l.err ? '<p class="tr-err">' + esc(l.err) + "</p>" : "") + "</div>";
        }).join("");
        log.scrollTop = log.scrollHeight;
      }
      var mic = root.querySelector('[data-mic="' + who + '"]');
      mic.classList.toggle("on", face.listening === who);
      mic.setAttribute("aria-pressed", String(face.listening === who));
    });
  }
  function msg(who, txt) {
    if (!face) return;
    var el = face.root.querySelector('[data-msg="' + who + '"]');
    if (el) el.textContent = txt || "";
  }
  function errText(code) {
    return code === "QUOTA_PROVIDER" ? t("quota") : code === "OFFLINE" || code === "NETWORK" ? t("net_err") : t("tr_err", { m: code });
  }
  function say(who, text) {
    var from = halfLang(who), to = halfLang(who === 1 ? 2 : 1);
    var line = { from: who, orig: text, tr: "", err: "" };
    face.lines.push(line);
    if (face.lines.length > 30) face.lines.shift();
    msg(1, ""); msg(2, "");
    paintFace();
    M.translate(text, from, to).then(function (tr) {
      line.tr = tr;
      paintFace();
      var sr = face && face.root.querySelector("#trFaceSr");
      if (sr) sr.textContent = tr;
      var p = prefs();
      if (p.sound) M.speak(tr, to, p.volume);
    }, function (e) {
      line.err = errText(e && e.message);
      paintFace();
    });
  }
  function startMic(who) {
    if (!face) return;
    if (face.listening === who) { if (face.rec) face.rec.stop(); return; }
    if (face.listening) { msg(who, t("busy")); return; }
    if (!M.canListen) { msg(who, t("no_stt")); openType(who); return; }
    msg(1, ""); msg(2, "");
    M.stopSpeaking();
    M.askMic().then(function (ok) {
      if (!face) return;
      if (!ok) { msg(who, t("mic_denied")); return; }
      face.listening = who;
      paintFace();
      msg(who, t("listening"));
      var f = face;
      f.rec = M.listen(halfLang(who), {
        interim: function (txt) { if (face === f) msg(who, txt ? "🎤 " + txt : t("listening")); },
        final: function (txt) { if (face !== f) return; f.listening = 0; f.rec = null; msg(who, ""); say(who, txt); },
        error: function (code) {
          if (face !== f) return;
          f.listening = 0; f.rec = null; paintFace();
          msg(who, code === "DENIED" ? t("mic_denied") : code === "NETWORK" ? t("net_err") : code === "NO_SPEECH" ? t("no_speech") : t("stt_fail"));
        },
        end: function () { if (face !== f) return; if (f.listening === who) { f.listening = 0; f.rec = null; msg(who, ""); } paintFace(); }
      });
      if (!f.rec) { f.listening = 0; paintFace(); msg(who, t("stt_fail")); }
    });
  }
  function openType(who) {
    var form = face.root.querySelector('[data-type="' + who + '"]');
    form.hidden = !form.hidden;
    if (!form.hidden) form.querySelector("input").focus();
  }

  // ---------- Mes langues ----------
  function langsScreen(root) {
    var p = prefs();
    root.innerHTML = backLink() + '<h1 id="h-tr">' + esc(t("my_langs")) + "</h1>" +
      '<div class="card"><label class="tr-field"><span>' + esc(t("lang_me")) + '</span><select id="trMe">' + langOptions(p.me) + "</select></label>" +
      '<label class="tr-field"><span>' + esc(t("lang_other")) + '</span><select id="trOther">' + langOptions(p.other) + "</select></label>" +
      '<p class="note">' + esc(t("lang_note")) + '</p><p class="tr-ok" id="trLangOk" role="status"></p></div>';
    function upd() { var q = prefs(); q.me = root.querySelector("#trMe").value; q.other = root.querySelector("#trOther").value; savePrefs(); root.querySelector("#trLangOk").textContent = t("saved"); }
    root.querySelector("#trMe").addEventListener("change", upd);
    root.querySelector("#trOther").addEventListener("change", upd);
  }

  // ---------- Configurations ----------
  function settingsScreen(root) {
    var p = prefs();
    var sizes = t("sizes").split("|");
    root.innerHTML = backLink() + '<h1 id="h-tr">' + esc(t("settings")) + "</h1>" +
      '<div class="card">' +
        '<div class="row"><span id="trLblSound">' + esc(t("set_sound")) + '</span><button type="button" class="toggle" id="trSetSound" role="switch" aria-labelledby="trLblSound" aria-checked="' + p.sound + '"></button></div>' +
        '<label class="tr-field"><span>' + esc(t("set_volume")) + ' <b id="trVolTxt">' + Math.round(p.volume * 100) + ' %</b></span><input type="range" id="trVol" min="0" max="100" step="10" value="' + Math.round(p.volume * 100) + '"></label>' +
        '<div class="row"><span id="trLblSize">' + esc(t("set_size")) + '</span><span class="seg" role="radiogroup" aria-labelledby="trLblSize">' +
          sizes.map(function (n, i) { return '<button type="button" role="radio" data-trsize="' + i + '" aria-checked="' + (p.size === i) + '" aria-label="' + esc(n) + '" class="ts' + i + '">A</button>'; }).join("") +
        "</span></div>" +
        '<p class="note">' + esc(t("set_note")) + ' <a href="#/parametres">' + esc(t("a11y_link")) + "</a></p>" +
      "</div>";
    root.querySelector("#trSetSound").addEventListener("click", function (e) { var q = prefs(); q.sound = !q.sound; savePrefs(); e.currentTarget.setAttribute("aria-checked", String(q.sound)); });
    root.querySelector("#trVol").addEventListener("input", function (e) { var q = prefs(); q.volume = (+e.target.value) / 100; savePrefs(); root.querySelector("#trVolTxt").textContent = e.target.value + " %"; });
    root.querySelectorAll("[data-trsize]").forEach(function (b) {
      b.addEventListener("click", function () {
        var q = prefs(); q.size = +b.getAttribute("data-trsize"); savePrefs();
        root.querySelectorAll("[data-trsize]").forEach(function (x) { x.setAttribute("aria-checked", String(x === b)); });
      });
    });
  }

  // ---------- Mode B : appeler sur TALK ----------
  // Contacts lus sur le serveur avec la session de TALK (même compte, même site), comme le fait TALK :
  // seules les personnes déjà en discussion avec moi (contacts autorisés). L'appel lui-même est celui de TALK.
  var callState = null; // { me, pseudo, plang, contacts:[{convId, id, pseudo, lang}] }
  function talkUrl(q) { return CFG.basePath + "index.html" + (q || ""); }
  function callScreen(root, my) {
    root.innerHTML = backLink() + '<h1 id="h-tr">' + esc(t("call")) + '</h1><div id="trCallBody"><div class="state"><div class="spinner" aria-hidden="true"></div><p>' + esc(t("c_loading")) + "</p></div></div>";
    var body = root.querySelector("#trCallBody");
    if (!window.EWConnect || !window.EWConnect.client) { body.innerHTML = '<p class="muted">' + esc(t("c_off")) + "</p>"; return; }
    window.EWConnect.client().then(function (sb) {
      return sb.auth.getSession().then(function (r) {
        var s = r && r.data && r.data.session;
        if (!s) return { none: true };
        var me = s.user.id;
        return Promise.all([
          sb.from("profiles").select("id,pseudo,lang").eq("id", me).maybeSingle(),
          sb.from("members").select("conversation_id,user_id"),
          sb.from("blocks").select("blocked")
        ]).then(function (res) {
          if (res[0].error || res[1].error) throw res[0].error || res[1].error;
          var prof = res[0].data;
          if (!prof) return { none: true };
          var mems = res[1].data || [];
          var blocked = (res[2].data || []).map(function (b) { return b.blocked; });
          var mine = mems.filter(function (m) { return m.user_id === me; }).map(function (m) { return m.conversation_id; });
          var others = mems.filter(function (m) { return m.user_id !== me && mine.indexOf(m.conversation_id) !== -1 && blocked.indexOf(m.user_id) === -1; });
          var ids = others.map(function (m) { return m.user_id; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
          return (ids.length ? sb.from("profiles").select("id,pseudo,lang").in("id", ids) : Promise.resolve({ data: [] })).then(function (pr) {
            var profs = (pr && pr.data) || [];
            var contacts = others.map(function (m) {
              var p = profs.filter(function (x) { return x.id === m.user_id; })[0];
              return p ? { convId: m.conversation_id, id: p.id, pseudo: p.pseudo, lang: p.lang } : null;
            }).filter(Boolean).sort(function (a, b) { return a.pseudo < b.pseudo ? -1 : 1; });
            return { me: me, pseudo: prof.pseudo, plang: prof.lang, contacts: contacts };
          });
        });
      });
    }).then(function (st) {
      if (my !== token) return;
      if (st.none) {
        body.innerHTML = '<p class="muted">' + esc(t("c_noprof")) + '</p><a class="btn primary wide" href="' + esc(talkUrl("?ew=1")) + '">' + esc(t("c_create")) + "</a>";
        return;
      }
      callState = st;
      body.innerHTML = '<input type="search" class="cx-input tr-search" id="trSearch" placeholder="' + esc(t("c_search")) + '" aria-label="' + esc(t("c_search")) + '">' +
        '<button type="button" class="tr-invite" id="trInvite">' + esc(t("c_invite")) + '</button><p class="note">' + esc(t("c_invite_d")) + '</p><p class="tr-ok" id="trInviteMsg" role="status"></p>' +
        '<ul class="tr-contacts" id="trContacts"></ul>';
      paintContacts("");
      body.querySelector("#trSearch").addEventListener("input", function (e) { paintContacts(e.target.value); });
      body.querySelector("#trInvite").addEventListener("click", invite);
    }, function (e) {
      if (my !== token) return;
      body.innerHTML = e && e.message === "OFF" ? '<p class="muted">' + esc(t("c_off")) + "</p>"
        : '<div class="state" role="alert"><p>' + esc(t("c_err")) + '</p><button type="button" class="btn primary" id="trRetry">' + esc(t("retry")) + "</button></div>";
      var r = body.querySelector("#trRetry");
      if (r) r.addEventListener("click", function () { show(root, ["appel"], lang); });
    });
  }
  function paintContacts(q) {
    var ul = document.getElementById("trContacts");
    if (!ul || !callState) return;
    q = String(q || "").trim().replace(/^@/, "").toLowerCase();
    var list = callState.contacts.filter(function (c) { return !q || c.pseudo.indexOf(q) !== -1; });
    if (!callState.contacts.length) { ul.innerHTML = '<li class="muted tr-none">' + esc(t("c_none")) + "</li>"; return; }
    if (!list.length) { ul.innerHTML = '<li class="muted tr-none">' + esc(t("c_nomatch")) + "</li>"; return; }
    ul.innerHTML = list.map(function (c) {
      return '<li class="tr-ct"><span class="tr-av" aria-hidden="true">' + esc(c.pseudo.charAt(0).toUpperCase()) + "</span>" +
        "<span><b>@" + esc(c.pseudo) + "</b><small>" + esc(t("c_lang_of", { l: langName(c.lang) })) + "</small></span>" +
        '<button type="button" class="btn tr-callbtn" data-call="' + esc(c.convId) + '" aria-label="' + esc(t("c_call") + " @" + c.pseudo) + '">' + esc(t("c_call")) + "</button></li>";
    }).join("");
  }
  // Langues de la discussion, au même endroit que TALK (lc_convlang_<discussion>) : TALK les utilise pour l'appel.
  function convLangs(convId) {
    var o = {};
    try { o = JSON.parse(store.get("lc_convlang_" + convId) || "{}") || {}; } catch (e) { o = {}; }
    return { speak: o.speak || callState.plang, read: o.read || callState.plang };
  }
  function setConvLangs(convId, speak, read) {
    var o = { speak: speak === callState.plang ? "" : speak, read: read === callState.plang ? "" : read };
    try {
      if (!o.speak && !o.read) localStorage.removeItem("lc_convlang_" + convId);
      else localStorage.setItem("lc_convlang_" + convId, JSON.stringify(o));
    } catch (e) { /* stockage indisponible : TALK prendra la langue du profil */ }
  }
  function callSheet(convId) {
    var c = callState.contacts.filter(function (x) { return x.convId === convId; })[0];
    if (!c) return;
    var cl = convLangs(convId);
    var old = document.getElementById("trSheet");
    if (old) old.remove();
    var d = document.createElement("div");
    d.className = "tr-sheet";
    d.id = "trSheet";
    d.setAttribute("role", "dialog");
    d.setAttribute("aria-modal", "true");
    d.setAttribute("aria-labelledby", "trSheetH");
    d.innerHTML = '<div class="tr-sheet-in"><h2 id="trSheetH">' + esc(t("c_before", { p: c.pseudo })) + "</h2>" +
      '<label class="tr-field"><span>' + esc(t("c_i_speak")) + '</span><select id="trCSpeak">' + langOptions(cl.speak) + "</select></label>" +
      '<label class="tr-field"><span>' + esc(t("c_i_read")) + '</span><select id="trCRead">' + langOptions(cl.read) + "</select></label>" +
      '<p class="note">' + esc(t("c_how")) + "</p>" +
      '<a class="btn primary wide" id="trCGo" href="' + esc(talkUrl("?ew=1&ew_appel=" + encodeURIComponent(convId))) + '">' + esc(t("c_go", { p: c.pseudo })) + "</a>" +
      '<button type="button" class="btn wide" id="trCCancel">' + esc(t("cancel")) + "</button></div>";
    document.body.appendChild(d);
    d.querySelector("#trCSpeak").focus();
    d.querySelector("#trCGo").addEventListener("click", function () { setConvLangs(convId, d.querySelector("#trCSpeak").value, d.querySelector("#trCRead").value); });
    function close() { d.remove(); var b = document.querySelector('[data-call="' + convId + '"]'); if (b) b.focus(); }
    d.querySelector("#trCCancel").addEventListener("click", close);
    d.addEventListener("click", function (e) { if (e.target === d) close(); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }
  // Invitation : le même lien que « Inviter un ami » de TALK (…/?ajouter=<mon pseudo>), envoyé avec le partage du téléphone.
  function invite() {
    var out = document.getElementById("trInviteMsg");
    var url = new URL(CFG.basePath, location.href).href + "?ajouter=" + encodeURIComponent(callState.pseudo) + "&i=5";
    var copy = function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { out.textContent = t("c_link_copied"); }, function () { out.textContent = t("c_link_txt", { u: url }); });
      } else out.textContent = t("c_link_txt", { u: url });
    };
    if (navigator.share) {
      navigator.share({ url: url }).catch(function (e) { if (!(e && e.name === "AbortError")) copy(); });
    } else copy();
  }

  // ---------- Événements ----------
  document.addEventListener("click", function (e) {
    if (!e.target.closest) return;
    var b = e.target.closest("[data-mic], [data-kb], #trSwap, #trSound, #trSize, [data-call]");
    if (!b) return;
    if (b.hasAttribute("data-call")) { callSheet(b.getAttribute("data-call")); return; }
    if (!face || !face.root.contains(b)) return;
    var p = prefs();
    if (b.hasAttribute("data-mic")) startMic(+b.getAttribute("data-mic"));
    else if (b.hasAttribute("data-kb")) openType(+b.getAttribute("data-kb"));
    else if (b.id === "trSwap") {
      var x = p.me; p.me = p.other; p.other = x; savePrefs();
      faceScreen(face.root);
    } else if (b.id === "trSound") {
      p.sound = !p.sound; savePrefs();
      if (!p.sound) M.stopSpeaking();
      b.setAttribute("aria-checked", String(p.sound));
      b.innerHTML = (p.sound ? "🔊" : "🔇") + " " + esc(t("sound_btn"));
      var sr = face.root.querySelector("#trFaceSr");
      if (sr) sr.textContent = t(p.sound ? "sound_on" : "sound_off");
    } else if (b.id === "trSize") {
      p.size = (p.size + 1) % 3; savePrefs();
      face.root.querySelector("#trFace").setAttribute("data-size", String(p.size));
    }
  });
  document.addEventListener("change", function (e) {
    var s = e.target;
    if (!face || !s.hasAttribute || !s.hasAttribute("data-lang-of") || !face.root.contains(s)) return;
    var p = prefs();
    if (s.getAttribute("data-lang-of") === "1") p.me = s.value; else p.other = s.value;
    savePrefs();
    var lines = face.lines;
    faceScreen(face.root);
    face.lines = lines;
    paintFace();
  });
  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (!face || !f.hasAttribute || !f.hasAttribute("data-type")) return;
    e.preventDefault();
    var inp = f.querySelector("input");
    var v = inp.value.trim();
    if (!v) return;
    inp.value = "";
    say(+f.getAttribute("data-type"), v);
  });

  // ---------- Point d'entrée (appelé par app.js à chaque changement d'adresse) ----------
  var token = 0;
  function show(root, parts, uiLang) {
    lang = uiLang === "en" ? "en" : "fr";
    token += 1;
    if (face && face.rec) face.rec.stop();
    face = null;
    M.stopSpeaking();
    var old = document.getElementById("trSheet");
    if (old) old.remove();
    var s = (parts || [])[0] || "";
    root.classList.toggle("tr-full", s === "face");
    if (s === "face") { faceScreen(root); return t("face"); }
    if (s === "appel") { callScreen(root, token); return t("call"); }
    if (s === "langues") { langsScreen(root); return t("my_langs"); }
    if (s === "reglages") { settingsScreen(root); return t("settings"); }
    home(root);
    return t("title");
  }
  window.EWEverywhere = { show: show, _strings: STR, prefs: prefs };
})();
