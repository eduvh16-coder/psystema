// ============ Psystema — Pacientes, Expediente, Finanzas ============
const { Icon: WIcon, Avatar: WAvatar, EstadoBadge: WBadge, Card: WCard, fmtMoney: wFmt, pidIndex: wPidx } = window;
const fmtFecha = (iso) => { const d = new Date(iso + "T00:00"); return `${d.getDate()} ${window.MESES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`; };

function TabBar({ tabs, active, set }) {
  return (
    <div className="flex gap-1 overflow-x-auto -mx-1 px-1">
      {tabs.map(([k, l]) => (
        <button key={k} onClick={() => set(k)} className="relative h-9 px-3.5 text-[13.5px] font-medium whitespace-nowrap transition rounded-lg"
          style={{ color: active === k ? "var(--ink)" : "var(--ink-soft)", fontWeight: active === k ? 600 : 500 }}
          onMouseEnter={(e) => { if (active !== k) e.currentTarget.style.background = "#F2F4F7"; }}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
          {l}
          {active === k && <span className="absolute -bottom-[1px] left-3 right-3 h-[2.5px] rounded-full" style={{ background: "var(--accent)" }}></span>}
        </button>
      ))}
    </div>
  );
}

function DataRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="grid place-items-center w-8 h-8 rounded-[9px] shrink-0" style={{ background: "#F2F4F7", color: "#8A92A0" }}><WIcon name={icon} size={16} /></span>
      <div className="min-w-0"><div className="text-[11.5px]" style={{ color: "var(--ink-soft)" }}>{label}</div>
        <div className="text-[13.5px] font-medium truncate" style={{ color: "var(--ink)" }}>{value}</div></div>
    </div>
  );
}

function proximaCita(pid, citas) {
  const now = window.todayISO() + " " + window.pad2(new Date().getHours()) + ":" + window.pad2(new Date().getMinutes());
  const c = (citas || []).filter((c) => c.pid === pid && c.estado !== "Cancelada" && (c.fecha + " " + c.fin) >= now)
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))[0];
  if (!c) return null;
  const hoy = window.todayISO();
  const d = new Date(c.fecha + "T12:00");
  const dia = c.fecha === hoy ? "Hoy" : c.fecha === window.addDays(hoy, 1) ? "Mañana" : `${window.DIAS[d.getDay()].slice(0, 3)} ${d.getDate()} ${window.MESES[d.getMonth()].slice(0, 3)}`;
  return dia + " · " + c.hora;
}

