// ============ Psystema — modals ============
const { Icon: MIcon, Avatar: MAvatar, fmtMoney: mFmt } = window;
const { useState: useS } = React;

function ModalShell({ title, subtitle, icon, onClose, children, footer, wide, maxW }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0" style={{ background: "rgba(24,28,38,.38)", backdropFilter: "blur(3px)" }} onMouseDown={onClose}></div>
      <div className="psy-sheet relative bg-white w-full rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col animate-[mpop_.22s_cubic-bezier(.2,.8,.2,1)]"
        style={{ maxWidth: maxW || (wide ? 640 : 480), boxShadow: "0 24px 70px rgba(20,30,60,.28)" }}>
        <div className="flex items-start gap-3.5 px-6 pt-5 pb-4 border-b" style={{ borderColor: "var(--line)" }}>
          <div className="grid place-items-center w-10 h-10 rounded-[11px] shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
            <MIcon name={icon} size={20} />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h2 className="text-[17px] font-bold tracking-[-0.01em]" style={{ color: "var(--ink)" }}>{title}</h2>
            {subtitle && <p className="text-[12.5px]" style={{ color: "var(--ink-soft)" }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="grid place-items-center w-8 h-8 rounded-lg hover:bg-[#F2F4F7] transition" style={{ color: "var(--ink-soft)" }}>
            <MIcon name="x" size={18} />
          </button>
        </div>
        <div className="px-5 sm:px-6 py-5 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="psy-safe-b px-6 py-4 border-t flex items-center gap-3 justify-end flex-wrap" style={{ borderColor: "var(--line)", background: "#FBFCFD" }}>{footer}</div>}
      </div>
    </div>
  );
}

const fieldCls = "w-full h-10 px-3 rounded-[9px] text-[14px] bg-white outline-none transition";
const areaCls = "w-full p-3 rounded-[9px] text-[14px] bg-white outline-none resize-y leading-relaxed";
function Field({ label, children, span, hint }) {
  return (
    <label className={"flex flex-col gap-1.5 " + (span ? "col-span-2" : "")}>
      <span className="text-[12.5px] font-medium" style={{ color: "var(--ink-soft)" }}>{label}</span>
      {children}
      {hint && <span className="text-[11.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>{hint}</span>}
    </label>
  );
}
function inputStyle() { return { border: "1px solid var(--line)", color: "var(--ink)" }; }
function focusBorder(e) { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }
function blurBorder(e) { e.target.style.borderColor = "var(--line)"; e.target.style.boxShadow = "none"; }
const fx = { onFocus: focusBorder, onBlur: blurBorder };

function BtnPrimary({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="h-10 px-5 rounded-[9px] text-[14px] font-semibold text-white transition active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: "var(--accent)", boxShadow: "0 1px 2px rgba(20,40,90,.18)" }}>{children}</button>
  );
}
function BtnGhost({ children, onClick, danger }) {
  return <button onClick={onClick} className="h-10 px-4 rounded-[9px] text-[14px] font-semibold transition hover:bg-[#F2F4F7]" style={{ color: danger ? "#B23636" : "var(--ink-soft)" }}>{children}</button>;
}
function Check({ checked, onChange, children }) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 w-4 h-4" style={{ accentColor: "var(--accent)" }} />
      <span className="text-[13px] leading-snug" style={{ color: "var(--ink)" }}>{children}</span>
    </label>
  );
}

// ---- Confirmation ----
function ConfirmModal({ title, text, confirmLabel, danger, onConfirm, onClose }) {
  return (
    <ModalShell icon={danger ? "x" : "check-circle"} title={title} onClose={onClose}
      footer={<><BtnGhost onClick={onClose}>Cancelar</BtnGhost>
        <button onClick={onConfirm} className="h-10 px-5 rounded-[9px] text-[14px] font-semibold text-white" style={{ background: danger ? "#C73B3B" : "var(--accent)" }}>{confirmLabel || "Confirmar"}</button></>}>
      <p className="text-[14px] leading-relaxed" style={{ color: "var(--ink)" }}>{text}</p>
    </ModalShell>
  );
}

