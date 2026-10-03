/* Faux client Supabase, UNIQUEMENT pour les tests automatiques (jamais chargé par le site).
   Il simule un compte déjà inscrit (@sebtest, français) sans aucun accès réseau. */
(function () {
  var PROFILE = { id: "00000000-0000-4000-8000-0000000000aa", pseudo: "sebtest", lang: "fr" };
  function builder(table) {
    var single = false;
    var b = {
      then: function (ok, ko) {
        var data = table === "profiles" && single ? PROFILE : [];
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
  window.supabase = {
    createClient: function () {
      return {
        auth: {
          getSession: function () { return Promise.resolve({ data: { session: { user: { id: PROFILE.id }, access_token: "x" } }, error: null }); },
          signInAnonymously: function () { return Promise.resolve({ data: { user: { id: PROFILE.id } }, error: null }); },
          onAuthStateChange: function () { return { data: { subscription: { unsubscribe: function () {} } } }; }
        },
        from: builder,
        rpc: function () { return Promise.resolve({ data: null, error: null }); },
        channel: channel,
        removeChannel: function () { return Promise.resolve("ok"); },
        realtime: { setAuth: function () {} },
        functions: { invoke: function () { return Promise.resolve({ data: null, error: { message: "test" } }); } }
      };
    }
  };
})();
