// ============ Psystema — main app ============
const { useState, useEffect, useRef } = React;
const { Sidebar, Topbar, MobileTabBar, Dashboard, Agenda, Pacientes, Finanzas, Expediente, FichaView, Icon, Logo, Avatar } = window;
const { NuevoPacienteModal, NuevaSesionModal, RegistrarPagoModal, CitaModal, PerfilModal, PlantillaModal, RespaldoModal, ConfirmModal, SessionEditor, DictadoPanel, DictadoEntry } = window;
const { DocModal, ContratoModal, PoliticasModal, RiesgoModal, PlanSeguridadModal, PinModal, ResumenIAModal, InformeModal } = window;
const durDe = (c) => { const [a, b] = [c.hora, c.fin].map((x) => { const [h, m] = x.split(":").map(Number); return h * 60 + m; }); return Math.max(1, b - a); };
const CANCELADAS = ["Cancelada", "Cancelación tardía", "No asistió"];
const { useTweaks, TweaksPanel, TweakSection, TweakColor, TweakRadio } = window;

const ACCENTS = {
  "#3D6FF6": { soft: "#E8EEFE", glow: "rgba(61,111,246,.40)" },
  "#2F9469": { soft: "#E4F2EB", glow: "rgba(47,148,105,.40)" },
  "#C2683F": { soft: "#F7ECE5", glow: "rgba(194,104,63,.40)" },
  "#7C5CD6": { soft: "#EFEAFB", glow: "rgba(124,92,214,.40)" },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#3D6FF6",
  "sidebar": "Oscuro",
  "density": "Regular"
}/*EDITMODE-END*/;

const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const nowHHMM = () => { const d = new Date(); return window.pad2(d.getHours()) + ":" + window.pad2(d.getMinutes()); };

function titleFor(view, pacientes) {
  const now = new Date();
  const fecha = `${window.DIAS[now.getDay()].charAt(0).toUpperCase() + window.DIAS[now.getDay()].slice(1)}, ${now.getDate()} de ${window.MESES[now.getMonth()]}`;
  const h = now.getHours();
  const saludo = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  switch (view) {
    case "dashboard": return { t: `${saludo}, ${window.THERAPIST.nombre.split(" ")[0]}`, s: fecha };
    case "agenda": return { t: "Agenda", s: "Citas y sesiones" };
    case "pacientes": return { t: "Pacientes", s: `${pacientes.length} expedientes` };
    case "finanzas": return { t: "Finanzas", s: "Honorarios e ingresos" };
    default: return { t: "Psystema", s: "" };
  }
}

