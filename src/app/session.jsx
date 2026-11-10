// ============ Psystema — session note (template-driven fields) ============
const { Icon: SIcon } = window;

// Controlled editor. `fields` defaults to the active template; each field has its own mic + "pulir con IA".
function SessionEditor({ value, onChange, compact, fields, paciente }) {
  const list = fields || window.SESSION_FIELDS;
  return (
    <div className="flex flex-col gap-4">
      {list.map((f) => (
        <div key={f.key} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <label htmlFor={"fld-" + f.key} className="text-[12.5px] font-semibold flex items-center gap-1.5 flex-1" style={{ color: f.big ? "var(--ink)" : "var(--ink-soft)" }}>
              {f.big && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }}></span>}
              {f.label}
            </label>
            <FieldTools field={f} value={value[f.key] || ""} onChange={(v) => onChange(f.key, v)} paciente={paciente} />
          </div>
          <textarea id={"fld-" + f.key}
            value={value[f.key] || ""}
            onChange={(e) => onChange(f.key, e.target.value)}
            rows={compact && !f.big ? Math.min(f.rows, 2) : f.rows}
            placeholder={f.ph}
            className="w-full p-3 rounded-[10px] text-[14px] bg-white outline-none resize-y leading-relaxed transition"
            style={{ border: f.big ? "1.5px solid var(--line)" : "1px solid var(--line)", color: "var(--ink)" }}
            onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }}
            onBlur={(e) => { e.target.style.borderColor = "var(--line)"; e.target.style.boxShadow = "none"; }}
          />
        </div>
      ))}
    </div>
  );
}

// Per-field dictation (only one field listens at a time) + AI polish of that field
let __fieldStop = null;
function FieldTools({ field, value, onChange, paciente }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const [rec, setRec] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [prev, setPrev] = React.useState(null);
  const [err, setErr] = React.useState("");
  const rRef = React.useRef(null), want = React.useRef(false), base = React.useRef(""), fin = React.useRef(""), valRef = React.useRef(value);
  valRef.current = value;
  const stop = () => { want.current = false; const r = rRef.current; if (r) { try { r.stop(); } catch (_) {} } };
  React.useEffect(() => () => { want.current = false; const r = rRef.current; if (r) { r.onresult = null; r.onend = null; try { r.abort(); } catch (_) {} } }, []);
  const start = () => {
    if (__fieldStop) __fieldStop();
    setErr("");
    try {
      const r = new SR();
      r.lang = "es-MX"; r.continuous = !/Android/i.test(navigator.userAgent || ""); r.interimResults = true;
      base.current = valRef.current; fin.current = "";
      r.onresult = (e) => {
        let f = "", i2 = "";
        for (let i = 0; i < e.results.length; i++) { if (e.results[i].isFinal) f += " " + e.results[i][0].transcript; else i2 += " " + e.results[i][0].transcript; }
        fin.current = f;
        onChange(joinTxt(base.current, voiceCmds(f + i2)));
      };
      r.onerror = (e) => { if (e.error === "not-allowed" || e.error === "service-not-allowed" || e.error === "audio-capture" || e.error === "network") { want.current = false; setErr("Micrófono no disponible; usa el dictado del teclado (Win + H / Fn Fn)."); } };
      r.onend = () => {
        base.current = joinTxt(base.current, voiceCmds(fin.current)); fin.current = "";
        onChange(base.current);
        if (want.current) { try { r.start(); } catch (_) { want.current = false; setRec(false); } } else setRec(false);
      };
      rRef.current = r; want.current = true; r.start(); setRec(true);
      __fieldStop = stop;
    } catch (_) { setErr("No se pudo iniciar el micrófono."); }
  };
  const pulir = async () => {
    if (!value.trim()) return;
    setBusy(true); setErr("");
    try {
      const raw = await window.claude.complete({ model: "claude-sonnet",
        system: `Eres un asistente clínico (${window.NOTA_CFG.enfoque}). Reescribe el texto que te dan para el apartado «${field.label}» de una nota de sesión psicológica: lenguaje clínico formal, objetivo, en pasado, tercera persona, corrigiendo errores de dictado. Instrucción del apartado: ${field.ai} No agregues información que no esté en el texto. Sin Markdown. Devuelve SOLO el texto final.${(window.NOTA_CFG.instrucciones || "").trim() ? "\nInstrucciones personales del terapeuta: " + window.NOTA_CFG.instrucciones.trim() : ""}`,
        messages: [{ role: "user", content: (paciente ? `Paciente: ${paciente.nombre} (${paciente.genero || ""}).\n\n` : "") + value }] });
      setPrev(value); onChange(String(raw || "").trim());
    } catch (e) { setErr("No se pudo pulir: " + String((e && e.message) || e).slice(0, 100)); }
    setBusy(false);
  };
  const btn = "inline-flex items-center gap-1 h-7 px-2 rounded-[7px] text-[11.5px] font-semibold transition";
  return (
    <div className="flex items-center gap-1 shrink-0">
      {err && <span className="text-[11px] mr-1 max-w-[220px] truncate" title={err} style={{ color: "#B23636" }}>{err}</span>}
      {prev != null && !busy && <button type="button" onClick={() => { onChange(prev); setPrev(null); }} className={btn} style={{ color: "var(--ink-soft)" }}>Deshacer</button>}
      {value.trim() && <button type="button" onClick={pulir} disabled={busy || rec} title="Pasar este apartado a lenguaje clínico con IA" className={btn + " disabled:opacity-50"} style={{ color: "var(--accent)" }}>
        <SIcon name="sparkles" size={13} />{busy ? "Puliendo…" : "Pulir"}</button>}
      {SR && <button type="button" onClick={() => (rec ? stop() : start())} aria-label={rec ? "Detener dictado de " + field.label : "Dictar " + field.label} title={rec ? "Detener" : "Dictar solo este apartado"}
        className={btn} style={rec ? { background: "#E0466F", color: "#fff" } : { background: "var(--accent-soft)", color: "var(--accent)" }}>
        <SIcon name={rec ? "pause" : "mic"} size={13} />{rec ? "Escuchando" : ""}</button>}
    </div>
  );
}

