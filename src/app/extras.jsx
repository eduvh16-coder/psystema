// ============ Psystema — extras: horario/bloqueos, vista semanal, PIN, IA (resumen e informes), reporte, etiquetas ============
const { useState: useXS, useEffect: useXE, useMemo: useXM } = React;
const XI = (props) => <window.Icon {...props} />;
const toMinX = (s) => { const [h, m] = String(s || "0:0").split(":").map(Number); return h * 60 + (m || 0); };
const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// ---------- Schedule helpers ----------
function bloqueosDe(fecha) {
  const P = window.POLITICAS, dow = new Date(fecha + "T12:00").getDay();
  return (P.bloqueos || []).filter((b) => {
    if (b.tipo === "fechas") return b.fechaIni && fecha >= b.fechaIni && fecha <= (b.fechaFin || b.fechaIni);
    if (b.tipo === "semanal") return Number(b.dia) === dow;
    return (P.horario.dias || []).includes(dow); // diario = every working day
  }).map((b) => b.tipo === "fechas" ? { ...b, desde: "00:00", hasta: "23:59", todoDia: true } : b);
}
function esDiaLaboral(fecha) {
  const dow = new Date(fecha + "T12:00").getDay();
  return (window.POLITICAS.horario.dias || []).includes(dow) && !bloqueosDe(fecha).some((b) => b.todoDia);
}
// warnings for an appointment: overlaps, outside hours, inside a block
function avisosCita(c, citas, pacientes) {
  const out = [];
  if (!c || !c.fecha || !c.hora || !c.fin) return out;
  const a = toMinX(c.hora), z = toMinX(c.fin);
  citas.filter((x) => x.id !== c.id && x.fecha === c.fecha && !["Cancelada", "Cancelación tardía", "No asistió"].includes(x.estado))
    .forEach((x) => { if (toMinX(x.hora) < z && toMinX(x.fin) > a) { const p = pacientes.find((y) => y.id === x.pid); out.push(`Choca con ${p ? p.nombre : "otra cita"} (${x.hora}–${x.fin}).`); } });
  const H = window.POLITICAS.horario, dow = new Date(c.fecha + "T12:00").getDay();
  if (!(H.dias || []).includes(dow)) out.push(`El ${window.DIAS[dow]} no está en tus días laborales.`);
  else if (a < toMinX(H.inicio) || z > toMinX(H.fin)) out.push(`Queda fuera de tu horario (${H.inicio}–${H.fin}).`);
  bloqueosDe(c.fecha).forEach((b) => { if (b.todoDia || (toMinX(b.desde) < z && toMinX(b.hasta) > a)) out.push(`Coincide con un bloqueo: ${b.titulo || "Bloqueo"}${b.todoDia ? "" : ` (${b.desde}–${b.hasta})`}.`); });
  return out;
}