function Expediente({ paciente: p, onModal, sessionMode, onStart, onTareas, citas, pagos, onCita }) {
  const [tab, setTab] = React.useState("ficha");
  React.useEffect(() => { setTab("ficha"); }, [p.id]);
  const idx = wPidx(p.id);
  const saldo = window.saldoDe(p.id, pagos);
  const prox = proximaCita(p.id, citas);
  const nTareas = (p.tareas || []).filter((t) => t.estado !== "completada").length;
  const riesgoAlto = p.riesgo && p.riesgo.nivel && p.riesgo.nivel !== "Bajo";
  const tabs = [["ficha", "Ficha"], ["sesiones", `Sesiones · ${p.historial.length}`], ["riesgo", riesgoAlto ? "Riesgo ⚠" : "Riesgo"], ["tareas", nTareas ? `Tareas · ${nTareas}` : "Tareas"], ["cuenta", saldo > 0 ? "Cuenta · debe" : "Cuenta"], ["docs", "Documentos"]];

  return (
    <div className="flex flex-col md:h-full">
      {/* header */}
      <div className="px-5 md:px-7 pt-5 md:pt-6 pb-4 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="flex items-start gap-4">
          <WAvatar nombre={p.nombre} idx={idx} size={56} />
          <div className="flex-1 min-w-0 flex flex-wrap items-start gap-x-3 gap-y-2.5">
            <div className="min-w-0 flex-1 basis-[180px]">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-[20px] md:text-[22px] font-bold tracking-[-0.02em]" style={{ color: "var(--ink)" }}>{p.nombre}</h2>
                <WBadge estado={p.estado} />
              </div>
              <div className="text-[13px] mt-0.5" style={{ color: "var(--ink-soft)" }}>{p.folio}{p.tipo === "Pareja" ? " · Terapia de pareja" : p.edad && p.edad !== "—" ? ` · ${p.edad} años` : ""} · {p.motivo}</div>
              {p.tipo === "Pareja" && (p.miembros || []).length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[12.5px]" style={{ color: "var(--ink-soft)" }}>Miembros:
                  {p.miembros.map((m, i) => m.pid && window.PACIENTES.some((x) => x.id === m.pid)
                    ? <button key={i} onClick={() => window.__selPaciente(m.pid)} className="font-semibold underline underline-offset-2" style={{ color: "var(--accent)" }}>{m.nombre}</button>
                    : <span key={i} className="font-semibold" style={{ color: "var(--ink)" }}>{m.nombre}</span>)}
                </div>
              )}
              {p.tipo !== "Pareja" && window.PACIENTES.filter((x) => x.tipo === "Pareja" && (x.miembros || []).some((m) => m.pid === p.id)).map((x) => (
                <button key={x.id} onClick={() => window.__selPaciente(x.id)} className="mt-1.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: "var(--accent)" }}><WIcon name="users" size={13} />También en terapia de pareja: {x.nombre}</button>
              ))}
              {(p.etiquetas || []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">{p.etiquetas.map((e) => <span key={e} className="h-6 px-2 rounded-full text-[11.5px] font-medium inline-flex items-center" style={{ background: "#F1F3F6", color: "var(--ink-soft)" }}>{e}</span>)}</div>
              )}
              {p.estado === "En espera" && p.disponibilidad && <div className="text-[12.5px] mt-1.5" style={{ color: "var(--ink-soft)" }}>Disponibilidad: {p.disponibilidad}</div>}
            </div>
            {!sessionMode && (
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <button onClick={() => onStart(p.id)} title="Escribir o narrar la nota de una sesión" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] text-[13px] font-semibold text-white transition active:scale-[.98]" style={{ background: "var(--accent)" }}><WIcon name="mic" size={15} />Registrar sesión</button>
                <button onClick={() => onCita(null, { pid: p.id, fecha: window.todayISO() })} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[9px] text-[13px] font-semibold transition" style={{ background: "#fff", color: "var(--ink)", border: "1px solid var(--line)" }}><WIcon name="calendar" size={15} />Cita</button>
                <button onClick={() => onModal("pago", p.id)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[9px] text-[13px] font-semibold transition" style={{ background: "#fff", color: "var(--ink)", border: "1px solid var(--line)" }}><WIcon name="money" size={15} />Pago</button>
                <button onClick={() => onModal("editar", p.id)} aria-label="Editar expediente" title="Editar expediente" className="grid place-items-center w-9 h-9 rounded-[9px] transition" style={{ background: "#fff", color: "var(--ink-soft)", border: "1px solid var(--line)" }}><WIcon name="edit" size={15} /></button>
              </div>
            )}
          </div>
        </div>
        {/* meta chips */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-4 text-[12.5px]" style={{ color: "var(--ink-soft)" }}>
          {p.enfoque && <span className="inline-flex items-center gap-1.5"><WIcon name="brain-list" size={14} />{p.enfoque}</span>}
          <span className="inline-flex items-center gap-1.5"><WIcon name="note" size={14} />{p.sesiones} sesiones</span>
          <span className="inline-flex items-center gap-1.5"><WIcon name="calendar" size={14} />Próxima: {prox || "sin agendar"}</span>
          <span className="inline-flex items-center gap-1.5"><WIcon name="money" size={14} />{wFmt(Number(p.tarifa) || 0)} / sesión</span>
          {saldo > 0 && <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: "#9A6B12" }}><WIcon name="wallet" size={14} />Debe {wFmt(saldo)}</span>}
          {!p.consentimiento && <button onClick={() => onModal("contrato", p.id)} className="inline-flex items-center gap-1.5 underline underline-offset-2" style={{ color: "#9A6B12" }}><WIcon name="file" size={14} />Sin contrato / consentimiento · generar</button>}
          {p.pagoAdelantado && <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: "#9A6B12" }}><WIcon name="wallet" size={14} />Próxima sesión: pago por adelantado</span>}
        </div>
        {riesgoAlto && (
          <button onClick={() => setTab("riesgo")} className="mt-3 w-full text-left rounded-[10px] px-3.5 py-2.5 flex items-center gap-2.5 text-[13px]" style={{ background: p.riesgo.nivel === "Alto" ? "#FCE4E4" : "#FFF3DB", color: p.riesgo.nivel === "Alto" ? "#9B2222" : "#7A4F0E" }}>
            <WIcon name="alert" size={16} /><span className="flex-1"><b>Riesgo {p.riesgo.nivel.toLowerCase()}</b> · valorado el {fmtFecha(p.riesgo.fecha)}{p.planSeguridad ? " · plan de seguridad elaborado" : " · sin plan de seguridad"}</span><span className="font-semibold">Ver</span>
          </button>
        )}
      </div>

      {/* tabs */}
      <div className="px-5 md:px-7 pt-3 border-b sticky top-0 md:static z-10 bg-white" style={{ borderColor: "var(--line)" }}>
        <TabBar tabs={tabs} active={tab} set={setTab} />
      </div>

      {/* body */}
      <div className="md:flex-1 md:overflow-y-auto px-5 md:px-7 py-6">
        {tab === "ficha" && <FichaView p={p} />}
        {tab === "sesiones" && <SesionesView p={p} onModal={onModal} />}
        {tab === "tareas" && <TareasView p={p} onTareas={onTareas} />}
        {tab === "cuenta" && <CuentaView p={p} pagos={pagos} onModal={onModal} />}
        {tab === "riesgo" && <RiesgoView p={p} onModal={onModal} />}
        {tab === "docs" && <DocsView p={p} onModal={onModal} />}
      </div>
    </div>
  );
}

