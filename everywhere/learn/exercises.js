/* 24/24 LEARN — moteur d'exercices interactifs. © 2026 Sébastien Chevrier. Tous droits réservés.
   Types : choice (choix de la bonne réponse, aussi « comprendre une expression »), match (associer mot ↔ traduction),
   complete (compléter une phrase), listen (écoute). Un nouveau type = une fonction de plus dans TYPES.
   Voix : synthèse vocale intégrée au navigateur (gratuite, sur l'appareil, rien n'est envoyé). */
(function () {
  "use strict";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }

  // ---------- Voix (synthèse vocale du navigateur) ----------
  var canSpeak = typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined";
  function pickVoice(lang) {
    if (!canSpeak) return null;
    var vs = [];
    try { vs = window.speechSynthesis.getVoices() || []; } catch (e) { vs = []; }
    var base = lang.slice(0, 2).toLowerCase();
    return vs.filter(function (v) { return (v.lang || "").toLowerCase().replace("_", "-") === lang.toLowerCase(); })[0] ||
      vs.filter(function (v) { return (v.lang || "").toLowerCase().indexOf(base) === 0; })[0] || null;
  }
  function speak(text, lang, slow) {
    if (!canSpeak || !text) return false;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text.replace(/…/g, ""));
      u.lang = lang;
      var v = pickVoice(lang);
      if (v) u.voice = v;
      u.rate = slow ? 0.65 : 0.95;
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }
  if (canSpeak) { try { window.speechSynthesis.getVoices(); } catch (e) { /* les voix arrivent plus tard sur Android */ } }

  var SPK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
  function speakBtn(text, label, cls) {
    return '<button type="button" class="lx-say' + (cls ? " " + cls : "") + '" data-say="' + esc(text) + '" aria-label="' + esc(label) + '">' + SPK + "</button>";
  }

  // ---------- Exercices ----------
  // ctx : { lang (voix, ex. en-GB), T (textes), done(result) } ; result = { ok, picked, answer, mistakes:[{w,t}], rights:[w] }
  function head(ex, T) {
    return '<h2 class="lx-q" tabindex="-1">' + esc(ex.prompt || T.choose) + "</h2>";
  }
  function optionsHtml(opts) {
    return '<div class="lx-opts">' + opts.map(function (o, i) {
      return '<button type="button" class="lx-opt" data-i="' + i + '"><span>' + esc(o) + '</span><span class="lx-mark" aria-hidden="true"></span></button>';
    }).join("") + "</div>";
  }
  function wireChoice(root, ex, opts, ctx, extraKey) {
    root.querySelector(".lx-opts").addEventListener("click", function (e) {
      var b = e.target.closest(".lx-opt");
      if (!b || b.disabled) return;
      var picked = opts[+b.getAttribute("data-i")];
      var ok = picked === ex.answer;
      root.querySelectorAll(".lx-opt").forEach(function (x) {
        x.disabled = true;
        var v = opts[+x.getAttribute("data-i")];
        if (v === ex.answer) { x.classList.add("good"); x.querySelector(".lx-mark").textContent = "✓"; x.setAttribute("aria-label", v + ", " + ctx.T.right_answer); }
        else if (x === b) { x.classList.add("bad"); x.querySelector(".lx-mark").textContent = "✗"; x.setAttribute("aria-label", v + ", " + ctx.T.your_answer); }
      });
      ctx.done({ ok: ok, picked: picked, answer: ex.answer, key: extraKey || ex.answer });
    });
  }
  var TYPES = {
    choice: function (root, ex, ctx) {
      var opts = shuffle(ex.options);
      var big = ex.expr ? '<div class="lx-expr"><span lang="' + esc(ctx.lang) + '">' + esc(ex.expr) + "</span>" + speakBtn(ex.expr, ctx.T.listen, "") + "</div>"
        : ex.say ? '<div class="lx-expr small"><span lang="' + esc(ctx.lang) + '">' + esc(ex.say) + "</span>" + speakBtn(ex.say, ctx.T.listen, "") + "</div>" : "";
      root.innerHTML = (ex.kind === "expression" ? '<p class="lx-kind">' + esc(ctx.T.k_expr) + "</p>" : "") + head(ex, ctx.T) + big + optionsHtml(opts);
      wireChoice(root, ex, opts, ctx, ex.expr || ex.say);
    },
    complete: function (root, ex, ctx) {
      var opts = shuffle(ex.options);
      var parts = String(ex.sentence).split("___");
      root.innerHTML = '<p class="lx-kind">' + esc(ctx.T.k_complete) + "</p>" + head(ex, ctx.T) +
        '<p class="lx-sentence" lang="' + esc(ctx.lang) + '">' + esc(parts[0]) + '<span class="lx-blank" aria-label="' + esc(ctx.T.blank) + '">＿＿＿</span>' + esc(parts[1] || "") + "</p>" +
        (ex.hint ? '<p class="lx-hint">' + esc(ex.hint) + "</p>" : "") + optionsHtml(opts);
      wireChoice(root, ex, opts, ctx, ex.answer);
      root.querySelector(".lx-opts").addEventListener("click", function (e) {
        if (!e.target.closest(".lx-opt")) return;
        var bl = root.querySelector(".lx-blank");
        if (bl) { bl.textContent = ex.answer; bl.classList.add("filled"); bl.removeAttribute("aria-label"); }
      });
    },
    listen: function (root, ex, ctx) {
      var opts = shuffle(ex.options);
      var fallback = !canSpeak;
      root.innerHTML = '<p class="lx-kind">' + esc(ctx.T.k_listen) + "</p>" + head(ex, ctx.T) +
        '<div class="lx-listen">' + speakBtn(ex.say, ctx.T.listen, "big") + speakBtn(ex.say, ctx.T.listen_slow, "slow") + "</div>" +
        '<p class="lx-hint" id="lxNoVoice"' + (fallback ? "" : " hidden") + ">" + esc(ctx.T.no_voice) + ' <b lang="' + esc(ctx.lang) + '">' + esc(ex.say) + "</b></p>" +
        optionsHtml(opts);
      wireChoice(root, ex, opts, ctx, ex.say);
      if (!fallback) setTimeout(function () { speak(ex.say, ctx.lang); }, 350);
    },
    match: function (root, ex, ctx) {
      var left = shuffle(ex.pairs.map(function (p, i) { return { i: i, v: p[0] }; }));
      var right = shuffle(ex.pairs.map(function (p, i) { return { i: i, v: p[1] }; }));
      var col = function (arr, side) {
        return '<div class="lx-col" role="group" aria-label="' + esc(side === "l" ? ctx.T.col_word : ctx.T.col_tr) + '">' + arr.map(function (x) {
          return '<button type="button" class="lx-opt lx-m" data-side="' + side + '" data-i="' + x.i + '" aria-pressed="false"' + (side === "l" ? ' lang="' + esc(ctx.lang) + '"' : "") + ">" + esc(x.v) + "</button>";
        }).join("") + "</div>";
      };
      root.innerHTML = '<p class="lx-kind">' + esc(ctx.T.k_match) + "</p>" + head(ex, ctx.T) + '<p class="lx-hint">' + esc(ctx.T.match_how) + "</p>" +
        '<div class="lx-match">' + col(left, "l") + col(right, "r") + "</div>" + '<p class="sr" role="status" id="lxMatchSr"></p>';
      var sel = null, found = 0, errs = 0, mistakes = [];
      root.querySelector(".lx-match").addEventListener("click", function (e) {
        var b = e.target.closest(".lx-m");
        if (!b || b.disabled) return;
        if (!sel || sel.getAttribute("data-side") === b.getAttribute("data-side")) {
          if (sel) sel.setAttribute("aria-pressed", "false");
          sel = b; b.setAttribute("aria-pressed", "true");
          if (b.getAttribute("data-side") === "l") speak(b.textContent, ctx.lang);
          return;
        }
        var a = sel; sel = null;
        a.setAttribute("aria-pressed", "false");
        var sr = root.querySelector("#lxMatchSr");
        if (a.getAttribute("data-i") === b.getAttribute("data-i")) {
          [a, b].forEach(function (x) { x.disabled = true; x.classList.add("good"); });
          found += 1;
          sr.textContent = ctx.T.pair_ok;
          if (found === ex.pairs.length) ctx.done({ ok: errs === 0, mistakes: mistakes, pairs: true });
        } else {
          errs += 1;
          var l = a.getAttribute("data-side") === "l" ? a : b;
          var p = ex.pairs[+l.getAttribute("data-i")];
          mistakes.push({ w: p[0], t: p[1] });
          [a, b].forEach(function (x) { x.classList.add("shake"); setTimeout(function () { x.classList.remove("shake"); }, 450); });
          sr.textContent = ctx.T.pair_bad;
        }
      });
    }
  };

  // Clic sur un bouton haut-parleur, où qu'il soit (leçon, exercice).
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-say]") : null;
    if (!b) return;
    var lang = b.closest("[data-voice]");
    var ok = speak(b.getAttribute("data-say"), lang ? lang.getAttribute("data-voice") : "en-GB", b.classList.contains("slow"));
    if (!ok) { var nv = document.getElementById("lxNoVoice"); if (nv) nv.hidden = false; }
  });

  window.EWExercises = {
    render: function (root, ex, ctx) { (TYPES[ex.type] || TYPES.choice)(root, ex, ctx); var q = root.querySelector(".lx-q"); if (q) q.focus({ preventScroll: false }); },
    types: Object.keys(TYPES), speak: speak, canSpeak: canSpeak, speakBtn: speakBtn, shuffle: shuffle, esc: esc
  };
})();
