/* 24/24 EVERYWHERE — moteur de traduction et de voix. © 2026 Sébastien Chevrier. Tous droits réservés.
   Mêmes services que 24/24 TALK, gratuits et sans clé :
   - traduction : MyMemory (api.mymemory.translated.net), comme le moteur en ligne de TALK ;
   - écoute : reconnaissance vocale du navigateur (la langue doit être connue : un bouton micro par langue) ;
   - lecture : voix de synthèse du téléphone.
   Le dictionnaire de phrases hors ligne de TALK n'est pas repris ici (prochaine étape : un fichier commun à TALK et EVERYWHERE). */
(function () {
  "use strict";
  var LANGS = window.EW_LANGS || [];
  function lang(code) {
    return LANGS.filter(function (l) { return l.code === code; })[0] || { code: code, name: code, flag: "", speech: code };
  }

  // ---------- Traduction ----------
  // Résultat : texte traduit. Erreurs (message) : EMPTY, OFFLINE, NETWORK, SERVER, QUOTA_PROVIDER, EMPTY_RESULT.
  function translate(text, from, to) {
    text = String(text || "").trim();
    if (!text) return Promise.reject(new Error("EMPTY"));
    if (from === to) return Promise.resolve(text);
    if (navigator.onLine === false) return Promise.reject(new Error("OFFLINE"));
    var url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) + "&langpair=" + encodeURIComponent(from) + "|" + encodeURIComponent(to);
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 8000) : null;
    return fetch(url, { method: "GET", signal: ctrl ? ctrl.signal : undefined })
      .catch(function () { throw new Error("NETWORK"); })
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok) throw new Error("SERVER");
        return res.json();
      })
      .then(function (data) {
        if (data && data.quotaFinished) throw new Error("QUOTA_PROVIDER");
        var tr = data && data.responseData && data.responseData.translatedText;
        if (!tr) throw new Error("EMPTY_RESULT");
        return tr;
      });
  }

  // ---------- Lecture à voix haute ----------
  // Le son sort là où Android l'envoie : haut-parleur du téléphone, ou écouteurs Bluetooth s'ils sont connectés.
  // Une page web ne peut pas choisir elle-même la sortie ni piloter les écouteurs.
  var canSpeak = typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined";
  function allVoices() { try { return (canSpeak && window.speechSynthesis.getVoices()) || []; } catch (e) { return []; } }
  // Voix du téléphone pour une langue (fr → fr-FR, fr-CA…).
  function voicesFor(code) {
    var want = String(lang(code).speech || code).toLowerCase().replace("_", "-"), base = want.split("-")[0];
    return allVoices().filter(function (v) { var l = String(v.lang || "").toLowerCase().replace("_", "-"); return l === want || l.split("-")[0] === base; })
      .sort(function (a, b) { return (String(b.lang).toLowerCase() === want) - (String(a.lang).toLowerCase() === want); });
  }
  // Voix choisie (identifiant gardé dans les réglages) ou, à défaut, la plus naturelle disponible.
  function pickVoice(code, uri) {
    var list = voicesFor(code);
    if (uri) { var v = list.filter(function (x) { return x.voiceURI === uri; })[0]; if (v) return v; }
    return list.filter(function (x) { return /natural|neural|premium|enhanced|google/i.test(x.name || ""); })[0] || list[0] || null;
  }
  // opts : { rate (0,5 à 1,5), voice (identifiant), done() appelé une fois la phrase lue, ou tout de suite si rien n'est lu }.
  function speak(text, code, volume, opts) {
    opts = opts || {};
    var called = false, timer = null;
    function done() { if (called) return; called = true; clearTimeout(timer); if (opts.done) opts.done(); }
    if (!canSpeak || !text) { done(); return false; }
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang(code).speech;
      u.volume = typeof volume === "number" ? Math.max(0, Math.min(1, volume)) : 1;
      var rate = typeof opts.rate === "number" ? Math.max(0.5, Math.min(1.5, opts.rate)) : 1;
      u.rate = rate;
      var v = pickVoice(code, opts.voice);
      if (v) { try { u.voice = v; u.lang = v.lang || u.lang; } catch (e) { /* voix refusée : voix par défaut */ } }
      u.onend = done;
      u.onerror = done;
      // Certains Android n'annoncent pas toujours la fin de la phrase : délai de secours selon la longueur.
      timer = setTimeout(done, Math.min(20000, 1500 + String(text).length * 90 / rate));
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) { done(); return false; }
  }
  function stopSpeaking() { if (canSpeak) { try { window.speechSynthesis.cancel(); } catch (e) { /* rien */ } } }

  // ---------- Écoute (un seul micro à la fois sur un téléphone) ----------
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var micOk = false;
  // Autorisation du micro : comme dans TALK, on la demande nous-mêmes (Android ne l'affiche pas toujours).
  function askMic() {
    if (micOk || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.resolve(true);
    return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (st) {
      st.getTracks().forEach(function (tr) { tr.stop(); });
      micOk = true;
      return new Promise(function (r) { setTimeout(function () { r(true); }, 250); });
    }, function (e) {
      if (e && (e.name === "NotAllowedError" || e.name === "SecurityError" || e.name === "PermissionDeniedError")) return false;
      return true; // autre souci : la reconnaissance vocale tente sa chance
    });
  }
  // cb : { interim(text), final(text), error(code), end() } ; codes : DENIED, NETWORK, NO_SPEECH, FAIL.
  // Renvoie un objet { stop() } ou null si l'écoute n'a pas pu démarrer.
  function listen(code, cb) {
    if (!SR) return null;
    var r = new SR();
    r.lang = lang(code).speech;
    r.interimResults = true;
    r.continuous = false;
    var done = false, settle = null, shown = "";
    function deliver(txt) {
      if (done || !txt) return;
      done = true;
      clearTimeout(settle);
      try { r.abort(); } catch (e) { /* déjà arrêté */ }
      cb.final(txt);
    }
    r.onresult = function (ev) {
      if (done) return;
      var fin = "", inter = "";
      for (var i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) fin += ev.results[i][0].transcript; else inter += ev.results[i][0].transcript;
      }
      shown = (fin || inter).trim();
      if (cb.interim) cb.interim(shown);
      clearTimeout(settle);
      if (fin) deliver(fin.trim());
      else if (shown) settle = setTimeout(function () { deliver(shown); }, 700); // phrase stable : on n'attend pas le navigateur
    };
    r.onerror = function (ev) {
      if (done || ev.error === "aborted") return;
      done = true;
      cb.error(ev.error === "not-allowed" || ev.error === "service-not-allowed" ? "DENIED" : ev.error === "network" ? "NETWORK" : ev.error === "no-speech" ? "NO_SPEECH" : "FAIL");
    };
    r.onend = function () { clearTimeout(settle); if (!done && shown) deliver(shown); done = true; if (cb.end) cb.end(); };
    try { r.start(); } catch (e) { return null; }
    return { stop: function () { try { r.stop(); } catch (e) { /* déjà arrêté */ } } };
  }

  window.EWMoteur = { lang: lang, langs: LANGS, translate: translate, speak: speak, stopSpeaking: stopSpeaking, canSpeak: canSpeak, voicesFor: voicesFor, pickVoice: pickVoice,
    canListen: !!SR, askMic: askMic, listen: listen };
})();