// ---------- Horario + bloqueos editor (inside Políticas) ----------
function HorarioEditor({ value, onChange }) {
  const H = value.horario, B = value.bloqueos || [];
  const setH = (k, v) => onChange({ ...value, horario: { ...H, [k]: v } });
  const toggleDia = (d) => setH("dias", H.dias.includes(d) ? H.dias.filter((x) => x !== d) : [...H.dias, d].sort());
  const [nb, setNb] = useXS({ titulo: "Comida", tipo: "diario", dia: 1, desde: "14:00", hasta: "15:00", fechaIni: window.todayISO(), fechaFin: window.todayISO() });
  const add = () => { onChange({ ...value, bloqueos: [...B, { ...nb, id: "b" + Date.now().toString(36) }] }); };
  const inp = "h-9 px-2.5 rounded-[8px] text-[13px] bg-white outline-none";
  const st = { border: "1px solid var(--line)", color: "var(--ink)" };
  const desc = (b) => b.tipo === "fechas" ? `Del ${b.fechaIni} al ${b.fechaFin || b.fechaIni} (todo el día)` : `${b.tipo === "semanal" ? "Cada " + window.DIAS[b.dia] : "Cada día laboral"} · ${b.desde}–${b.hasta}`;
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[12.5px] font-medium" style={{ color: "var(--ink-soft)" }}>Días y horario de consulta</div>
      <div className="flex flex-wrap gap-1.5">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => (
          <button key={d} type="button" onClick={() => toggleDia(d)} aria-pressed={H.dias.includes(d)} className="h-9 w-12 rounded-[8px] text-[12.5px] font-semibold"
            style={H.dias.includes(d) ? { background: "var(--accent)", color: "#fff" } : { background: "#fff", color: "var(--ink-soft)", border: "1px solid var(--line)" }}>{DIAS_CORTOS[d]}</button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--ink-soft)" }}>
        De <input type="time" className={inp} style={st} value={H.inicio} onChange={(e) => setH("inicio", e.target.value)} aria-label="Hora de inicio" />
        a <input type="time" className={inp} style={st} value={H.fin} onChange={(e) => setH("fin", e.target.value)} aria-label="Hora de fin" />
      </div>
      <div className="text-[12.5px] font-medium mt-2" style={{ color: "var(--ink-soft)" }}>Bloqueos (comida, supervisión, vacaciones…)</div>
      {B.length === 0 && <div className="text-[12.5px]" style={{ color: "var(--ink-soft)" }}>Sin bloqueos.</div>}
      {B.map((b) => (
        <div key={b.id} className="flex items-center gap-2 px-3 py-2 rounded-[9px] border text-[13px]" style={{ borderColor: "var(--line)" }}>
          <span className="font-semibold" style={{ color: "var(--ink)" }}>{b.titulo}</span>
          <span className="flex-1 truncate" style={{ color: "var(--ink-soft)" }}>{desc(b)}</span>
          <button type="button" aria-label="Quitar bloqueo" onClick={() => onChange({ ...value, bloqueos: B.filter((x) => x.id !== b.id) })} className="grid place-items-center w-7 h-7 rounded-md hover:bg-[#F2F4F7]" style={{ color: "#A6ADB8" }}><XI name="x" size={14} /></button>
        </div>
      ))}
      <div className="rounded-[10px] p-3 flex flex-wrap items-center gap-2" style={{ background: "#F5F7FA" }}>
        <input className={inp + " w-[130px]"} style={st} value={nb.titulo} onChange={(e) => setNb({ ...nb, titulo: e.target.value })} placeholder="Nombre" aria-label="Nombre del bloqueo" />
        <select className={inp} style={st} value={nb.tipo} onChange={(e) => setNb({ ...nb, tipo: e.target.value })} aria-label="Repetición">
          <option value="diario">Cada día laboral</option><option value="semanal">Un día por semana</option><option value="fechas">Vacaciones / fechas</option>
        </select>
        {nb.tipo === "semanal" && <select className={inp} style={st} value={nb.dia} onChange={(e) => setNb({ ...nb, dia: Number(e.target.value) })} aria-label="Día">{[1, 2, 3, 4, 5, 6, 0].map((d) => <option key={d} value={d}>{window.DIAS[d]}</option>)}</select>}
        {nb.tipo === "fechas"
          ? <><input type="date" className={inp} style={st} value={nb.fechaIni} onChange={(e) => setNb({ ...nb, fechaIni: e.target.value })} aria-label="Desde" /><span className="text-[12.5px]">a</span><input type="date" className={inp} style={st} value={nb.fechaFin} onChange={(e) => setNb({ ...nb, fechaFin: e.target.value })} aria-label="Hasta" /></>
          : <><input type="time" className={inp} style={st} value={nb.desde} onChange={(e) => setNb({ ...nb, desde: e.target.value })} aria-label="Desde" /><span className="text-[12.5px]">a</span><input type="time" className={inp} style={st} value={nb.hasta} onChange={(e) => setNb({ ...nb, hasta: e.target.value })} aria-label="Hasta" /></>}
        <button type="button" onClick={add} disabled={!nb.titulo.trim()} className="h-9 px-3.5 rounded-[8px] text-[13px] font-semibold text-white disabled:opacity-40" style={{ background: "var(--accent)" }}>Agregar</button>
      </div>
    </div>
  );
}

