/* Faux client Supabase, UNIQUEMENT pour les tests automatiques (jamais chargé par le site).
   Aucun accès réseau. Par défaut : compte déjà inscrit (@sebtest, français), anonyme, un seul appareil.
   CONNECT : l'état (e-mail, appareils) est gardé dans localStorage « fake_sb » ; le bon code est 123456,
   et seul connu@exemple.fr est un compte existant. */
(function () {
  var PROFILE = { id: "00000000-0000-4000-8000-0000000000aa", pseudo: "sebtest", lang: "fr" };
  var UA_PC = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";
  function load() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem("fake_sb") || "null"); } catch (e) { s = null; }
    return s || { session: true, email: "", new_email: "", anon: true, pending: "",
      devices: [{ id: "11111111-1111-4111-8111-111111111111", appareil: navigator.userAgent, depuis: new Date().toISOString(), vu: new Date().toISOString(), actuel: true },
        { id: "22222222-2222-4222-8222-222222222222", appareil: UA_PC, depuis: new Date(Date.now() - 864e5).toISOString(), vu: new Date(Date.now() - 3 * 36e5).toISOString(), actuel: false }] };
  }
  function save(s) { try { localStorage.setItem("fake_sb", JSON.stringify(s)); localStorage.setItem("lc_net_auth", s.session ? "fake" : ""); } catch (e) {} }
  function user(s) { return { id: PROFILE.id, email: s.email, new_email: s.new_email, is_anonymous: s.anon }; }
  function err(message, code, status) { return { data: null, error: { message: message, code: code, status: status || 400 } }; }
  function builder(table) {
    var single = false;
    var b = {
      then: function (ok, ko) {
        var data = table === "profiles" && single ? (load().session ? PROFILE : null) : [];
        return Promise.resolve({ data: data, error: null }).then(ok, ko);
      },
      maybeSingle: function () { single = true; return b; },
      single: function () { single = true; return b; }
    };
    ["select", "eq", "neq", "in", "or", "order", "limit", "gt", "lt", "gte", "lte", "is", "insert", "update", "upsert", "delete", "match", "range", "not", "filter"]
      .forEach(function (m) { b[m] = function () { return b; }; });
    return b;
  }
  function channel() {
    var c = {
      on: function () { return c; },
      subscribe: function (cb) { setTimeout(function () { cb && cb("SUBSCRIBED"); }, 10); return c; },
      send: function () { return Promise.resolve("ok"); },
      track: function () { return Promise.resolve("ok"); },
      untrack: function () { return Promise.resolve("ok"); },
      presenceState: function () { return {}; },
      unsubscribe: function () { return Promise.resolve("ok"); }
    };
    return c;
  }
  var R = function (v) { return Promise.resolve(v); };
  window.supabase = {
    createClient: function () {
      return {
        auth: {
          getSession: function () { var s = load(); return R({ data: { session: s.session ? { user: user(s), access_token: "x" } : null }, error: null }); },
          getUser: function () { var s = load(); return R({ data: { user: s.session ? user(s) : null }, error: null }); },
          signInAnonymously: function () { var s = load(); s.session = true; save(s); return R({ data: { user: user(s) }, error: null }); },
          onAuthStateChange: function () { return { data: { subscription: { unsubscribe: function () {} } } }; },
          updateUser: function (a, o) {
            var s = load();
            try { localStorage.setItem("fake_redirect", (o && o.emailRedirectTo) || ""); } catch (e) {}
            if (a.email === "pris@exemple.fr") return R(err("A user with this email address has already been registered", "email_exists", 422));
            s.new_email = a.email; save(s); return R({ data: { user: user(s) }, error: null });
          },
          signInWithOtp: function (a) {
            try { localStorage.setItem("fake_redirect", (a.options && a.options.emailRedirectTo) || ""); } catch (e) {}
            if (a.email !== "connu@exemple.fr") return R(err("Signups not allowed for otp", "otp_disabled", 422));
            var s = load(); s.pending = a.email; save(s); return R({ data: {}, error: null });
          },
          verifyOtp: function (a) {
            if (a.token !== "123456") return R(err("Token has expired or is invalid", "otp_expired", 403));
            var s = load();
            if (a.type === "email_change") { s.email = s.new_email; s.new_email = ""; s.anon = false; }
            else { s.session = true; s.email = a.email; s.anon = false; }
            save(s); return R({ data: { user: user(s), session: {} }, error: null });
          },
          setSession: function (t) {
            if (!t.access_token || !t.refresh_token) return R(err("Auth session missing!", "session_missing", 400));
            var s = load(); s.session = true; s.anon = false; s.email = s.email || "connu@exemple.fr"; save(s); return R({ data: { session: {}, user: user(s) }, error: null });
          },
          signOut: function (o) {
            var s = load();
            if (o && o.scope === "others") s.devices = s.devices.filter(function (d) { return d.actuel; }); else s.session = false;
            save(s); return R({ error: null });
          }
        },
        from: builder,
        rpc: function (name, args) {
          var s = load();
          if (name === "mes_appareils") return R({ data: s.devices, error: null });
          if (name === "deconnecter_appareil") { s.devices = s.devices.filter(function (d) { return d.id !== args.sid; }); save(s); return R({ data: true, error: null }); }
          return R({ data: null, error: null });
        },
        channel: channel,
        removeChannel: function () { return Promise.resolve("ok"); },
        realtime: { setAuth: function () {} },
        functions: { invoke: function () { return Promise.resolve({ data: null, error: { message: "test" } }); } }
      };
    }
  };
})();
