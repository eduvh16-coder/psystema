// ============ Psystema — nube (Supabase): inicio de sesión, carga y guardado automático ============
// Loaded BEFORE data.jsx. Defines window.PSY_CLOUD only when the app has a Supabase configuration.
(function () {
  const CFG = window.PSY_CONFIG || {};
  if (!CFG.supabaseUrl || !CFG.supabaseAnonKey || !window.supabase) return;

  const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "psystema-auth" },
  });
  const TABLE = "registros";
  const CONFIG_KEYS = ["perfil_v1", "nota_cfg_v1", "politicas_v1"];
  const LS = "psystema_";

  // ---------- sync status (shown by <SyncBadge/>) ----------
  let estado = "ok"; // ok | guardando | error | offline
  const setEstado = (e) => { estado = e; window.dispatchEvent(new CustomEvent("psy-sync", { detail: e })); };

  // ---------- AI through our own Cloudflare Worker (keeps the Anthropic key secret) ----------
  window.claude = window.claude || {};
  window.claude.complete = async function (body) {
    const { data } = await sb.auth.getSession();
    const token = data && data.session && data.session.access_token;
    if (!token) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
    if (!CFG.iaUrl) throw new Error("El asistente de IA aún no está configurado.");
    const payload = typeof body === "string" ? { messages: [{ role: "user", content: body }] } : body;
    const r = await fetch(CFG.iaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ system: payload.system || "", messages: payload.messages || [], max_tokens: payload.max_tokens || 4000 }),
    });
    let d = {};
    try { d = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error(d.error || ("El servidor de IA respondió " + r.status));
    return d.text || "";
  };

  // ---------- snapshot diff ----------
  let last = { paciente: new Map(), pago: new Map(), cita: new Map() };
  const snap = (arr) => { const m = new Map(); (arr || []).forEach((x) => { if (x && x.id) m.set(String(x.id), JSON.stringify(x)); }); return m; };
  let pendiente = null, timer = null, enVuelo = false, reintento = 0;

  async function flush() {
    if (!pendiente || enVuelo) return;
    const st = pendiente; pendiente = null; enVuelo = true;
    const { data: ses } = await sb.auth.getSession();
    const uid = ses && ses.session && ses.session.user.id;
    if (!uid) { enVuelo = false; pendiente = st; setEstado("error"); return; }
    const pares = [["paciente", st.pacientes], ["pago", st.pagos], ["cita", st.citas]];
    const nuevos = {};
    try {
      setEstado("guardando");
      for (const [tipo, arr] of pares) {
        const now = snap(arr), prev = last[tipo];
        const ups = [], dels = [];
        now.forEach((json, id) => { if (prev.get(id) !== json) ups.push({ user_id: uid, tipo, id, data: JSON.parse(json), updated_at: new Date().toISOString() }); });
        prev.forEach((_, id) => { if (!now.has(id)) dels.push(id); });
        for (let i = 0; i < ups.length; i += 200) {
          const { error } = await sb.from(TABLE).upsert(ups.slice(i, i + 200), { onConflict: "user_id,tipo,id" });
          if (error) throw error;
        }
        for (let i = 0; i < dels.length; i += 200) {
          const { error } = await sb.from(TABLE).delete().eq("tipo", tipo).in("id", dels.slice(i, i + 200));
          if (error) throw error;
        }
        nuevos[tipo] = now;
      }
      Object.assign(last, nuevos);
      reintento = 0;
      setEstado(pendiente ? "guardando" : "ok");
    } catch (e) {
      console.warn("[Psystema] sync", e);
      Object.assign(last, nuevos); // the types that did save
      if (!pendiente) pendiente = st;
      reintento = Math.min(reintento + 1, 6);
      setEstado(navigator.onLine === false ? "offline" : "error");
      clearTimeout(timer); timer = setTimeout(flush, 1500 * Math.pow(2, reintento));
    } finally {
      enVuelo = false;
      if (pendiente && estado !== "error" && estado !== "offline") { clearTimeout(timer); timer = setTimeout(flush, 400); }
    }
  }
  window.addEventListener("online", () => { if (pendiente) flush(); });
  window.addEventListener("beforeunload", (e) => { if (pendiente || enVuelo) { e.preventDefault(); e.returnValue = ""; } });

  async function cfgSet(key, value) {
    const { data: ses } = await sb.auth.getSession();
    const uid = ses && ses.session && ses.session.user.id; if (!uid) return;
    const { error } = await sb.from(TABLE).upsert({ user_id: uid, tipo: "config", id: key, data: value, updated_at: new Date().toISOString() }, { onConflict: "user_id,tipo,id" });
    if (error) console.warn("[Psystema] config", error);
  }

  async function cargarTodo() {
    const out = { paciente: [], pago: [], cita: [], config: {} };
    for (let from = 0; ; from += 1000) {
      const { data, error } = await sb.from(TABLE).select("tipo,id,data").order("tipo").order("id").range(from, from + 999);
      if (error) throw error;
      (data || []).forEach((r) => { if (r.tipo === "config") out.config[r.id] = r.data; else if (out[r.tipo]) out[r.tipo].push(r.data); });
      if (!data || data.length < 1000) break;
    }
    return out;
  }

  // apply cloud config to this device
  function aplicarConfig(cfg) {
    const ls = (k, v) => { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch (e) {} };
    if (cfg.perfil_v1) { ls("perfil_v1", cfg.perfil_v1); Object.assign(window.THERAPIST, window.PERFIL_DEFAULT, cfg.perfil_v1); }
    if (cfg.nota_cfg_v1) { ls("nota_cfg_v1", cfg.nota_cfg_v1); __origNota(cfg.nota_cfg_v1); }
    if (cfg.politicas_v1) { ls("politicas_v1", cfg.politicas_v1); __origPol(cfg.politicas_v1); }
  }
  let __origNota = () => {}, __origPol = () => {};
  function envolverConfig() {
    // settings saved on any device follow you to the others
    __origNota = window.setNotaCfg; __origPol = window.setPoliticas;
    window.setNotaCfg = (c) => { __origNota(c); cfgSet("nota_cfg_v1", window.NOTA_CFG); };
    window.setPoliticas = (p) => { __origPol(p); cfgSet("politicas_v1", window.POLITICAS); };
    const origLs = window.lsSet;
    window.lsSet = (k, v) => { const r = origLs(k, v); if (CONFIG_KEYS.includes(k) && k === "perfil_v1") cfgSet(k, v); return r; };
  }

  // ---------- PIN (screen lock on this device) ----------
  async function hashPin(pin, salt) {
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(String(pin)), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 150000, hash: "SHA-256" }, base, 256);
    return btoa(String.fromCharCode(...new Uint8Array(bits)));
  }
  const pinMeta = () => { try { return JSON.parse(localStorage.getItem(LS + "pin_lock_v1")); } catch (e) { return null; } };

  window.PSY_CLOUD = {
    sb,
    sync(state) { pendiente = state; clearTimeout(timer); timer = setTimeout(flush, 700); },
    estado: () => estado,
    async checkPin(pin) { const m = pinMeta(); if (!m) return true; return (await hashPin(pin, m.salt)) === m.hash; },
    async setPin(pin) { const salt = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(LS + "pin_lock_v1", JSON.stringify({ salt, hash: await hashPin(pin, salt) })); },
    removePin() { localStorage.removeItem(LS + "pin_lock_v1"); },
    async signOut() {
      if (pendiente || enVuelo) { await flush(); }
      await sb.auth.signOut();
      try { Object.keys(localStorage).filter((k) => k.indexOf(LS + "borrador_") === 0).forEach((k) => localStorage.removeItem(k)); } catch (e) {}
      location.reload();
    },
    async boot(root, App) {
      if (!window.__psyInit) {
        window.__psyInit = true;
        envolverConfig();
        sb.auth.onAuthStateChange((ev) => {
          if (ev === "PASSWORD_RECOVERY") root.render(<AuthScreen modo="nueva" />);
          if (ev === "SIGNED_OUT") root.render(<AuthScreen onReady={() => location.reload()} />);
        });
      }
      const session = (await sb.auth.getSession()).data.session;
      const recovery = /type=recovery/.test(location.hash);
      if (!session || recovery) { root.render(<AuthScreen modo={recovery ? "nueva" : "entrar"} onReady={() => window.PSY_CLOUD.boot(root, App)} />); if (!session) return; if (recovery) return; }
      root.render(<Cargando />);
      try {
        const d = await cargarTodo();
        aplicarConfig(d.config);
        last = { paciente: snap(d.paciente), pago: snap(d.pago), cita: snap(d.cita) };
        window.PACIENTES = d.paciente; window.PAGOS = d.pago; window.CITAS = d.cita;
        root.render(<App />);
        // refresh when coming back to the app (e.g. you edited on the computer, now open the phone)
        let oculto = 0;
        document.addEventListener("visibilitychange", async () => {
          if (document.visibilityState === "hidden") { oculto = Date.now(); if (pendiente) flush(); return; }
          if (!oculto || Date.now() - oculto < 30000 || pendiente || enVuelo) return;
          try {
            const n = await cargarTodo();
            const cambio = ["paciente", "pago", "cita"].some((t) => { const a = snap(n[t]), b = last[t]; if (a.size !== b.size) return true; for (const [k, v] of a) if (b.get(k) !== v) return true; return false; });
            if (cambio && !pendiente && window.__psyReplace) { last = { paciente: snap(n.paciente), pago: snap(n.pago), cita: snap(n.cita) }; aplicarConfig(n.config); window.__psyReplace({ pacientes: n.paciente, pagos: n.pago, citas: n.cita }); }
          } catch (e) {}
        });
      } catch (e) {
        root.render(<ErrorCarga msg={String((e && e.message) || e)} />);
      }
    },
  };

  // ---------- UI pieces ----------
  const Brand = () => (
    <div className="flex flex-col items-center mb-7">
      <span style={{ color: "var(--accent)" }}><window.Logo size={56} /></span>
      <div className="text-[24px] font-bold tracking-[-0.02em] mt-3" style={{ color: "var(--ink)" }}>Psystema</div>
      <div className="text-[13px]" style={{ color: "var(--ink-soft)" }}>Expediente clínico</div>
    </div>
  );
  function Cargando() {
    return <div className="h-screen grid place-items-center" style={{ background: "var(--bg)" }}><div className="flex flex-col items-center gap-3"><span className="animate-pulse" style={{ color: "var(--accent)" }}><window.Logo size={44} /></span><span className="text-[13px]" style={{ color: "var(--ink-soft)" }}>Cargando tus expedientes…</span></div></div>;
  }
  function ErrorCarga({ msg }) {
    return (
      <div className="h-screen grid place-items-center px-6" style={{ background: "var(--bg)" }}>
        <div className="max-w-[380px] text-center">
          <Brand />
          <p className="text-[14px] mb-2" style={{ color: "var(--ink)" }}>No se pudieron cargar tus datos.</p>
          <p className="text-[12.5px] mb-5" style={{ color: "var(--ink-soft)" }}>{navigator.onLine === false ? "Parece que no tienes conexión a internet." : msg}</p>
          <button onClick={() => location.reload()} className="h-11 px-6 rounded-[10px] text-[15px] font-semibold text-white" style={{ background: "var(--accent)" }}>Reintentar</button>
        </div>
      </div>
    );
  }
  function AuthScreen({ modo: modo0 = "entrar", onReady }) {
    const [modo, setModo] = React.useState(modo0);
    const [email, setEmail] = React.useState(""), [pass, setPass] = React.useState(""), [pass2, setPass2] = React.useState("");
    const [msg, setMsg] = React.useState(null), [busy, setBusy] = React.useState(false);
    const go = async (e) => {
      e.preventDefault(); setMsg(null); setBusy(true);
      try {
        if (modo === "entrar") {
          const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: pass });
          if (error) throw error;
          if (onReady) onReady(); else location.reload();
        } else if (modo === "crear") {
          if (pass.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
          if (pass !== pass2) throw new Error("Las contraseñas no coinciden.");
          const { data, error } = await sb.auth.signUp({ email: email.trim(), password: pass, options: { emailRedirectTo: location.origin } });
          if (error) throw error;
          if (data.session) { if (onReady) onReady(); else location.reload(); }
          else { setMsg({ ok: true, t: "Te enviamos un correo para confirmar tu cuenta. Ábrelo y después inicia sesión aquí." }); setModo("entrar"); }
        } else if (modo === "olvide") {
          const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin });
          if (error) throw error;
          setMsg({ ok: true, t: "Si el correo está registrado, te llegará un enlace para crear una nueva contraseña." });
        } else if (modo === "nueva") {
          if (pass.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
          if (pass !== pass2) throw new Error("Las contraseñas no coinciden.");
          const { error } = await sb.auth.updateUser({ password: pass });
          if (error) throw error;
          history.replaceState(null, "", location.pathname);
          location.reload();
        }
      } catch (err) {
        const m = String((err && err.message) || err);
        setMsg({ ok: false, t: /Invalid login/i.test(m) ? "Correo o contraseña incorrectos." : /Email not confirmed/i.test(m) ? "Primero confirma tu correo (revisa tu bandeja y spam)." : /signups not allowed|Signups not allowed/i.test(m) ? "El registro de cuentas nuevas está desactivado." : m });
      }
      setBusy(false);
    };
    const inp = "w-full h-12 px-4 rounded-[12px] text-[16px] bg-white outline-none";
    const st = { border: "1px solid var(--line)", color: "var(--ink)" };
    const titulo = { entrar: "Inicia sesión", crear: "Crear cuenta", olvide: "Recuperar contraseña", nueva: "Nueva contraseña" }[modo];
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "var(--bg)", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <form onSubmit={go} className="w-full max-w-[380px]">
          <Brand />
          <div className="bg-white rounded-[18px] border p-5 sm:p-6 flex flex-col gap-3" style={{ borderColor: "var(--line)", boxShadow: "0 8px 30px rgba(20,30,60,.06)" }}>
            <h1 className="text-[18px] font-bold mb-1" style={{ color: "var(--ink)" }}>{titulo}</h1>
            {modo !== "nueva" && (
              <label className="flex flex-col gap-1.5"><span className="text-[13px] font-medium" style={{ color: "var(--ink-soft)" }}>Correo</span>
                <input className={inp} style={st} type="email" autoComplete="email" inputMode="email" autoCapitalize="none" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            )}
            {modo !== "olvide" && (
              <label className="flex flex-col gap-1.5"><span className="text-[13px] font-medium" style={{ color: "var(--ink-soft)" }}>Contraseña</span>
                <input className={inp} style={st} type="password" autoComplete={modo === "entrar" ? "current-password" : "new-password"} required value={pass} onChange={(e) => setPass(e.target.value)} /></label>
            )}
            {(modo === "crear" || modo === "nueva") && (
              <label className="flex flex-col gap-1.5"><span className="text-[13px] font-medium" style={{ color: "var(--ink-soft)" }}>Repite la contraseña</span>
                <input className={inp} style={st} type="password" autoComplete="new-password" required value={pass2} onChange={(e) => setPass2(e.target.value)} /></label>
            )}
            {msg && <div className="text-[13px] leading-snug rounded-[10px] px-3.5 py-2.5" style={msg.ok ? { background: "#E4F2EB", color: "#256B4C" } : { background: "#FCEDED", color: "#B23636" }}>{msg.t}</div>}
            <button type="submit" disabled={busy} className="h-12 rounded-[12px] text-[16px] font-semibold text-white mt-1 disabled:opacity-60" style={{ background: "var(--accent)" }}>
              {busy ? "Un momento…" : { entrar: "Entrar", crear: "Crear cuenta", olvide: "Enviar enlace", nueva: "Guardar contraseña" }[modo]}
            </button>
          </div>
          <div className="flex flex-col items-center gap-2 mt-5 text-[14px]">
            {modo === "entrar" && <button type="button" onClick={() => { setModo("olvide"); setMsg(null); }} className="font-medium py-1" style={{ color: "var(--accent)" }}>¿Olvidaste tu contraseña?</button>}
            {modo === "entrar" && CFG.permitirRegistro !== false && <button type="button" onClick={() => { setModo("crear"); setMsg(null); }} className="py-1" style={{ color: "var(--ink-soft)" }}>Crear una cuenta</button>}
            {modo !== "entrar" && modo !== "nueva" && <button type="button" onClick={() => { setModo("entrar"); setMsg(null); }} className="py-1" style={{ color: "var(--ink-soft)" }}>Volver a iniciar sesión</button>}
          </div>
        </form>
      </div>
    );
  }

  // change password from inside the app (asks for the current one first)
  window.CambiarPasswordModal = function CambiarPasswordModal({ onClose }) {
    const [actual, setActual] = React.useState(""), [p1, setP1] = React.useState(""), [p2, setP2] = React.useState("");
    const [msg, setMsg] = React.useState(null), [busy, setBusy] = React.useState(false);
    const ok = actual && p1.length >= 8 && p1 === p2;
    const go = async () => {
      setBusy(true); setMsg(null);
      try {
        const { data } = await sb.auth.getSession();
        const email = data && data.session && data.session.user.email;
        const chk = await sb.auth.signInWithPassword({ email, password: actual });
        if (chk.error) throw new Error("La contraseña actual no es correcta.");
        const { error } = await sb.auth.updateUser({ password: p1 });
        if (error) throw error;
        setMsg({ ok: true, t: "Contraseña actualizada. Úsala la próxima vez que inicies sesión." });
        setActual(""); setP1(""); setP2("");
      } catch (e) {
        const m = String((e && e.message) || e);
        setMsg({ ok: false, t: /different from the old|same password/i.test(m) ? "La nueva contraseña debe ser distinta a la actual." : /weak|at least/i.test(m) ? "Elige una contraseña más segura (mínimo 8 caracteres, mezcla letras y números)." : m });
      }
      setBusy(false);
    };
    const pw = (label, v, set, ac) => (
      <Field label={label}><input type="password" autoComplete={ac} className={fieldCls} style={inputStyle()} value={v} onChange={(e) => set(e.target.value)} {...fx} /></Field>
    );
    return (
      <ModalShell icon="shield" title="Cambiar contraseña" subtitle="Para tu cuenta de Psystema" onClose={onClose}
        footer={<><BtnGhost onClick={onClose}>{msg && msg.ok ? "Cerrar" : "Cancelar"}</BtnGhost><BtnPrimary disabled={!ok || busy} onClick={go}>{busy ? "Guardando…" : "Cambiar contraseña"}</BtnPrimary></>}>
        <div className="flex flex-col gap-4">
          {pw("Contraseña actual", actual, setActual, "current-password")}
          {pw("Nueva contraseña (mínimo 8 caracteres)", p1, setP1, "new-password")}
          {pw("Repite la nueva contraseña", p2, setP2, "new-password")}
          {p2 && p1 !== p2 && <div className="text-[12.5px]" style={{ color: "#B23636" }}>Las contraseñas no coinciden.</div>}
          {msg && <div className="text-[13px] rounded-[10px] px-3.5 py-2.5" style={msg.ok ? { background: "#E4F2EB", color: "#256B4C" } : { background: "#FCEDED", color: "#B23636" }}>{msg.t}</div>}
          <p className="text-[12px]" style={{ color: "var(--ink-soft)" }}>¿Olvidaste la actual? Cierra sesión y usa «¿Olvidaste tu contraseña?» en la pantalla de inicio.</p>
        </div>
      </ModalShell>
    );
  };

  // small status pill: only visible while saving or when something failed
  window.SyncBadge = function SyncBadge() {
    const [e, setE] = React.useState(estado);
    React.useEffect(() => { const h = (ev) => setE(ev.detail); window.addEventListener("psy-sync", h); return () => window.removeEventListener("psy-sync", h); }, []);
    if (e === "ok") return null;
    const t = { guardando: "Guardando…", error: "No se pudo guardar · reintentando", offline: "Sin conexión · se guardará al volver" }[e];
    const bad = e !== "guardando";
    return (
      <div className="fixed left-1/2 -translate-x-1/2 z-[70] pointer-events-none" style={{ bottom: "calc(84px + env(safe-area-inset-bottom))" }}>
        <div className="md:translate-y-[64px] px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold shadow" style={bad ? { background: "#FCEDED", color: "#B23636" } : { background: "#fff", color: "var(--ink-soft)", border: "1px solid var(--line)" }}>{t}</div>
      </div>
    );
  };
})();