// Read-only display of a stored session (shows whatever fields it was saved with)
function SessionNoteView({ s }) {
  return (
    <div className="flex flex-col gap-4">
      {window.noteFields(s).map((f) => (
        <div key={f.key}>
          <div className="text-[11.5px] font-semibold tracking-wide mb-1 flex items-center gap-1.5" style={{ color: f.big ? "var(--accent)" : "var(--ink-soft)" }}>
            {f.big && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }}></span>}
            {f.label.toUpperCase()}
          </div>
          <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--ink)" }}>{s[f.key]}</p>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { SessionEditor, SessionNoteView, FieldTools });

// ============ Dictado inteligente ============
const { useState: useDS, useEffect: useDE, useRef: useDR } = React;

// ---- Prompt built from the active template + the therapist's own instructions ----
function buildDictadoSystem(fieldsArg, paciente) {
  const T = window.THERAPIST, cfg = window.NOTA_CFG, fields = fieldsArg || window.SESSION_FIELDS;
  const quien = ((T.titulo ? T.titulo + " " : "") + T.nombre).trim();
  const lines = [];
  lines.push(`Eres un asistente clínico que ayuda a ${quien} (${T.rol}) a redactar notas de sesión para un expediente psicológico profesional. Enfoque terapéutico principal: ${cfg.enfoque || "Terapia Cognitivo-Conductual"}.`);
  lines.push(`Recibirás la TRANSCRIPCIÓN CRUDA del dictado de voz del terapeuta: un relato informal, en primera persona, con muletillas, repeticiones, errores del reconocimiento de voz y desorden, sobre lo que ocurrió en la consulta.`);
  lines.push(`Transforma ese relato en una nota clínica estructurada y devuelve EXCLUSIVAMENTE un objeto JSON válido (sin texto antes ni después, sin bloques de código) con exactamente estas claves: ${fields.map((f) => `"${f.key}"`).join(", ")}. Todos los valores son cadenas de texto.`);
  lines.push(``);
  if (paciente && paciente.tipo === "Pareja") lines.push(`Es una sesión de TERAPIA DE PAREJA: refiérete a cada miembro por su nombre y describe la dinámica entre ambos.`);
  lines.push(`PRINCIPIOS DE REDACCIÓN`);
  lines.push(`- Lenguaje clínico formal, objetivo y técnico, en pasado. Al paciente refiérete como "el paciente"/"la paciente" según su género, o por su nombre. Al terapeuta, en voz impersonal ("se trabajó", "se acordó") o como "el terapeuta".`);
  lines.push(`- Usa la terminología propia del enfoque cuando corresponda, sin forzarla.`);
  lines.push(`- NO inventes datos, diagnósticos, puntuaciones, fechas ni citas textuales que no estén en el dictado. Si algo es ambiguo, redáctalo con prudencia.`);
  lines.push(`- Corrige por contexto los errores evidentes del reconocimiento de voz, la ortografía y la gramática.`);
  lines.push(`- Español de México. Sin emojis ni Markdown. Usa \\n para separar líneas dentro de un valor.`);
  lines.push(`- Si un fragmento fue marcado para comentarios ("esto va en comentarios", "off the record"), sepáralo del resto y no lo repitas en otros apartados.`);
  lines.push(``);
  lines.push(`APARTADOS`);
  fields.forEach((f) => lines.push(`- "${f.key}" (${f.label}): ${f.ai}`));
  if ((cfg.instrucciones || "").trim()) {
    lines.push(``);
    lines.push(`INSTRUCCIONES PERSONALES DEL TERAPEUTA (tienen prioridad sobre lo anterior, salvo la regla de no inventar datos):`);
    lines.push(cfg.instrucciones.trim());
  }
  lines.push(``);
  lines.push(`Devuelve solo el objeto JSON.`);
  return lines.join("\n");
}

function buildContexto(paciente) {
  if (!paciente) return "No se seleccionó paciente; trabaja solo con la transcripción.";
  if (paciente.tipo === "Pareja") {
    const ms = (paciente.miembros || []).map((m) => m.nombre).filter(Boolean);
    paciente = { ...paciente, nombre: (ms.length ? ms.join(" y ") : paciente.nombre) + " (terapia de pareja)", genero: "pareja" };
  }
  let c = `Nombre: ${paciente.nombre}\nGénero: ${paciente.genero || "—"}\nEdad: ${paciente.edad || "—"}\nMotivo de consulta: ${paciente.motivo || "—"}\nEnfoque / objetivo actual: ${paciente.enfoque || "—"}`;
  if (paciente.motivoConsulta) c += `\nMotivo detallado: ${String(paciente.motivoConsulta).slice(0, 600)}`;
  const h = (paciente.historial || []).slice(0, 3);
  if (h.length) {
    c += `\nSesiones anteriores (más reciente primero):`;
    h.forEach((s) => {
      const resumen = window.noteFields(s).map((f) => `${f.label}: ${String(s[f.key]).replace(/\s+/g, " ").slice(0, 260)}`).join(" | ");
      c += `\n- ${s.fecha}: ${resumen}`;
    });
  }
  return c;
}

function parseFields(txt, fieldsArg) {
  let t = (txt || "").trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a !== -1 && b !== -1) t = t.slice(a, b + 1);
  const o = JSON.parse(t);
  const out = {};
  (fieldsArg || window.SESSION_FIELDS).forEach((f) => {
    const v = o[f.key];
    out[f.key] = Array.isArray(v) ? v.join("\n") : (v == null ? "" : String(v));
  });
  return out;
}

async function estructurarDictado(texto, paciente, fieldsArg) {
  const fields = fieldsArg || window.SESSION_FIELDS;
  const system = buildDictadoSystem(fields, paciente);
  const user = "[CONTEXTO DEL PACIENTE]\n" + buildContexto(paciente) +
    "\n\n[TRANSCRIPCIÓN DEL DICTADO]\n" + texto +
    "\n\nDevuelve SOLO el objeto JSON con las claves: " + fields.map((f) => f.key).join(", ") + ".";
  let firstErr = null;
  // 1) Claude, built into this page (no keys or servers needed)
  if (window.claude && typeof window.claude.complete === "function") {
    try {
      const raw = await window.claude.complete({ model: "claude-sonnet", system, messages: [{ role: "user", content: user }] });
      return parseFields(raw, fields);
    } catch (e) { firstErr = e; }
  }
  // 2) Optional: the therapist's own backend (e.g. the Vercel function)
  const url = (window.NOTA_CFG.backendUrl || "").trim();
  if (url) {
    const r = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: texto, contexto: buildContexto(paciente), system, campos: fields.map((f) => f.key) }),
    });
    if (!r.ok) throw new Error("Tu servidor respondió " + r.status);
    const data = await r.json();
    const out = {};
    fields.forEach((f) => { out[f.key] = data[f.key] || ""; });
    return out;
  }
  throw firstErr || new Error("El asistente no está disponible en esta vista.");
}

