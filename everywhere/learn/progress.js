/* 24/24 LEARN — progression d'apprentissage. © 2026 Sébastien Chevrier. Tous droits réservés.
   Enregistrée SUR CET APPAREIL (clé ew_learn_v1). Rien n'est envoyé au serveur pour l'instant.
   Toute modification passe par ce fichier et prévient les abonnés (onChange) : la future synchronisation avec
   le compte 24/24 (même compte que TALK) n'aura qu'à s'y brancher, sans toucher aux écrans. */
(function () {
  "use strict";
  var KEY = "ew_learn_v1";
  var HIST_MAX = 50;
  var subs = [];
  var mem = null; // copie en mémoire (utile si le stockage est indisponible)

  function blank() {
    return { v: 1, lang: null, level: "debutant", goal: 30, xp: 0, lessons: {}, ex: { done: 0, ok: 0 }, days: {}, hist: [], miss: {} };
  }
  function load() {
    if (mem) return mem;
    var d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { d = null; }
    mem = d && d.v === 1 ? Object.assign(blank(), d) : blank();
    return mem;
  }
  function save(d) {
    mem = d;
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* stockage plein ou bloqué : reste en mémoire pour cette visite */ }
    subs.forEach(function (fn) { try { fn(d); } catch (e) { /* un abonné en erreur ne bloque pas l'enregistrement */ } });
  }
  function day(ts) {
    var x = new Date(ts || Date.now());
    return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
  }
  function addXp(d, n) {
    d.xp += n;
    var k = day();
    d.days[k] = (d.days[k] || 0) + n;
  }
  function noteMistakes(d, lang, mistakes) {
    if (!mistakes || !mistakes.length) return;
    var m = d.miss[lang] = d.miss[lang] || {};
    mistakes.forEach(function (x) {
      if (!x || !x.w) return;
      var e = m[x.w] = m[x.w] || { t: x.t || "", n: 0 };
      e.n += 1;
      if (x.t) e.t = x.t;
    });
  }
  function clearMistakes(d, lang, rights) {
    var m = d.miss[lang];
    if (!m || !rights) return;
    rights.forEach(function (w) { if (m[w]) { m[w].n -= 1; if (m[w].n <= 0) delete m[w]; } });
  }
  function pushHist(d, h) {
    d.hist.unshift(h);
    if (d.hist.length > HIST_MAX) d.hist.length = HIST_MAX;
  }

  var P = {
    get: function () { return load(); },
    setLang: function (l) { var d = load(); d.lang = l; save(d); },
    setLevel: function (l) { var d = load(); d.level = l; save(d); },
    setGoal: function (n) { var d = load(); d.goal = n; save(d); },
    // Résultat d'une leçon : score = bonnes réponses, total = nombre d'exercices.
    recordLesson: function (lang, lesson, score, total, mistakes, rights) {
      var d = load();
      var prev = d.lessons[lesson.id] || { best: 0, total: total, tries: 0 };
      var first = !prev.done;
      d.lessons[lesson.id] = { lang: lang, best: Math.max(prev.best, score), total: total, tries: prev.tries + 1, done: true, at: Date.now() };
      d.ex.done += total;
      d.ex.ok += score;
      var xp = score * 10 + (first ? 20 : 0);
      addXp(d, xp);
      noteMistakes(d, lang, mistakes);
      clearMistakes(d, lang, rights);
      pushHist(d, { at: Date.now(), kind: "lesson", lang: lang, id: lesson.id, title: lesson.title, score: score, total: total, xp: xp });
      save(d);
      return xp;
    },
    // Révision ou défi : même principe, sans marquer de leçon terminée.
    recordPractice: function (kind, lang, score, total, mistakes, rights) {
      var d = load();
      d.ex.done += total;
      d.ex.ok += score;
      var xp = score * 5;
      addXp(d, xp);
      noteMistakes(d, lang, mistakes);
      clearMistakes(d, lang, rights);
      pushHist(d, { at: Date.now(), kind: kind, lang: lang, score: score, total: total, xp: xp });
      save(d);
      return xp;
    },
    todayXp: function () { return load().days[day()] || 0; },
    // Jours consécutifs avec au moins une activité (aujourd'hui ou hier compris).
    streak: function () {
      var d = load(), n = 0, t = Date.now();
      if (!d.days[day(t)]) t -= 864e5;
      while (d.days[day(t)]) { n += 1; t -= 864e5; }
      return n;
    },
    doneIn: function (lang) {
      var d = load();
      return Object.keys(d.lessons).filter(function (id) { return d.lessons[id].lang === lang && d.lessons[id].done; });
    },
    mistakes: function (lang) { return load().miss[lang] || {}; },
    reset: function () { save(blank()); },
    onChange: function (fn) { subs.push(fn); },
    _day: day
  };
  window.EWProgress = P;
})();