// Turn the "actividades"/"plan" section of a note into homework tasks
function tareasDeNota(nota, fecha) {
  const src = nota.actividades || nota.acuerdos || "";
  return src.split(/\n+/).map((l) => l.replace(/^\s*(\d+[.)]|[-•*])\s*/, "").trim()).filter((l) => l.length > 2)
    .map((titulo) => ({ titulo, estado: "pendiente", fecha: "Asignada " + fecha.slice(8, 10) + "/" + fecha.slice(5, 7) }));
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useState("dashboard");
  const [selId, setSel] = useState(() => (window.PACIENTES[0] && window.PACIENTES[0].id) || null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // {type, pid, cita, preset}
  const [sesion, setSesion] = useState(null); // {pid, start}
  const [pacientes, setPacientes] = useState(window.PACIENTES);
  const [pagos, setPagos] = useState(window.PAGOS);
  const [citas, setCitas] = useState(window.CITAS);
  const [toast, setToast] = useState(null);
  const [oculto, setOculto] = useState(false);
  const [pinActivo, setPinActivo] = useState(window.PIN_ACTIVO);
  const [bloqueado, setBloqueado] = useState(window.PIN_ACTIVO);
  const keyRef = useRef(null);
  const cargado = useRef(!window.PIN_ACTIVO);
  const saveSeq = useRef(0);
  window.PIN_ACTIVO_RUNTIME = pinActivo;
  const [, setTick] = useState(0);
  const rerender = () => setTick((n) => n + 1);

  const dark = t.sidebar === "Oscuro";

  useEffect(() => { window.__setView = setView; window.__setSearch = setSearch; const b = document.getElementById("boot"); if (b) b.remove(); }, []);

  useEffect(() => {
    const a = ACCENTS[t.accent] || ACCENTS["#3D6FF6"];
    const r = document.documentElement;
    r.style.setProperty("--accent", t.accent);
    r.style.setProperty("--accent-soft", a.soft);
    r.style.setProperty("--accent-glow", a.glow);
    r.setAttribute("data-density", ({ Compacto: "compact", Regular: "regular", "Cómodo": "comfy" }[t.density]) || "regular");
  }, [t.accent, t.density]);

  // keep window arrays in sync + save everything in this browser
  useEffect(() => {
    window.PACIENTES = pacientes; window.PAGOS = pagos; window.CITAS = citas;
    if (window.PSY_CLOUD) { window.PSY_CLOUD.sync({ pacientes, pagos, citas }); return; }
    if (!cargado.current) return; // locked: never overwrite the encrypted data with an empty set
    if (keyRef.current) {
      const n = ++saveSeq.current;
      window.cifrar(keyRef.current, { pacientes, pagos, citas }).then((b) => { if (n === saveSeq.current) { window.lsSet("datos_v1_enc", b); window.lsDel("datos_v1"); } });
    } else window.lsSet("datos_v1", { pacientes, pagos, citas });
  }, [pacientes, pagos, citas]);

  const flash = (msg, action) => { setToast({ msg, action }); clearTimeout(window.__toastT); window.__toastT = setTimeout(() => setToast(null), action ? 6000 : 2600); };
  const onModal = (type, pid, extra) => { if (type === "sesion") { startSesion(pid); return; } setModal({ type, pid, ...(extra || {}) }); };

  // auto-hide the screen after inactivity (no PIN for now)
  useEffect(() => {
    const min = Number(window.POLITICAS.autoOcultarMin) || 0;
    if (!min) return;
    let t;
    const reset = () => { clearTimeout(t); t = setTimeout(() => setOculto(true), min * 60000); };
    const evs = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    evs.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => { clearTimeout(t); evs.forEach((e) => window.removeEventListener(e, reset)); };
  });
  const onCita = (cita, preset) => setModal({ type: "cita", cita, preset });
  const openPaciente = (pid) => { setSel(pid); setView("pacientes"); setModal(null); };

  // ----- PIN -----
  // the cloud app can replace the data when another device saved changes
  useEffect(() => { window.__psyReplace = (d) => { setPacientes(d.pacientes || []); setPagos(d.pagos || []); setCitas(d.citas || []); rerender(); }; }, []);
  const unlock = async (pin) => {
    if (window.PSY_CLOUD) { const ok = await window.PSY_CLOUD.checkPin(pin); if (ok) { setBloqueado(false); setOculto(false); } return ok; }
    const key = await window.probarPin(pin);
    if (!key) return false;
    if (!cargado.current) {
      const blob = window.lsGet("datos_v1_enc", null);
      let d = { pacientes: [], pagos: [], citas: [] };
      if (blob) { try { d = await window.descifrar(key, blob); } catch (e) { return false; } }
      keyRef.current = key; cargado.current = true;
      setPacientes(d.pacientes || []); setPagos(d.pagos || []); setCitas(d.citas || []);
      setSel((d.pacientes && d.pacientes[0] && d.pacientes[0].id) || null);
    }
    keyRef.current = key; setBloqueado(false); setOculto(false);
    return true;
  };
  const setPin = async (pin) => {
    if (window.PSY_CLOUD) { await window.PSY_CLOUD.setPin(pin); setPinActivo(true); setModal(null); flash("PIN activado en este dispositivo"); return; }
    const salt = window.nuevaSal();
    const key = await window.pinKey(pin, salt);
    const check = await window.cifrar(key, "psystema");
    window.lsSet("datos_v1_enc", await window.cifrar(key, { pacientes, pagos, citas }));
    window.lsSet("pin_v1", { salt, check });
    window.lsDel("datos_v1");
    keyRef.current = key; setPinActivo(true); setModal(null); flash("PIN activado · tus expedientes quedan cifrados");
  };
  const removePin = async () => {
    if (window.PSY_CLOUD) { window.PSY_CLOUD.removePin(); setPinActivo(false); setModal(null); flash("PIN eliminado"); return; }
    window.lsSet("datos_v1", { pacientes, pagos, citas });
    window.lsDel("datos_v1_enc"); window.lsDel("pin_v1");
    keyRef.current = null; setPinActivo(false); setModal(null); flash("PIN eliminado");
  };

  // ----- registrar sesión (nota con fecha tomada del calendario) -----
  const fechaAuto = (pid) => {
    const p = pacientes.find((x) => x.id === pid);
    const hoy = window.todayISO();
    const hechas = new Set(((p && p.historial) || []).map((s) => s.fecha));
    const c = citas.filter((c) => c.pid === pid && !CANCELADAS.includes(c.estado) && c.fecha <= hoy && !hechas.has(c.fecha))
      .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora))[0];
    const P = window.POLITICAS;
    if (c) return { fecha: c.fecha, duracion: String(durDe(c)), origen: "cita" };
    return { fecha: hoy, duracion: String(p && p.tipo === "Pareja" ? P.durPareja : P.durIndividual), origen: "hoy" };
  };
  const startSesion = (pid, opts) => {
    let id = pid;
    if (!id) {
      const hoy = window.todayISO(), ahora = nowHHMM();
      const c = citas.filter((c) => c.fecha === hoy && !CANCELADAS.includes(c.estado) && c.hora <= ahora)
        .sort((a, b) => b.hora.localeCompare(a.hora))[0];
      id = (c && c.pid) || selId || (pacientes[0] && pacientes[0].id);
    }
    if (!id || !pacientes.some((p) => p.id === id)) { flash("Primero crea un paciente"); onModal("paciente"); return; }
    setSel(id); setModal(null); setSesion({ pid: id, ...fechaAuto(id), ...(opts || {}) });
  };
  const endSesion = () => setSesion(null);

  // ----- pacientes -----
  const savePaciente = (f) => {
    const editId = modal && modal.type === "editar" ? modal.pid : null;
    const clean = {
      nombre: f.nombre.trim(), edad: f.edad ? Number(f.edad) || f.edad : "—", genero: f.genero,
      telefono: f.telefono || "—", email: f.email || "—", direccion: f.direccion || "—", lugarNacimiento: f.lugarNacimiento || "—",
      estadoCivil: f.estadoCivil || "—", ocupacion: f.ocupacion || "—", estudios: f.estudios || "—", viveCon: f.viveCon || "—",
      hijos: f.hijos || "—", emergencia: f.emergencia || "—", motivo: f.motivo.trim(), enfoque: f.enfoque || "",
      motivoConsulta: f.motivoConsulta || "", historiaClinica: f.historiaClinica || "", tarifa: Number(f.tarifa) || 0,
      consentimiento: !!f.consentimiento,
      etiquetas: f.etiquetas || [], disponibilidad: f.disponibilidad || "",
      tipo: f.tipo || "Individual",
      miembros: f.tipo === "Pareja" ? [{ pid: f.m1pid || "", nombre: (f.m1nombre || "").trim() }, { pid: f.m2pid || "", nombre: (f.m2nombre || "").trim() }] : [],
    };
    if (editId) {
      setPacientes((prev) => prev.map((p) => p.id === editId ? { ...p, ...clean, estado: f.estado || p.estado } : p));
      setModal(null); flash("Expediente actualizado"); return;
    }
    const year = window.todayISO().slice(0, 4);
    const seq = pacientes.map((p) => String(p.folio || "")).filter((x) => x.indexOf("PSY-" + year + "-") === 0).map((x) => Number(x.split("-")[2]) || 0);
    const folio = "PSY-" + year + "-" + String((seq.length ? Math.max(...seq) : 0) + 1).padStart(3, "0");
    const id = uid("p");
    const nuevo = { id, folio, ...clean, estado: f.espera ? "En espera" : "Nuevo", alta: window.todayISO(), sesiones: 0, tareas: [], historial: [] };
    setPacientes((p) => [nuevo, ...p]); setModal(null); setSel(id); setView("pacientes");
    flash("Expediente de " + nuevo.nombre.split(" ")[0] + " creado", { label: "Agendar cita", onClick: () => onCita(null, { pid: id, fecha: window.todayISO() }) });
  };
  const deletePaciente = (id) => {
    setPacientes((p) => p.filter((x) => x.id !== id));
    setPagos((g) => g.filter((x) => x.pid !== id));
    setCitas((c) => c.filter((x) => x.pid !== id));
    window.lsDel("borrador_" + id);
    setSel(null); setModal(null); flash("Expediente eliminado");
  };
  const setTareas = (pid, tareas) => setPacientes((prev) => prev.map((p) => p.id === pid ? { ...p, tareas } : p));

  // ----- notas de sesión -----
  const saveNota = ({ pid, fecha, duracion, cargo, nota }) => {
    const p = pacientes.find((x) => x.id === pid); if (!p) return;
    const f = fecha || window.todayISO();
    const entry = { fecha: f, duracion: duracion || "50 min", ...nota };
    const nuevas = tareasDeNota(nota, f);
    setPacientes((prev) => prev.map((x) => {
      if (x.id !== pid) return x;
      const historial = [entry, ...x.historial].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
      return { ...x, sesiones: (x.sesiones || 0) + 1, historial, estado: x.estado === "Nuevo" ? "Activo" : x.estado, tareas: [...nuevas, ...(x.tareas || [])] };
    }));
    const cita = citas.find((c) => c.pid === pid && c.fecha === f && ["Confirmada", "Pendiente"].includes(c.estado));
    if (cita) setCitas((cs) => cs.map((c) => c.id === cita.id ? { ...c, estado: "Realizada" } : c));
    if (cargo && Number(p.tarifa) > 0) {
      setPagos((g) => [{ id: uid("g"), pid, fecha: f, concepto: (cita && cita.tipo) || "Sesión", monto: Number(p.tarifa), metodo: "—", estado: "Pendiente" }, ...g]);
    }
    window.lsDel("borrador_" + pid);
    setModal(null);
    flash("Nota guardada" + (nuevas.length ? ` · ${nuevas.length} tarea${nuevas.length > 1 ? "s" : ""} agregada${nuevas.length > 1 ? "s" : ""}` : ""));
  };

  // ----- pagos: settle pending charges first, oldest first -----
  const savePago = ({ pid, monto, concepto, metodo, fecha }) => {
    let rest = monto; const f = fecha || window.todayISO();
    let next = pagos.map((g) => ({ ...g }));
    const pend = next.filter((g) => g.pid === pid && g.estado === "Pendiente").sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    for (const g of pend) {
      if (rest <= 0) break;
      if (rest >= g.monto) { g.estado = "Pagado"; g.metodo = metodo; g.fecha = f; rest -= g.monto; }
      else { g.monto -= rest; next.unshift({ id: uid("g"), pid, fecha: f, concepto: g.concepto + " (abono)", monto: rest, metodo, estado: "Pagado" }); rest = 0; }
    }
    if (rest > 0) next.unshift({ id: uid("g"), pid, fecha: f, concepto, monto: rest, metodo, estado: "Pagado" });
    setPagos(next);
    setPacientes((prev) => prev.map((x) => x.id === pid && x.pagoAdelantado ? { ...x, pagoAdelantado: false } : x));
    setModal(null); flash("Pago de " + window.fmtMoney(monto) + " registrado");
  };
  const marcarPagado = (gid) => {
    const g = pagos.find((x) => x.id === gid); if (!g) return;
    setModal({ type: "pago", pid: g.pid });
  };

  // ----- citas -----
  const saveCita = (c, repetir) => {
    if (c.id) {
      const prev = citas.find((x) => x.id === c.id) || {};
      const falta = (c.estado === "No asistió" || c.estado === "Cancelación tardía") && prev.estado !== c.estado;
      const p = pacientes.find((x) => x.id === c.pid);
      let next = { ...c };
      if (falta && window.POLITICAS.cargoInasistencia && !c.cargoId && p && Number(p.tarifa) > 0) {
        const gid = uid("g");
        setPagos((g) => [{ id: gid, pid: c.pid, fecha: c.fecha, concepto: c.estado === "No asistió" ? "Inasistencia sin aviso" : `Cancelación con menos de ${window.POLITICAS.horasAviso} h`, monto: Number(p.tarifa), metodo: "—", estado: "Pendiente" }, ...g]);
        setPacientes((ps) => ps.map((x) => x.id === c.pid ? { ...x, pagoAdelantado: true } : x));
        next.cargoId = gid;
        flash("Cita actualizada · cargo generado según tu política");
      } else flash("Cita actualizada");
      setCitas((cs) => cs.map((x) => x.id === c.id ? next : x)); setModal(null); return;
    }
    const serie = [];
    for (let i = 0; i <= (repetir || 0); i++) serie.push({ ...c, id: uid("c"), fecha: window.addDays(c.fecha, 7 * i) });
    setCitas((cs) => [...cs, ...serie]); setModal(null);
    const p = pacientes.find((x) => x.id === c.pid);
    flash(serie.length > 1 ? `${serie.length} citas agendadas` : "Cita agendada", p ? { label: "Agregar a Google Calendar", href: window.gcalTemplateUrl(serie[0], p) } : null);
  };
  const deleteCita = (id) => { setCitas((cs) => cs.filter((x) => x.id !== id)); setModal(null); flash("Cita eliminada"); };
  const onPublished = (map) => setCitas((cs) => cs.map((c) => map[c.id] ? { ...c, gcalId: map[c.id] } : c));

  // ----- cuenta / ajustes -----
  const onMenu = (k) => {
    if (k === "salir") { if (window.PSY_CLOUD) window.PSY_CLOUD.signOut(); return; }
    if (k === "limpiar") setModal({ type: "limpiar" });
    else setModal({ type: k });
  };
  const savePerfil = (f) => {
    const clean = { nombre: f.nombre.trim(), titulo: (f.titulo || "").trim(), rol: (f.rol || "").trim(), cedula: (f.cedula || "").trim(), genero: f.genero };
    Object.assign(window.THERAPIST, clean); window.lsSet("perfil_v1", clean);
    setModal(null); rerender(); flash("Perfil actualizado");
  };
  const saveResumen = (pid, r) => { setPacientes((prev) => prev.map((x) => x.id === pid ? { ...x, resumenIA: r } : x)); setModal(null); flash("Resumen guardado en el expediente"); };
  const saveDoc = (pid, d) => { setPacientes((prev) => prev.map((x) => x.id === pid ? { ...x, documentos: [d, ...(x.documentos || [])] } : x)); setModal(null); flash("Documento guardado en el expediente"); };
  const savePoliticas = (c) => { window.setPoliticas(c); setModal(null); rerender(); flash("Políticas guardadas"); };
  const onSigned = ({ pid, folio, fecha, tipo, titulo, html }) => {
    setPacientes((prev) => prev.map((x) => x.id === pid ? { ...x, consentimiento: true, fechaConsentimiento: fecha, documentos: [{ folio, fecha, tipo, titulo, html }, ...(x.documentos || [])] } : x));
    setModal(null); flash("Contrato " + folio + " registrado como firmado");
  };
  const saveRiesgo = (pid, v) => {
    const p = pacientes.find((x) => x.id === pid);
    setPacientes((prev) => prev.map((x) => x.id === pid ? { ...x, riesgo: v, riesgoHist: [v, ...(x.riesgoHist || [])] } : x));
    setModal(null);
    if (v.nivel !== "Bajo" && p && !p.planSeguridad) flash("Valoración guardada · riesgo " + v.nivel.toLowerCase(), { label: "Elaborar plan de seguridad", onClick: () => setModal({ type: "plan", pid }) });
    else flash("Valoración guardada");
  };
  const savePlan = (pid, plan) => { setPacientes((prev) => prev.map((x) => x.id === pid ? { ...x, planSeguridad: plan } : x)); setModal(null); flash("Plan de seguridad guardado"); };
  const savePlantilla = (c) => { window.setNotaCfg(c); setModal(null); rerender(); flash("Plantilla guardada"); };
  const getData = () => ({ app: "psystema", version: 1, exportado: new Date().toISOString(), perfil: window.THERAPIST, notaCfg: window.NOTA_CFG, pacientes, pagos, citas });
  const importData = (d) => {
    setPacientes(d.pacientes || []); setPagos(d.pagos || []); setCitas(d.citas || []);
    if (d.perfil) { Object.assign(window.THERAPIST, d.perfil); window.lsSet("perfil_v1", d.perfil); }
    if (d.notaCfg) window.setNotaCfg(d.notaCfg);
    setSel((d.pacientes && d.pacientes[0] && d.pacientes[0].id) || null); setModal(null); rerender(); flash("Respaldo importado");
  };
  const limpiar = () => { setPacientes([]); setPagos([]); setCitas([]); setSel(null); setModal(null); setView("dashboard"); flash("Listo: empiezas con la app vacía"); };

  // ----- avisos (bell) -----
  const hoy = window.todayISO(), ahora = nowHHMM();
  const avisos = [];
  const prox = citas.filter((c) => c.fecha === hoy && c.hora >= ahora && !["Cancelada", "Realizada", "No asistió"].includes(c.estado)).sort((a, b) => a.hora.localeCompare(b.hora))[0];
  if (prox) { const p = pacientes.find((x) => x.id === prox.pid); if (p) avisos.push({ icon: "clock", text: `Próxima cita: ${p.nombre} a las ${prox.hora}`, onClick: () => onCita(prox) }); }
  const sinConf = citas.filter((c) => c.fecha >= hoy && c.fecha <= window.addDays(hoy, 1) && c.estado === "Pendiente").length;
  if (sinConf) avisos.push({ icon: "calendar", color: "#9A6B12", text: `${sinConf} cita${sinConf > 1 ? "s" : ""} de hoy/mañana sin confirmar`, onClick: () => setView("agenda") });
  const pend = pagos.filter((g) => g.estado === "Pendiente" && pacientes.some((p) => p.id === g.pid));
  if (pend.length) avisos.push({ icon: "wallet", color: "#9A6B12", text: `${pend.length} cobro${pend.length > 1 ? "s" : ""} pendiente${pend.length > 1 ? "s" : ""} · ${window.fmtMoney(pend.reduce((a, g) => a + g.monto, 0))}`, onClick: () => setView("finanzas") });
  const ult = window.lsGet("ultimo_respaldo", 0);
  if (pacientes.length && (!ult || Date.now() - ult > 7 * 864e5)) avisos.unshift({ icon: "external", color: "#9A6B12", text: ult ? `Tu último respaldo fue hace ${Math.floor((Date.now() - ult) / 864e5)} días. Respalda tus datos.` : "Aún no has hecho ningún respaldo de tus datos.", onClick: () => setModal({ type: "respaldo" }) });
  const enRiesgo = citas.filter((c) => c.fecha === hoy && !CANCELADAS.includes(c.estado)).map((c) => pacientes.find((x) => x.id === c.pid)).filter((p) => p && p.riesgo && p.riesgo.nivel !== "Bajo");
  enRiesgo.forEach((p) => avisos.unshift({ icon: "alert", color: "#C73B3B", text: `Hoy atiendes a ${p.nombre} · riesgo ${p.riesgo.nivel.toLowerCase()}`, onClick: () => openPaciente(p.id) }));
  const sinCons = pacientes.filter((p) => !p.consentimiento && !["Alta"].includes(p.estado)).length;
  if (sinCons) avisos.push({ icon: "note", color: "#9A6B12", text: `${sinCons} expediente${sinCons > 1 ? "s" : ""} sin consentimiento informado registrado`, onClick: () => setView("pacientes") });

  const head = titleFor(view, pacientes);
  const citasHoy = citas.filter((c) => c.fecha === hoy && !CANCELADAS.includes(c.estado)).length;
  const menuItems = [
    { icon: "user", label: "Mi perfil", onClick: () => onMenu("perfil") },
    { icon: "sparkles", label: "Plantilla de notas y dictado", onClick: () => onMenu("plantilla") },
    { icon: "shield", label: "Políticas del consultorio", onClick: () => onMenu("politicas") },
    { icon: "file", label: "Generar contrato", onClick: () => onMenu("contrato") },
    { icon: "external", label: "Respaldo: exportar / importar", onClick: () => onMenu("respaldo") },
  ].concat(window.PSY_CLOUD ? [{ icon: "logout", label: "Cerrar sesión", danger: true, onClick: () => onMenu("salir") }] : []);

  const modals = (
    <ModalLayer modal={modal} setModal={setModal} pacientes={pacientes} pagos={pagos}
      savePaciente={savePaciente} deletePaciente={deletePaciente} saveNota={saveNota} savePago={savePago}
      saveCita={saveCita} deleteCita={deleteCita} startSesion={startSesion} openPaciente={openPaciente}
      savePerfil={savePerfil} savePlantilla={savePlantilla} getData={getData} importData={importData} limpiar={limpiar}
      savePoliticas={savePoliticas} onSigned={onSigned} saveRiesgo={saveRiesgo} savePlan={savePlan}
      citas={citas} setPin={setPin} removePin={removePin} saveResumen={saveResumen} saveDoc={saveDoc} />
  );
  const cortina = oculto && (
    <PantallaOculta onShow={() => setOculto(false)} pin={pinActivo} onUnlock={unlock} />
  );

  if (bloqueado) return <PantallaOculta pin inicio onUnlock={unlock} />;

  if (sesion) {
    return (<><SessionView sesion={sesion} pacientes={pacientes} setSesionPid={(pid) => setSesion({ pid, ...fechaAuto(pid) })} onEnd={endSesion} onSave={saveNota} flash={flash} />
      {modals}
      <TweaksUI t={t} setTweak={setTweak} />
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}{cortina}</>);
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <div className="hidden md:block h-full"><Sidebar view={view} setView={setView} dark={dark} citasCount={citasHoy} onMenu={onMenu} /></div>
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <Topbar title={head.t} subtitle={head.s} onSesion={() => startSesion()} search={search} setSearch={setSearch} showSearch={view === "pacientes"} avisos={avisos} menuItems={menuItems} onOcultar={() => setOculto(true)} />
        <main className="flex-1 overflow-y-auto overscroll-contain pb-[calc(76px+env(safe-area-inset-bottom))] md:pb-0">
          {view === "dashboard" && <Dashboard onModal={onModal} onCita={onCita} onOpen={openPaciente} onStart={startSesion} pacientes={pacientes} citas={citas} pagos={pagos} />}
          {view === "agenda" && <Agenda citas={citas} pacientes={pacientes} onCita={(c) => onCita(c)} onNewCita={(preset) => onCita(null, preset)} onStart={startSesion} onPublished={onPublished} />}
          {view === "pacientes" && <Pacientes pacientes={pacientes} selId={selId} setSel={setSel} search={search} onModal={onModal} onStart={startSesion} onTareas={setTareas} citas={citas} pagos={pagos} onCita={onCita} />}
          {view === "finanzas" && <Finanzas pagos={pagos} pacientes={pacientes} citas={citas} onModal={onModal} onMarcarPagado={marcarPagado} />}
        </main>
      </div>
      <MobileTabBar view={view} setView={setView} onAdd={() => onModal("paciente")} />
      {modals}
      <TweaksUI t={t} setTweak={setTweak} />
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      {window.SyncBadge && <window.SyncBadge />}
      {cortina}
    </div>
  );
}