// ---- Nuevo / editar paciente ----
const PACIENTE_VACIO = { nombre: "", edad: "", genero: "Femenino", telefono: "", email: "", direccion: "", lugarNacimiento: "", estadoCivil: "Soltera", ocupacion: "", estudios: "Licenciatura", viveCon: "", hijos: "No", emergencia: "", motivo: "", tarifa: "", motivoConsulta: "", historiaClinica: "", enfoque: "", estado: "Nuevo", consentimiento: false, etiquetas: [], disponibilidad: "", espera: false, tipo: "Individual", m1pid: "", m1nombre: "", m2pid: "", m2nombre: "" };
function NuevoPacienteModal({ onClose, onSave, onDelete, inicial, pacientes = [] }) {
  const editing = !!inicial;
  const [f, setF] = useS(() => {
    if (!inicial) return { ...PACIENTE_VACIO, tarifa: String(window.POLITICAS.tarifaIndividual) };
    const o = { ...PACIENTE_VACIO };
    Object.keys(o).forEach((k) => { if (inicial[k] != null && inicial[k] !== "—") o[k] = typeof o[k] === "boolean" ? !!inicial[k] : Array.isArray(o[k]) ? [...inicial[k]] : String(inicial[k]); });
    const ms = inicial.miembros || [];
    if (ms[0]) { o.m1pid = ms[0].pid || ""; o.m1nombre = ms[0].nombre || ""; }
    if (ms[1]) { o.m2pid = ms[1].pid || ""; o.m2nombre = ms[1].nombre || ""; }
    return o;
  });
  const [confirmDel, setConfirmDel] = useS(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const ti = (label, k, props = {}) => (
    <Field label={label} span={props.span}>
      <input className={fieldCls} style={inputStyle()} placeholder={props.ph || ""} inputMode={props.num ? "numeric" : undefined} value={f[k]} onChange={set(k)} {...fx} autoFocus={props.auto} />
    </Field>
  );
  const sel = (label, k, opts) => (
    <Field label={label}>
      <select className={fieldCls} style={inputStyle()} value={f[k]} onChange={set(k)} {...fx}>
        {opts.map((o) => <option key={o}>{o}</option>)}
      </select>
    </Field>
  );
  const pareja = f.tipo === "Pareja";
  const nombreAuto = [f.m1nombre.trim(), f.m2nombre.trim()].filter(Boolean).join(" y ");
  const ok = (f.nombre.trim() || (pareja && nombreAuto)) && f.motivo.trim();
  const individuales = pacientes.filter((x) => x.tipo !== "Pareja" && (!inicial || x.id !== inicial.id));
  const setTipo = (e) => { const t = e.target.value; setF({ ...f, tipo: t, tarifa: editing ? f.tarifa : String(t === "Pareja" ? window.POLITICAS.tarifaPareja : window.POLITICAS.tarifaIndividual) }); };
  const miembro = (n) => (
    <div className="grid grid-cols-2 gap-2 col-span-2">
      <Field label={`Miembro ${n} · expediente individual (opcional)`}>
        <select className={fieldCls} style={inputStyle()} value={f["m" + n + "pid"]} onChange={(e) => { const x = pacientes.find((y) => y.id === e.target.value); setF({ ...f, ["m" + n + "pid"]: e.target.value, ["m" + n + "nombre"]: x ? x.nombre : f["m" + n + "nombre"] }); }} {...fx}>
          <option value="">— Sin expediente individual —</option>
          {individuales.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
        </select>
      </Field>
      <Field label={`Nombre completo del miembro ${n}`}>
        <input className={fieldCls} style={inputStyle()} value={f["m" + n + "nombre"]} onChange={set("m" + n + "nombre")} placeholder="Nombre y apellidos" {...fx} />
      </Field>
    </div>
  );
  if (confirmDel) return <ConfirmModal danger title="Eliminar expediente" confirmLabel="Eliminar definitivamente"
    text={`Se eliminará el expediente de ${inicial.nombre}, con todas sus notas de sesión, citas y pagos. Esta acción no se puede deshacer. Si solo dejó de asistir, considera cambiar su estado a "Alta" o "En pausa".`}
    onClose={() => setConfirmDel(false)} onConfirm={() => onDelete(inicial.id)} />;
  return (
    <ModalShell wide icon="user" title={editing ? "Editar expediente" : "Nuevo paciente"} subtitle={editing ? inicial.folio : "Datos generales para abrir el expediente"} onClose={onClose}
      footer={<>{editing && <span className="mr-auto"><BtnGhost danger onClick={() => setConfirmDel(true)}>Eliminar</BtnGhost></span>}
        <BtnGhost onClick={onClose}>Cancelar</BtnGhost><BtnPrimary disabled={!ok} onClick={() => onSave({ ...f, nombre: f.nombre.trim() || nombreAuto })}>{editing ? "Guardar cambios" : "Crear expediente"}</BtnPrimary></>}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Tipo de expediente">
          <select className={fieldCls} style={inputStyle()} value={f.tipo} onChange={setTipo} {...fx}><option>Individual</option><option>Pareja</option></select>
        </Field>
        <div className="flex items-end text-[12px] leading-snug pb-1" style={{ color: "var(--ink-soft)" }}>{pareja ? "Un solo historial para las sesiones conjuntas. Cada miembro puede tener además su expediente individual." : ""}</div>
        {pareja && miembro(1)}
        {pareja && miembro(2)}
        {ti(pareja ? "Nombre del expediente (opcional)" : "Nombre completo *", "nombre", { span: true, ph: pareja ? (nombreAuto || "Se llena con los dos nombres") : "Nombre y apellidos", auto: !editing && !pareja })}
        {ti("Edad", "edad", { ph: "28", num: true })}
        {sel("Género", "genero", ["Femenino", "Masculino", "No binario", "Otro", "Prefiere no decir"])}
        {ti("Teléfono", "telefono", { ph: "+52 …" })}
        {ti("Correo", "email", { ph: "correo@…" })}
        {ti("Dirección", "direccion", { span: true, ph: "Calle, número, colonia, ciudad" })}
        {ti("Lugar de nacimiento", "lugarNacimiento", { ph: "Ciudad, estado" })}
        {sel("Estado civil", "estadoCivil", ["Soltera", "Soltero", "Casada", "Casado", "Unión libre", "Divorciada", "Divorciado", "Viuda", "Viudo", "Otro"])}
        {ti("Ocupación", "ocupacion", { ph: "Profesión / actividad" })}
        {sel("Nivel de estudios", "estudios", ["Primaria", "Secundaria", "Bachillerato", "Licenciatura", "Licenciatura (en curso)", "Maestría", "Doctorado", "Otro"])}
        {ti("Vive con", "viveCon", { ph: "Pareja, familia, solo/a…" })}
        {sel("¿Tiene hijos?", "hijos", ["No", "Sí, 1", "Sí, 2", "Sí, 3", "Sí, 4+"])}
        {ti("Contacto de emergencia", "emergencia", { span: true, ph: "Nombre (parentesco) · teléfono" })}
        {ti("Motivo de consulta (breve) *", "motivo", { span: true, ph: "Ej. Trastorno de ansiedad generalizada" })}
        {ti("Enfoque / objetivo de tratamiento", "enfoque", { ph: "Ej. Reestructuración cognitiva" })}
        {ti("Tarifa por sesión (MXN)", "tarifa", { num: true })}
        {editing && sel("Estado del expediente", "estado", ["En espera", "Nuevo", "Activo", "En pausa", "Alta"])}
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <Field label="Etiquetas"><window.EtiquetasInput value={f.etiquetas} onChange={(v) => setF({ ...f, etiquetas: v })} /></Field>
        {!editing && <Check checked={f.espera} onChange={(v) => setF({ ...f, espera: v })}>Agregar a la <b>lista de espera</b> (aún no tengo espacio para agendarle)</Check>}
        {(f.espera || f.estado === "En espera") && (
          <Field label="Disponibilidad / notas de la lista de espera">
            <input className={fieldCls} style={inputStyle()} value={f.disponibilidad} onChange={set("disponibilidad")} placeholder="Ej. martes y jueves después de las 17:00, online" {...fx} />
          </Field>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 mt-4">
        <Field label="Motivo de consulta (detallado)">
          <textarea value={f.motivoConsulta} onChange={set("motivoConsulta")} rows={3} placeholder="Descripción del motivo de consulta…" className={areaCls} style={inputStyle()} {...fx} />
        </Field>
        <Field label="Historia clínica">
          <textarea value={f.historiaClinica} onChange={set("historiaClinica")} rows={4} placeholder="Antecedentes, evolución, factores relevantes…" className={areaCls} style={inputStyle()} {...fx} />
        </Field>
        <Check checked={f.consentimiento} onChange={(v) => setF({ ...f, consentimiento: v })}>Consentimiento informado y aviso de privacidad firmados</Check>
      </div>
    </ModalShell>
  );
}

// ---- Nueva sesión (nota sin entrar a la pantalla de consulta) ----
function NuevaSesionModal({ onClose, onSave, pacientes, preselect }) {
  const [pid, setPid] = useS(preselect || "");
  const [sess, setSess] = useS(window.emptySession());
  const [dictado, setDictado] = useS(false);
  const [narr, setNarr] = useS("");
  const [aiUsed, setAiUsed] = useS(false);
  const [fecha, setFecha] = useS(window.todayISO());
  const [duracion, setDuracion] = useS("50");
  const [cargo, setCargo] = useS(true);
  const set = (k, v) => setSess((s) => ({ ...s, [k]: v }));
  const hasContent = Object.values(sess).some((v) => String(v).trim());
  const ok = pid && hasContent;
  const sel = pacientes.find((p) => p.id === pid) || null;
  const applyDictado = (fields) => { setSess((s) => ({ ...s, ...fields })); setAiUsed(true); setDictado(false); };
  return (
    <ModalShell wide icon="note" title="Nueva nota de sesión" subtitle="Registra una sesión ya realizada" onClose={onClose}
      footer={<>
        {sel && <span className="mr-auto"><Check checked={cargo} onChange={setCargo}>Generar cargo de {mFmt(Number(sel.tarifa) || 0)}</Check></span>}
        <BtnGhost onClick={onClose}>Cancelar</BtnGhost><BtnPrimary disabled={!ok} onClick={() => onSave({ pid, fecha, duracion: duracion + " min", cargo, nota: sess })}>Guardar nota</BtnPrimary></>}>
      <div className="grid grid-cols-2 sm:grid-cols-[1fr_150px_110px] gap-3 mb-4">
        <div className="col-span-2 sm:col-span-1">
          <Field label="Paciente">
            <select className={fieldCls} style={inputStyle()} value={pid} onChange={(e) => setPid(e.target.value)} {...fx}>
              <option value="">Selecciona…</option>
              {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Fecha"><input type="date" className={fieldCls} style={inputStyle()} value={fecha} onChange={(e) => setFecha(e.target.value)} {...fx} /></Field>
        <Field label="Duración (min)"><input className={fieldCls} style={inputStyle()} inputMode="numeric" value={duracion} onChange={(e) => setDuracion(e.target.value.replace(/\D/g, ""))} {...fx} /></Field>
      </div>

      <DictadoEntry aiUsed={aiUsed} hasNarr={!!narr.trim()} onOpen={() => setDictado(true)} />
      <SessionEditor value={sess} onChange={set} />
      {dictado && <window.DictadoPanel paciente={sel} texto={narr} setTexto={setNarr} onApply={applyDictado} onClose={() => setDictado(false)} />}
    </ModalShell>
  );
}

// Entry card that opens the dictation panel (shared by modal and consultation screen)
function DictadoEntry({ aiUsed, hasNarr, onOpen }) {
  if (aiUsed) return (
    <div className="w-full mb-5 rounded-[12px] px-4 py-2.5 flex items-center gap-2.5" style={{ background: "#FAFBFD", border: "1px solid var(--line)" }}>
      <span className="grid place-items-center w-6 h-6 rounded-full shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}><MIcon name="sparkles" size={13} /></span>
      <span className="text-[12.5px] flex-1" style={{ color: "var(--ink-soft)" }}>Redactado por el asistente · revísalo y ajústalo antes de guardar.</span>
      <button onClick={onOpen} className="text-[12.5px] font-semibold inline-flex items-center gap-1" style={{ color: "var(--accent)" }}><MIcon name="mic" size={13} />Seguir dictando</button>
    </div>
  );
  return (
    <button onClick={onOpen}
      className="w-full text-left mb-5 rounded-[14px] px-4 py-3.5 flex items-center gap-3.5 transition"
      style={{ background: "var(--accent-soft)", border: "1px solid transparent" }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent)"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}>
      <span className="grid place-items-center w-10 h-10 rounded-[11px] shrink-0 text-white" style={{ background: "var(--accent)" }}>
        <MIcon name="mic" size={19} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold flex items-center gap-1.5" style={{ color: "var(--ink)" }}>
          {hasNarr ? "Continuar dictado" : "Dictado inteligente"} <MIcon name="sparkles" size={13} style={{ color: "var(--accent)" }} />
        </div>
        <div className="text-[12.5px]" style={{ color: "var(--ink-soft)" }}>Narra la sesión con tu voz y el asistente la redacta en los apartados de tu plantilla.</div>
      </div>
      <span className="hidden sm:inline-flex items-center gap-1 text-[13px] font-semibold shrink-0" style={{ color: "var(--accent)" }}>
        Iniciar<MIcon name="chevron-right" size={15} />
      </span>
    </button>
  );
}

// ---- Registrar pago ----
function RegistrarPagoModal({ onClose, onSave, pacientes, pagos, preselect }) {
  const pend0 = preselect ? window.saldoDe(preselect, pagos) : 0;
  const p0 = pacientes.find((x) => x.id === preselect);
  const [pid, setPid] = useS(preselect || "");
  const [monto, setMonto] = useS(preselect ? String(pend0 || (p0 && p0.tarifa) || "") : "");
  const [concepto, setConcepto] = useS("Sesión");
  const [metodo, setMetodo] = useS("Transferencia");
  const [fecha, setFecha] = useS(window.todayISO());
  const ok = pid && Number(monto) > 0;
  const p = pacientes.find((x) => x.id === pid);
  const saldo = pid ? window.saldoDe(pid, pagos) : 0;
  return (
    <ModalShell icon="money" title="Registrar pago" subtitle="Se aplica primero a los cargos pendientes" onClose={onClose}
      footer={<><BtnGhost onClick={onClose}>Cancelar</BtnGhost><BtnPrimary disabled={!ok} onClick={() => onSave({ pid, monto: Number(monto), concepto, metodo, fecha })}>Registrar {ok ? mFmt(Number(monto)) : "pago"}</BtnPrimary></>}>
      <div className="flex flex-col gap-4">
        <Field label="Paciente">
          <select className={fieldCls} style={inputStyle()} value={pid} onChange={(e) => { const id = e.target.value; setPid(id); const px = pacientes.find((x) => x.id === id); const s = id ? window.saldoDe(id, pagos) : 0; setMonto(px ? String(s || px.tarifa) : ""); }} {...fx}>
            <option value="">Selecciona…</option>
            {pacientes.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Monto (MXN)">
            <input className={fieldCls} style={inputStyle()} inputMode="numeric" placeholder={p ? String(p.tarifa) : "850"} value={monto} onChange={(e) => setMonto(e.target.value.replace(/[^\d.]/g, ""))} {...fx} />
          </Field>
          <Field label="Método">
            <select className={fieldCls} style={inputStyle()} value={metodo} onChange={(e) => setMetodo(e.target.value)} {...fx}>
              <option>Transferencia</option><option>Efectivo</option><option>Tarjeta</option>
            </select>
          </Field>
          <Field label="Concepto">
            <select className={fieldCls} style={inputStyle()} value={concepto} onChange={(e) => setConcepto(e.target.value)} {...fx}>
              <option>Sesión</option><option>Seguimiento</option><option>Primera consulta</option><option>Sesión familiar</option><option>Paquete de sesiones</option><option>Evaluación / pruebas</option>
            </select>
          </Field>
          <Field label="Fecha"><input type="date" className={fieldCls} style={inputStyle()} value={fecha} onChange={(e) => setFecha(e.target.value)} {...fx} /></Field>
        </div>
        {p && (
          <div className="flex items-center gap-3 p-3 rounded-[10px]" style={{ background: "var(--accent-soft)" }}>
            <MAvatar nombre={p.nombre} idx={window.pidIndex(p.id)} size={34} />
            <div className="text-[13px]"><div className="font-semibold" style={{ color: "var(--ink)" }}>{p.nombre}</div>
              <div style={{ color: "var(--ink-soft)" }}>{saldo > 0 ? `Saldo pendiente: ${mFmt(saldo)}` : "Sin saldo pendiente"}</div></div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

// ---- Cita: crear / editar ----
const addMin = (hhmm, min) => { const [h, m] = hhmm.split(":").map(Number); const t = h * 60 + m + Number(min || 0); return window.pad2(Math.floor(t / 60) % 24) + ":" + window.pad2(t % 60); };
const diffMin = (a, b) => { const [h1, m1] = a.split(":").map(Number); const [h2, m2] = b.split(":").map(Number); return (h2 * 60 + m2) - (h1 * 60 + m1); };
function CitaModal({ onClose, onSave, onDelete, onStart, onOpenPaciente, pacientes, citas, cita, preset }) {
  const editing = !!(cita && cita.id);
  const base = cita || {};
  const [f, setF] = useS({
    pid: base.pid || (preset && preset.pid) || "",
    fecha: base.fecha || (preset && preset.fecha) || window.todayISO(),
    hora: base.hora || (preset && preset.hora) || "09:00",
    dur: String(base.hora && base.fin ? diffMin(base.hora, base.fin) : window.POLITICAS.durIndividual),
    tipo: base.tipo || "Sesión",
    modalidad: base.modalidad || "Presencial",
    estado: base.estado || "Confirmada",
    nota: base.nota || "",
    repetir: "0",
  });
  const [confirmDel, setConfirmDel] = useS(false);
  const set = (k) => (e) => {
    const v = e.target.value, nf = { ...f, [k]: v };
    if (k === "tipo" && !editing) nf.dur = String(/pareja/i.test(v) ? window.POLITICAS.durPareja : window.POLITICAS.durIndividual);
    setF(nf);
  };
  const p = pacientes.find((x) => x.id === f.pid);
  const ok = f.pid && f.fecha && /^\d{2}:\d{2}$/.test(f.hora) && Number(f.dur) > 0;
  const out = () => ({ ...(cita || {}), pid: f.pid, fecha: f.fecha, hora: f.hora, fin: addMin(f.hora, f.dur), tipo: f.tipo, modalidad: f.modalidad, estado: f.estado, nota: f.nota });
  const gUrl = ok && p ? window.gcalTemplateUrl(out(), p) : null;
  const avisos = ok && !["Cancelada", "Cancelación tardía", "No asistió"].includes(f.estado) ? window.avisosCita(out(), citas || [], pacientes) : [];
  if (confirmDel) return <ConfirmModal danger title="Eliminar cita" confirmLabel="Eliminar" text={`¿Eliminar la cita de ${p ? p.nombre : "este paciente"} del ${f.fecha} a las ${f.hora}? Si ya la agregaste a Google Calendar, bórrala también allá.`} onClose={() => setConfirmDel(false)} onConfirm={() => onDelete(cita.id)} />;
  return (
    <ModalShell icon="calendar" title={editing ? "Cita" : "Nueva cita"} subtitle={editing && p ? p.nombre : "Agenda una sesión"} onClose={onClose}
      footer={<>{editing && <span className="mr-auto"><BtnGhost danger onClick={() => setConfirmDel(true)}>Eliminar</BtnGhost></span>}
        <BtnGhost onClick={onClose}>Cancelar</BtnGhost><BtnPrimary disabled={!ok} onClick={() => onSave(out(), Number(f.repetir))}>{editing ? "Guardar" : "Agendar"}</BtnPrimary></>}>
      {editing && p && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button onClick={() => onStart(p.id, { fecha: f.fecha, duracion: String(f.dur), origen: "cita" })} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] text-[13px] font-semibold text-white" style={{ background: "var(--accent)" }}><MIcon name="mic" size={14} />Registrar sesión</button>
          <button onClick={() => onOpenPaciente(p.id)} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] text-[13px] font-semibold" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}><MIcon name="user" size={14} />Expediente</button>
          {gUrl && <a href={gUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] text-[13px] font-semibold" style={{ border: "1px solid var(--line)", color: "#1A73E8" }}><MIcon name="external" size={14} />Agregar a Google Calendar</a>}
        </div>
      )}
      {p && p.pagoAdelantado && (
        <div className="mb-4 rounded-[10px] px-3.5 py-2.5 text-[12.5px] leading-snug" style={{ background: "#FFF6E9", color: "#7A4F0E", border: "1px solid #F2E1C4" }}>
          <b>Pago por adelantado:</b> {p.nombre.split(" ")[0]} tuvo una inasistencia o cancelación tardía. Según tu política, esta sesión debe pagarse antes de agendarse.
        </div>
      )}
      {p && p.riesgo && p.riesgo.nivel !== "Bajo" && (
        <div className="mb-4 rounded-[10px] px-3.5 py-2.5 text-[12.5px]" style={{ background: "#FCE4E4", color: "#9B2222" }}><b>Riesgo {p.riesgo.nivel.toLowerCase()}</b> · última valoración {p.riesgo.fecha}</div>
      )}
      {(f.estado === "No asistió" || f.estado === "Cancelación tardía") && editing && base.estado !== f.estado && window.POLITICAS.cargoInasistencia && !base.cargoId && p && (
        <div className="mb-4 rounded-[10px] px-3.5 py-2.5 text-[12.5px]" style={{ background: "#F5F7FA", color: "var(--ink)" }}>Al guardar se generará un cargo de {mFmt(Number(p.tarifa) || 0)} y la siguiente sesión quedará como pago por adelantado (según tus políticas).</div>
      )}
      {avisos.length > 0 && (
        <div className="mb-4 rounded-[10px] px-3.5 py-2.5 text-[12.5px] leading-snug" style={{ background: "#FFF6E9", color: "#7A4F0E", border: "1px solid #F2E1C4" }}>
          {avisos.map((a, i) => <div key={i} className="flex gap-1.5"><MIcon name="alert" size={14} />{a}</div>)}
          <div className="mt-1 opacity-80">Puedes agendarla de todos modos.</div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Paciente" span>
          <select className={fieldCls} style={inputStyle()} value={f.pid} onChange={set("pid")} {...fx}>
            <option value="">Selecciona…</option>
            {pacientes.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
          </select>
        </Field>
        <Field label="Fecha"><input type="date" className={fieldCls} style={inputStyle()} value={f.fecha} onChange={set("fecha")} {...fx} /></Field>
        <Field label="Hora"><input type="time" step="300" className={fieldCls} style={inputStyle()} value={f.hora} onChange={set("hora")} {...fx} /></Field>
        <Field label="Duración">
          <select className={fieldCls} style={inputStyle()} value={f.dur} onChange={set("dur")} {...fx}>
            {Array.from(new Set(["30", "45", "50", "60", "80", "90", "120", String(f.dur)])).sort((a, b) => a - b).map((d) => <option key={d} value={d}>{d} min</option>)}
          </select>
        </Field>
        <Field label="Modalidad">
          <select className={fieldCls} style={inputStyle()} value={f.modalidad} onChange={set("modalidad")} {...fx}><option>Presencial</option><option>Online</option></select>
        </Field>
        <Field label="Tipo">
          <select className={fieldCls} style={inputStyle()} value={f.tipo} onChange={set("tipo")} {...fx}>
            <option>Sesión</option><option>Primera consulta</option><option>Seguimiento</option><option>Sesión familiar</option><option>Sesión de pareja</option><option>Evaluación</option>
          </select>
        </Field>
        <Field label="Estado">
          <select className={fieldCls} style={inputStyle()} value={f.estado} onChange={set("estado")} {...fx}>
            <option>Confirmada</option><option>Pendiente</option><option>Realizada</option><option>Cancelada</option><option>Cancelación tardía</option><option>No asistió</option>
          </select>
        </Field>
        {!editing && (
          <Field label="Repetir cada semana" span>
            <select className={fieldCls} style={inputStyle()} value={f.repetir} onChange={set("repetir")} {...fx}>
              <option value="0">No repetir</option><option value="3">4 semanas</option><option value="7">8 semanas</option><option value="11">12 semanas</option>
            </select>
          </Field>
        )}
        <Field label="Nota interna (opcional)" span>
          <input className={fieldCls} style={inputStyle()} value={f.nota} onChange={set("nota")} placeholder="Ej. traer autorregistros" {...fx} />
        </Field>
      </div>
    </ModalShell>
  );
}

// ---- Perfil del terapeuta ----
function PerfilModal({ onClose, onSave }) {
  const [f, setF] = useS({ ...window.THERAPIST });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <ModalShell wide icon="user" title="Mi perfil" subtitle="Aparece en la app, en tus documentos y en las notas del asistente" onClose={onClose}
      footer={<><BtnGhost onClick={onClose}>Cancelar</BtnGhost><BtnPrimary disabled={!f.nombre.trim()} onClick={() => onSave(f)}>Guardar</BtnPrimary></>}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Título"><input className={fieldCls} style={inputStyle()} value={f.titulo} onChange={set("titulo")} placeholder="Psic., Mtro., Dr.…" {...fx} /></Field>
        <Field label="Género">
          <select className={fieldCls} style={inputStyle()} value={f.genero} onChange={set("genero")} {...fx}><option>Masculino</option><option>Femenino</option><option>Otro</option></select>
        </Field>
        <Field label="Nombre (como aparece en la app)" span><input className={fieldCls} style={inputStyle()} value={f.nombre} onChange={set("nombre")} {...fx} /></Field>
        <Field label="Nombre completo (contratos y firmas)" span><input className={fieldCls} style={inputStyle()} value={f.nombreCompleto || ""} onChange={set("nombreCompleto")} {...fx} /></Field>
        <Field label="Profesión"><input className={fieldCls} style={inputStyle()} value={f.rol} onChange={set("rol")} placeholder="Psicólogo clínico" {...fx} /></Field>
        <Field label="Especialidad (membrete)"><input className={fieldCls} style={inputStyle()} value={f.especialidad || ""} onChange={set("especialidad")} placeholder="Terapia individual y de pareja" {...fx} /></Field>
        <Field label="Cédula profesional"><input className={fieldCls} style={inputStyle()} value={f.cedula} onChange={set("cedula")} {...fx} /></Field>
        <Field label="Teléfono"><input className={fieldCls} style={inputStyle()} value={f.telefono || ""} onChange={set("telefono")} {...fx} /></Field>
      </div>
    </ModalShell>
  );
}

// ---- Plantilla de notas + dictado ----
function PlantillaModal({ onClose, onSave }) {
  const [c, setC] = useS({ ...window.NOTA_CFG });
  const set = (k) => (e) => setC({ ...c, [k]: e.target.value });
  const fields = window.fieldsFor(c.plantilla);
  return (
    <ModalShell wide icon="sparkles" title="Plantilla de notas y dictado" subtitle="Define cómo quieres que se estructure cada nota de sesión" onClose={onClose}
      footer={<><BtnGhost onClick={onClose}>Cancelar</BtnGhost><BtnPrimary onClick={() => onSave(c)}>Guardar</BtnPrimary></>}>
      <div className="flex flex-col gap-5">
        <div>
          <div className="text-[12.5px] font-medium mb-2" style={{ color: "var(--ink-soft)" }}>Formato de la nota</div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {Object.entries(window.PLANTILLAS).filter(([k, t]) => !t.soloPareja).map(([k, t]) => (
              <button key={k} onClick={() => setC({ ...c, plantilla: k })} className="text-left rounded-[11px] px-3.5 py-3 transition"
                style={{ border: c.plantilla === k ? "1.5px solid var(--accent)" : "1px solid var(--line)", background: c.plantilla === k ? "var(--accent-soft)" : "#fff" }}>
                <div className="text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>{t.nombre}</div>
                <div className="text-[12px] leading-snug" style={{ color: "var(--ink-soft)" }}>{t.desc}</div>
              </button>
            ))}
          </div>
          <div className="text-[12px] mt-2" style={{ color: "var(--ink-soft)" }}>Apartados: {fields.map((x) => x.label).join(" · ")}</div>
        </div>
        <Field label="Enfoque terapéutico">
          <input className={fieldCls} style={inputStyle()} value={c.enfoque} onChange={set("enfoque")} placeholder="Terapia Cognitivo-Conductual (TCC)" {...fx} />
        </Field>
        <Field label="Tus instrucciones para el asistente" hint="Escríbelas como se las dirías a un asistente. Ej.: «Escribe el desarrollo en máximo 3 párrafos», «Usa siempre el nombre del paciente», «En temas usa máximo 3 viñetas», «Incluye la escala SUDS si la menciono».">
          <textarea value={c.instrucciones} onChange={set("instrucciones")} rows={5} className={areaCls} style={inputStyle()} {...fx}
            placeholder="Opcional. Tus reglas de redacción personales…" />
        </Field>
        <Field label="Servidor propio (opcional, avanzado)" hint="Solo se usa si el asistente integrado no responde. Ej. tu función de Vercel /api/estructurar-sesion.">
          <input className={fieldCls} style={inputStyle()} value={c.backendUrl} onChange={set("backendUrl")} placeholder="https://…" {...fx} />
        </Field>
      </div>
    </ModalShell>
  );
}

// ---- Respaldo ----
function RespaldoModal({ onClose, getData, onImport }) {
  const json = React.useMemo(() => JSON.stringify(getData(), null, 2), []);
  const [txt, setTxt] = useS("");
  const [msg, setMsg] = useS(null);
  const href = React.useMemo(() => { try { return URL.createObjectURL(new Blob([json], { type: "application/json" })); } catch (e) { return null; } }, [json]);
  const marca = () => { window.lsSet("ultimo_respaldo", Date.now()); };
  const copy = () => { try { navigator.clipboard.writeText(json).then(() => { marca(); setMsg({ ok: true, t: "Respaldo copiado al portapapeles. Pégalo en un archivo de texto y guárdalo en un lugar seguro." }); }, () => setMsg({ ok: false, t: "No se pudo copiar; usa Descargar." })); } catch (e) { setMsg({ ok: false, t: "No se pudo copiar; usa Descargar." }); } };
  const doImport = () => {
    try {
      const d = JSON.parse(txt);
      if (!d || !Array.isArray(d.pacientes)) throw new Error("formato");
      onImport(d);
    } catch (e) { setMsg({ ok: false, t: "El texto no es un respaldo válido de Psystema." }); }
  };
  return (
    <ModalShell wide icon="external" title="Respaldo de datos" subtitle="Tus datos viven solo en este navegador: respáldalos con frecuencia" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div>
          <div className="text-[13.5px] font-semibold mb-1" style={{ color: "var(--ink)" }}>Exportar</div>
          <p className="text-[12.5px] mb-2.5" style={{ color: "var(--ink-soft)" }}>Incluye expedientes, notas, citas, pagos y tu configuración. Guárdalo en un lugar seguro: contiene datos clínicos.</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { marca(); window.guardarArchivo(new Blob([json], { type: "application/json" }), "psystema-respaldo-" + window.todayISO() + ".json"); }} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] text-[13px] font-semibold text-white" style={{ background: "var(--accent)" }}>Descargar archivo</button>
            <button onClick={copy} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] text-[13px] font-semibold" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}>Copiar al portapapeles</button>
          </div>
        </div>
        <div className="border-t pt-5" style={{ borderColor: "var(--line)" }}>
          <div className="text-[13.5px] font-semibold mb-1" style={{ color: "var(--ink)" }}>Importar</div>
          <p className="text-[12.5px] mb-2.5" style={{ color: "var(--ink-soft)" }}>Elige el archivo de respaldo (.json) o pega su contenido. Reemplazará los datos actuales.</p>
          <label className="inline-flex items-center gap-1.5 h-9 px-3.5 mb-2.5 rounded-[9px] text-[13px] font-semibold cursor-pointer" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}>
            Elegir archivo…
            <input type="file" accept=".json,application/json" className="sr-only" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => setTxt(String(r.result || "")); r.readAsText(f); }} />
          </label>
          <textarea value={txt} onChange={(e) => setTxt(e.target.value)} rows={4} className={areaCls + " font-mono text-[12px]"} style={inputStyle()} placeholder='{"pacientes": [...]}' {...fx} />
          <div className="mt-2.5 flex justify-end"><BtnPrimary disabled={!txt.trim()} onClick={doImport}>Importar y reemplazar</BtnPrimary></div>
        </div>
        {msg && <div className="text-[12.5px] px-3 py-2 rounded-[9px]" style={msg.ok ? { background: "#E4F2EB", color: "#256B4C" } : { background: "#FCEDED", color: "#B23636" }}>{msg.t}</div>}
      </div>
    </ModalShell>
  );
}

Object.assign(window, { NuevoPacienteModal, NuevaSesionModal, RegistrarPagoModal, CitaModal, PerfilModal, PlantillaModal, RespaldoModal, ConfirmModal, ModalShell, DictadoEntry, addMin });