// ---------- Week view ----------
function WeekView({ citas, pacientes, monday, onCita, onNewCita, onDay }) {
  const H0 = 7, H1 = 21, ROW = 52;
  const hours = []; for (let h = H0; h < H1; h++) hours.push(h);
  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => window.addDays(monday, i));
  const hoy = window.todayISO();
  const H = window.POLITICAS.horario;
  const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
  const y = (hhmm) => ((Math.min(Math.max(toMinX(hhmm), H0 * 60), H1 * 60) - H0 * 60) / 60) * ROW;
  const clickCol = (fecha) => (e) => {
    if (e.target !== e.currentTarget) return;
    const min = Math.round((e.nativeEvent.offsetY / ROW) * 2) * 30 + H0 * 60;
    onNewCita({ fecha, hora: window.pad2(Math.min(H1 - 1, Math.floor(min / 60))) + ":" + window.pad2(min % 60) });
  };
  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 760 }}>
        <div className="grid border-b" style={{ gridTemplateColumns: "52px repeat(7, 1fr)", borderColor: "var(--line)" }}>
          <div></div>
          {days.map((f) => {
            const d = new Date(f + "T12:00"), lab = esDiaLaboral(f);
            return (
              <button key={f} onClick={() => onDay(f)} className="py-2 text-center hover:bg-[#F5F7FA]" title="Ver el día">
                <div className="text-[11px] font-semibold uppercase" style={{ color: lab ? "var(--ink-soft)" : "#A6ADB8" }}>{DIAS_CORTOS[d.getDay()]}</div>
                <div className="text-[16px] font-bold mx-auto w-8 h-8 grid place-items-center rounded-full" style={f === hoy ? { background: "var(--accent)", color: "#fff" } : { color: lab ? "var(--ink)" : "#A6ADB8" }}>{d.getDate()}</div>
              </button>
            );
          })}
        </div>
        <div className="grid relative" style={{ gridTemplateColumns: "52px repeat(7, 1fr)", height: hours.length * ROW }}>
          <div className="relative">
            {hours.map((h, i) => <div key={h} className="absolute right-2 text-[10.5px] tabular-nums" style={{ top: i * ROW - 6, color: "var(--ink-soft)" }}>{i ? window.pad2(h) + ":00" : ""}</div>)}
          </div>
          {days.map((f) => {
            const dow = new Date(f + "T12:00").getDay(), lab = (H.dias || []).includes(dow);
            const cs = citas.filter((c) => c.fecha === f);
            const bs = bloqueosDe(f);
            return (
              <div key={f} className="relative border-l cursor-copy" style={{ borderColor: "var(--line)", background: lab ? "#fff" : "#F4F5F8" }} onClick={clickCol(f)}>
                {hours.map((h, i) => <div key={h} className="absolute left-0 right-0 border-t pointer-events-none" style={{ top: i * ROW, borderColor: "#EEF0F4" }}></div>)}
                {lab && <div className="absolute left-0 right-0 pointer-events-none" style={{ top: 0, height: y(H.inicio), background: "rgba(120,130,150,.07)" }}></div>}
                {lab && <div className="absolute left-0 right-0 pointer-events-none" style={{ top: y(H.fin), bottom: 0, background: "rgba(120,130,150,.07)" }}></div>}
                {bs.map((b, i) => (
                  <div key={"b" + i} className="absolute left-0.5 right-0.5 rounded-[6px] px-1.5 py-0.5 text-[10.5px] font-medium overflow-hidden pointer-events-none"
                    style={{ top: y(b.desde), height: Math.max(16, y(b.hasta) - y(b.desde)), color: "#5E6A7D", background: "repeating-linear-gradient(135deg, #EEF0F4 0 6px, #F7F8FA 6px 12px)" }}>{b.titulo}</div>
                ))}
                {f === hoy && nowMin > H0 * 60 && nowMin < H1 * 60 && <div className="absolute left-0 right-0 border-t-2 z-10 pointer-events-none" style={{ top: ((nowMin - H0 * 60) / 60) * ROW, borderColor: "#E5484D" }}></div>}
                {cs.map((c) => {
                  const p = pacientes.find((x) => x.id === c.pid); if (!p) return null;
                  const cancel = ["Cancelada", "No asistió", "Cancelación tardía"].includes(c.estado);
                  const rk = p.riesgo && p.riesgo.nivel !== "Bajo";
                  return (
                    <button key={c.id} onClick={() => onCita(c)} className="absolute left-0.5 right-0.5 rounded-[7px] px-1.5 py-1 text-left overflow-hidden z-[5]"
                      style={{ top: y(c.hora) + 1, height: Math.max(22, y(c.fin) - y(c.hora) - 2), background: cancel ? "#F1F2F5" : "var(--accent-soft)", borderLeft: `3px solid ${cancel ? "#A6ADB8" : "var(--accent)"}` }}>
                      <div className="text-[11.5px] font-semibold truncate leading-tight" style={{ color: "var(--ink)", textDecoration: cancel ? "line-through" : "none" }}>{rk ? "⚠ " : ""}{p.nombre}</div>
                      <div className="text-[10.5px] tabular-nums leading-tight" style={{ color: "var(--ink-soft)" }}>{c.hora}–{c.fin}</div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- PIN setup ----------
function PinModal({ onClose, onSet, onRemove }) {
  const activo = window.PIN_ACTIVO_RUNTIME;
  const [modo, setModo] = useXS(activo ? "cambiar" : "crear");
  const [actual, setActual] = useXS(""), [p1, setP1] = useXS(""), [p2, setP2] = useXS("");
  const [err, setErr] = useXS(""), [busy, setBusy] = useXS(false);
  const valid = /^\d{4,8}$/.test(p1) && p1 === p2;
  const go = async () => {
    setErr(""); setBusy(true);
    try {
      if (activo) { const k = await window.probarPin(actual); if (!k) { setErr("El PIN actual no es correcto."); setBusy(false); return; } }
      if (modo === "quitar") await onRemove(); else await onSet(p1);
    } catch (e) { setErr("No se pudo guardar: " + (e && e.message)); setBusy(false); }
  };
  const pinIn = (label, v, set, auto) => (
    <Field label={label}><input type="password" inputMode="numeric" autoComplete="off" maxLength={8} autoFocus={auto} className={fieldCls + " tracking-[0.4em] text-[18px]"} style={inputStyle()} value={v} onChange={(e) => set(e.target.value.replace(/\D/g, ""))} {...fx} /></Field>
  );
  return (
    <ModalShell icon="shield" title={activo ? "PIN de acceso" : "Crear PIN de acceso"} subtitle="Bloquea la app y cifra tus expedientes en este navegador" onClose={onClose}
      footer={<><BtnGhost onClick={onClose}>Cancelar</BtnGhost>
        {modo === "quitar"
          ? <button onClick={go} disabled={busy || !actual} className="h-10 px-5 rounded-[9px] text-[14px] font-semibold text-white disabled:opacity-40" style={{ background: "#C73B3B" }}>Quitar PIN</button>
          : <BtnPrimary disabled={busy || !valid || (activo && !actual)} onClick={go}>{busy ? "Cifrando…" : activo ? "Cambiar PIN" : "Activar PIN"}</BtnPrimary>}</>}>
      <div className="flex flex-col gap-4">
        {activo && (
          <div className="flex gap-2">
            {[["cambiar", "Cambiar PIN"], ["quitar", "Quitar PIN"]].map(([k, l]) => (
              <button key={k} onClick={() => setModo(k)} className="h-9 px-3.5 rounded-[9px] text-[13px] font-semibold" style={modo === k ? { background: "var(--accent-soft)", color: "var(--accent)" } : { border: "1px solid var(--line)", color: "var(--ink-soft)" }}>{l}</button>
            ))}
          </div>
        )}
        {activo && pinIn("PIN actual", actual, setActual, true)}
        {modo !== "quitar" && <>{pinIn("Nuevo PIN (4 a 8 números)", p1, setP1, !activo)}{pinIn("Repite el PIN", p2, setP2)}</>}
        {p2 && p1 !== p2 && <div className="text-[12.5px]" style={{ color: "#B23636" }}>Los PIN no coinciden.</div>}
        {err && <div className="text-[12.5px]" style={{ color: "#B23636" }}>{err}</div>}
        <div className="rounded-[10px] px-3.5 py-2.5 text-[12.5px] leading-snug" style={{ background: "#FFF6E9", color: "#7A4F0E", border: "1px solid #F2E1C4" }}>
          <b>Importante:</b> si olvidas el PIN, tus datos cifrados no se pueden recuperar. Haz un respaldo y guárdalo en un lugar seguro. Al abrir la app y al mostrar la pantalla oculta se pedirá el PIN.
        </div>
      </div>
    </ModalShell>
  );
}

// ---------- AI helper ----------
async function iaTexto(system, user) {
  if (!(window.claude && typeof window.claude.complete === "function")) throw new Error("El asistente no está disponible en esta vista.");
  const raw = await window.claude.complete({ model: "claude-sonnet", system, messages: [{ role: "user", content: user }] });
  return String(raw || "").replace(/^```[a-z]*\s*|```$/g, "").trim();
}
function expedienteTexto(p, maxNotas) {
  const notas = (p.historial || []).slice().sort((a, b) => String(a.fecha).localeCompare(String(b.fecha))).slice(-(maxNotas || 40));
  let t = `Paciente: ${p.nombre}. Edad: ${p.edad}. Género: ${p.genero}. Ocupación: ${p.ocupacion}. Fecha de ingreso: ${p.alta}. Estado: ${p.estado}.
Motivo de consulta: ${p.motivo}. ${p.motivoConsulta || ""}
Historia clínica: ${p.historiaClinica || "—"}
Enfoque / objetivo: ${p.enfoque || "—"}
Sesiones registradas: ${(p.historial || []).length}.`;
  if (p.riesgo) t += `\nÚltima valoración de riesgo (${p.riesgo.fecha}): nivel ${p.riesgo.nivel}; ideación ${p.riesgo.ideacion}; intento previo ${p.riesgo.intento}.`;
  const tareas = (p.tareas || []).map((x) => `${x.titulo} (${x.estado})`).join("; ");
  if (tareas) t += `\nTareas: ${tareas}`;
  t += `\n\nNOTAS DE SESIÓN (orden cronológico):`;
  notas.forEach((s, i) => { t += `\n--- ${s.fecha} ---\n` + window.noteFields(s).map((f) => `${f.label}: ${s[f.key]}`).join("\n"); });
  return t;
}
const IA_REGLAS = "Escribe en español de México, lenguaje clínico formal y objetivo. No inventes datos, fechas, diagnósticos ni puntuaciones que no estén en el expediente; si falta información, dilo. Sin Markdown (no uses #, ** ni tablas); usa títulos en MAYÚSCULAS seguidos de dos puntos y viñetas con «• ».";

// ---------- Resumen del caso ----------
function ResumenIAModal({ paciente, onClose, onSave }) {
  const [txt, setTxt] = useXS((paciente.resumenIA && paciente.resumenIA.texto) || "");
  const [fecha, setFecha] = useXS((paciente.resumenIA && paciente.resumenIA.fecha) || "");
  const [busy, setBusy] = useXS(false), [err, setErr] = useXS("");
  const generar = async () => {
    setBusy(true); setErr("");
    try {
      const out = await iaTexto(
        `Eres un asistente clínico que prepara resúmenes de caso para un psicólogo clínico (${window.NOTA_CFG.enfoque}). ${IA_REGLAS}
Estructura exactamente: MOTIVO DE CONSULTA: · EVOLUCIÓN: (cronológica y breve) · TÉCNICAS E INTERVENCIONES: · AVANCES: · DIFICULTADES Y PENDIENTES: · RIESGO: · SUGERENCIAS PARA LAS PRÓXIMAS SESIONES: (marca claramente que son sugerencias para el criterio del terapeuta). Máximo 450 palabras.`,
        expedienteTexto(paciente));
      setTxt(out); setFecha(window.todayISO());
    } catch (e) { setErr(String((e && e.message) || e).slice(0, 200)); }
    setBusy(false);
  };
  useXE(() => { if (!txt && (paciente.historial || []).length) generar(); }, []);
  const html = window.docHTMLTexto("RESUMEN DEL CASO", paciente, txt, fecha);
  return (
    <ModalShell maxW={760} icon="sparkles" title="Resumen del caso" subtitle={paciente.nombre + (fecha ? " · generado el " + fecha : "")} onClose={onClose}
      footer={<>
        <span className="mr-auto"><BtnGhost onClick={generar}>{busy ? "Generando…" : "Volver a generar"}</BtnGhost></span>
        <BtnGhost onClick={onClose}>Cerrar</BtnGhost>
        {txt && <window.DocActions html={html} title={"Resumen " + paciente.nombre} />}
        <BtnPrimary disabled={!txt || busy} onClick={() => onSave(paciente.id, { texto: txt, fecha: fecha || window.todayISO() })}>Guardar</BtnPrimary>
      </>}>
      {!(paciente.historial || []).length && <p className="text-[13px]" style={{ color: "var(--ink-soft)" }}>Este paciente aún no tiene notas de sesión para resumir.</p>}
      {busy && <div className="flex flex-col gap-2 mb-3">{[92, 80, 86, 70, 88, 60].map((w, i) => <div key={i} className="ai-skel" style={{ height: 10, width: w + "%" }}></div>)}</div>}
      {err && <div className="text-[13px] rounded-[10px] px-3.5 py-2.5 mb-3" style={{ background: "#FCEEF0", color: "#9B2C3C" }}>No se pudo generar: {err}</div>}
      {txt && !busy && <textarea value={txt} onChange={(e) => setTxt(e.target.value)} rows={18} className={areaCls + " text-[13.5px]"} style={inputStyle()} {...fx} aria-label="Resumen del caso" />}
      <p className="text-[11.5px] mt-2" style={{ color: "var(--ink-soft)" }}>Redactado por IA a partir del expediente. Revísalo antes de usarlo; puedes editar el texto.</p>
    </ModalShell>
  );
}

// ---------- Informes y cartas ----------
const INFORMES = {
  evolucion: { n: "Informe de evolución", d: "Resumen formal del proceso terapéutico para el paciente, un médico u otra institución." },
  referencia: { n: "Carta de referencia a psiquiatría", d: "Solicita valoración psiquiátrica explicando motivo, evolución y hallazgos." },
  constancia: { n: "Constancia de asistencia", d: "Hace constar que el paciente asiste a psicoterapia (sin detalles clínicos)." },
  escolar: { n: "Informe para escuela o trabajo", d: "Información mínima necesaria, sin detalles íntimos, para justificar o pedir ajustes." },
};
function constanciaTexto(p, dest) {
  const T = window.THERAPIST, n = (p.historial || []).length;
  return `A QUIEN CORRESPONDA${dest ? "\n" + dest : ""}:\n\nPor medio de la presente hago constar que ${p.nombre} asiste a proceso de psicoterapia conmigo desde el ${window.fechaCortaLarga(p.alta)}${n ? `, con un total de ${n} sesión${n > 1 ? "es" : ""} a la fecha` : ""}.\n\nSe extiende la presente a petición del interesado para los fines que a este convengan.`;
}
function InformeModal({ paciente, onClose, onSaveDoc }) {
  const [tipo, setTipo] = useXS("evolucion");
  const [dest, setDest] = useXS("");
  const [extra, setExtra] = useXS("");
  const [txt, setTxt] = useXS("");
  const [busy, setBusy] = useXS(false), [err, setErr] = useXS("");
  const [ver, setVer] = useXS(false);
  const generar = async () => {
    setErr("");
    if (tipo === "constancia") { setTxt(constanciaTexto(paciente, dest)); return; }
    setBusy(true);
    try {
      const T = window.THERAPIST;
      const out = await iaTexto(
        `Redactas documentos clínicos formales para ${(T.titulo ? T.titulo + " " : "") + (T.nombreCompleto || T.nombre)}, ${T.rol}. ${IA_REGLAS}
Documento: ${INFORMES[tipo].n}. ${INFORMES[tipo].d}
Reglas: escribe SOLO el cuerpo del documento (sin membrete, sin fecha ni firma: la app los agrega). Empieza con el destinatario (o "A QUIEN CORRESPONDA:") y termina con una despedida formal breve.
${tipo === "escolar" ? "Respeta la confidencialidad: incluye solo lo mínimo necesario; no reveles contenido íntimo de las sesiones." : ""}
${tipo === "referencia" ? "Incluye: datos del paciente, motivo de la referencia, síntomas y evolución relevantes, riesgo si lo hay, intervenciones realizadas y la solicitud concreta de valoración." : ""}
Extensión: de 1 a 2 páginas como máximo.`,
        `Destinatario: ${dest || "A quien corresponda"}\nIndicaciones del psicólogo: ${extra || "ninguna"}\n\nEXPEDIENTE:\n${expedienteTexto(paciente)}`);
      setTxt(out);
    } catch (e) { setErr(String((e && e.message) || e).slice(0, 200)); }
    setBusy(false);
  };
  const html = window.docHTMLTexto(INFORMES[tipo].n.toUpperCase(), paciente, txt, window.todayISO(), true);
  const title = INFORMES[tipo].n + " " + paciente.nombre;
  return (
    <ModalShell maxW={ver ? 860 : 720} icon="file" title="Informes y cartas" subtitle={paciente.nombre} onClose={onClose}
      footer={<>
        {txt && <span className="mr-auto"><BtnGhost onClick={() => setVer(!ver)}>{ver ? "Editar texto" : "Vista de impresión"}</BtnGhost></span>}
        <BtnGhost onClick={onClose}>Cerrar</BtnGhost>
        {txt && <window.DocActions html={html} title={title} />}
        {txt && <BtnPrimary onClick={() => onSaveDoc(paciente.id, { folio: "INF-" + Date.now().toString(36).toUpperCase().slice(-5), fecha: window.todayISO(), tipo: "Informe", titulo: INFORMES[tipo].n, html })}>Guardar en expediente</BtnPrimary>}
      </>}>
      {ver ? <window.DocPreview html={html} /> : (
        <div className="flex flex-col gap-4">
          <div className="grid sm:grid-cols-2 gap-2">
            {Object.entries(INFORMES).map(([k, x]) => (
              <button key={k} onClick={() => { setTipo(k); setTxt(""); }} className="text-left rounded-[11px] px-3.5 py-2.5" style={{ border: tipo === k ? "1.5px solid var(--accent)" : "1px solid var(--line)", background: tipo === k ? "var(--accent-soft)" : "#fff" }}>
                <div className="text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>{x.n}</div>
                <div className="text-[12px] leading-snug" style={{ color: "var(--ink-soft)" }}>{x.d}</div>
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Destinatario (opcional)"><input className={fieldCls} style={inputStyle()} value={dest} onChange={(e) => setDest(e.target.value)} placeholder="Ej. Dr. Juan Pérez, Psiquiatra" {...fx} /></Field>
            <Field label="Indicaciones para la redacción"><input className={fieldCls} style={inputStyle()} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Ej. enfatizar el insomnio" {...fx} /></Field>
          </div>
          <div><button onClick={generar} disabled={busy} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[9px] text-[13.5px] font-semibold text-white disabled:opacity-50" style={{ background: "var(--accent)" }}>
            <XI name="sparkles" size={16} />{busy ? "Redactando…" : tipo === "constancia" ? "Generar constancia" : txt ? "Volver a redactar con IA" : "Redactar con IA"}</button></div>
          {err && <div className="text-[13px] rounded-[10px] px-3.5 py-2.5" style={{ background: "#FCEEF0", color: "#9B2C3C" }}>No se pudo redactar: {err}</div>}
          {busy && <div className="flex flex-col gap-2">{[92, 80, 86, 70, 88].map((w, i) => <div key={i} className="ai-skel" style={{ height: 10, width: w + "%" }}></div>)}</div>}
          {txt && !busy && <textarea value={txt} onChange={(e) => setTxt(e.target.value)} rows={16} className={areaCls + " text-[13.5px]"} style={inputStyle()} {...fx} aria-label="Texto del documento" />}
          {txt && <p className="text-[11.5px]" style={{ color: "var(--ink-soft)" }}>Revisa y corrige el texto antes de imprimir. La fecha, tu membrete y tu firma con cédula se agregan solos.</p>}
        </div>
      )}
    </ModalShell>
  );
}

// ---------- Reporte mensual (Finanzas) ----------
function csvDescarga(rows, nombre) {
  const esc = (v) => { const s = String(v == null ? "" : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const txt = "\ufeff" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
  return window.guardarArchivo(new Blob([txt], { type: "text/csv;charset=utf-8" }), nombre);
}
function ReporteMensual({ pagos, pacientes, citas }) {
  const [mes, setMes] = useXS(window.todayISO().slice(0, 7));
  const [msg, setMsg] = useXS("");
  const nom = (pid) => { const p = pacientes.find((x) => x.id === pid); return p ? p.nombre : "—"; };
  const del = pagos.filter((g) => String(g.fecha).slice(0, 7) === mes);
  const cobrado = del.filter((g) => g.estado === "Pagado");
  const total = cobrado.reduce((a, g) => a + g.monto, 0);
  const pend = pagos.filter((g) => g.estado === "Pendiente").reduce((a, g) => a + g.monto, 0);
  const cmes = citas.filter((c) => String(c.fecha).slice(0, 7) === mes);
  const realizadas = cmes.filter((c) => c.estado === "Realizada").length;
  const faltas = cmes.filter((c) => c.estado === "No asistió" || c.estado === "Cancelación tardía").length;
  const agrupa = (k) => { const m = {}; cobrado.forEach((g) => { const key = g[k] && g[k] !== "—" ? g[k] : "Sin especificar"; m[key] = (m[key] || 0) + g.monto; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const ultimos = []; { const d = new Date(mes + "-15T12:00"); for (let i = 11; i >= 0; i--) { const x = new Date(d); x.setMonth(d.getMonth() - i); const k = window.isoLocal(x).slice(0, 7); ultimos.push([k, pagos.filter((g) => g.estado === "Pagado" && String(g.fecha).slice(0, 7) === k).reduce((a, g) => a + g.monto, 0)]); } }
  const max = Math.max(1, ...ultimos.map((u) => u[1]));
  const exportar = () => {
    const rows = [["Fecha", "Paciente", "Folio", "Concepto", "Método", "Estado", "Monto (MXN)"]];
    del.slice().sort((a, b) => String(a.fecha).localeCompare(String(b.fecha))).forEach((g) => { const p = pacientes.find((x) => x.id === g.pid); rows.push([g.fecha, p ? p.nombre : "—", p ? p.folio : "", g.concepto, g.metodo, g.estado, g.monto]); });
    rows.push([], ["Total cobrado", "", "", "", "", "", total], ["Sesiones realizadas", "", "", "", "", "", realizadas], ["Inasistencias / cancelaciones tardías", "", "", "", "", "", faltas]);
    setMsg(csvDescarga(rows, `psystema-reporte-${mes}.csv`) ? "" : "No se pudo descargar aquí.");
  };
  const mesNom = (k) => window.MESES[Number(k.slice(5, 7)) - 1];
  const fm = window.fmtMoney;
  const Bloque = ({ t, data }) => (
    <div className="bg-white rounded-[14px] border p-4" style={{ borderColor: "var(--line)" }}>
      <div className="text-[13px] font-bold mb-2" style={{ color: "var(--ink)" }}>{t}</div>
      {data.length === 0 && <div className="text-[12.5px]" style={{ color: "var(--ink-soft)" }}>Sin cobros este mes.</div>}
      {data.map(([k, v]) => (
        <div key={k} className="py-1.5">
          <div className="flex justify-between text-[12.5px]"><span style={{ color: "var(--ink)" }}>{k}</span><span className="font-semibold tabular-nums" style={{ color: "var(--ink)" }}>{fm(v)}</span></div>
          <div className="h-1.5 rounded-full mt-1" style={{ background: "#EEF1F6" }}><div className="h-full rounded-full" style={{ width: (v / Math.max(1, total)) * 100 + "%", background: "var(--accent)" }}></div></div>
        </div>
      ))}
    </div>
  );
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <h2 className="text-[16px] font-bold mr-2" style={{ color: "var(--ink)" }}>Reporte mensual</h2>
        <input type="month" value={mes} onChange={(e) => e.target.value && setMes(e.target.value)} aria-label="Mes" className="h-9 px-2.5 rounded-[9px] text-[13px] bg-white outline-none" style={{ border: "1px solid var(--line)", color: "var(--ink)" }} />
        <button onClick={exportar} className="ml-auto inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] text-[13px] font-semibold" style={{ border: "1px solid var(--line)", color: "var(--ink)", background: "#fff" }}><XI name="file" size={15} />Exportar a Excel (CSV)</button>
        {msg && <span className="text-[12px]" style={{ color: "#B23636" }}>{msg}</span>}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[["Cobrado en " + mesNom(mes), fm(total), "var(--accent)"], ["Por cobrar (total)", fm(pend), "#9A6B12"], ["Sesiones realizadas", realizadas, "var(--ink)"], ["Inasistencias / cancel. tardías", faltas, faltas ? "#9A5B12" : "var(--ink)"]].map(([l, v, c]) => (
          <div key={l} className="bg-white rounded-[14px] border px-4 py-3" style={{ borderColor: "var(--line)" }}>
            <div className="text-[12px]" style={{ color: "var(--ink-soft)" }}>{l}</div>
            <div className="text-[21px] font-bold tabular-nums" style={{ color: c }}>{v}</div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-[1.4fr_1fr_1fr] gap-3">
        <div className="bg-white rounded-[14px] border p-4" style={{ borderColor: "var(--line)" }}>
          <div className="text-[13px] font-bold mb-3" style={{ color: "var(--ink)" }}>Ingresos de los últimos 12 meses</div>
          <div className="flex items-end gap-1.5 h-[130px]">
            {ultimos.map(([k, v]) => (
              <button key={k} onClick={() => setMes(k)} title={`${mesNom(k)} ${k.slice(0, 4)}: ${fm(v)}`} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <div className="w-full rounded-t-[4px]" style={{ height: Math.max(2, (v / max) * 100) + "px", background: k === mes ? "var(--accent)" : "#C9D5F5" }}></div>
                <span className="text-[9.5px] uppercase" style={{ color: k === mes ? "var(--accent)" : "var(--ink-soft)" }}>{mesNom(k).slice(0, 3)}</span>
              </button>
            ))}
          </div>
        </div>
        <Bloque t="Por concepto" data={agrupa("concepto")} />
        <Bloque t="Por método de pago" data={agrupa("metodo")} />
      </div>
    </div>
  );
}

// ---------- Etiquetas ----------
const ETIQUETAS_SUGERIDAS = ["Online", "Presencial", "Pareja", "Adolescente", "Familia", "Tarifa social", "Pausa por vacaciones", "Referido por psiquiatra"];
function EtiquetasInput({ value, onChange }) {
  const [t, setT] = useXS("");
  const v = value || [];
  const add = (x) => { const s = String(x || "").trim(); if (s && !v.includes(s)) onChange([...v, s]); setT(""); };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {v.map((e) => (
          <span key={e} className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-full text-[12px] font-medium" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
            {e}<button type="button" aria-label={"Quitar " + e} onClick={() => onChange(v.filter((x) => x !== e))} className="grid place-items-center w-5 h-5 rounded-full hover:bg-white/60"><XI name="x" size={11} /></button>
          </span>
        ))}
        <input value={t} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(t); } }} placeholder="Escribe y presiona Enter…" aria-label="Nueva etiqueta"
          className="h-7 px-2 text-[12.5px] outline-none bg-transparent min-w-[150px]" style={{ color: "var(--ink)" }} />
      </div>
      <div className="flex flex-wrap gap-1">
        {ETIQUETAS_SUGERIDAS.filter((x) => !v.includes(x)).map((x) => (
          <button type="button" key={x} onClick={() => add(x)} className="h-6 px-2 rounded-full text-[11.5px]" style={{ border: "1px dashed var(--line)", color: "var(--ink-soft)" }}>+ {x}</button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  bloqueosDe, esDiaLaboral, avisosCita, HorarioEditor, WeekView, PinModal, iaTexto, ResumenIAModal, InformeModal, ReporteMensual, EtiquetasInput, csvDescarga,
});