// ----- Registrar sesión: write/narrate the note after the session -----
function SessionView({ sesion, pacientes, setSesionPid, onEnd, onSave, flash }) {
  const sel = pacientes.find((p) => p.id === sesion.pid) || pacientes[0];
  const fields = window.camposPara(sel);
  const loadDraft = (pid) => window.lsGet("borrador_" + pid, null);
  const initDraft = (pid) => { const d = loadDraft(pid); return d && d.nota ? { ...window.emptySession(window.camposPara(pacientes.find((p) => p.id === pid))), ...d.nota } : window.emptySession(window.camposPara(pacientes.find((p) => p.id === pid))); };
  const [draft, setDraft] = useState(() => initDraft(sesion.pid));
  const [narr, setNarr] = useState(() => { const d = loadDraft(sesion.pid); return (d && d.narr) || ""; });
  const [fecha, setFecha] = useState(sesion.fecha || window.todayISO());
  const [duracion, setDuracion] = useState(sesion.duracion || String(window.POLITICAS.durIndividual));
  const [showFicha, setShowFicha] = useState(false);
  const [dictado, setDictado] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);
  const [cargo, setCargo] = useState(true);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const first = useRef(true);
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const d = loadDraft(sesion.pid);
    setDraft(initDraft(sesion.pid)); setNarr((d && d.narr) || "");
    setFecha(sesion.fecha || window.todayISO()); setDuracion(sesion.duracion || String(window.POLITICAS.durIndividual));
    setShowFicha(false); setDictado(false); setAiUsed(false);
  }, [sesion.pid]);
  const hasContent = Object.values(draft).some((v) => String(v || "").trim());
  useEffect(() => {
    if (hasContent || narr.trim()) window.lsSet("borrador_" + sesion.pid, { nota: draft, narr, t: Date.now() });
  }, [draft, narr]);

  const applyDictado = (out) => { setDraft((d) => ({ ...d, ...out })); setAiUsed(true); setDictado(false); if (flash) flash("Nota estructurada · revísala antes de guardar"); };
  const guardar = () => { onSave({ pid: sesion.pid, fecha, duracion: (duracion || "50") + " min", cargo, nota: draft }); onEnd(); };
  const descartar = () => { window.lsDel("borrador_" + sesion.pid); setConfirmDiscard(false); onEnd(); };
  const yaHay = (sel.historial || []).some((s) => s.fecha === fecha);
  const inp = "h-9 px-2.5 rounded-[9px] text-[13.5px] bg-white outline-none";

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: "var(--bg)" }}>
      <header className="flex items-center gap-3 md:gap-4 px-4 md:px-7 border-b shrink-0" style={{ height: 64, borderColor: "var(--line)", background: "#fff" }}>
        <button onClick={onEnd} aria-label="Volver" className="grid place-items-center w-9 h-9 rounded-[9px] hover:bg-[#F2F4F7]" style={{ color: "var(--ink-soft)" }}><Icon name="arrow-left" size={18} /></button>
        <div className="min-w-0">
          <div className="text-[15px] font-bold truncate" style={{ color: "var(--ink)" }}>Registrar sesión</div>
          <div className="text-[12px] truncate" style={{ color: "var(--ink-soft)" }}>{hasContent ? "Borrador guardado automáticamente" : "Narra o escribe lo que pasó en la sesión"}</div>
        </div>
        {sel.riesgo && sel.riesgo.nivel !== "Bajo" && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ background: sel.riesgo.nivel === "Alto" ? "#FCE4E4" : "#FFF3DB", color: sel.riesgo.nivel === "Alto" ? "#9B2222" : "#7A4F0E" }}><Icon name="alert" size={13} />Riesgo {sel.riesgo.nivel.toLowerCase()}</span>
        )}
        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <button onClick={() => setShowFicha((v) => !v)}
            className="hidden md:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] text-[13px] font-semibold transition"
            style={showFicha ? { background: "var(--accent-soft)", color: "var(--accent)" } : { background: "#fff", color: "var(--ink)", border: "1px solid var(--line)" }}>
            <Icon name="user" size={15} />Ficha
          </button>
          <button onClick={guardar} disabled={!hasContent} className="inline-flex items-center gap-1.5 h-9 px-3.5 md:px-4 rounded-[9px] text-[13px] font-semibold text-white whitespace-nowrap transition active:scale-[.98] disabled:opacity-40" style={{ background: "var(--accent)" }}>
            <Icon name="check" size={15} />Guardar<span className="hidden sm:inline"> nota</span>
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden flex">
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-[780px] mx-auto px-4 md:px-8 pt-6 pb-[calc(32px+env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-3 mb-4">
              <Avatar nombre={sel.nombre} idx={window.pidIndex(sel.id)} size={44} />
              <div className="min-w-0 flex-1">
                <select value={sesion.pid} onChange={(e) => setSesionPid(e.target.value)} aria-label="Paciente"
                  className="max-w-full h-9 pl-0 pr-8 text-[19px] font-bold tracking-[-0.02em] bg-transparent outline-none cursor-pointer" style={{ color: "var(--ink)" }}>
                  {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <div className="text-[12.5px] truncate" style={{ color: "var(--ink-soft)" }}>{sel.folio} · {sel.tipo === "Pareja" ? "Terapia de pareja · " : ""}{sel.motivo} · sesión {(sel.sesiones || 0) + 1}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-3 mb-5 p-3.5 rounded-[12px] bg-white border" style={{ borderColor: "var(--line)" }}>
              <label className="flex flex-col gap-1">
                <span className="text-[11.5px] font-semibold" style={{ color: "var(--ink-soft)" }}>FECHA DE LA SESIÓN</span>
                <input type="date" value={fecha} max={window.todayISO()} onChange={(e) => e.target.value && setFecha(e.target.value)} className={inp} style={{ border: "1px solid var(--line)", color: "var(--ink)" }} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11.5px] font-semibold" style={{ color: "var(--ink-soft)" }}>DURACIÓN (MIN)</span>
                <input inputMode="numeric" value={duracion} onChange={(e) => setDuracion(e.target.value.replace(/\D/g, ""))} className={inp + " w-[90px]"} style={{ border: "1px solid var(--line)", color: "var(--ink)" }} />
              </label>
              <span className="text-[12px] pb-2 flex-1 min-w-[180px]" style={{ color: yaHay ? "#9A6B12" : "var(--ink-soft)" }}>
                {yaHay ? "Ya existe una nota con esta fecha; se guardará como otra nota." : sesion.origen === "cita" && fecha === sesion.fecha ? "Fecha tomada de su cita en el calendario." : "Puedes cambiar la fecha si la sesión fue otro día."}
              </span>
            </div>

            {sel.historial && sel.historial[0] && (
              <details className="mb-5 rounded-[12px] border bg-white" style={{ borderColor: "var(--line)" }}>
                <summary className="px-4 py-2.5 text-[12.5px] font-semibold cursor-pointer" style={{ color: "var(--ink-soft)" }}>Ver la sesión anterior · {sel.historial[0].fecha}</summary>
                <div className="px-4 pb-4"><window.SessionNoteView s={sel.historial[0]} /></div>
              </details>
            )}

            <DictadoEntry aiUsed={aiUsed} hasNarr={!!narr.trim()} onOpen={() => setDictado(true)} />
            <p className="text-[12px] -mt-3 mb-4" style={{ color: "var(--ink-soft)" }}>¿Solo quieres agregar algo puntual? Usa el micrófono de cada apartado y luego «Pulir» para pasarlo a lenguaje clínico.</p>
            <SessionEditor value={draft} onChange={set} fields={fields} paciente={sel} />
            <div className="flex items-center justify-between gap-3 mt-6 pt-5 border-t flex-wrap" style={{ borderColor: "var(--line)" }}>
              {Number(sel.tarifa) > 0 ? (
                <label className="flex items-center gap-2 text-[12.5px] cursor-pointer" style={{ color: "var(--ink)" }}>
                  <input type="checkbox" checked={cargo} onChange={(e) => setCargo(e.target.checked)} style={{ accentColor: "var(--accent)" }} />Generar cargo de {window.fmtMoney(Number(sel.tarifa))}
                </label>
              ) : <span></span>}
              <div className="flex items-center gap-2">
                {(hasContent || narr.trim()) && <button onClick={() => setConfirmDiscard(true)} className="h-10 px-3.5 rounded-[9px] text-[13px] font-semibold hover:bg-[#F2F4F7]" style={{ color: "#B23636" }}>Descartar</button>}
                <button onClick={guardar} className="inline-flex items-center gap-1.5 h-10 px-5 rounded-[9px] text-[14px] font-semibold text-white transition active:scale-[.98] disabled:opacity-40" style={{ background: "var(--accent)" }} disabled={!hasContent}>
                  <Icon name="check" size={16} stroke={2.4} />Guardar nota
                </button>
              </div>
            </div>
          </div>
        </div>

        {showFicha && (
          <aside className="hidden md:block w-[400px] shrink-0 border-l overflow-y-auto bg-white" style={{ borderColor: "var(--line)" }}>
            <div className="px-6 py-5 border-b sticky top-0 bg-white z-10" style={{ borderColor: "var(--line)" }}>
              <h3 className="text-[15px] font-bold" style={{ color: "var(--ink)" }}>Ficha de {sel.nombre.split(" ")[0]}</h3>
            </div>
            <div className="px-6 py-5"><FichaView p={sel} /></div>
          </aside>
        )}
      </div>

      {dictado && <DictadoPanel paciente={sel} fields={fields} texto={narr} setTexto={setNarr} onApply={applyDictado} onClose={() => setDictado(false)} />}
      {confirmDiscard && <ConfirmModal danger title="Descartar nota" confirmLabel="Descartar" text="Se borrará el borrador de esta sesión y la narración dictada. No se guardará nada en el expediente." onClose={() => setConfirmDiscard(false)} onConfirm={descartar} />}
    </div>
  );
}