// Spoken punctuation commands
function voiceCmds(s) {
  return String(s || "")
    .replace(/\s*\b(punto y aparte|nuevo p[áa]rrafo)\b[.,]?\s*/gi, ".\n\n")
    .replace(/\s*\bpunto y seguido\b[.,]?\s*/gi, ". ")
    .replace(/\s*\bdos puntos\b\s*/gi, ": ")
    .replace(/\.\.+/g, ".");
}
function joinTxt(a, b) {
  const bb = String(b || "").trim();
  if (!bb) return a || "";
  if (!a) return bb;
  return /\s$/.test(a) ? a + bb : a + " " + bb;
}

// Animated equalizer (active while the mic is recording)
function Equalizer({ active }) {
  const bars = [0.0, 0.18, 0.36, 0.1, 0.28, 0.46, 0.14, 0.32, 0.06, 0.24, 0.4, 0.12, 0.3];
  return (
    <div className="flex items-center justify-center gap-[3px] h-9" aria-hidden="true">
      {bars.map((d, i) => (
        <span key={i} className="w-[3px] rounded-full" style={{
          height: 30, background: "var(--accent)", transformOrigin: "center",
          animation: active ? `eqbar ${0.7 + (i % 4) * 0.18}s ease-in-out ${d}s infinite` : "none",
          opacity: active ? 1 : 0.22, transform: active ? undefined : "scaleY(.28)",
        }}></span>
      ))}
    </div>
  );
}