function FichaField({ label, value, wide }) {
  return (
    <div className={"pb-3 border-b " + (wide ? "sm:col-span-2 lg:col-span-3" : "")} style={{ borderColor: "var(--line)" }}>
      <div className="text-[11px] font-semibold tracking-[0.04em] mb-1" style={{ color: "#9AA1AD" }}>{label.toUpperCase()}</div>
      <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{value || "—"}</div>
    </div>
  );
}

function FichaView({ p }) {
  return (
    <div className="max-w-[840px]">
      {/* datos en cuadrícula */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
        <FichaField label="Folio" value={p.folio} />
        <FichaField label="Nombre completo" value={p.nombre} wide />
        <FichaField label="Fecha de ingreso" value={fmtFecha(p.alta)} />
        <FichaField label="Teléfono" value={p.telefono} />
        <FichaField label="Correo" value={p.email} />
        <FichaField label="Dirección" value={p.direccion} wide />
        <FichaField label="Lugar de nacimiento" value={p.lugarNacimiento} />
        <FichaField label="Estado civil" value={p.estadoCivil} />
        <FichaField label="Ocupación" value={p.ocupacion} />
        <FichaField label="Nivel de estudios" value={p.estudios} />
        <FichaField label="Vive con" value={p.viveCon} />
        <FichaField label="¿Tiene hijos?" value={p.hijos} />
        <FichaField label="Contacto de emergencia" value={p.emergencia} wide />
        <FichaField label="Consentimiento informado" value={p.consentimiento ? "Firmado" : "No registrado"} />
        <FichaField label="Estado" value={p.estado} />
      </div>

      {/* áreas amplias de texto */}
      <div className="mt-9 flex flex-col gap-7">
        <div>
          <h3 className="text-[14px] font-bold mb-2" style={{ color: "var(--ink)" }}>Motivo de consulta:</h3>
          <div className="rounded-[12px] border p-4 text-[14px] leading-relaxed whitespace-pre-wrap" style={{ borderColor: "var(--line)", background: "#FBFCFD", color: "var(--ink)", minHeight: 96 }}>{p.motivoConsulta}</div>
        </div>
        <div>
          <h3 className="text-[14px] font-bold mb-2" style={{ color: "var(--ink)" }}>Historia clínica:</h3>
          <div className="rounded-[12px] border p-4 text-[14px] leading-relaxed whitespace-pre-wrap" style={{ borderColor: "var(--line)", background: "#FBFCFD", color: "var(--ink)", minHeight: 130 }}>{p.historiaClinica}</div>
        </div>
      </div>
    </div>
  );
}

function SesionesView({ p, onModal }) {
  const [open, setOpen] = React.useState(0);
  return (
    <div className="max-w-[760px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-bold mr-auto" style={{ color: "var(--ink)" }}>Historial de sesiones <span className="font-medium" style={{ color: "var(--ink-soft)" }}>· {p.historial.length}</span></h3>
        {onModal && p.historial.length > 0 && <button onClick={() => onModal("resumen", p.id)} className="inline-flex items-center gap-1.5 h-8 px-3 mr-2 rounded-lg text-[12.5px] font-semibold" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}><WIcon name="sparkles" size={14} />Resumen del caso</button>}
        {onModal && <button onClick={() => onModal("sesion", p.id)} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] font-semibold text-white transition active:scale-[.98]" style={{ background: "var(--accent)" }}><WIcon name="plus" size={14} />Nota de sesión</button>}
      </div>
      {p.historial.length === 0 && <Empty icon="note" text="Aún no hay sesiones registradas." />}
      <div className="flex flex-col gap-3">
        {p.historial.map((s, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="rounded-[12px] border overflow-hidden" style={{ borderColor: "var(--line)" }}>
              <button onClick={() => setOpen(isOpen ? -1 : i)} className="w-full flex items-center gap-3 px-4 py-3 text-left transition" style={{ background: isOpen ? "#FBFCFD" : "#fff" }}
                onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.background = "#F7F8FA"; }} onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.background = "#fff"; }}>
                <span className="grid place-items-center w-9 h-9 rounded-[9px] shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}><WIcon name="note" size={16} /></span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>{fmtFecha(s.fecha)}</div>
                  <div className="text-[12px] truncate" style={{ color: "var(--ink-soft)" }}>{s.duracion} · {String(s.temas || s.subjetivo || s.datos || s.desarrollo || "Sesión").replace(/[•\n]+/g, " ").trim()}</div>
                </div>
                <span className="shrink-0 transition-transform" style={{ color: "#A6ADB8", transform: isOpen ? "rotate(180deg)" : "none" }}><WIcon name="chevron-down" size={18} /></span>
              </button>
              {isOpen && <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: "var(--line)" }}>
                <div className="flex justify-end pt-2"><button onClick={() => onModal && onModal("doc", p.id, { title: "Nota de sesión " + p.nombre + " " + s.fecha, html: window.notaHTML(p, s) })} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] font-semibold" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}><WIcon name="printer" size={14} />Imprimir / PDF</button></div>
                <SessionNoteView s={s} /></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TAREA_NEXT = { pendiente: "en curso", "en curso": "completada", completada: "pendiente" };