// ----- Hidden-screen wallpaper (privacy curtain) -----
const FONDOS = [
  { n: "Amanecer", bg: "radial-gradient(60% 70% at 15% 20%, #F7B79C 0%, transparent 60%), radial-gradient(55% 60% at 85% 25%, #F5D08B 0%, transparent 60%), radial-gradient(70% 70% at 60% 90%, #C78BB8 0%, transparent 65%), linear-gradient(160deg, #F3A68C, #8E6BA8)" },
  { n: "Océano", bg: "radial-gradient(60% 70% at 20% 25%, #5FC3E4 0%, transparent 60%), radial-gradient(60% 60% at 80% 70%, #2A6FDB 0%, transparent 60%), radial-gradient(50% 50% at 60% 15%, #9BE7D8 0%, transparent 60%), linear-gradient(160deg, #1B4F8C, #0E2A4F)" },
  { n: "Bosque", bg: "radial-gradient(60% 70% at 20% 80%, #3E8E6E 0%, transparent 60%), radial-gradient(55% 60% at 80% 20%, #A7C98B 0%, transparent 60%), radial-gradient(50% 50% at 55% 50%, #1F5E4A 0%, transparent 70%), linear-gradient(160deg, #234B3A, #0F2A22)" },
  { n: "Lavanda", bg: "radial-gradient(60% 70% at 25% 25%, #C9B6F2 0%, transparent 60%), radial-gradient(60% 60% at 80% 80%, #8C7BE0 0%, transparent 60%), radial-gradient(45% 45% at 75% 20%, #F2C6E0 0%, transparent 60%), linear-gradient(160deg, #7A6BC9, #3E356F)" },
  { n: "Noche", bg: "radial-gradient(55% 60% at 20% 20%, #3D6FF6 0%, transparent 60%), radial-gradient(60% 60% at 85% 85%, #7C5CD6 0%, transparent 60%), radial-gradient(40% 40% at 70% 25%, #1FA3A0 0%, transparent 60%), linear-gradient(160deg, #141A2E, #070A14)" },
  { n: "Arena", bg: "radial-gradient(60% 70% at 20% 30%, #F1DCC0 0%, transparent 60%), radial-gradient(60% 60% at 80% 75%, #D9A880 0%, transparent 60%), radial-gradient(45% 45% at 70% 20%, #F6EEE2 0%, transparent 60%), linear-gradient(160deg, #C8956A, #7E5A43)" },
];
function PantallaOculta({ onShow, pin, inicio, onUnlock }) {
  const [code, setCode] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const tryPin = async () => { if (!code || busy) return; setBusy(true); setErr(""); const ok = await onUnlock(code); setBusy(false); if (!ok) { setErr("PIN incorrecto"); setCode(""); } };
  const reveal = pin ? () => {} : onShow;
  const [i, setI] = useState(() => { const s = window.lsGet("fondo_oculto", "auto"); return s === "auto" ? Math.floor(Math.random() * FONDOS.length) : (Number(s) || 0) % FONDOS.length; });
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 15000); return () => clearInterval(t); }, []);
  useEffect(() => { if (pin) return; const k = (e) => { if (e.key === "Enter" || e.key === " ") onShow(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [pin]);
  const cambiar = (e) => { e.stopPropagation(); const n = (i + 1) % FONDOS.length; setI(n); window.lsSet("fondo_oculto", n); };
  const T = window.THERAPIST;
  const hora = window.pad2(now.getHours()) + ":" + window.pad2(now.getMinutes());
  const fecha = `${window.DIAS[now.getDay()]}, ${now.getDate()} de ${window.MESES[now.getMonth()]}`;
  return (
    <div className={"fixed inset-0 z-[200] overflow-hidden select-none " + (pin ? "" : "cursor-pointer")} onClick={reveal}>
      <style>{`@keyframes psDrift{0%{transform:scale(1.15) translate(0,0) rotate(0deg)}50%{transform:scale(1.25) translate(-3%,2%) rotate(4deg)}100%{transform:scale(1.15) translate(0,0) rotate(0deg)}}@keyframes psBreath{0%,100%{transform:scale(1);opacity:.95}50%{transform:scale(1.045);opacity:1}}@media (prefers-reduced-motion: reduce){.ps-anim{animation:none!important}}`}</style>
      <div className="ps-anim absolute inset-[-10%] transition-[background] duration-700" style={{ background: FONDOS[i].bg, animation: "psDrift 28s ease-in-out infinite", filter: "saturate(1.05)" }}></div>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 0%, rgba(0,0,0,.28) 100%)" }}></div>
      <div className="relative h-full flex flex-col items-center justify-center text-center px-6 text-white">
        <div className="ps-anim grid place-items-center rounded-full" style={{ width: 168, height: 168, background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.35)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", boxShadow: "0 20px 60px rgba(0,0,0,.25)", animation: "psBreath 6s ease-in-out infinite" }}>
          <span style={{ color: "#fff" }}><Logo size={92} /></span>
        </div>
        <div className="mt-6 text-[22px] font-bold tracking-[-0.01em]" style={{ textShadow: "0 2px 12px rgba(0,0,0,.25)" }}>{(T.titulo ? T.titulo + " " : "") + T.nombre}</div>
        <div className="text-[13.5px] font-medium" style={{ opacity: .85 }}>{T.rol}{T.especialidad ? " · " + T.especialidad : ""}</div>
        <div className="mt-8 text-[44px] font-light tabular-nums leading-none" style={{ textShadow: "0 2px 16px rgba(0,0,0,.25)" }}>{hora}</div>
        <div className="mt-1.5 text-[13.5px] capitalize" style={{ opacity: .85 }}>{fecha}</div>
        {pin ? (
          <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); tryPin(); }} className="mt-9 flex flex-col items-center gap-3">
            <label htmlFor="pin-in" className="text-[13px] font-medium" style={{ opacity: .9 }}>{inicio ? "Ingresa tu PIN para abrir Psystema" : "Ingresa tu PIN para continuar"}</label>
            <input id="pin-in" autoFocus type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-[200px] h-12 rounded-full text-center text-[22px] tracking-[0.5em] text-white outline-none" style={{ background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.5)", backdropFilter: "blur(10px)" }} />
            <div className="h-5 text-[13px] font-semibold" style={{ color: "#FFE1E1" }}>{err}</div>
            <button type="submit" disabled={!code || busy} className="h-11 px-6 rounded-full text-[14px] font-semibold text-white disabled:opacity-60" style={{ background: "rgba(255,255,255,.22)", border: "1px solid rgba(255,255,255,.5)" }}>{busy ? "Verificando…" : "Desbloquear"}</button>
          </form>
        ) : <button autoFocus onClick={(e) => { e.stopPropagation(); onShow(); }} className="mt-9 h-11 px-6 rounded-full text-[14px] font-semibold text-white" style={{ background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.45)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>Mostrar de nuevo</button>}
      </div>
      <button onClick={cambiar} className="absolute bottom-5 right-5 h-9 px-3.5 rounded-full text-[12.5px] font-semibold text-white" style={{ background: "rgba(0,0,0,.22)", border: "1px solid rgba(255,255,255,.3)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
        Fondo: {FONDOS[i].n} ›
      </button>
    </div>
  );
}

