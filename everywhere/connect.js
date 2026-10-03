/* 24/24 EVERYWHERE — CONNECT : un compte, plusieurs appareils. © 2026 Sébastien Chevrier. Tous droits réservés.
   - Sécuriser mon compte : relier une adresse e-mail au compte actuel (sans mot de passe, code à 6 chiffres).
   - J'ai déjà un compte : se connecter sur cet appareil avec le code reçu par e-mail.
   - Mes appareils : voir ses appareils connectés, en déconnecter un (perdu) ou tous les autres.
   Même session que 24/24 TALK (clé lc_net_auth, même site) : rien n'est recopié. Clé publique uniquement. */
(function () {
  "use strict";
  var CFG = window.EW_CONFIG || {};
  var S = {
    fr: {
      loading: "Lecture de votre profil…", error: "Impossible de joindre le serveur. Vérifiez votre connexion.", retry: "Réessayer",
      off: "La messagerie de TALK n'est pas activée sur ce site.",
      none: "Vous n'avez pas encore de profil sur cet appareil.", none_txt: "Créez-le dans 24/24 TALK (un pseudo et votre langue suffisent), ou connectez-vous si votre compte est déjà relié à un e-mail.",
      create: "Créer mon profil dans TALK", have: "J'ai déjà un compte", lang: "Langue parlée : {l}", chats: "Ouvrir mes discussions",
      sec_title: "Sécurité du compte",
      sec_no: "Ce compte n'est relié à aucune adresse e-mail. Si vous perdez ou changez de téléphone, ou si les données du navigateur sont effacées, il ne pourra pas être retrouvé.",
      sec_btn: "Sécuriser mon compte",
      sec_yes: "Compte sécurisé : {e}", sec_pending: "Adresse en attente de confirmation : {e}",
      sync: "Sur un autre appareil, vous retrouvez votre pseudo, vos contacts et les messages des 90 derniers jours. L'historique de traduction, les favoris et les réglages restent sur cet appareil.",
      email_lbl: "Votre adresse e-mail", email_ph: "nom@exemple.com", send: "Recevoir le code", cancel: "Annuler",
      email_link_txt: "Nous envoyons un code à 6 chiffres à cette adresse. Elle sert uniquement à retrouver votre compte et n'est jamais montrée aux autres utilisateurs.",
      login_txt: "Saisissez l'adresse e-mail reliée à votre compte : nous y envoyons un code à 6 chiffres.",
      code_lbl: "Code reçu par e-mail (6 chiffres)", code_sent: "Code envoyé à {e}. Pensez à regarder dans les courriers indésirables.", verify: "Valider",
      linked_ok: "C'est fait : votre compte est relié à {e}.", login_ok: "Connecté : bienvenue @{p} !",
      replace_warn: "Attention : cet appareil a déjà le compte @{p}, qui n'est relié à aucun e-mail. Si vous vous connectez à un autre compte, @{p} sera perdu définitivement.",
      replace_ok: "Je comprends, continuer",
      other_account: "Se connecter à un autre compte",
      dev_title: "Mes appareils", dev_this: "Cet appareil", dev_seen: "Vu {d}", dev_out: "Déconnecter", dev_out_sure: "Confirmer", dev_out_all: "Déconnecter tous les autres appareils",
      dev_out_done: "Appareil déconnecté : il n'a plus accès à vos conversations et ne sonnera plus.", dev_all_done: "Tous vos autres appareils sont déconnectés.",
      dev_none: "Aucun autre appareil connecté.", dev_err: "Impossible de lire la liste des appareils pour le moment.",
      e_email: "Adresse e-mail invalide.", e_code: "Le code doit faire 6 chiffres.", e_bad_code: "Code incorrect ou expiré. Demandez-en un nouveau.",
      e_taken: "Cette adresse est déjà reliée à un autre compte. Utilisez « J'ai déjà un compte » sur l'écran de connexion, ou une autre adresse.",
      e_unknown: "Aucun compte n'est relié à cette adresse.", e_rate: "Trop d'e-mails envoyés pour le moment. Réessayez dans une heure.",
      e_notauth: "Site de test : seules les adresses des membres de l'équipe du projet reçoivent les e-mails.",
      e_net: "Pas de connexion. Réessayez.", e_other: "Ça n'a pas marché ({m}). Réessayez.",
      today: "aujourd'hui", ago_min: "il y a {n} min", ago_h: "il y a {n} h", ago_d: "il y a {n} j",
      android: "Android", iphone: "iPhone", ipad: "iPad", windows: "Ordinateur Windows", mac: "Mac", linux: "Ordinateur Linux", other: "Appareil"
    },
    en: {
      loading: "Reading your profile…", error: "Can't reach the server. Check your connection.", retry: "Try again",
      off: "TALK messaging is not enabled on this site.",
      none: "You don't have a profile on this device yet.", none_txt: "Create it in 24/24 TALK (a username and your language are enough), or sign in if your account is already linked to an email.",
      create: "Create my profile in TALK", have: "I already have an account", lang: "Spoken language: {l}", chats: "Open my chats",
      sec_title: "Account security",
      sec_no: "This account isn't linked to any email address. If you lose or change your phone, or if browser data is cleared, it can't be recovered.",
      sec_btn: "Secure my account",
      sec_yes: "Account secured: {e}", sec_pending: "Address waiting for confirmation: {e}",
      sync: "On another device you get back your username, your contacts and the last 90 days of messages. Translation history, favorites and settings stay on this device.",
      email_lbl: "Your email address", email_ph: "name@example.com", send: "Get the code", cancel: "Cancel",
      email_link_txt: "We send a 6-digit code to this address. It's only used to recover your account and is never shown to other users.",
      login_txt: "Enter the email address linked to your account: we send a 6-digit code to it.",
      code_lbl: "Code received by email (6 digits)", code_sent: "Code sent to {e}. Check your spam folder too.", verify: "Confirm",
      linked_ok: "Done: your account is linked to {e}.", login_ok: "Signed in: welcome @{p}!",
      replace_warn: "Warning: this device already has the account @{p}, which isn't linked to any email. If you sign in to another account, @{p} will be lost for good.",
      replace_ok: "I understand, continue",
      other_account: "Sign in to another account",
      dev_title: "My devices", dev_this: "This device", dev_seen: "Seen {d}", dev_out: "Sign out", dev_out_sure: "Confirm", dev_out_all: "Sign out all other devices",
      dev_out_done: "Device signed out: it no longer has access to your chats and won't ring.", dev_all_done: "All your other devices are signed out.",
      dev_none: "No other device signed in.", dev_err: "Can't read the device list right now.",
      e_email: "Invalid email address.", e_code: "The code must be 6 digits.", e_bad_code: "Wrong or expired code. Ask for a new one.",
      e_taken: "This address is already linked to another account. Use “I already have an account” on the sign-in screen, or another address.",
      e_unknown: "No account is linked to this address.", e_rate: "Too many emails sent for now. Try again in an hour.",
      e_notauth: "Test site: only addresses of the project's team members receive emails.",
      e_net: "No connection. Try again.", e_other: "That didn't work ({m}). Try again.",
      today: "today", ago_min: "{n} min ago", ago_h: "{n} h ago", ago_d: "{n} d ago",
      android: "Android", iphone: "iPhone", ipad: "iPad", windows: "Windows computer", mac: "Mac", linux: "Linux computer", other: "Device"
    }
  };
  var LANG_NAMES = { fr: "Français", en: "English", es: "Español", pt: "Português", de: "Deutsch", it: "Italiano", mg: "Malagasy", zh: "中文", ja: "日本語", ar: "العربية", ru: "Русский" };
  var lang = (window.EWShell && window.EWShell.lang()) || "fr";
  function t(k, v) {
    var s = (S[lang] && S[lang][k]) || S.fr[k] || k;
    if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); });
    return s;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignoré */ } }
  };

  // ---------- Client Supabase partagé avec TALK (même session, chargé seulement quand on en a besoin) ----------
  var sb = null, sdkP = null;
  function client() {
    if (sb) return Promise.resolve(sb);
    if (!CFG.supabase || !CFG.supabase.url || !CFG.supabase.key) return Promise.reject(new Error("OFF"));
    if (!sdkP) sdkP = new Promise(function (ok, ko) {
      if (window.supabase && window.supabase.createClient) return ok(window.supabase);
      var s = document.createElement("script");
      s.src = CFG.supabase.sdk;
      s.async = true;
      s.onload = function () { window.supabase && window.supabase.createClient ? ok(window.supabase) : ko(new Error("SDK")); };
      s.onerror = function () { sdkP = null; ko(new Error("NETWORK")); };
      document.head.appendChild(s);
    });
    return sdkP.then(function (lib) {
      if (!sb) sb = lib.createClient(CFG.supabase.url, CFG.supabase.key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "lc_net_auth" }
      });
      return sb;
    });
  }

  function errText(e) {
    var m = String((e && (e.message || e.msg || e.error_description)) || e || "");
    var code = String((e && (e.code || e.error_code)) || "");
    var st = e && e.status;
    if (/not authorized/i.test(m)) return t("e_notauth");
    if (st === 429 || /rate limit|too many/i.test(m) || /over_email_send_rate_limit|over_request_rate_limit/.test(code)) return t("e_rate");
    if (/email_exists|already been registered|already registered|already exists/i.test(code + " " + m)) return t("e_taken");
    if (/otp_disabled|signups not allowed|user not found/i.test(code + " " + m)) return t("e_unknown");
    if (/otp_expired|expired|invalid/i.test(code + " " + m)) return t("e_bad_code");
    if (/failed to fetch|network|NETWORK/i.test(m)) return t("e_net");
    return t("e_other", { m: m.slice(0, 80) || code || "?" });
  }
  function maskEmail(e) {
    var p = String(e || "").split("@");
    if (p.length !== 2) return e;
    return p[0].slice(0, 2) + "•••@" + p[1];
  }
  function deviceName(ua) {
    ua = String(ua || "");
    var os = /iPhone/.test(ua) ? t("iphone") : /iPad/.test(ua) ? t("ipad") : /Android/.test(ua) ? t("android") : /Windows/.test(ua) ? t("windows")
      : /Macintosh|Mac OS X/.test(ua) ? t("mac") : /Linux/.test(ua) ? t("linux") : t("other");
    var br = /SamsungBrowser/.test(ua) ? "Samsung Internet" : /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox"
      : /CriOS|Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "";
    return os + (br ? " · " + br : "");
  }
  function ago(d) {
    var ms = Date.now() - new Date(d).getTime();
    if (!(ms >= 0)) return t("today");
    var min = Math.round(ms / 60000);
    if (min < 60) return t("ago_min", { n: Math.max(1, min) });
    var h = Math.round(min / 60);
    if (h < 24) return t("ago_h", { n: h });
    return t("ago_d", { n: Math.round(h / 24) });
  }
  function msg(box, text, kind) { box.innerHTML = text ? '<p class="cx-msg ' + (kind || "err") + '" role="' + (kind === "ok" ? "status" : "alert") + '">' + esc(text) + "</p>" : ""; }

  // ---------- Formulaire en deux temps : e-mail, puis code à 6 chiffres ----------
  // mode "link" : relier l'e-mail au compte actuel ; mode "login" : se connecter à un compte existant.
  function emailForm(box, mode, done, cancel) {
    box.innerHTML =
      '<div class="cx-form">' +
      '<p class="muted">' + esc(mode === "link" ? t("email_link_txt") : t("login_txt")) + "</p>" +
      '<label class="cx-lbl" for="cxEmail">' + esc(t("email_lbl")) + "</label>" +
      '<input class="cx-input" id="cxEmail" type="email" inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false" placeholder="' + esc(t("email_ph")) + '">' +
      '<div class="cx-actions"><button type="button" class="btn primary" id="cxSend">' + esc(t("send")) + '</button>' +
      '<button type="button" class="btn" id="cxCancel">' + esc(t("cancel")) + "</button></div>" +
      '<div id="cxStep2"></div><div id="cxMsg" aria-live="polite"></div></div>';
    var email = box.querySelector("#cxEmail"), m = box.querySelector("#cxMsg"), send = box.querySelector("#cxSend");
    box.querySelector("#cxCancel").addEventListener("click", cancel);
    email.focus();
    send.addEventListener("click", function () {
      var e = email.value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return msg(m, t("e_email"));
      send.disabled = true;
      msg(m, "");
      client().then(function (c) {
        return mode === "link" ? c.auth.updateUser({ email: e }) : c.auth.signInWithOtp({ email: e, options: { shouldCreateUser: false } });
      }).then(function (r) {
        send.disabled = false;
        if (r && r.error) return msg(m, errText(r.error));
        msg(m, t("code_sent", { e: e }), "ok");
        codeStep(box.querySelector("#cxStep2"), m, mode, e, done);
      }, function (err) { send.disabled = false; msg(m, errText(err)); });
    });
  }
  function codeStep(step, m, mode, email, done) {
    step.innerHTML =
      '<label class="cx-lbl" for="cxCode">' + esc(t("code_lbl")) + "</label>" +
      '<input class="cx-input cx-code" id="cxCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]*">' +
      '<div class="cx-actions"><button type="button" class="btn primary" id="cxVerify">' + esc(t("verify")) + "</button></div>";
    var code = step.querySelector("#cxCode"), ver = step.querySelector("#cxVerify");
    code.focus();
    code.addEventListener("input", function () { code.value = code.value.replace(/\D/g, "").slice(0, 6); });
    ver.addEventListener("click", function () {
      var k = code.value.trim();
      if (!/^\d{6}$/.test(k)) return msg(m, t("e_code"));
      ver.disabled = true;
      client().then(function (c) {
        return c.auth.verifyOtp({ email: email, token: k, type: mode === "link" ? "email_change" : "email" });
      }).then(function (r) {
        ver.disabled = false;
        if (r && r.error) return msg(m, errText(r.error));
        store.set("lc_net_joined", "1"); // TALK se reconnecte tout seul à ce compte
        done(email);
      }, function (err) { ver.disabled = false; msg(m, errText(err)); });
    });
  }

  // ---------- Mes appareils ----------
  function devices(box, flash) {
    box.innerHTML = '<h2 class="cx-h">' + esc(t("dev_title")) + '</h2><div class="spinner" aria-hidden="true"></div>';
    client().then(function (c) { return c.rpc("mes_appareils"); }).then(function (r) {
      if (r.error) throw r.error;
      var list = r.data || [];
      var others = list.filter(function (d) { return !d.actuel; });
      var html = '<h2 class="cx-h">' + esc(t("dev_title")) + "</h2>" + (flash ? '<p class="cx-msg ok" role="status">' + esc(flash) + "</p>" : "") + '<ul class="cx-devs">';
      list.forEach(function (d) {
        html += '<li class="cx-dev"><span><b>' + esc(deviceName(d.appareil)) + "</b><small>" +
          esc(d.actuel ? t("dev_this") : t("dev_seen", { d: ago(d.vu) })) + "</small></span>" +
          (d.actuel ? '<span class="badge">' + esc(t("dev_this")) + "</span>" : '<button type="button" class="link-btn" data-out="' + esc(d.id) + '">' + esc(t("dev_out")) + "</button>") + "</li>";
      });
      html += "</ul>" + (others.length ? '<button type="button" class="btn wide" id="cxOutAll">' + esc(t("dev_out_all")) + "</button>" : '<p class="muted">' + esc(t("dev_none")) + "</p>") +
        '<div id="cxDevMsg" aria-live="polite"></div>';
      box.innerHTML = html;
      var dm = box.querySelector("#cxDevMsg");
      // Deux appuis pour déconnecter (pas de fenêtre de confirmation du navigateur).
      box.querySelectorAll("[data-out]").forEach(function (b) {
        b.addEventListener("click", function () {
          if (!b.classList.contains("sure")) { b.classList.add("sure"); b.textContent = t("dev_out_sure"); return; }
          b.disabled = true;
          client().then(function (c) { return c.rpc("deconnecter_appareil", { sid: b.getAttribute("data-out") }); }).then(function (x) {
            if (x.error) { b.disabled = false; return msg(dm, errText(x.error)); }
            devices(box, t("dev_out_done"));
          }, function (err) { b.disabled = false; msg(dm, errText(err)); });
        });
      });
      var all = box.querySelector("#cxOutAll");
      if (all) all.addEventListener("click", function () {
        if (!all.classList.contains("sure")) { all.classList.add("sure"); all.textContent = t("dev_out_sure"); return; }
        all.disabled = true;
        client().then(function (c) { return c.auth.signOut({ scope: "others" }); }).then(function (x) {
          if (x && x.error) { all.disabled = false; return msg(dm, errText(x.error)); }
          devices(box, t("dev_all_done"));
        }, function (err) { all.disabled = false; msg(dm, errText(err)); });
      });
    }).catch(function () { box.innerHTML = '<h2 class="cx-h">' + esc(t("dev_title")) + '</h2><p class="muted">' + esc(t("dev_err")) + "</p>"; });
  }

  // ---------- Écran Profil ----------
  // opts.openTalk(view) : ouvre TALK. opts.login : ouvrir directement « J'ai déjà un compte ».
  function render(card, opts) {
    opts = opts || {};
    if (!CFG.supabase) { card.innerHTML = '<div class="state"><p>' + esc(t("off")) + "</p></div>"; return; }
    // Aucune session enregistrée sur cet appareil : pas besoin du serveur pour afficher l'invitation (marche aussi hors ligne).
    if (!store.get("lc_net_auth")) return noProfile(card, opts);
    card.innerHTML = '<div class="state"><div class="spinner" aria-hidden="true"></div><p>' + esc(t("loading")) + "</p></div>";
    var c, user = null, prof = null;
    client().then(function (x) { c = x; return c.auth.getSession(); }).then(function (r) {
      if (r.error) throw r.error;
      user = r.data && r.data.session ? r.data.session.user : null;
      if (!user) return null;
      return c.from("profiles").select("id,pseudo,lang").eq("id", user.id).maybeSingle().then(function (p) {
        if (p.error) throw p.error;
        return p.data;
      });
    }).then(function (p) {
      prof = p || null;
      if (!prof) return noProfile(card, opts);
      showProfile(card, user, prof, opts);
    }).catch(function () {
      card.innerHTML = '<div class="state" role="alert"><p>' + esc(t("error")) + '</p><button type="button" class="btn primary" id="cxRetry">' + esc(t("retry")) + "</button></div>";
      card.querySelector("#cxRetry").addEventListener("click", function () { render(card, opts); });
    });
  }
  function noProfile(card, opts) {
    card.innerHTML = '<div class="state"><p><b>' + esc(t("none")) + '</b></p><p class="muted">' + esc(t("none_txt")) + "</p>" +
      '<button type="button" class="btn primary wide" id="cxCreate">' + esc(t("create")) + "</button>" +
      '<button type="button" class="btn wide" id="cxHave">' + esc(t("have")) + '</button></div><div id="cxBox"></div>';
    card.querySelector("#cxCreate").addEventListener("click", function () { opts.openTalk && opts.openTalk("net"); });
    var box = card.querySelector("#cxBox");
    function openLogin() {
      emailForm(box, "login", function () { render(card, { openTalk: opts.openTalk, flash: "login" }); }, function () { box.innerHTML = ""; });
    }
    card.querySelector("#cxHave").addEventListener("click", openLogin);
    if (opts.login) openLogin();
  }
  function showProfile(card, user, prof, opts) {
    var l = LANG_NAMES[prof.lang] || String(prof.lang || "").toUpperCase();
    var email = user.email || "", pending = user.new_email || "";
    var secured = !!email && user.is_anonymous !== true;
    var html = (opts.flash === "login" ? '<p class="cx-msg ok" role="status">' + esc(t("login_ok", { p: prof.pseudo })) + "</p>" : "") +
      (opts.flash === "linked" ? '<p class="cx-msg ok" role="status">' + esc(t("linked_ok", { e: maskEmail(email || pending) })) + "</p>" : "") +
      '<div class="profile-head"><span class="avatar" aria-hidden="true">' + esc(prof.pseudo.charAt(0).toUpperCase()) + "</span>" +
      '<span><b dir="ltr">@' + esc(prof.pseudo) + '</b><span class="muted">' + esc(t("lang", { l: l })) + "</span></span></div>" +
      '<button type="button" class="btn primary wide" id="cxChats">' + esc(t("chats")) + "</button>" +
      '<section class="cx-sec"><h2 class="cx-h">' + esc(t("sec_title")) + "</h2>";
    if (secured) html += '<p class="cx-ok">✅ ' + esc(t("sec_yes", { e: maskEmail(email) })) + '</p><p class="muted">' + esc(t("sync")) + "</p>";
    else {
      html += '<p class="cx-warn">' + esc(t("sec_no")) + "</p>" + (pending ? '<p class="muted">' + esc(t("sec_pending", { e: maskEmail(pending) })) + "</p>" : "") +
        '<button type="button" class="btn primary wide" id="cxSecure">' + esc(t("sec_btn")) + '</button><div id="cxBox"></div>' +
        '<p class="muted">' + esc(t("sync")) + "</p>";
    }
    html += '</section><section class="cx-sec" id="cxDevices"></section>' +
      '<p class="cx-other"><button type="button" class="link-btn" id="cxOther">' + esc(t("other_account")) + '</button></p><div id="cxOtherBox"></div>';
    card.innerHTML = html;
    card.querySelector("#cxChats").addEventListener("click", function () { opts.openTalk && opts.openTalk("net"); });
    var sec = card.querySelector("#cxSecure");
    if (sec) sec.addEventListener("click", function () {
      sec.hidden = true;
      emailForm(card.querySelector("#cxBox"), "link", function () { render(card, { openTalk: opts.openTalk, flash: "linked" }); },
        function () { card.querySelector("#cxBox").innerHTML = ""; sec.hidden = false; });
    });
    devices(card.querySelector("#cxDevices"));
    // Autre compte : prévenir si le compte actuel n'est relié à aucun e-mail (il serait perdu).
    var other = card.querySelector("#cxOther"), ob = card.querySelector("#cxOtherBox");
    other.addEventListener("click", function () {
      other.hidden = true;
      var go = function () {
        emailForm(ob, "login", function () { render(card, { openTalk: opts.openTalk, flash: "login" }); }, function () { ob.innerHTML = ""; other.hidden = false; });
      };
      if (secured) return go();
      ob.innerHTML = '<p class="cx-warn" role="alert">' + esc(t("replace_warn", { p: prof.pseudo })) + '</p><div class="cx-actions">' +
        '<button type="button" class="btn" id="cxReplaceOk">' + esc(t("replace_ok")) + '</button><button type="button" class="btn primary" id="cxReplaceNo">' + esc(t("cancel")) + "</button></div>";
      ob.querySelector("#cxReplaceOk").addEventListener("click", go);
      ob.querySelector("#cxReplaceNo").addEventListener("click", function () { ob.innerHTML = ""; other.hidden = false; });
    });
  }

  window.EWConnect = { render: render, deviceName: deviceName, errText: errText };
})();