function TareasView({ p, onTareas }) {
  const [nueva, setNueva] = React.useState("");
  const tareas = p.tareas || [];
  const add = () => { const t = nueva.trim(); if (!t) return; onTareas(p.id, [{ titulo: t, estado: "pendiente", fecha: "Asignada " + fmtFecha(window.todayISO()) }, ...tareas]); setNueva(""); };
  const color = { pendiente: "#C8A23A", "en curso": "var(--accent)", completada: "#2F9469" };
  return (
    <div className="max-w-[760px]">
      <div className="flex gap-2 mb-4">
        <input value={nueva} onChange={(e) => setNueva(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} placeholder="Nueva tarea para casa…"
          className="flex-1 h-10 px-3 rounded-[9px] text-[14px] outline-none" style={{ border: "1px solid var(--line)", color: "var(--ink)" }} />
        <button onClick={add} disabled={!nueva.trim()} className="h-10 px-4 rounded-[9px] text-[13.5px] font-semibold text-white disabled:opacity-40" style={{ background: "var(--accent)" }}>Agregar</button>
      </div>
      <p className="text-[12px] mb-3" style={{ color: "var(--ink-soft)" }}>Las actividades que guardes en una nota de sesión se agregan aquí automáticamente. Toca el estado para avanzarlo.</p>
      {tareas.length === 0 && <Empty icon="tasks" text="Sin tareas asignadas." />}
      <div className="flex flex-col gap-2">
        {tareas.map((t, i) => (
          <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 rounded-[11px] border" style={{ borderColor: "var(--line)" }}>
            <button onClick={() => onTareas(p.id, tareas.map((x, j) => j === i ? { ...x, estado: TAREA_NEXT[x.estado] || "pendiente" } : x))}
              className="shrink-0 text-[11.5px] font-semibold px-2 py-1 rounded-full" style={{ background: "#F5F7FA", color: color[t.estado] || "var(--ink-soft)", border: "1px solid var(--line)" }}>{t.estado}</button>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)", textDecoration: t.estado === "completada" ? "line-through" : "none" }}>{t.titulo}</div>
              <div className="text-[11.5px]" style={{ color: "var(--ink-soft)" }}>{t.fecha}</div>
            </div>
            <button onClick={() => onTareas(p.id, tareas.filter((_, j) => j !== i))} aria-label="Quitar tarea" className="grid place-items-center w-7 h-7 rounded-md hover:bg-[#F2F4F7]" style={{ color: "#A6ADB8" }}><WIcon name="x" size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CuentaView({ p, pagos, onModal }) {
  const mov = pagos.filter((g) => g.pid === p.id);
  const saldo = window.saldoDe(p.id, pagos);
  const pagado = mov.filter((g) => g.estado === "Pagado").reduce((a, g) => a + g.monto, 0);
  return (
    <div className="max-w-[760px]">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <MiniStat label="Saldo pendiente" value={wFmt(saldo)} warn={saldo > 0} />
        <MiniStat label="Total pagado" value={wFmt(pagado)} accent />
        <button onClick={() => onModal("pago", p.id)} className="ml-auto inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] text-[13px] font-semibold text-white" style={{ background: "var(--accent)" }}><WIcon name="plus" size={15} />Registrar pago</button>
      </div>
      {mov.length === 0 && <Empty icon="wallet" text="Sin movimientos." />}
      <div className="flex flex-col divide-y rounded-[12px] border" style={{ borderColor: "var(--line)" }}>
        {mov.map((g) => (
          <div key={g.id} className="flex items-center gap-3 px-4 py-2.5">
            <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{g.concepto}</div>
              <div className="text-[11.5px]" style={{ color: "var(--ink-soft)" }}>{fmtFecha(g.fecha)}{g.metodo && g.metodo !== "—" ? " · " + g.metodo : ""}</div></div>
            <WBadge estado={g.estado} />
            <span className="text-[13.5px] font-semibold tabular-nums w-[80px] text-right" style={{ color: "var(--ink)" }}>{wFmt(g.monto)}</span>
            {g.estado === "Pagado"
              ? <button onClick={() => onModal("doc", p.id, { title: "Recibo " + p.nombre + " " + g.fecha, html: window.reciboHTML(p, g) })} aria-label="Recibo" title="Imprimir recibo" className="grid place-items-center w-8 h-8 rounded-md hover:bg-[#F2F4F7]" style={{ color: "var(--ink-soft)" }}><WIcon name="printer" size={15} /></button>
              : <span className="w-8"></span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function RiesgoView({ p, onModal }) {
  const r = p.riesgo;
  const hist = p.riesgoHist || [];
  const col = { Bajo: ["#E4F2EB", "#256B4C"], Moderado: ["#FFF3DB", "#7A4F0E"], Alto: ["#FCE4E4", "#9B2222"] };
  return (
    <div className="max-w-[760px] flex flex-col gap-4">
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => onModal("riesgo", p.id)} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] text-[13px] font-semibold text-white" style={{ background: "var(--accent)" }}><WIcon name="shield" size={15} />Nueva valoración</button>
        <button onClick={() => onModal("plan", p.id)} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] text-[13px] font-semibold" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}><WIcon name="file" size={15} />{p.planSeguridad ? "Ver / editar plan de seguridad" : "Elaborar plan de seguridad"}</button>
      </div>
      {!r && <Empty icon="shield" text="Sin valoraciones de riesgo registradas." />}
      {r && (
        <div className="rounded-[12px] p-4" style={{ background: col[r.nivel][0], color: col[r.nivel][1] }}>
          <div className="text-[12px] font-semibold">VALORACIÓN ACTUAL · {fmtFecha(r.fecha)}</div>
          <div className="text-[20px] font-bold">Riesgo {r.nivel.toLowerCase()}</div>
          <div className="text-[13px] mt-1 leading-relaxed">Ideación: {r.ideacion} · Intento previo: {r.intento} · Acceso a medios: {r.medios} · Autolesiones: {r.autolesiones} · Consumo: {r.consumo}</div>
          {r.protectores && <div className="text-[13px] mt-1">Factores protectores: {r.protectores}</div>}
          {r.notas && <div className="text-[13px] mt-1 whitespace-pre-wrap">{r.notas}</div>}
        </div>
      )}
      {hist.length > 1 && (
        <div>
          <div className="text-[12px] font-semibold mb-2" style={{ color: "var(--ink-soft)" }}>HISTORIAL</div>
          <div className="flex flex-col gap-1.5">
            {hist.slice(1).map((h, i) => <div key={i} className="text-[13px] flex gap-3" style={{ color: "var(--ink)" }}><span className="w-[110px]" style={{ color: "var(--ink-soft)" }}>{fmtFecha(h.fecha)}</span><WBadge estado={"Riesgo " + h.nivel.toLowerCase()} /><span className="truncate" style={{ color: "var(--ink-soft)" }}>{h.ideacion}</span></div>)}
          </div>
        </div>
      )}
      <p className="text-[12px] leading-snug" style={{ color: "var(--ink-soft)" }}>El nivel sugerido es solo una orientación basada en las respuestas; la decisión es tu juicio clínico. Ante riesgo inminente activa la red de apoyo del paciente y los servicios de emergencia (911).</p>
    </div>
  );
}

function DocsView({ p, onModal }) {
  const docs = p.documentos || [];
  const btn = "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] text-[13px] font-semibold";
  return (
    <div className="max-w-[760px]">
      <div className="flex gap-2 flex-wrap mb-5">
        <button onClick={() => onModal("contrato", p.id)} className={btn + " text-white"} style={{ background: "var(--accent)" }}><WIcon name="file" size={15} />Generar contrato</button>
        <button onClick={() => onModal("informe", p.id)} className={btn} style={{ border: "1px solid var(--line)", color: "var(--ink)" }}><WIcon name="sparkles" size={15} />Informe o carta</button>
        <button onClick={() => onModal("doc", p.id, { title: "Expediente " + p.nombre, html: window.expedienteHTML(p) })} className={btn} style={{ border: "1px solid var(--line)", color: "var(--ink)" }}><WIcon name="printer" size={15} />Imprimir expediente completo</button>
        {p.planSeguridad && <button onClick={() => onModal("doc", p.id, { title: "Plan de seguridad " + p.nombre, html: window.planHTML(p, p.planSeguridad) })} className={btn} style={{ border: "1px solid var(--line)", color: "var(--ink)" }}><WIcon name="shield" size={15} />Plan de seguridad</button>}
      </div>
      {p.resumenIA && (
        <div className="mb-5 rounded-[12px] border p-4" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center gap-2 mb-1"><span className="text-[12px] font-semibold flex-1" style={{ color: "var(--ink-soft)" }}>ÚLTIMO RESUMEN DEL CASO · {fmtFecha(p.resumenIA.fecha)}</span>
            <button onClick={() => onModal("resumen", p.id)} className="text-[12.5px] font-semibold" style={{ color: "var(--accent)" }}>Abrir</button></div>
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap line-clamp-4" style={{ color: "var(--ink)" }}>{p.resumenIA.texto}</p>
        </div>
      )}
      <div className="text-[12px] font-semibold mb-2" style={{ color: "var(--ink-soft)" }}>CONTRATOS E INFORMES</div>
      {docs.length === 0 && <div className="text-[13px] py-3" style={{ color: "var(--ink-soft)" }}>Ninguno todavía. Genera el contrato, imprímelo, fírmenlo y márcalo como firmado.</div>}
      <div className="flex flex-col gap-2">
        {docs.map((d, i) => (
          <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 rounded-[11px] border" style={{ borderColor: "var(--line)" }}>
            <span style={{ color: "var(--accent)" }}><WIcon name="file" size={17} /></span>
            <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{d.titulo || d.tipo}</div>
              <div className="text-[11.5px]" style={{ color: "var(--ink-soft)" }}>Folio {d.folio} · {d.tipo === "Contrato" ? "firmado" : "emitido"} el {fmtFecha(d.fecha)}</div></div>
            <button onClick={() => onModal("doc", p.id, { title: (d.titulo || d.tipo) + " " + d.folio, html: d.html })} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] font-semibold" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}><WIcon name="printer" size={14} />Reimprimir</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Empty({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <span className="grid place-items-center w-12 h-12 rounded-[12px] mb-3" style={{ background: "#F2F4F7", color: "#A6ADB8" }}><WIcon name={icon} size={22} /></span>
      <p className="text-[13.5px]" style={{ color: "var(--ink-soft)" }}>{text}</p>
    </div>
  );
}

// ---------- Pacientes (master-detail) ----------
function Pacientes({ pacientes, selId, setSel, search, onModal, onStart, onTareas, citas, pagos, onCita }) {
  const [filtro, setFiltro] = React.useState("actuales");
  const [tag, setTag] = React.useState("");
  const tags = Array.from(new Set(pacientes.flatMap((p) => p.etiquetas || []))).sort();
  React.useEffect(() => { window.__selPaciente = (id) => { setFiltro("todos"); setSel(id); }; }, []);
  const norm = (x) => String(x || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const q = norm(search);
  const list = pacientes
    .filter((p) => filtro === "todos" || (filtro === "actuales" ? !["Alta", "En pausa", "En espera"].includes(p.estado) : filtro === "espera" ? p.estado === "En espera" : filtro === "pareja" ? p.tipo === "Pareja" : ["Alta", "En pausa"].includes(p.estado)))
    .filter((p) => !tag || (p.etiquetas || []).includes(tag))
    .filter((p) => !q || norm(p.nombre).includes(q) || norm(p.motivo).includes(q) || norm(p.folio).includes(q))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const sel = pacientes.find((p) => p.id === selId);
  return (
    <div className="min-h-full md:h-full flex">
      {/* list */}
      <div className={"flex-col border-r shrink-0 " + (sel ? "hidden md:flex" : "flex") + " w-full md:w-[330px]"} style={{ borderColor: "var(--line)", background: "#fff" }}>
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 h-10 px-3 rounded-[10px]" style={{ background: "#F2F4F7" }}>
            <span style={{ color: "#A6ADB8" }}><WIcon name="search" size={16} /></span>
            <input value={search} onChange={(e) => window.__setSearch(e.target.value)} placeholder="Buscar por nombre, motivo o folio…" className="bg-transparent outline-none text-[13.5px] w-full" style={{ color: "var(--ink)" }} />
          </div>
          <div className="flex items-center gap-2 mt-2.5">
            <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="h-9 pl-2.5 rounded-[9px] text-[12.5px] font-medium outline-none bg-white" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}>
              <option value="actuales">En tratamiento</option><option value="espera">Lista de espera ({pacientes.filter((x) => x.estado === "En espera").length})</option><option value="pareja">Parejas</option><option value="archivo">Alta / en pausa</option><option value="todos">Todos</option>
            </select>
            {tags.length > 0 && (
              <select value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Etiqueta" className="h-9 pl-2.5 rounded-[9px] text-[12.5px] font-medium outline-none bg-white max-w-[120px]" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}>
                <option value="">Etiqueta</option>{tags.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
            <button onClick={() => onModal("paciente")} className="ml-auto inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[9px] text-[13px] font-semibold text-white transition active:scale-[.98]" style={{ background: "var(--accent)" }}><WIcon name="plus" size={15} />Nuevo paciente</button>
          </div>
        </div>
        <div className="md:flex-1 md:overflow-y-auto px-2 pb-3">
          {list.map((p) => {
            const active = p.id === selId;
            return (
              <button key={p.id} onClick={() => setSel(p.id)} className="w-full flex items-center gap-3 p-2.5 rounded-[11px] text-left transition mb-0.5"
                style={{ background: active ? "var(--accent-soft)" : "transparent" }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#F7F8FA"; }} onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                <WAvatar nombre={p.nombre} idx={wPidx(p.id)} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold truncate" style={{ color: "var(--ink)" }}>{p.nombre}</div>
                  <div className="text-[12px] truncate" style={{ color: "var(--ink-soft)" }}>{p.tipo === "Pareja" ? "Pareja · " : ""}{p.estado === "En espera" ? "En espera · " : ""}{p.motivo}</div>
                </div>
                {p.riesgo && p.riesgo.nivel !== "Bajo" && <span className="shrink-0" title={"Riesgo " + p.riesgo.nivel.toLowerCase()} style={{ color: p.riesgo.nivel === "Alto" ? "#C73B3B" : "#C8862F" }}><WIcon name="alert" size={15} /></span>}
                {window.saldoDe(p.id, pagos) > 0 && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#C8A23A" }} title="Saldo pendiente"></span>}
              </button>
            );
          })}
          {list.length === 0 && <div className="text-center text-[13px] py-8" style={{ color: "var(--ink-soft)" }}>{pacientes.length ? "Sin resultados" : "Aún no tienes pacientes. Crea el primero con «Nuevo paciente»."}</div>}
        </div>
      </div>
      {/* detail */}
      <div className={"flex-1 min-w-0 " + (sel ? "block" : "hidden md:block")} style={{ background: "#fff" }}>
        {sel ? (
          <div className="md:h-full flex flex-col">
            <button onClick={() => setSel(null)} className="md:hidden flex items-center gap-1.5 px-5 pt-4 text-[13px] font-medium" style={{ color: "var(--accent)" }}><WIcon name="arrow-left" size={16} />Pacientes</button>
            <div className="md:flex-1 md:min-h-0"><Expediente paciente={sel} onModal={onModal} onStart={onStart} onTareas={onTareas} citas={citas} pagos={pagos} onCita={onCita} /></div>
          </div>
        ) : (
          <div className="hidden md:flex h-full items-center justify-center"><Empty icon="users" text="Selecciona un paciente para ver su expediente." /></div>
        )}
      </div>
    </div>
  );
}

// ---------- Finanzas ----------
function Finanzas({ pagos, pacientes, citas, onModal, onMarcarPagado }) {
  const mes = window.todayISO().slice(0, 7);
  const nombreMes = window.MESES[Number(mes.slice(5, 7)) - 1];
  const delMes = pagos.filter((g) => String(g.fecha).slice(0, 7) === mes);
  const pagado = delMes.filter((g) => g.estado === "Pagado").reduce((a, g) => a + g.monto, 0);
  const pendiente = pagos.filter((g) => g.estado === "Pendiente").reduce((a, g) => a + g.monto, 0);
  const sesionesCobradas = delMes.filter((g) => g.estado === "Pagado").length;
  const ordenados = [...pagos].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  return (
    <div className="max-w-[1080px] mx-auto px-5 md:px-8 py-6">
      <window.ReporteMensual pagos={pagos} pacientes={pacientes} citas={citas || []} />
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-3.5 flex-wrap">
          <MiniStat label={"Cobrado · " + nombreMes} value={wFmt(pagado)} accent />
          <MiniStat label="Por cobrar" value={wFmt(pendiente)} warn />
          <MiniStat label={"Pagos · " + nombreMes} value={sesionesCobradas} />
        </div>
        <button onClick={() => onModal("pago")} className="inline-flex items-center gap-2 h-10 px-4 rounded-[9px] text-[13.5px] font-semibold text-white transition active:scale-[.98]" style={{ background: "var(--accent)" }}><WIcon name="plus" size={16} />Registrar pago</button>
      </div>

      <WCard className="overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--line)" }}>
          <h2 className="text-[15px] font-bold" style={{ color: "var(--ink)" }}>Movimientos</h2>
          <span className="text-[12.5px]" style={{ color: "var(--ink-soft)" }}>{pagos.length} registros</span>
        </div>
        {/* table head */}
        <div className="hidden md:grid grid-cols-[1.6fr_1fr_1fr_.9fr_.9fr] px-5 py-2.5 text-[11.5px] font-semibold tracking-wide border-b" style={{ color: "var(--ink-soft)", borderColor: "var(--line)" }}>
          <span>PACIENTE</span><span>CONCEPTO</span><span>FECHA</span><span>MÉTODO</span><span className="text-right">MONTO</span>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--line)" }}>
          {ordenados.length === 0 && <Empty icon="wallet" text="Sin movimientos todavía." />}
          {ordenados.map((g) => {
            const p = pacientes.find((x) => x.id === g.pid);
            if (!p) return null;
            return (
              <div key={g.id} className="grid grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr_.9fr_.9fr] gap-y-1 px-5 py-3 items-center transition" onMouseEnter={(e) => e.currentTarget.style.background = "#F7F8FA"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <div className="flex items-center gap-2.5 col-span-2 md:col-span-1">
                  <WAvatar nombre={p.nombre} idx={wPidx(p.id)} size={32} />
                  <span className="text-[13.5px] font-medium truncate" style={{ color: "var(--ink)" }}>{p.nombre}</span>
                </div>
                <span className="text-[13px] hidden md:block" style={{ color: "var(--ink-soft)" }}>{g.concepto}</span>
                <span className="text-[13px]" style={{ color: "var(--ink-soft)" }}>{fmtFecha(g.fecha)}</span>
                <span className="text-[13px] hidden md:block" style={{ color: "var(--ink-soft)" }}>{g.metodo}</span>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-[13.5px] font-semibold tabular-nums" style={{ color: "var(--ink)" }}>{wFmt(g.monto)}</span>
                  {g.estado === "Pendiente" && <button onClick={() => onMarcarPagado(g.id)} title="Marcar como pagado" className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#FBF2DE", color: "#8A6418" }}>pendiente · cobrar</button>}
                </div>
              </div>
            );
          })}
        </div>
      </WCard>
    </div>
  );
}

function MiniStat({ label, value, accent, warn }) {
  return (
    <WCard className="px-4 py-3 min-w-[150px]">
      <div className="text-[12px]" style={{ color: "var(--ink-soft)" }}>{label}</div>
      <div className="text-[22px] font-bold tracking-[-0.02em] mt-0.5" style={{ color: accent ? "var(--accent)" : warn ? "#B8862F" : "var(--ink)" }}>{value}</div>
    </WCard>
  );
}

Object.assign(window, { Pacientes, Expediente, Finanzas });