function ModalLayer(props) {
  const { modal, setModal, pacientes, pagos } = props;
  if (!modal) return null;
  const close = () => setModal(null);
  switch (modal.type) {
    case "paciente": return <NuevoPacienteModal onClose={close} onSave={props.savePaciente} pacientes={pacientes} />;
    case "editar": {
      const p = pacientes.find((x) => x.id === modal.pid);
      return p ? <NuevoPacienteModal inicial={p} pacientes={pacientes} onClose={close} onSave={props.savePaciente} onDelete={props.deletePaciente} /> : null;
    }
    case "sesion": return <NuevaSesionModal onClose={close} onSave={props.saveNota} pacientes={pacientes} preselect={modal.pid} />;
    case "pago": return <RegistrarPagoModal onClose={close} onSave={props.savePago} pacientes={pacientes} pagos={pagos} preselect={modal.pid} />;
    case "cita": return <CitaModal onClose={close} onSave={props.saveCita} onDelete={props.deleteCita} onStart={props.startSesion} onOpenPaciente={props.openPaciente} pacientes={pacientes} citas={props.citas} cita={modal.cita} preset={modal.preset} />;
    case "pin": return <PinModal onClose={close} onSet={props.setPin} onRemove={props.removePin} />;
    case "resumen": { const p = pacientes.find((x) => x.id === modal.pid); return p ? <ResumenIAModal paciente={p} onClose={close} onSave={props.saveResumen} /> : null; }
    case "informe": { const p = pacientes.find((x) => x.id === modal.pid); return p ? <InformeModal paciente={p} onClose={close} onSaveDoc={props.saveDoc} /> : null; }
    case "perfil": return <PerfilModal onClose={close} onSave={props.savePerfil} />;
    case "plantilla": return <PlantillaModal onClose={close} onSave={props.savePlantilla} />;
    case "respaldo": return <RespaldoModal onClose={close} getData={props.getData} onImport={props.importData} />;
    case "doc": return <DocModal title={modal.title} html={modal.html} onClose={close} />;
    case "contrato": return <ContratoModal pacientes={pacientes} preselect={modal.pid} onClose={close} onSigned={props.onSigned} onPoliticas={() => setModal({ type: "politicas" })} />;
    case "politicas": return <PoliticasModal onClose={close} onSave={props.savePoliticas} onPin={() => setModal({ type: "pin" })} />;
    case "riesgo": { const p = pacientes.find((x) => x.id === modal.pid); return p ? <RiesgoModal paciente={p} onClose={close} onSave={props.saveRiesgo} /> : null; }
    case "plan": { const p = pacientes.find((x) => x.id === modal.pid); return p ? <PlanSeguridadModal paciente={p} onClose={close} onSave={props.savePlan} /> : null; }
    case "limpiar": return <ConfirmModal danger title="Empezar sin datos de ejemplo" confirmLabel="Borrar todo"
      text="Se borrarán todos los pacientes, notas, citas y pagos guardados en este navegador (incluidos los de ejemplo). Tu perfil y tu plantilla se conservan. Si tienes datos reales, exporta un respaldo antes."
      onClose={close} onConfirm={props.limpiar} />;
    default: return null;
  }
}

