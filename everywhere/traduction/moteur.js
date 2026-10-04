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
  var canSpeak = typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined";
  function speak(text, code, volume) {
    if (!canSpeak || !text) return false;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang(code).speech;
      u.volume = typeof volume === "number" ? Math.max(0, Math.min(1, volume)) : 1;
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
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

  window.EWMoteur = { lang: lang, langs: LANGS, translate: translate, speak: speak, stopSpeaking: stopSpeaking, canSpeak: canSpeak,
    canListen: !!SR, askMic: askMic, listen: listen };
})();