const KEYBOARD_TIP = "Alternativa que funciona siempre: haz clic en el cuadro de texto y usa el dictado de tu sistema — Windows: tecla Windows + H · Mac: pulsa dos veces la tecla Fn (o Control) · Celular: el micrófono del teclado.";

// Dictation (Web Speech API) + AI structuring. The transcript lives in the parent so it survives closing the panel.
function DictadoPanel({ paciente, texto, setTexto, onApply, onClose, fields }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const isAndroid = /Android/i.test(navigator.userAgent || "");
  const [phase, setPhase] = useDS("dictation"); // dictation | processing | error
  const [interim, setInterim] = useDS("");
  const [recording, setRecording] = useDS(false);
  const [secs, setSecs] = useDS(0);
  const [notice, setNotice] = useDS(SR ? "" : "unsupported");
  const [errMsg, setErrMsg] = useDS("");

  const recogRef = useDR(null);
  const wantRef = useDR(false);       // keep listening (auto-restart after silences)
  const baseRef = useDR(texto || ""); // text committed before the current recognition run
  const runRef = useDR("");           // final text of the current recognition run

  const detach = (r) => { if (!r) return; r.onresult = null; r.onend = null; r.onerror = null; };

  const startRec = () => {
    if (!SR) { setNotice("unsupported"); return; }
    try {
      const r = new SR();
      r.lang = "es-MX";
      r.continuous = !isAndroid; // Android repeats results in continuous mode; restart instead
      r.interimResults = true;
      r.maxAlternatives = 1;
      runRef.current = "";
      r.onresult = (e) => {
        let fin = "", intr = "";
        for (let i = 0; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) fin += " " + res[0].transcript; else intr += " " + res[0].transcript;
        }
        runRef.current = fin;
        setTexto(joinTxt(baseRef.current, voiceCmds(fin)));
        setInterim(intr.trim());
      };
      r.onerror = (e) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") { wantRef.current = false; setNotice("denied"); setRecording(false); }
        else if (e.error === "audio-capture") { wantRef.current = false; setNotice("nomic"); setRecording(false); }
        else if (e.error === "network") { wantRef.current = false; setNotice("network"); setRecording(false); }
        // no-speech / aborted: harmless, onend restarts
      };
      r.onend = () => {
        baseRef.current = joinTxt(baseRef.current, voiceCmds(runRef.current));
        runRef.current = "";
        setTexto(baseRef.current);
        setInterim("");
        if (wantRef.current) { try { r.start(); } catch (_) { wantRef.current = false; setRecording(false); } }
        else setRecording(false);
      };
      recogRef.current = r;
      wantRef.current = true;
      r.start();
      setRecording(true);
      setNotice("");
    } catch (_) { setNotice("error"); }
  };

  const stopRec = () => {
    wantRef.current = false;
    if (recogRef.current) { try { recogRef.current.stop(); } catch (_) {} }
  };

  // The user typed while recording: drop pending results so nothing gets duplicated
  const onType = (v) => {
    if (recording || wantRef.current) {
      wantRef.current = false;
      const r = recogRef.current; detach(r);
      try { r && r.abort(); } catch (_) {}
      setRecording(false);
    }
    runRef.current = ""; setInterim("");
    baseRef.current = v; setTexto(v);
  };

  useDE(() => () => { wantRef.current = false; const r = recogRef.current; detach(r); try { r && r.abort(); } catch (_) {} }, []);

  useDE(() => {
    if (!recording) return;
    const i = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [recording]);

  const process = async () => {
    const text = joinTxt(texto, interim).trim();
    if (!text) return;
    if (recording) { wantRef.current = false; const r = recogRef.current; detach(r); try { r && r.stop(); } catch (_) {} setRecording(false); }
    baseRef.current = text; setTexto(text); setInterim("");
    setPhase("processing");
    try {
      const out = await estructurarDictado(text, paciente, fields);
      onApply(out);
    } catch (err) {
      const m = String((err && err.message) || err || "");
      setErrMsg(/unavailable|no está disponible|not available/i.test(m)
        ? "El asistente de IA no está disponible en esta vista. Abre Psystema directamente (no en vista previa) e inténtalo de nuevo. Tu narración se conservó."
        : "No se pudo estructurar la narración (" + m.slice(0, 160) + "). Tu narración se conservó; puedes reintentar.");
      setPhase("error");
    }
  };

  const clearAll = () => { baseRef.current = ""; runRef.current = ""; setTexto(""); setInterim(""); setSecs(0); };

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const canProcess = joinTxt(texto, interim).trim().length > 0;
  const words = joinTxt(texto, interim).trim() ? joinTxt(texto, interim).trim().split(/\s+/).length : 0;
  const plantilla = paciente && paciente.tipo === "Pareja" ? window.PLANTILLAS.pareja.nombre : (window.PLANTILLAS[window.NOTA_CFG.plantilla] || window.PLANTILLAS.tcc).nombre;

  const noticeText = {
    unsupported: "Este navegador no tiene reconocimiento de voz integrado (funciona en Chrome y Edge). " + KEYBOARD_TIP,
    denied: "El micrófono está bloqueado para esta página. Permítelo en el candado de la barra de direcciones, o abre Psystema en su propia pestaña. " + KEYBOARD_TIP,
    nomic: "No se detectó ningún micrófono. Conecta uno o usa el dictado de tu sistema. " + KEYBOARD_TIP,
    network: "El reconocimiento de voz del navegador necesita internet y no respondió. " + KEYBOARD_TIP,
    error: "Hubo un problema con el micrófono. " + KEYBOARD_TIP,
  }[notice];

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0" style={{ background: "rgba(24,28,38,.42)", backdropFilter: "blur(4px)" }}></div>
      <div className="psy-sheet relative bg-white w-full rounded-t-2xl sm:rounded-[20px] overflow-hidden flex flex-col animate-[mpop_.24s_cubic-bezier(.2,.8,.2,1)]"
        style={{ maxWidth: 640, boxShadow: "0 28px 80px rgba(20,30,60,.32)" }}>

        {/* header */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-4">
          <div className="grid place-items-center w-10 h-10 rounded-[12px] shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
            <SIcon name="sparkles" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[16.5px] font-bold tracking-[-0.01em]" style={{ color: "var(--ink)" }}>Dictado inteligente</h2>
            <p className="text-[12.5px] truncate" style={{ color: "var(--ink-soft)" }}>
              {phase === "processing" ? "Redactando la nota clínica…" : (paciente ? paciente.nombre + " · " : "") + "Plantilla: " + plantilla}
            </p>
          </div>
          {phase !== "processing" && (
            <button onClick={() => { stopRec(); onClose(); }} aria-label="Cerrar" className="grid place-items-center w-8 h-8 rounded-lg hover:bg-[#F2F4F7] transition" style={{ color: "var(--ink-soft)" }}>
              <SIcon name="x" size={18} />
            </button>
          )}
        </div>

        {phase === "dictation" && (
          <>
            <div className="px-6">
              <div className="rounded-[14px] px-5 py-4 flex items-center gap-4" style={{ background: "#FAFBFD", border: "1px solid var(--line)" }}>
                <button onClick={() => (recording ? stopRec() : startRec())} disabled={!SR} aria-label={recording ? "Pausar dictado" : "Empezar a dictar"}
                  className="relative grid place-items-center w-12 h-12 rounded-full shrink-0 transition active:scale-95 disabled:opacity-40"
                  style={{ background: recording ? "var(--accent)" : "#fff", border: recording ? "none" : "1.5px solid var(--line)", color: recording ? "#fff" : "var(--accent)" }}>
                  {recording && <span className="absolute inline-flex rounded-full w-12 h-12 opacity-35 animate-ping" style={{ background: "var(--accent)" }}></span>}
                  <span className="relative"><SIcon name={recording ? "pause" : "mic"} size={recording ? 20 : 22} /></span>
                </button>
                <div className="flex-1 min-w-0">
                  {recording ? <Equalizer active={true} />
                    : <div className="text-[13px] font-medium" style={{ color: "var(--ink-soft)" }}>{SR ? (texto ? "En pausa · toca para seguir dictando" : "Toca el micrófono y narra la sesión") : "Escribe o usa el dictado del teclado"}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[15px] font-bold tabular-nums tracking-tight" style={{ color: recording ? "var(--ink)" : "var(--ink-soft)" }}>{mm}:{ss}</div>
                  <div className="text-[11px] tabular-nums" style={{ color: "var(--ink-soft)" }}>{words} palabras</div>
                </div>
              </div>
            </div>

            {notice && (
              <div className="px-6 pt-3">
                <div className="text-[12.5px] leading-snug rounded-[10px] px-3.5 py-2.5" style={{ background: "#FFF6E9", color: "#7A4F0E", border: "1px solid #F2E1C4" }}>{noticeText}</div>
              </div>
            )}

            <div className="px-6 pt-4 flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-semibold tracking-[0.1em]" style={{ color: "var(--ink-soft)" }}>NARRACIÓN {recording ? "· EN VIVO" : "· EDITABLE"}</div>
                <div className="flex items-center gap-3">
                  {recording && <span className="text-[11.5px] inline-flex items-center gap-1.5" style={{ color: "var(--ink-soft)" }}><span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#E0466F" }}></span>Escuchando</span>}
                  {texto && !recording && <button onClick={clearAll} className="text-[12px] font-medium hover:opacity-70 transition" style={{ color: "var(--ink-soft)" }}>Borrar todo</button>}
                </div>
              </div>
              <textarea value={joinTxt(texto, interim)}
                onChange={(e) => onType(e.target.value)}
                onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") process(); }}
                placeholder={"Narra la sesión con tus palabras, como se la contarías a un colega. Puedes escribir, pegar texto o dictar.\n\nComandos de voz: «punto y aparte», «punto y seguido», «dos puntos».\nPara separar una observación privada di: «esto va en comentarios»."}
                className="w-full p-3.5 rounded-[12px] text-[14px] leading-relaxed bg-white outline-none resize-none transition"
                style={{ border: "1px solid var(--line)", color: "var(--ink)", height: 230 }}
                onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--line)"; e.target.style.boxShadow = "none"; }} />
              <p className="text-[11.5px] mt-2 leading-snug" style={{ color: "var(--ink-soft)" }}>
                {SR ? "El reconocimiento de voz del navegador envía el audio a su proveedor (Google en Chrome) para transcribirlo. " : ""}La narración se queda guardada aunque cierres este panel.
              </p>
            </div>

            <div className="psy-safe-b px-6 py-4 mt-3 border-t flex items-center gap-3" style={{ borderColor: "var(--line)", background: "#FBFCFD" }}>
              <span className="text-[12px] mr-auto hidden sm:block" style={{ color: "var(--ink-soft)" }}>Ctrl/⌘ + Enter para estructurar</span>
              <button onClick={() => { stopRec(); onClose(); }} className="h-10 px-4 rounded-[9px] text-[14px] font-semibold transition hover:bg-[#F2F4F7]" style={{ color: "var(--ink-soft)" }}>Cerrar</button>
              <button onClick={process} disabled={!canProcess}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-[9px] text-[14px] font-semibold text-white transition active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "var(--accent)", boxShadow: "0 1px 2px rgba(20,40,90,.18)" }}>
                <SIcon name="sparkles" size={16} />Estructurar nota
              </button>
            </div>
          </>
        )}

        {phase === "processing" && (
          <div className="px-6 pb-7 pt-1 overflow-y-auto">
            <div className="rounded-[14px] px-5 py-4 flex items-center gap-3.5 mb-5" style={{ background: "var(--accent-soft)" }}>
              <span className="relative flex w-5 h-5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: "var(--accent)" }}></span>
                <span className="relative inline-flex rounded-full w-5 h-5 items-center justify-center text-white" style={{ background: "var(--accent)" }}><SIcon name="sparkles" size={12} /></span>
              </span>
              <div className="text-[13.5px] font-semibold" style={{ color: "var(--accent)" }}>Estructurando en lenguaje clínico…</div>
            </div>
            <div className="flex flex-col gap-4">
              {(fields || window.SESSION_FIELDS).map((f, i) => (
                <div key={f.key}>
                  <div className="text-[11.5px] font-semibold mb-1.5" style={{ color: "var(--ink-soft)" }}>{f.label}</div>
                  <div className="flex flex-col gap-1.5">
                    {Array.from({ length: f.big ? 4 : 2 }).map((_, r) => (
                      <div key={r} className="ai-skel" style={{ height: 9, width: r === 0 ? "92%" : r % 2 ? "78%" : "85%", animationDelay: `${(i * 0.12 + r * 0.06)}s` }}></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="px-6 pb-7 pt-1">
            <div className="rounded-[12px] px-4 py-3.5 mb-5 text-[13.5px] leading-relaxed" style={{ background: "#FCEEF0", color: "#9B2C3C", border: "1px solid #F3D2D8" }}>{errMsg}</div>
            <div className="flex items-center gap-3 justify-end">
              <button onClick={onClose} className="h-10 px-4 rounded-[9px] text-[14px] font-semibold transition hover:bg-[#F2F4F7]" style={{ color: "var(--ink-soft)" }}>Cerrar</button>
              <button onClick={() => { setErrMsg(""); setPhase("dictation"); }} className="h-10 px-4 rounded-[9px] text-[14px] font-semibold transition" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}>Editar narración</button>
              <button onClick={process} className="inline-flex items-center gap-2 h-10 px-5 rounded-[9px] text-[14px] font-semibold text-white transition active:scale-[.98]" style={{ background: "var(--accent)" }}>Reintentar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { DictadoPanel, buildDictadoSystem, estructurarDictado });
