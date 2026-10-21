/* 24/24 ONE WORLD — PARTOUT : traduire pour tous les autres moyens de communication. © 2026 Sébastien Chevrier. Tous droits réservés.
   Route #/everywhere/partout (appelée par everywhere.js).
   - « J'envoie » : j'écris dans ma langue, ONE WORLD traduit dans la langue de la personne, puis le texte part
     par SMS, WhatsApp, Telegram, e-mail ou n'importe quelle application du téléphone (feuille de partage Android).
   - « J'ai reçu » : je colle (ou je partage vers ONE WORLD depuis une autre application) un message reçu,
     ONE WORLD le traduit dans ma langue.
   Rien n'est envoyé par ONE WORLD lui-même : c'est l'application choisie qui envoie, comme d'habitude.
   Aucun service payant, aucune clé : même moteur de traduction gratuit que le face à face (moteur.js). */
(function () {
  "use strict";
  var STR = {
    fr: {
      title: "Partout", sub: "Traduire pour SMS, WhatsApp, e-mail, réseaux sociaux…",
      tab_send: "J'envoie", tab_recv: "J'ai reçu",
      send_ph: "Écrivez votre message dans votre langue", to_lang: "Langue de la personne",
      recv_ph: "Collez ici le message reçu", from_lang: "Langue du message reçu",
      paste: "📋 Coller", translate: "Traduire", working: "Traduction…",
      result_send: "Traduction à envoyer (vous pouvez la corriger)", result_recv: "Dans votre langue",
      by: "Envoyer par", sms: "SMS", wa: "WhatsApp", tg: "Telegram", mail: "E-mail", share: "Autre appli…", copy: "Copier",
      copied: "Copié : collez-le où vous voulez.", copy_fail: "Copie impossible : sélectionnez le texte et copiez-le.",
      both: "Ajouter mon message d'origine en dessous", listen: "🔊 Écouter",
      empty: "Écrivez d'abord un message.", empty_recv: "Collez d'abord un message.",
      tip: "Astuce : dans WhatsApp, Messenger ou vos SMS, appuyez longuement sur un message, puis « Partager » et choisissez 24/24 ONE WORLD : il arrive ici, traduit.",
      tr_hint: "Traduction automatique : vérifiez les informations importantes.",
      err: "Traduction impossible pour le moment. Vérifiez la connexion et réessayez.",
      quota: "Limite quotidienne du service de traduction gratuit atteinte. Réessayez demain.",
      back: "← Face à face", home_d: "SMS, WhatsApp, e-mail, réseaux sociaux : traduit"
    },
    en: {
      title: "Everywhere", sub: "Translate for SMS, WhatsApp, e-mail, social networks…",
      tab_send: "I'm sending", tab_recv: "I received",
      send_ph: "Write your message in your language", to_lang: "The person's language",
      recv_ph: "Paste the message you received here", from_lang: "Language of the message",
      paste: "📋 Paste", translate: "Translate", working: "Translating…",
      result_send: "Translation to send (you can correct it)", result_recv: "In your language",
      by: "Send by", sms: "SMS", wa: "WhatsApp", tg: "Telegram", mail: "E-mail", share: "Other app…", copy: "Copy",
      copied: "Copied: paste it wherever you want.", copy_fail: "Can't copy: select the text and copy it.",
      both: "Add my original message below", listen: "🔊 Listen",
      empty: "Write a message first.", empty_recv: "Paste a message first.",
      tip: "Tip: in WhatsApp, Messenger or your texts, long-press a message, then “Share” and choose 24/24 ONE WORLD: it arrives here, translated.",
      tr_hint: "Automatic translation: check important information.",
      err: "Translation isn't possible right now. Check the connection and try again.",
      quota: "Daily limit of the free translation service reached. Try again tomorrow.",
      back: "← Face to face", home_d: "SMS, WhatsApp, e-mail, social networks: translated"
    }
  };
  var lang = "fr", KEY = "ew_partout_v1";
  function t(k) { return (STR[lang] && STR[lang][k]) || STR.en[k] || STR.fr[k] || k; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* cette visite seulement */ } }
  };
  function mem() { try { return JSON.parse(store.get(KEY) || "{}") || {}; } catch (e) { return {}; } }
  function remember(o) { var m = mem(); Object.keys(o).forEach(function (k) { m[k] = o[k]; }); store.set(KEY, JSON.stringify(m)); }

  // Texte reçu par la feuille de partage d'Android (manifest share_target → app.js → sessionStorage).
  function takeShared() {
    try { var s = sessionStorage.getItem("ew_partage"); if (s) sessionStorage.removeItem("ew_partage"); return s || ""; } catch (e) { return ""; }
  }

  function show(root, uiLang, ctx) {
    lang = STR[uiLang] ? uiLang : "fr";
    var M = window.EWMoteur, p = ctx.prefs(), m = mem();
    var shared = takeShared();
    var mode = shared ? "recv" : (m.mode === "recv" ? "recv" : "send");
    var other = m.other && M.lang(m.other).name !== m.other ? m.other : p.other;
    root.innerHTML = '<a class="tr-back" href="#/everywhere">' + esc(t("back")) + "</a>" +
      '<h1 id="h-tr">' + esc(t("title")) + '</h1><p class="muted">' + esc(t("sub")) + "</p>" +
      '<div class="seg pt-tabs" role="tablist">' +
        '<button type="button" role="tab" data-ptmode="send">' + esc(t("tab_send")) + "</button>" +
        '<button type="button" role="tab" data-ptmode="recv">' + esc(t("tab_recv")) + "</button></div>" +
      '<div class="card">' +
        '<label class="tr-field"><span id="ptLangLbl"></span><select id="ptLang">' + ctx.langOptions(other) + "</select></label>" +
        '<textarea id="ptIn" rows="4" class="pt-text"></textarea>' +
        '<div class="pt-row"><button type="button" class="btn" id="ptPaste">' + esc(t("paste")) + '</button>' +
        '<button type="button" class="btn primary" id="ptGo">' + esc(t("translate")) + "</button></div>" +
        '<p class="tr-err" id="ptErr" role="alert" hidden></p>' +
      "</div>" +
      '<div class="card" id="ptOut" hidden>' +
        '<label class="tr-field"><span id="ptOutLbl"></span><textarea id="ptRes" rows="4" class="pt-text"></textarea></label>' +
        '<p class="note">' + esc(t("tr_hint")) + "</p>" +
        '<div id="ptSendBox"><label class="pt-check"><input type="checkbox" id="ptBoth"' + (m.both ? " checked" : "") + "> " + esc(t("both")) + "</label>" +
          '<p class="pt-by">' + esc(t("by")) + "</p>" +
          '<div class="pt-apps">' +
            '<a class="btn pt-app" id="ptSms" data-app="sms">' + esc(t("sms")) + "</a>" +
            '<a class="btn pt-app" id="ptWa" data-app="wa" target="_blank" rel="noopener">' + esc(t("wa")) + "</a>" +
            '<a class="btn pt-app" id="ptTg" data-app="tg" target="_blank" rel="noopener">' + esc(t("tg")) + "</a>" +
            '<a class="btn pt-app" id="ptMail" data-app="mail">' + esc(t("mail")) + "</a>" +
            '<button type="button" class="btn pt-app" id="ptShare">' + esc(t("share")) + "</button>" +
          "</div></div>" +
        '<div class="pt-row"><button type="button" class="btn" id="ptCopy">' + esc(t("copy")) + '</button>' +
        '<button type="button" class="btn" id="ptListen">' + esc(t("listen")) + "</button></div>" +
        '<p class="tr-ok" id="ptOk" role="status"></p>' +
      "</div>" +
      '<p class="note">' + esc(t("tip")) + "</p>";

    var $ = function (s) { return root.querySelector(s); };
    var inEl = $("#ptIn"), res = $("#ptRes"), sel = $("#ptLang"), out = $("#ptOut"), err = $("#ptErr"), ok = $("#ptOk");
    var lastTo = p.me;
    if (!navigator.share) $("#ptShare").hidden = true;
    if (!(navigator.clipboard && navigator.clipboard.readText)) $("#ptPaste").hidden = true;

    function setMode(md) {
      mode = md; remember({ mode: md });
      root.querySelectorAll("[data-ptmode]").forEach(function (b) { var on = b.getAttribute("data-ptmode") === md; b.setAttribute("aria-selected", on); b.setAttribute("aria-checked", on); });
      $("#ptLangLbl").textContent = t(md === "send" ? "to_lang" : "from_lang");
      inEl.placeholder = t(md === "send" ? "send_ph" : "recv_ph");
      $("#ptOutLbl").textContent = t(md === "send" ? "result_send" : "result_recv");
      $("#ptSendBox").hidden = md !== "send";
      out.hidden = true; err.hidden = true; ok.textContent = "";
    }
    // Texte final envoyé : la traduction, et en option le message d'origine en dessous.
    function finalText() {
      var tr = res.value.trim();
      if (mode === "send" && $("#ptBoth").checked && inEl.value.trim()) tr += "\n\n(" + inEl.value.trim() + ")";
      return tr;
    }
    function paintLinks() {
      var x = encodeURIComponent(finalText());
      $("#ptSms").href = "sms:?&body=" + x;
      $("#ptWa").href = "https://wa.me/?text=" + x;
      $("#ptTg").href = "https://t.me/share/url?url=" + encodeURIComponent(" ") + "&text=" + x;
      $("#ptMail").href = "mailto:?body=" + x;
    }
    function go() {
      var text = inEl.value.trim();
      err.hidden = true; ok.textContent = "";
      if (!text) { err.textContent = t(mode === "send" ? "empty" : "empty_recv"); err.hidden = false; return; }
      var o = sel.value, from = mode === "send" ? p.me : o, to = mode === "send" ? o : p.me;
      lastTo = to;
      remember({ other: o });
      var b = $("#ptGo"); b.disabled = true; b.textContent = t("working");
      M.translate(text, from, to).then(function (tr) {
        res.value = tr; out.hidden = false; paintLinks();
        out.scrollIntoView({ behavior: "smooth", block: "start" });
      }, function (e) {
        err.textContent = e && e.message === "QUOTA_PROVIDER" ? t("quota") : t("err"); err.hidden = false;
      }).then(function () { b.disabled = false; b.textContent = t("translate"); });
    }
    root.querySelectorAll("[data-ptmode]").forEach(function (b) { b.addEventListener("click", function () { setMode(b.getAttribute("data-ptmode")); }); });
    $("#ptGo").addEventListener("click", go);
    sel.addEventListener("change", function () { remember({ other: sel.value }); out.hidden = true; });
    res.addEventListener("input", paintLinks);
    $("#ptBoth").addEventListener("change", function () { remember({ both: $("#ptBoth").checked }); paintLinks(); });
    $("#ptPaste").addEventListener("click", function () {
      navigator.clipboard.readText().then(function (s) { if (s) { inEl.value = s; go(); } }, function () {});
    });
    $("#ptShare").addEventListener("click", function () { navigator.share({ text: finalText() }).catch(function () {}); });
    $("#ptCopy").addEventListener("click", function () {
      var txt = mode === "send" ? finalText() : res.value;
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { ok.textContent = t("copied"); }, function () { res.select(); ok.textContent = t("copy_fail"); });
    });
    $("#ptListen").addEventListener("click", function () { var q = ctx.prefs(); M.speak(res.value, lastTo, q.volume, { rate: q.rate, voice: q.voices[lastTo] }); });
    setMode(mode);
    if (shared) { inEl.value = shared; go(); }
    return t("title");
  }
  window.EWPartout = { show: show, _strings: STR, homeLabel: function (l) { lang = STR[l] ? l : "fr"; return { b: t("title"), d: t("home_d") }; } };
})();
