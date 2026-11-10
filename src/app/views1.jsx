// ============ Psystema — Dashboard + Agenda ============
const { Icon: VIcon, Avatar: VAvatar, EstadoBadge: VBadge, QuickAction: VQA, fmtMoney: vFmt, pidIndex: vPidx } = window;

function Card({ children, className = "", style, onClick, hover }) {
  return (
    <div onClick={onClick}
      className={"bg-white rounded-[14px] border transition " + (onClick || hover ? "cursor-pointer " : "") + className}
      style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(20,30,60,.03)", ...style }}
      onMouseEnter={(e) => { if (onClick || hover) { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(20,40,90,.07)"; } }}
      onMouseLeave={(e) => { if (onClick || hover) { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(20,30,60,.03)"; } }}>
      {children}
    </div>
  );
}

function Kpi({ label, value, sub, icon, accent, muted, onReveal, hidden }) {
  return (
    <Card className="p-4 md:p-5">
      <div className="flex items-start justify-between">
        <span className="text-[12.5px] font-medium" style={{ color: "var(--ink-soft)" }}>{label}</span>
        <span className="grid place-items-center w-8 h-8 rounded-[9px]" style={{ background: accent ? "var(--accent-soft)" : "#F1F3F6", color: accent ? "var(--accent)" : "#8A92A0" }}>
          <VIcon name={icon} size={17} />
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-[27px] font-bold tracking-[-0.03em]" style={{ color: "var(--ink)", filter: hidden ? "blur(8px)" : "none", userSelect: hidden ? "none" : "auto" }}>{value}</span>
        {onReveal && (
          <button onClick={onReveal} className="text-[11.5px] font-medium px-1.5 py-0.5 rounded-md hover:bg-[#F1F3F6]" style={{ color: "var(--accent)" }}>{hidden ? "Mostrar" : "Ocultar"}</button>
        )}
      </div>
      {sub && <div className="text-[12px] mt-0.5" style={{ color: muted ? "var(--ink-soft)" : "#2F9469" }}>{sub}</div>}
    </Card>
  );
}

function CitaRow({ cita, onOpen, onStart, compact }) {
  const p = window.PACIENTES.find((x) => x.id === cita.pid);
  if (!p) return null;
  return (
    <div className="group flex items-center gap-3 md:gap-4 px-3 md:px-4 py-3 rounded-[11px] transition cursor-pointer"
      onClick={() => onOpen(p.id)}
      onMouseEnter={(e) => e.currentTarget.style.background = "#F7F8FA"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
      <div className="text-right shrink-0 w-[52px]">
        <div className="text-[14px] font-bold tabular-nums" style={{ color: "var(--ink)" }}>{cita.hora}</div>
        <div className="text-[11px]" style={{ color: "var(--ink-soft)" }}>{cita.fin}</div>
      </div>
      <div className="w-px self-stretch" style={{ background: "var(--line)" }}></div>
      <VAvatar nombre={p.nombre} idx={vPidx(p.id)} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {p.riesgo && p.riesgo.nivel !== "Bajo" && <span title={"Riesgo " + p.riesgo.nivel.toLowerCase()} style={{ color: p.riesgo.nivel === "Alto" ? "#C73B3B" : "#C8862F" }}><VIcon name="alert" size={14} /></span>}
          <span className="text-[14px] font-semibold truncate" style={{ color: "var(--ink)" }}>{p.nombre}</span>
          <span className="text-[12px] shrink-0" style={{ color: "var(--ink-soft)" }}>· {p.edad} años</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[12px]" style={{ color: "var(--ink-soft)" }}>
          <span className="inline-flex items-center gap-1"><VIcon name={cita.modalidad === "Online" ? "video" : "pin"} size={13} />{cita.tipo}</span>
        </div>
      </div>
      <div className="hidden sm:block"><VBadge estado={cita.estado} /></div>
      <button onClick={(e) => { e.stopPropagation(); onStart(p.id, { fecha: cita.fecha, duracion: String((+cita.fin.slice(0, 2) * 60 + +cita.fin.slice(3)) - (+cita.hora.slice(0, 2) * 60 + +cita.hora.slice(3))), origen: "cita" }); }}
        className="md:opacity-0 md:group-hover:opacity-100 transition inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] font-semibold shrink-0"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
        <VIcon name="mic" size={14} />Registrar
      </button>
    </div>
  );
}

function Dashboard({ onModal, onOpen, onStart, onCita, pacientes, citas, pagos }) {
  const [hideIncome, setHide] = React.useState(() => window.lsGet("ocultar_ingresos", false));
  const toggleHide = () => { setHide((v) => { window.lsSet("ocultar_ingresos", !v); return !v; }); };
  const [gcal] = useGcal();
  const hoy = window.todayISO();
  const mes = hoy.slice(0, 7);
  const prevD = new Date(hoy + "T12:00"); prevD.setDate(1); prevD.setMonth(prevD.getMonth() - 1);
  const mesPrev = window.isoLocal(prevD).slice(0, 7);
  const nombreMes = window.MESES[Number(mes.slice(5, 7)) - 1];
  const citasHoy = citas.filter((c) => c.fecha === hoy && !["Cancelada", "Cancelación tardía"].includes(c.estado)).sort((a, b) => a.hora.localeCompare(b.hora));
  const activos = pacientes.filter((p) => p.estado === "Activo" || p.estado === "Nuevo").length;
  const nuevosMes = pacientes.filter((p) => String(p.alta || "").slice(0, 7) === mes).length;
  const ingresoDe = (m) => pagos.filter((g) => g.estado === "Pagado" && String(g.fecha).slice(0, 7) === m).reduce((a, g) => a + g.monto, 0);
  const ingresoMes = ingresoDe(mes), ingresoPrev = ingresoDe(mesPrev);
  const delta = ingresoPrev > 0 ? Math.round(((ingresoMes - ingresoPrev) / ingresoPrev) * 100) : null;
  const pendientesPago = pagos.filter((g) => g.estado === "Pendiente" && pacientes.some((p) => p.id === g.pid));
  const tareasRevisar = pacientes.flatMap((p) => (p.tareas || []).filter((t) => t.estado !== "completada").map((t) => ({ ...t, p }))).slice(0, 6);

  return (
    <div className="max-w-[1180px] mx-auto px-5 md:px-8 py-6 md:py-7">
      {/* quick actions */}
      <div className="flex flex-wrap items-center gap-2.5 mb-6">
        <VQA icon="plus" label="Nuevo paciente" primary onClick={() => onModal("paciente")} />
        <VQA icon="calendar" label="Nueva cita" onClick={() => onCita(null, { fecha: hoy })} />
        <VQA icon="note" label="Nota de sesión" onClick={() => onModal("sesion")} />
        <VQA icon="money" label="Registrar pago" onClick={() => onModal("pago")} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-4 mb-6">
        <Kpi label="Citas de hoy" value={citasHoy.length} icon="calendar" accent sub={`${citasHoy.filter((c) => c.estado === "Confirmada").length} confirmadas`} muted />
        <Kpi label="Pacientes en tratamiento" value={activos} icon="users" sub={nuevosMes ? `${nuevosMes} nuevo${nuevosMes > 1 ? "s" : ""} este mes` : "Sin altas nuevas este mes"} muted={!nuevosMes} />
        <Kpi label={"Ingresos · " + nombreMes} value={vFmt(ingresoMes)} icon="trend" sub={delta == null ? "Cobrado este mes" : `${delta >= 0 ? "+" : ""}${delta}% vs. mes anterior`} muted={delta == null || delta < 0} hidden={hideIncome} onReveal={toggleHide} />
        <Kpi label="Pagos pendientes" value={pendientesPago.length} icon="wallet" sub={vFmt(pendientesPago.reduce((a, g) => a + g.monto, 0))} muted />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4 md:gap-5">
        {/* agenda de hoy */}
        <Card className="p-2 md:p-3 min-w-0">
          <div className="flex items-center justify-between px-3 md:px-4 pt-3 pb-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold tracking-[-0.01em]" style={{ color: "var(--ink)" }}>Agenda de hoy</h2>
              <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{citasHoy.length} sesiones</span>
              {gcal.connected && (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11.5px] font-medium px-2 py-0.5 rounded-full" title={`Sincronizado con Google Calendar · ${gcal.email}`} style={{ background: "#F1F4F9", color: "var(--ink-soft)" }}>
                  <GCalMark size={12} />Sincronizado
                </span>
              )}
            </div>
            <button onClick={() => window.__setView("agenda")} className="text-[12.5px] font-medium inline-flex items-center gap-1 hover:underline shrink-0 whitespace-nowrap" style={{ color: "var(--accent)" }}>
              Ver agenda <VIcon name="chevron-right" size={14} />
            </button>
          </div>
          <div className="flex flex-col">
            {citasHoy.map((c) => <CitaRow key={c.id} cita={c} onOpen={() => onCita(c)} onStart={onStart} />)}
            {citasHoy.length === 0 && (
              <div className="px-4 py-8 text-center text-[13px]" style={{ color: "var(--ink-soft)" }}>
                No hay citas para hoy. <button onClick={() => onCita(null, { fecha: hoy })} className="font-semibold" style={{ color: "var(--accent)" }}>Agendar una</button>
              </div>
            )}
          </div>
        </Card>

        {/* right column */}
        <div className="flex flex-col gap-4 md:gap-5 min-w-0">
          <Card className="p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-bold tracking-[-0.01em]" style={{ color: "var(--ink)" }}>Tareas por revisar</h2>
              <span style={{ color: "var(--accent)" }}><VIcon name="tasks" size={18} /></span>
            </div>
            <div className="flex flex-col gap-1">
              {tareasRevisar.length === 0 && <div className="text-[13px] py-2" style={{ color: "var(--ink-soft)" }}>Sin tareas pendientes.</div>}
              {tareasRevisar.map((t, i) => (
                <button key={i} onClick={() => onOpen(t.p.id)} className="flex items-center gap-3 py-2 text-left rounded-lg px-1 -mx-1 transition hover:bg-[#F7F8FA]">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: t.estado === "en curso" ? "var(--accent)" : "#C8A23A" }}></span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium truncate" style={{ color: "var(--ink)" }}>{t.titulo}</div>
                    <div className="text-[11.5px]" style={{ color: "var(--ink-soft)" }}>{t.p.nombre} · {t.fecha}</div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {pacientes.some((p) => p.estado === "En espera") && (
            <Card className="p-4 md:p-5">
              <h2 className="text-[15px] font-bold tracking-[-0.01em] mb-3" style={{ color: "var(--ink)" }}>Lista de espera</h2>
              {pacientes.filter((p) => p.estado === "En espera").slice(0, 5).map((p) => (
                <button key={p.id} onClick={() => onCita(null, { pid: p.id, fecha: hoy })} className="w-full flex items-center gap-3 py-2 text-left rounded-lg px-1 -mx-1 hover:bg-[#F7F8FA]">
                  <VAvatar nombre={p.nombre} idx={vPidx(p.id)} size={32} />
                  <div className="min-w-0 flex-1"><div className="text-[13px] font-medium truncate" style={{ color: "var(--ink)" }}>{p.nombre}</div>
                    <div className="text-[11.5px] truncate" style={{ color: "var(--ink-soft)" }}>{p.disponibilidad || p.motivo}</div></div>
                  <span className="text-[12px] font-semibold shrink-0" style={{ color: "var(--accent)" }}>Agendar</span>
                </button>
              ))}
            </Card>
          )}
          <Card className="p-4 md:p-5">
            <h2 className="text-[15px] font-bold tracking-[-0.01em] mb-3" style={{ color: "var(--ink)" }}>Cobros pendientes</h2>
            <div className="flex flex-col gap-1">
              {pendientesPago.length === 0 && <div className="text-[13px] py-2" style={{ color: "var(--ink-soft)" }}>Nada pendiente de cobro.</div>}
              {pendientesPago.map((g) => {
                const p = pacientes.find((x) => x.id === g.pid);
                return (
                  <button key={g.id} onClick={() => onModal("pago", p.id)} className="flex items-center gap-3 py-2 text-left rounded-lg px-1 -mx-1 transition hover:bg-[#F7F8FA]">
                    <VAvatar nombre={p.nombre} idx={vPidx(p.id)} size={32} />
                    <div className="min-w-0 flex-1"><div className="text-[13px] font-medium truncate" style={{ color: "var(--ink)" }}>{p.nombre}</div>
                      <div className="text-[11.5px]" style={{ color: "var(--ink-soft)" }}>{g.concepto}</div></div>
                    <span className="text-[13px] font-semibold tabular-nums" style={{ color: "var(--ink)" }}>{vFmt(g.monto)}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------- Google Calendar link state ----------
const GCAL_KEY = "psystema_gcal_v1";
function gcalRead() {
  try { return JSON.parse(localStorage.getItem(GCAL_KEY)) || { connected: false }; }
  catch (e) { return { connected: false }; }
}
function useGcal() {
  const [state, setState] = React.useState(gcalRead);
  React.useEffect(() => {
    const h = () => setState(gcalRead());
    window.addEventListener("gcal-change", h);
    return () => window.removeEventListener("gcal-change", h);
  }, []);
  const write = (next) => {
    const merged = typeof next === "function" ? next(gcalRead()) : next;
    localStorage.setItem(GCAL_KEY, JSON.stringify(merged));
    window.dispatchEvent(new Event("gcal-change"));
  };
  return [state, write];
}
function relTime(ts) {
  if (!ts) return "";
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "hace un momento";
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  return `hace ${h} h`;
}

// 4-colour Google palette tile (brand-safe, not the logomark)
function GCalMark({ size = 18 }) {
  const cell = { borderRadius: Math.max(1, size * 0.09) };
  return (
    <span className="inline-grid shrink-0" style={{ gridTemplateColumns: "1fr 1fr", gap: size * 0.12, width: size, height: size, padding: size * 0.13, borderRadius: size * 0.26, background: "#fff", border: "1px solid #E3E6EB" }}>
      <i style={{ ...cell, background: "#4285F4" }}></i>
      <i style={{ ...cell, background: "#EA4335" }}></i>
      <i style={{ ...cell, background: "#FBBC05" }}></i>
      <i style={{ ...cell, background: "#34A853" }}></i>
    </span>
  );
}

function Spinner({ size = 15 }) {
  return (
    <span className="inline-block animate-spin rounded-full border-2 border-white/35 border-t-white" style={{ width: size, height: size }}></span>
  );
}

function CopyField({ value }) {
  const [done, setDone] = React.useState(false);
  const copy = () => {
    try { navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1400); } catch (e) {}
  };
  return (
    <div className="flex items-stretch gap-2">
      <code className="flex-1 min-w-0 truncate text-[12px] px-2.5 py-2 rounded-[8px]" style={{ background: "#F5F7FA", border: "1px solid var(--line)", color: "var(--ink)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{value}</code>
      <button onClick={copy} className="shrink-0 inline-flex items-center gap-1.5 h-auto px-3 rounded-[8px] text-[12px] font-semibold transition" style={{ background: done ? "#E4F2EB" : "var(--accent-soft)", color: done ? "#2F9469" : "var(--accent)" }}>
        <VIcon name={done ? "check" : "note"} size={13} stroke={2.2} />{done ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

// ---------- Setup dialog: enter OAuth Client ID ----------
function GCalSettings({ onClose, onSaveConnect, onDemo, busy }) {
  const [cid, setCid] = React.useState((window.gcalCfg().clientId) || "");
  const origin = window.location.origin;
  const step = (n, title, body) => (
    <div className="flex gap-3">
      <span className="grid place-items-center w-6 h-6 rounded-full shrink-0 text-[12px] font-bold text-white mt-0.5" style={{ background: "var(--accent)" }}>{n}</span>
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>{title}</div>
        <div className="text-[12.5px] leading-snug mt-0.5" style={{ color: "var(--ink-soft)" }}>{body}</div>
      </div>
    </div>
  );
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4" style={{ background: "rgba(20,28,45,.45)" }} onClick={onClose}>
      <div className="w-full max-w-[520px] max-h-[90vh] overflow-y-auto rounded-[16px] bg-white" style={{ boxShadow: "0 24px 60px rgba(20,30,60,.28)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b sticky top-0 bg-white rounded-t-[16px]" style={{ borderColor: "var(--line)" }}>
          <GCalMark size={26} />
          <div className="flex-1">
            <div className="text-[15px] font-bold tracking-[-0.01em]" style={{ color: "var(--ink)" }}>Conectar tu Google Calendar</div>
            <div className="text-[12px]" style={{ color: "var(--ink-soft)" }}>Configuración única en tu cuenta de Google</div>
          </div>
          <button onClick={onClose} className="grid place-items-center w-8 h-8 rounded-[8px] transition hover:bg-[#F2F4F7]" style={{ color: "var(--ink-soft)" }}><VIcon name="x" size={17} /></button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3.5">
          {step("1", "Crea un ID de cliente OAuth", <>En <b>console.cloud.google.com</b> → APIs y servicios → Credenciales → <i>Crear credenciales → ID de cliente de OAuth → Aplicación web</i>.</>)}
          {step("2", "Habilita la Google Calendar API", <>En <b>APIs y servicios → Biblioteca</b>, busca “Google Calendar API” y actívala.</>)}
          {step("3", "Autoriza este origen", <>En tu ID de cliente, agrega esta dirección en <b>Orígenes de JavaScript autorizados</b>:</>)}
          <div className="-mt-1 ml-9"><CopyField value={origin} /></div>
          {step("4", "Pega tu ID de cliente aquí", "Termina en .apps.googleusercontent.com")}

          <input value={cid} onChange={(e) => setCid(e.target.value)} placeholder="xxxxxxxx.apps.googleusercontent.com"
            className="w-full h-11 px-3.5 rounded-[10px] text-[13px] outline-none" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}
            onFocus={(e) => e.target.style.borderColor = "var(--accent)"} onBlur={(e) => e.target.style.borderColor = "var(--line)"} />

          <button onClick={() => onSaveConnect(cid.trim())} disabled={!cid.trim() || busy}
            className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-[10px] text-[14px] font-semibold text-white transition active:scale-[.99] disabled:opacity-50"
            style={{ background: "#1A73E8" }}>
            {busy ? (<><Spinner />Conectando con Google…</>) : (<><VIcon name="link" size={16} stroke={2} />Guardar y conectar mi cuenta</>)}
          </button>

          <div className="rounded-[10px] px-3 py-2.5 text-[12px] leading-snug" style={{ background: "#FFF7E8", border: "1px solid #F1E2C0", color: "#8A6B1F" }}>
            <b>¿Estás dentro del editor?</b> Google bloquea la ventana de permiso dentro de marcos. Abre la app en una pestaña propia, o pruébala una vez publicada en tu dominio.
            <button onClick={() => window.open(window.location.href, "_blank")} className="mt-1.5 inline-flex items-center gap-1.5 font-semibold" style={{ color: "#1A73E8" }}><VIcon name="external" size={13} />Abrir en pestaña nueva</button>
          </div>

          <button onClick={onDemo} className="w-full text-[12.5px] font-medium py-1.5" style={{ color: "var(--ink-soft)" }}>
            Solo explorar · <span style={{ color: "var(--accent)" }}>probar en modo demo</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Connection / sync bar shown above the timeline ----------
function GCalBar({ gcal, setGcal, onEvents, citas, fecha, onPublished }) {
  const [phase, setPhase] = React.useState("idle"); // idle | connecting | syncing | publishing
  const [menu, setMenu] = React.useState(false);
  const [settings, setSettings] = React.useState(false);
  const [status, setStatus] = React.useState(null); // {text, kind:'err'|'ok'}
  const demoEmail = window.THERAPIST.nombre.toLowerCase().replace("dra. ", "").replace(/\s+/g, ".").normalize("NFD").replace(/[\u0300-\u036f]/g, "") + "@gmail.com";

  const refresh = async (token) => {
    try {
      const evs = await window.gcalListToday(token, fecha);
      onEvents(evs);
      setGcal((s) => ({ ...s, lastSync: Date.now() }));
      setStatus(null);
      return true;
    } catch (e) {
      if (String(e.message).includes("token_expired")) { setStatus({ text: "Tu sesión de Google expiró. Vuelve a conectar.", kind: "err" }); setGcal({ connected: false }); onEvents([]); }
      else setStatus({ text: e.message, kind: "err" });
      return false;
    }
  };

  // restore on load
  React.useEffect(() => {
    if (!gcal.connected) { onEvents([]); return; }
    if (gcal.mode === "demo") { onEvents(window.GCAL_EVENTS); return; }
    if (gcal.mode === "real") {
      if (gcal.expiry && gcal.expiry < Date.now()) { setStatus({ text: "Tu sesión de Google expiró. Vuelve a conectar.", kind: "err" }); setGcal({ connected: false }); onEvents([]); }
      else if (gcal.token) { refresh(gcal.token); }
    }
  }, [gcal.connected, gcal.mode, fecha]);

  const doRealConnect = async (clientId) => {
    const id = (clientId || (window.gcalCfg().clientId) || "").trim();
    if (!id) { setSettings(true); return; }
    window.gcalSetCfg({ clientId: id });
    setStatus(null); setPhase("connecting");
    try {
      const { token, expiry } = await window.gcalRequestToken(id);
      const info = await window.gcalUserInfo(token);
      setGcal({ connected: true, mode: "real", email: info.email || "", name: info.name || "", token, expiry, lastSync: Date.now() });
      setSettings(false);
      await refresh(token);
    } catch (e) {
      const m = String(e.message || e);
      if (m === "popup_blocked") setStatus({ text: "El navegador bloqueó la ventana de Google. Abre la app en una pestaña nueva e inténtalo de nuevo.", kind: "err" });
      else if (m === "popup_closed") setStatus({ text: "Cerraste la ventana de Google antes de autorizar.", kind: "err" });
      else if (/origin|redirect|invalid_client|idpiframe|400|401|403/i.test(m)) setStatus({ text: "Google rechazó este origen o el ID de cliente. Verifica el ID y que este origen esté autorizado (botón Configurar).", kind: "err" });
      else setStatus({ text: m, kind: "err" });
    } finally { setPhase("idle"); }
  };

  const doDemo = () => {
    setSettings(false); setStatus(null);
    setGcal({ connected: true, mode: "demo", email: demoEmail, lastSync: Date.now() });
    onEvents(window.GCAL_EVENTS);
  };

  const sync = async () => {
    if (gcal.mode === "real") {
      if (!gcal.token || (gcal.expiry && gcal.expiry < Date.now())) { doRealConnect(); return; }
      setPhase("syncing"); await refresh(gcal.token); setPhase("idle");
    } else {
      setPhase("syncing");
      setTimeout(() => { setGcal((s) => ({ ...s, lastSync: Date.now() })); onEvents(window.GCAL_EVENTS); setPhase("idle"); }, 700);
    }
  };

  const publish = async () => {
    setMenu(false);
    if (gcal.mode !== "real") { setStatus({ text: "Conecta tu cuenta real de Google para publicar tus sesiones.", kind: "err" }); return; }
    const pend = citas.filter((c) => !c.gcalId && c.estado !== "Cancelada");
    if (!pend.length) { setStatus({ text: "Las sesiones de este día ya están en Google Calendar.", kind: "ok" }); return; }
    setPhase("publishing");
    let ok = 0, fail = 0; const done = {};
    for (const c of pend) {
      const p = window.PACIENTES.find((x) => x.id === c.pid);
      try {
        const ev = await window.gcalInsert(gcal.token, { summary: "Sesión · " + (p ? p.nombre : "Paciente"), dateISO: c.fecha, startHHMM: c.hora, endHHMM: c.fin, description: (c.tipo || "") + " · " + (c.modalidad || "") + " — agendado desde Psystema" });
        done[c.id] = (ev && ev.id) || "ok"; ok++;
      } catch (e) { fail++; if (String(e.message).includes("token_expired")) break; }
    }
    if (onPublished && ok) onPublished(done);
    if (gcal.token) await refresh(gcal.token);
    setPhase("idle");
    setStatus({ text: fail ? `Se publicaron ${ok} sesiones; ${fail} fallaron.` : `${ok} sesiones publicadas en tu Google Calendar.`, kind: fail ? "err" : "ok" });
  };

  const disconnect = () => {
    setMenu(false);
    if (gcal.mode === "real" && gcal.token && window.google && window.google.accounts && window.google.accounts.oauth2) {
      try { window.google.accounts.oauth2.revoke(gcal.token, () => {}); } catch (e) {}
    }
    setGcal({ connected: false }); onEvents([]); setStatus(null);
  };

  const StatusLine = status ? (
    <div className="mt-2 text-[12.5px] px-3 py-2 rounded-[9px] flex items-start gap-2" style={status.kind === "ok" ? { background: "#E4F2EB", color: "#256B4C" } : { background: "#FCEDED", color: "#B23636" }}>
      <span className="mt-0.5 shrink-0"><VIcon name={status.kind === "ok" ? "check-circle" : "bell"} size={14} /></span>
      <span className="flex-1">{status.text}</span>
      <button onClick={() => setStatus(null)} className="shrink-0 opacity-60 hover:opacity-100"><VIcon name="x" size={13} /></button>
    </div>
  ) : null;

  // ---- disconnected ----
  if (!gcal.connected) {
    return (
      <div className="mb-4">
        <div className="rounded-[14px] border bg-white px-4 md:px-5 py-3.5 flex items-center gap-3.5" style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(20,30,60,.03)" }}>
          <GCalMark size={34} />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold tracking-[-0.01em]" style={{ color: "var(--ink)" }}>Vincula tu Google Calendar</div>
            <div className="text-[12.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>Trae tus eventos reales del día y publica tus sesiones en Google. <button onClick={doDemo} className="font-medium" style={{ color: "var(--accent)" }}>o prueba en modo demo</button></div>
          </div>
          <button onClick={() => doRealConnect()} disabled={phase === "connecting"}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-[9px] text-[13px] font-semibold text-white shrink-0 transition active:scale-[.98] disabled:opacity-80"
            style={{ background: "#1A73E8", boxShadow: "0 1px 2px rgba(26,115,232,.35)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#1765cc"} onMouseLeave={(e) => e.currentTarget.style.background = "#1A73E8"}>
            {phase === "connecting" ? (<><Spinner /><span>Conectando…</span></>) : (<><VIcon name="link" size={15} stroke={2} />Conectar</>)}
          </button>
        </div>
        {StatusLine}
        {settings && <GCalSettings onClose={() => setSettings(false)} onSaveConnect={doRealConnect} onDemo={doDemo} busy={phase === "connecting"} />}
      </div>
    );
  }

  // ---- connected ----
  const isDemo = gcal.mode === "demo";
  return (
    <div className="mb-4">
      <div className="rounded-[14px] border bg-white px-4 md:px-5 py-3 flex items-center gap-3" style={{ borderColor: "var(--line)", boxShadow: "0 1px 2px rgba(20,30,60,.03)" }}>
        <GCalMark size={26} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-semibold truncate" style={{ color: "var(--ink)" }}>Google Calendar</span>
            {isDemo ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#FFF3DB", color: "#9A6B12" }}>Modo demo</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#E4F2EB", color: "#2F9469" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#2F9469" }}></span>Conectado
              </span>
            )}
          </div>
          <div className="text-[12px] truncate" style={{ color: "var(--ink-soft)" }}>
            {gcal.email || "Cuenta de Google"} · {phase === "syncing" ? "Sincronizando…" : phase === "publishing" ? "Publicando…" : `sincronizado ${relTime(gcal.lastSync)}`}
          </div>
        </div>
        <button onClick={sync} disabled={phase === "syncing" || phase === "publishing"} title="Sincronizar ahora"
          className="grid place-items-center w-9 h-9 rounded-[9px] shrink-0 transition" style={{ border: "1px solid var(--line)", color: "var(--ink-soft)" }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#F5F7FA"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
          <span className={phase === "syncing" ? "animate-spin" : ""} style={{ display: "grid" }}><VIcon name="refresh" size={16} /></span>
        </button>
        <div className="relative shrink-0">
          <button onClick={() => setMenu((v) => !v)}
            className="grid place-items-center w-9 h-9 rounded-[9px] transition" style={{ border: "1px solid var(--line)", color: "var(--ink-soft)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#F5F7FA"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <VIcon name="dot-menu" size={16} />
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setMenu(false)}></div>
              <div className="absolute right-0 top-11 z-30 w-[232px] rounded-[12px] border bg-white py-1.5" style={{ borderColor: "var(--line)", boxShadow: "0 12px 34px rgba(20,30,60,.16)" }}>
                {!isDemo && (
                  <button onClick={publish} disabled={phase === "publishing"} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-medium transition hover:bg-[#F7F8FA]" style={{ color: "var(--ink)" }}>
                    <VIcon name="external" size={15} style={{ color: "var(--accent)" }} />Publicar sesiones de este día
                  </button>
                )}
                <button onClick={() => { setMenu(false); setSettings(true); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-medium transition hover:bg-[#F7F8FA]" style={{ color: "var(--ink)" }}>
                  <VIcon name="settings" size={15} style={{ color: "var(--ink-soft)" }} />{isDemo ? "Conectar cuenta real" : "Configuración"}
                </button>
                <div className="my-1.5 border-t" style={{ borderColor: "var(--line)" }}></div>
                <button onClick={disconnect} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-medium transition hover:bg-[#F7F8FA]" style={{ color: "#D14343" }}>
                  <VIcon name="unlink" size={15} />Desvincular cuenta
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {StatusLine}
      {settings && <GCalSettings onClose={() => setSettings(false)} onSaveConnect={doRealConnect} onDemo={doDemo} busy={phase === "connecting"} />}
    </div>
  );
}

// ---------- Agenda (day timeline with week navigation, Google Calendar–style) ----------
function Agenda({ citas, pacientes, onCita, onNewCita, onStart, onPublished }) {
  const [gcal, setGcal] = useGcal();
  const [gevents, setGevents] = React.useState([]);
  const [fecha, setFecha] = React.useState(window.todayISO());
  const [modo, setModoS] = React.useState(() => window.lsGet("agenda_modo", window.innerWidth < 768 ? "dia" : "semana"));
  const setModo = (m) => { setModoS(m); window.lsSet("agenda_modo", m); };
  const bloqueos = window.bloqueosDe(fecha);
  const HL = window.POLITICAS.horario;
  const laboral = window.esDiaLaboral(fecha);
  const H0 = 7, H1 = 21;
  const hours = []; for (let h = H0; h <= H1; h++) hours.push(h);
  const ROW = 68; // px per hour
  const toMin = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  const base = H0 * 60, top = H1 * 60;
  const hoy = window.todayISO();
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const selD = new Date(fecha + "T12:00");
  const dow = (selD.getDay() + 6) % 7; // 0 = Monday
  const monday = window.addDays(fecha, -dow);
  const week = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
  const dayCitas = citas.filter((c) => c.fecha === fecha).sort((a, b) => a.hora.localeCompare(b.hora));
  const visible = (gcal.connected ? gevents : []).filter((g) => toMin(g.fin) > base && toMin(g.hora) < top);

  // simple lane layout so overlapping appointments sit side by side
  const lanes = []; const laneOf = {};
  dayCitas.forEach((c) => {
    let i = lanes.findIndex((end) => end <= toMin(c.hora));
    if (i === -1) { lanes.push(0); i = lanes.length - 1; }
    lanes[i] = toMin(c.fin); laneOf[c.id] = i;
  });
  const nLanes = Math.max(1, lanes.length);

  const clickGrid = (e) => {
    if (e.target !== e.currentTarget) return;
    const y = e.nativeEvent.offsetY - 12;
    const min = Math.max(0, Math.round((y / ROW) * 60 / 30) * 30) + base;
    const hh = Math.min(H1 - 1, Math.floor(min / 60)), mm = min % 60;
    onNewCita({ fecha, hora: window.pad2(hh) + ":" + window.pad2(mm) });
  };
  const dLabel = `${window.DIAS[selD.getDay()].charAt(0).toUpperCase() + window.DIAS[selD.getDay()].slice(1)} ${selD.getDate()} de ${window.MESES[selD.getMonth()]}`;
  const navBtn = "grid place-items-center w-9 h-9 rounded-[9px] bg-white border shrink-0 transition hover:bg-[#F5F7FA]";

  return (
    <div className="max-w-[980px] mx-auto px-5 md:px-8 py-6">
      <GCalBar gcal={gcal} setGcal={setGcal} onEvents={setGevents} citas={dayCitas} fecha={fecha} onPublished={onPublished} />

      {/* week navigation */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <button onClick={() => setFecha(window.addDays(fecha, -7))} aria-label="Semana anterior" className={navBtn} style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}><VIcon name="chevron-left" size={17} /></button>
        <button onClick={() => setFecha(window.addDays(fecha, 7))} aria-label="Semana siguiente" className={navBtn} style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}><VIcon name="chevron-right" size={17} /></button>
        <button onClick={() => setFecha(hoy)} className="h-9 px-3.5 rounded-[9px] bg-white border text-[13px] font-semibold" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>Hoy</button>
        <span className="text-[15px] font-bold ml-1 capitalize" style={{ color: "var(--ink)" }}>{window.MESES[selD.getMonth()]} {selD.getFullYear()}</span>
        <div className="ml-auto inline-flex rounded-[9px] p-0.5 bg-white border" style={{ borderColor: "var(--line)" }}>
          {[["dia", "Día"], ["semana", "Semana"]].map(([k, l]) => (
            <button key={k} onClick={() => setModo(k)} aria-pressed={modo === k} className="h-8 px-3 rounded-[7px] text-[12.5px] font-semibold" style={modo === k ? { background: "var(--accent-soft)", color: "var(--accent)" } : { color: "var(--ink-soft)" }}>{l}</button>
          ))}
        </div>
        <button onClick={() => onNewCita({ fecha, hora: HL.inicio || "09:00" })} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] text-[13px] font-semibold text-white" style={{ background: "var(--accent)" }}><VIcon name="plus" size={15} />Nueva cita</button>
      </div>
      {modo === "semana" ? (
        <Card className="p-0 overflow-hidden">
          <WeekView citas={citas} pacientes={pacientes} monday={monday} onCita={onCita} onNewCita={onNewCita} onDay={(f) => { setFecha(f); setModo("dia"); }} />
        </Card>
      ) : (<>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-6">
        {week.map((d, i) => {
          const iso = window.addDays(monday, i);
          const dt = new Date(iso + "T12:00");
          const isSel = iso === fecha, isToday = iso === hoy;
          const n = citas.filter((c) => c.fecha === iso && c.estado !== "Cancelada").length;
          return (
            <button key={d} onClick={() => setFecha(iso)} className="flex flex-col items-center justify-center rounded-[12px] h-[66px] border transition"
              style={isSel ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" } : { background: "#fff", borderColor: isToday ? "var(--accent)" : "var(--line)", color: "var(--ink-soft)" }}>
              <span className="text-[11px] font-medium uppercase">{d}</span>
              <span className="text-[17px] font-bold leading-tight" style={{ color: isSel ? "#fff" : "var(--ink)" }}>{dt.getDate()}</span>
              <span className="text-[10px] h-3 leading-3" style={{ color: isSel ? "rgba(255,255,255,.85)" : "var(--accent)" }}>{n ? n + " cita" + (n > 1 ? "s" : "") : ""}</span>
            </button>
          );
        })}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b gap-3 flex-wrap" style={{ borderColor: "var(--line)" }}>
          <h2 className="text-[15px] font-bold" style={{ color: "var(--ink)" }}>{fecha === hoy ? "Hoy · " : ""}{dLabel}{!laboral && <span className="ml-2 text-[12px] font-semibold px-2 py-0.5 rounded-full align-middle" style={{ background: "#F1F3F6", color: "var(--ink-soft)" }}>{bloqueos.find((b) => b.todoDia) ? bloqueos.find((b) => b.todoDia).titulo : "Día no laboral"}</span>}</h2>
          <div className="flex items-center gap-3.5 text-[12px]" style={{ color: "var(--ink-soft)" }}>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: "var(--accent)" }}></span>{dayCitas.length} citas</span>
            {gcal.connected && <span className="inline-flex items-center gap-1.5"><GCalMark size={13} />{visible.length} de Google</span>}
            <span className="hidden sm:inline">Clic en un horario libre para agendar</span>
          </div>
        </div>
        <div className="relative px-5 py-3 cursor-copy" style={{ height: hours.length * ROW }} onClick={clickGrid}>
          {hours.map((h, i) => (
            <div key={h} className="absolute left-0 right-0 flex items-start pointer-events-none" style={{ top: i * ROW + 12 }}>
              <span className="w-[54px] text-right pr-3 text-[11.5px] -mt-1.5 tabular-nums" style={{ color: "var(--ink-soft)" }}>{String(h).padStart(2, "0")}:00</span>
              <div className="flex-1 border-t" style={{ borderColor: "var(--line)" }}></div>
            </div>
          ))}
          {laboral && toMin(HL.inicio) > base && <div className="absolute left-[66px] right-3 pointer-events-none" style={{ top: 12, height: ((toMin(HL.inicio) - base) / 60) * ROW, background: "rgba(120,130,150,.07)" }}></div>}
          {laboral && toMin(HL.fin) < top && <div className="absolute left-[66px] right-3 pointer-events-none" style={{ top: 12 + ((toMin(HL.fin) - base) / 60) * ROW, height: ((top - toMin(HL.fin)) / 60) * ROW, background: "rgba(120,130,150,.07)" }}></div>}
          {!laboral && <div className="absolute left-[66px] right-3 top-3 bottom-3 pointer-events-none rounded-[8px]" style={{ background: "repeating-linear-gradient(135deg, rgba(120,130,150,.06) 0 8px, transparent 8px 16px)" }}></div>}
          {bloqueos.filter((b) => !b.todoDia).map((b, i) => (
            <div key={"blq" + i} className="absolute rounded-[10px] px-3 py-1 text-[12px] font-medium pointer-events-none overflow-hidden" style={{ top: ((Math.max(toMin(b.desde), base) - base) / 60) * ROW + 12, height: Math.max(22, ((Math.min(toMin(b.hasta), top) - Math.max(toMin(b.desde), base)) / 60) * ROW - 4), left: 66, right: 12, color: "#5E6A7D", background: "repeating-linear-gradient(135deg, #EEF0F4 0 7px, #F7F8FA 7px 14px)" }}>{b.titulo} · {b.desde}–{b.hasta}</div>
          ))}
          {fecha === hoy && nowMin > base && nowMin < top && (
            <div className="absolute left-[54px] right-3 flex items-center z-10 pointer-events-none" style={{ top: 12 + ((nowMin - base) / 60) * ROW }}>
              <span className="w-2 h-2 rounded-full" style={{ background: "#E5484D" }}></span>
              <div className="flex-1 border-t" style={{ borderColor: "#E5484D" }}></div>
            </div>
          )}

          {visible.map((g) => {
            const t = ((Math.max(toMin(g.hora), base) - base) / 60) * ROW + 12;
            const hgt = ((Math.min(toMin(g.fin), top) - Math.max(toMin(g.hora), base)) / 60) * ROW - 4;
            const inner = (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold truncate" style={{ color: "var(--ink)" }}>{g.titulo}</span>
                  <span className="text-[11.5px] shrink-0 tabular-nums" style={{ color: "var(--ink-soft)" }}>{g.hora}–{g.fin}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5"><GCalMark size={12} /><span className="text-[11.5px] truncate" style={{ color: "var(--ink-soft)" }}>{g.cal}{g.meet ? " · Google Meet" : ""}</span></div>
              </>
            );
            const st = { top: t, left: 66, right: 12, height: Math.max(hgt, 34), background: "#fff", border: `1px solid ${g.color}33`, borderLeft: `3px solid ${g.color}`, backgroundImage: `repeating-linear-gradient(135deg, ${g.color}0D 0 7px, transparent 7px 14px)` };
            return g.htmlLink
              ? <a key={g.id} href={g.htmlLink} target="_blank" rel="noopener noreferrer" className="absolute rounded-[10px] px-3 py-1.5 overflow-hidden block" style={st}>{inner}</a>
              : <div key={g.id} className="absolute rounded-[10px] px-3 py-1.5 overflow-hidden" style={st}>{inner}</div>;
          })}

          {dayCitas.map((c) => {
            const t = ((Math.max(toMin(c.hora), base) - base) / 60) * ROW + 12;
            const hgt = ((Math.min(toMin(c.fin), top) - Math.max(toMin(c.hora), base)) / 60) * ROW - 4;
            const p = window.PACIENTES.find((x) => x.id === c.pid);
            if (!p) return null;
            const cancel = ["Cancelada", "No asistió", "Cancelación tardía"].includes(c.estado);
            const rk = p.riesgo && p.riesgo.nivel !== "Bajo";
            const lane = laneOf[c.id] || 0;
            return (
              <button key={c.id} onClick={() => onCita(c)}
                className="absolute rounded-[10px] px-3 py-1.5 text-left transition overflow-hidden"
                style={{ top: t, height: Math.max(hgt, 34), left: `calc(66px + (100% - 78px) * ${lane / nLanes})`, width: `calc((100% - 78px) / ${nLanes} - 4px)`,
                  background: cancel ? "#F4F5F7" : "var(--accent-soft)", borderLeft: `3px solid ${cancel ? "#A6ADB8" : "var(--accent)"}`, opacity: cancel ? .8 : 1 }}
                onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(.97)"} onMouseLeave={(e) => e.currentTarget.style.filter = "none"}>
                <div className="flex items-center gap-2">
                  {rk && <span title={"Riesgo " + p.riesgo.nivel.toLowerCase()} style={{ color: p.riesgo.nivel === "Alto" ? "#C73B3B" : "#C8862F" }}><VIcon name="alert" size={13} /></span>}
                  <span className="text-[13px] font-semibold truncate" style={{ color: "var(--ink)", textDecoration: cancel ? "line-through" : "none" }}>{p.nombre}</span>
                  <span className="text-[11.5px] shrink-0 tabular-nums" style={{ color: cancel ? "var(--ink-soft)" : "var(--accent)" }}>{c.hora}–{c.fin}</span>
                  {c.gcalId && <span className="ml-auto shrink-0 inline-flex items-center gap-1 text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full" title="Publicado en Google Calendar" style={{ background: "#fff", color: "#2F9469", border: "1px solid #D8EBE1" }}><VIcon name="check" size={11} stroke={2.6} />Google</span>}
                </div>
                <div className="text-[12px] truncate" style={{ color: "var(--ink-soft)" }}>{c.estado !== "Confirmada" ? c.estado + " · " : ""}{c.tipo} · {c.modalidad}</div>
              </button>
            );
          })}
        </div>
      </Card>
      </>)}
    </div>
  );
}

Object.assign(window, { Dashboard, Agenda, Card, Kpi });