function Toast({ toast, onClose }) {
  const a = toast.action;
  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[80] animate-[mpop_.2s_ease] max-w-[92vw]">
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-[11px] text-white text-[13.5px] font-medium shadow-lg" style={{ background: "var(--ink)", boxShadow: "0 10px 30px rgba(20,30,60,.25)" }}>
        <span className="grid place-items-center w-4 h-4 rounded-full shrink-0" style={{ background: "#2F9469" }}><Icon name="check" size={11} stroke={3} /></span>
        <span className="truncate">{toast.msg}</span>
        {a && (a.href
          ? <a href={a.href} target="_blank" rel="noopener noreferrer" onClick={onClose} className="ml-1 font-semibold whitespace-nowrap underline underline-offset-2" style={{ color: "#9DB8FF" }}>{a.label}</a>
          : <button onClick={() => { onClose(); a.onClick(); }} className="ml-1 font-semibold whitespace-nowrap underline underline-offset-2" style={{ color: "#9DB8FF" }}>{a.label}</button>)}
      </div>
    </div>
  );
}

function TweaksUI({ t, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Acento" />
      <TweakColor label="Color de acción" value={t.accent} options={["#3D6FF6", "#2F9469", "#C2683F", "#7C5CD6"]} onChange={(v) => setTweak("accent", v)} />
      <TweakSection label="Navegación" />
      <TweakRadio label="Barra lateral" value={t.sidebar} options={["Claro", "Oscuro"]} onChange={(v) => setTweak("sidebar", v)} />
      <TweakSection label="Densidad" />
      <TweakRadio label="Espaciado" value={t.density} options={["Compacto", "Regular", "Cómodo"]} onChange={(v) => setTweak("density", v)} />
    </TweaksPanel>
  );
}

const __root = ReactDOM.createRoot(document.getElementById("root"));
if (window.PSY_CLOUD) window.PSY_CLOUD.boot(__root, App);
else __root.render(<App />);
