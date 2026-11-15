/* 24/24 ONE WORLD — application Android : voix du téléphone pour le site.
   La WebView Android n'a ni reconnaissance vocale ni lecture à voix haute qui marchent.
   Ce script, injecté AVANT les scripts du site, remplace SpeechRecognition et speechSynthesis
   par les moteurs natifs du téléphone (plugins Capacitor), sans changer le site. */
(function () {
  if (window.__owNative) return;
  window.__owNative = true;
  function P(name) { var C = window.Capacitor; return C && C.Plugins ? C.Plugins[name] : null; }
  var sleepTimer = null;
  function awake() {
    var K = P("KeepAwake"); if (!K) return;
    try { K.keepAwake(); } catch (e) {}
    clearTimeout(sleepTimer);
    sleepTimer = setTimeout(function () { try { K.allowSleep(); } catch (e) {} }, 120000);
  }
  function Rec() {
    this.lang = "fr-FR"; this.interimResults = false; this.continuous = false; this.maxAlternatives = 1;
    this.onresult = this.onerror = this.onend = this.onstart = null;
    this.onsoundstart = this.onspeechstart = this.onsoundend = this.onspeechend = this.onaudiostart = this.onaudioend = null;
    this._ls = {}; this._live = false;
  }
  Rec.prototype.addEventListener = function (t, f) { (this._ls[t] = this._ls[t] || []).push(f); };
  Rec.prototype.removeEventListener = function (t, f) { this._ls[t] = (this._ls[t] || []).filter(function (x) { return x !== f; }); };
  Rec.prototype._fire = function (t, ev) {
    ev = ev || {}; ev.type = t;
    try { if (typeof this["on" + t] === "function") this["on" + t](ev); } catch (e) { setTimeout(function () { throw e; }); }
    (this._ls[t] || []).forEach(function (f) { try { f(ev); } catch (e) {} });
  };
  Rec.prototype.start = function () {
    var self = this, SR = P("SpeechRecognition");
    if (!SR) { setTimeout(function () { self._fire("error", { error: "not-allowed" }); self._fire("end"); }); return; }
    self._live = true; awake();
    SR.requestPermissions().then(function (p) {
      if (p && p.speechRecognition && p.speechRecognition !== "granted") throw { error: "not-allowed" };
      self._fire("start"); self._fire("audiostart"); self._fire("soundstart"); self._fire("speechstart");
      return SR.start({ language: self.lang, maxResults: 1, partialResults: false, popup: false });
    }).then(function (r) {
      var txt = r && r.matches && r.matches[0];
      if (!self._live) return;
      self._live = false;
      self._fire("speechend"); self._fire("soundend");
      if (txt) {
        var alt = [{ transcript: txt, confidence: 0.9 }]; alt.isFinal = true;
        self._fire("result", { resultIndex: 0, results: [alt] });
      } else self._fire("error", { error: "no-speech" });
      self._fire("end");
    }, function (e) {
      if (!self._live) return;
      self._live = false;
      var m = String((e && (e.error || e.message)) || "");
      self._fire("error", { error: /not-allowed|permission|denied/i.test(m) ? "not-allowed" : /network/i.test(m) ? "network" : "no-speech" });
      self._fire("end");
    });
  };
  Rec.prototype.stop = Rec.prototype.abort = function () {
    var SR = P("SpeechRecognition");
    if (this._live) { this._live = false; try { SR && SR.stop(); } catch (e) {} var s = this; setTimeout(function () { s._fire("end"); }); }
  };
  window.SpeechRecognition = window.webkitSpeechRecognition = Rec;

  function Utt(t) { this.text = t || ""; this.lang = ""; this.rate = 1; this.pitch = 1; this.volume = 1; this.voice = null; this.onend = this.onerror = this.onstart = null; }
  var synth = {
    speaking: false, pending: false, paused: false,
    getVoices: function () { return []; },
    speak: function (u) {
      var T = P("TextToSpeech");
      if (!T) { setTimeout(function () { u.onerror && u.onerror({ error: "synthesis-unavailable" }); }); return; }
      synth.speaking = true; awake();
      try { u.onstart && u.onstart({}); } catch (e) {}
      T.speak({ text: String(u.text || ""), lang: u.lang || "fr-FR", rate: u.rate || 1, pitch: u.pitch || 1, volume: typeof u.volume === "number" ? u.volume : 1, category: "playback" })
        .then(function () { synth.speaking = false; u.onend && u.onend({}); }, function (e) { synth.speaking = false; u.onerror && u.onerror({ error: String(e && e.message || e) }); });
    },
    cancel: function () { var T = P("TextToSpeech"); synth.speaking = false; try { T && T.stop(); } catch (e) {} },
    pause: function () {}, resume: function () {},
    addEventListener: function () {}, removeEventListener: function () {}, onvoiceschanged: null
  };
  try { Object.defineProperty(window, "speechSynthesis", { configurable: true, get: function () { return synth; } }); } catch (e) { window.speechSynthesis = synth; }
  window.SpeechSynthesisUtterance = Utt;

  // Lampe (flash) pendant le scan d'un document : quand le site ouvre la caméra arrière et que le téléphone a un flash,
  // un bouton 🔦 apparaît en bas à droite ; il disparaît quand la caméra se ferme.
  function torchButton(track) {
    var old = document.getElementById("owTorch"); if (old) old.remove();
    var on = false, b = document.createElement("button");
    b.id = "owTorch"; b.type = "button"; b.textContent = "🔦"; b.setAttribute("aria-label", "Lampe");
    b.style.cssText = "position:fixed;right:16px;bottom:96px;z-index:2147483647;width:56px;height:56px;border-radius:50%;border:2px solid #fff;background:rgba(0,0,0,.6);color:#fff;font-size:26px";
    b.addEventListener("click", function () {
      on = !on;
      track.applyConstraints({ advanced: [{ torch: on }] }).then(function () { b.style.background = on ? "#f5c400" : "rgba(0,0,0,.6)"; b.dataset.on = on ? "1" : "0"; }, function () { on = !on; });
    });
    (document.body || document.documentElement).appendChild(b);
    var gone = function () { b.remove(); };
    track.addEventListener("ended", gone);
    var st = track.stop.bind(track); track.stop = function () { gone(); st(); };
  }
  function hookCam() {
    var md = navigator.mediaDevices; if (!md || !md.getUserMedia || md.__owHook) return;
    md.__owHook = true;
    var orig = md.getUserMedia.bind(md);
    md.getUserMedia = function (c) {
      return orig(c).then(function (stream) {
        try {
          var t = stream.getVideoTracks()[0], cap = t && t.getCapabilities ? t.getCapabilities() : {};
          if (t && cap.torch) torchButton(t);
        } catch (e) {}
        return stream;
      });
    };
  }
  hookCam();
  document.addEventListener("DOMContentLoaded", hookCam);
})();
