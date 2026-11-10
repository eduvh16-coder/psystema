// ============ Psystema — documentos (contrato, nota, expediente, recibo, plan de seguridad) ============
// Builds printable letter-size documents with the therapist's letterhead.
// Print/PDF uses a hidden frame + the browser's print dialog ("Guardar como PDF"); Word downloads an HTML .doc.
const { useState: useDocS, useEffect: useDocE, useRef: useDocR } = React;

const LOGO_PATHS = "<path d=\"M218.36,138.29c.88-4.56,1.72-16-6.85-30.95a37.71,37.71,0,0,0-20.72-16.62l-.56-1.1-.07-.14c-2.39-4.79-6-12-16.37-14.83-13.11-3.55-20.69,0-23.81,2.12-3.12-2.14-10.69-5.67-23.77-2.12-10.37,2.81-14,10-16.41,14.91-.21.41-.4.8-.59,1.16a37.71,37.71,0,0,0-20.72,16.62c-8.57,15-7.73,26.39-6.85,30.95a53.21,53.21,0,0,0-5.83,25.08c0,17.13,13.32,25.64,19.57,28.69,1.47,9.64,6.65,22.63,22.83,30.88A36.72,36.72,0,0,0,135,226.86a45.16,45.16,0,0,0,15-2.63,55.63,55.63,0,0,0,15,2.63,36.72,36.72,0,0,0,16.82-3.92c16.18-8.25,21.36-21.24,22.83-30.88,6.25-3.05,19.54-11.56,19.57-28.69A53.21,53.21,0,0,0,218.36,138.29ZM166.71,218c-5.52-.67-9.78-5-12.65-12.85a40.5,40.5,0,0,1-.37-4.31l-.14-109.09c0-3.35,1-5.82,3-7.33,2.9-2.21,7.59-2.25,11-1.33,8.67,2.4,11.27,6.09,12,7.89-3.74,2.33-7.84,5.33-7.71,7.15a1.54,1.54,0,0,0,1,1.3c1.78.76,4.1.64,6.77.5,6.46-.34,15.31-.8,22.6,11.53,5.69,9.63,7.29,16.52,4.9,21a13.11,13.11,0,0,1-3.46,3.38,24,24,0,0,0-7.21,7.94,1.46,1.46,0,0,0,.13,1.76c.39.44,1.58,1.74,13.51-3,1.65,2.69,5.12,9.91,4,21.74-1.1,11.49-7.85,16.34-11.74,18.2-1-8.66-2.44-8.77-3.07-8.83-1.42-.12-2,1.86-2.24,2.91a55.58,55.58,0,0,0-1,6.42c-1.12,9-2.82,22.59-12.64,29.21A36.56,36.56,0,0,1,173,217.37,29.61,29.61,0,0,1,166.71,218Zm-39.58-.57a36.71,36.71,0,0,1-10.43-5.17C106.88,205.6,105.18,192,104.06,183a55.58,55.58,0,0,0-1-6.42c-.27-1-.78-2.91-2.12-2.91h-.12c-.63.06-2.07.17-3.07,8.83-3.89-1.86-10.64-6.71-11.74-18.2-1.14-11.83,2.33-19.05,4-21.74,11.93,4.72,13.12,3.42,13.51,3a1.46,1.46,0,0,0,.13-1.76,24,24,0,0,0-7.21-7.94,13,13,0,0,1-3.46-3.38c-2.39-4.53-.79-11.42,4.9-21,7.29-12.33,16.14-11.87,22.6-11.53,2.67.14,5,.26,6.77-.5a1.54,1.54,0,0,0,1-1.3c.13-1.82-4-4.82-7.71-7.15.76-1.8,3.36-5.49,12-7.89,3.37-.92,8.06-.88,11,1.33,2,1.51,3,4,3,7.33l-.14,109.07a40.43,40.43,0,0,1-.37,4.33c-2.87,7.86-7.13,12.18-12.55,12.85A30.6,30.6,0,0,1,127.13,217.39Z\"></path><path d=\"M128.5,121.86a12.84,12.84,0,0,1-2.16-2.25,18.74,18.74,0,0,1-2-9.43,7.65,7.65,0,0,0-.11-1.79c-.38-1.47-1.21-1.7-1.68-1.71h0c-2.71,0-5.34,9-5.83,10.82l-.13.44c-.07.23-.13.47-.19.71-.33,1.3-.61,2.43-2.13,3.18-6.2,3.1-6.8,7.27-6.61,9.47.08,1,.51,2.91,1.52,3.21a1,1,0,0,0,.71,0,1.85,1.85,0,0,0,.42-.38c4.64-5.87,9-7.38,9.79-7.44,1.32-.06,4.12,1.62,6.37,3,3.45,2,5.3,3.08,6.56,2.39a1.63,1.63,0,0,0,.82-1.48C134,126.85,130.83,124,128.5,121.86Z\"></path><path d=\"M171.5,178.1a12.51,12.51,0,0,1,2.16,2.24,18.78,18.78,0,0,1,2,9.43,7.61,7.61,0,0,0,.11,1.79c.38,1.48,1.21,1.7,1.68,1.71h0c2.71,0,5.34-9,5.83-10.82l.13-.44c.07-.23.13-.46.19-.71.33-1.3.61-2.42,2.13-3.18,6.2-3.09,6.8-7.26,6.61-9.47-.08-1-.51-2.9-1.52-3.21a1,1,0,0,0-.71,0,2.08,2.08,0,0,0-.42.39c-4.64,5.87-9,7.37-9.79,7.43-1.32.06-4.12-1.62-6.37-3-3.45-2-5.3-3.08-6.56-2.39a1.63,1.63,0,0,0-.82,1.48C166,173.11,169.17,176,171.5,178.1Z\"></path>";
const logoSVG = (size, color) => `<svg width="${size}" height="${Math.round(size * 1.03)}" viewBox="76 72 152 156" fill="${color || "#000"}" xmlns="http://www.w3.org/2000/svg">${LOGO_PATHS}</svg>`;
const escH = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const nl2br = (s) => escH(s).replace(/\n/g, "<br>");
const fechaLarga = (iso) => { const d = new Date((iso || window.todayISO()) + "T12:00"); return `${window.pad2(d.getDate())} de ${window.MESES[d.getMonth()]} del ${d.getFullYear()}`; };
const fechaCorta = (iso) => { const d = new Date((iso || window.todayISO()) + "T12:00"); return `${d.getDate()} ${window.MESES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`; };
const money = (n) => "$" + Number(n || 0).toLocaleString("es-MX") + " MXN";

function numLetras(n) {
  n = Math.floor(Math.abs(Number(n) || 0));
  const U = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
  const D = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
  const C = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
  const apoc = (s) => s.replace(/veintiuno$/, "veintiún").replace(/uno$/, "un");
  const tres = (x) => { if (!x) return ""; if (x === 100) return "cien"; const c = Math.floor(x / 100), r = x % 100; const t = r < 30 ? U[r] : D[Math.floor(r / 10)] + (r % 10 ? " y " + U[r % 10] : ""); return ((c ? C[c] : "") + " " + t).trim(); };
  if (n === 0) return "Cero";
  const mill = Math.floor(n / 1e6), miles = Math.floor((n % 1e6) / 1000), rest = n % 1000;
  let out = "";
  if (mill) out += (mill === 1 ? "un millón" : apoc(tres(mill)) + " millones") + " ";
  if (miles) out += (miles === 1 ? "mil" : apoc(tres(miles)) + " mil") + " ";
  out += tres(rest);
  out = apoc(out.trim());
  return out.charAt(0).toUpperCase() + out.slice(1);
}

// ---- shared pieces (inline styles only, so they survive print and Word) ----
const S_BODY = "font-family:'Open Sans',Arial,Helvetica,sans-serif;font-size:10.5pt;line-height:1.5;color:#111;";
const S_H1 = "text-align:center;font-size:14pt;font-weight:700;letter-spacing:1.5px;margin:18px 0 8px;";
const S_H2 = "font-size:10.5pt;font-weight:700;letter-spacing:.8px;margin:16px 0 4px;text-transform:uppercase;";
const S_P = "margin:0 0 8px;text-align:justify;letter-spacing:.3px;";
const S_UL = "margin:0 0 6px;padding-left:22px;";
const S_LI = "margin:0 0 2px;text-align:justify;letter-spacing:.3px;";
const HR = `<div style="border-top:3px solid #000;margin:6px 10px 12px;"></div>`;
const ul = (items) => `<ul style="${S_UL}">${items.map((i) => `<li style="${S_LI}">${i}</li>`).join("")}</ul>`;

function membreteHTML() {
  const T = window.THERAPIST;
  return `<table style="border-collapse:collapse;margin-bottom:4px;"><tr>
    <td style="vertical-align:middle;padding:0 8px 0 0;">${logoSVG(46)}</td>
    <td style="vertical-align:middle;line-height:1.2;">
      <div style="font-weight:700;font-size:12pt;">${escH(T.nombre)}</div>
      <div style="font-weight:700;font-size:9pt;">${escH(T.rol)}</div>
      <div style="font-size:7.5pt;">${escH(T.especialidad || "")}</div>
    </td></tr></table>`;
}
function pieHTML() {
  const T = window.THERAPIST;
  return `<div style="text-align:center;margin-top:28px;page-break-inside:avoid;">${logoSVG(40)}
    <div style="font-size:7.5pt;font-weight:700;line-height:1.3;">${escH(((T.titulo ? T.titulo + " " : "") + T.nombre).trim())}${T.telefono ? "<br>Tel: " + escH(T.telefono) : ""}</div></div>`;
}
function firmasHTML(nombres) {
  const T = window.THERAPIST;
  const cell = (n, sub) => `<td style="width:${Math.floor(100 / (nombres.length + 1))}%;padding:0 14px;vertical-align:top;text-align:center;">
    <div style="border-top:1.5px solid #000;padding-top:4px;font-size:9.5pt;font-weight:700;letter-spacing:.6px;">${escH(String(n).toUpperCase())}</div>
    ${sub ? `<div style="font-size:8.5pt;font-weight:700;letter-spacing:.6px;">${sub}</div>` : ""}</td>`;
  return `<div style="page-break-inside:avoid;margin-top:70px;"><table style="width:100%;border-collapse:collapse;"><tr>
    ${nombres.map((n) => cell(n, "")).join("")}
    ${cell(((T.titulo ? T.titulo + " " : "") + (T.nombreCompleto || T.nombre)), T.cedula ? "CÉD. PROF. " + escH(T.cedula) : "")}
  </tr></table></div>`;
}
const docWrap = (inner) => `<div style="${S_BODY}">${inner}</div>`;

// ---------- Contrato ----------
function contratoHTML({ nombres, fecha, tipo, folio }) {
  const T = window.THERAPIST, P = window.POLITICAS;
  const pl = nombres.length > 1;
  const pac = pl ? "los pacientes" : "el paciente", Pac = pl ? "Los pacientes" : "El paciente";
  const nombresTxt = pl ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : nombres[0];
  return docWrap(`
    ${membreteHTML()}
    <div style="${S_H1}">CONTRATO DE PRESTACIÓN DE SERVICIOS DE PSICOTERAPIA<br>Y CONSENTIMIENTO INFORMADO</div>
    ${HR}
    <div style="text-align:right;letter-spacing:1px;margin-bottom:10px;">${fechaLarga(fecha)}</div>
    <p style="margin:0;"><b>Nombre completo ${pl ? "de los pacientes" : "del paciente"}:</b> ${escH(nombresTxt)}</p>
    <p style="margin:0 0 12px;"><b>Nombre completo del terapeuta:</b> ${escH(T.nombreCompleto || T.nombre)}</p>
    <p style="${S_P}">El terapeuta se compromete a brindar servicios de psicoterapia de manera ética, profesional y confidencial. ${Pac} ${pl ? "aceptan" : "acepta"} participar en el proceso terapéutico, reconociendo que los resultados dependerán de su participación activa y compromiso.</p>
    <div style="${S_H2}">Confidencialidad</div>
    ${ul([
      "Toda la información compartida en las sesiones será tratada con estricta confidencialidad.",
      `Los registros clínicos se manejarán de forma segura y no serán divulgados sin el consentimiento ${pl ? "de los pacientes" : "del paciente"}, salvo en los casos en que la ley lo requiera (riesgo de daño a sí mismo, a terceros o por orden judicial).`,
      `En dichos casos, el terapeuta notificará previamente ${pl ? "a los pacientes" : "al paciente"} sobre la necesidad de compartir la información.`,
      `Las sesiones no serán grabadas en audio ni en video. En caso de requerirse una grabación por motivos profesionales o académicos, esta se realizará únicamente con consentimiento previo, expreso y por escrito ${pl ? "de los pacientes" : "del paciente"}.`,
    ])}
    <div style="${S_H2}">Modalidad de sesiones</div>
    ${ul([
      `Duración de las sesiones:<ul style="margin:2px 0 0;padding-left:20px;list-style:circle;"><li><b>Terapia individual: ${P.durIndividual} minutos.</b></li><li><b>Terapia de pareja: ${P.durPareja} minutos.</b></li></ul>`,
      `Sesiones presenciales o en línea: se podrán realizar de manera presencial o virtual mediante ${escH(P.plataforma)} u otra plataforma acordada con ${pac}. Las políticas de este contrato aplican de igual manera a ambas modalidades.`,
    ])}
    <div style="${S_H2}">Asistencia, puntualidad y cancelaciones</div>
    ${ul([
      `${Pac} se ${pl ? "comprometen" : "compromete"} a asistir puntualmente a sus sesiones.`,
      `En caso de no poder asistir, deberá${pl ? "n" : ""} avisar con al menos ${P.horasAviso} horas de anticipación para reagendar sin costo adicional.`,
      "Si no se notifica con dicha anticipación, la sesión se considerará tomada: el pago de la sesión quedará registrado y no habrá reembolso.",
      "Para agendar una nueva sesión después de una inasistencia o cancelación sin aviso oportuno, el pago deberá realizarse por adelantado.",
    ])}
    <div style="${S_H2}">Honorarios y forma de pago</div>
    ${ul([
      "El costo de los servicios es el siguiente:",
      `Terapia individual: <b>${money(P.tarifaIndividual)} por sesión.</b>`,
      `Terapia de pareja: <b>${money(P.tarifaPareja)} por sesión.</b>`,
      `Los pagos se realizarán únicamente ${escH(P.metodosPago)}.`,
      `${Pac} se ${pl ? "comprometen" : "compromete"} a cubrir la tarifa acordada antes o al finalizar cada sesión.`,
    ])}
    <div style="${S_H2}">Condiciones del servicio</div>
    ${ul([
      `El terapeuta se reserva el derecho de no brindar el servicio en caso de que ${pac} se ${pl ? "presenten" : "presente"} bajo los efectos de alcohol u otras sustancias que impidan llevar a cabo la sesión de manera adecuada.`,
      `Tanto ${pac} como el terapeuta podrán decidir finalizar el proceso terapéutico en cualquier momento. Esto deberá realizarse mediante previo aviso y acuerdo mutuo, a fin de favorecer un cierre adecuado del proceso.`,
    ])}
    <div style="${S_H2}">Consentimiento informado</div>
    <p style="${S_P}">${pl ? "Declaramos que hemos" : "Declaro que he"} recibido información clara respecto a:</p>
    ${ul([
      "La naturaleza del proceso psicoterapéutico.",
      "Los alcances y límites de la confidencialidad.",
      `${pl ? "Nuestros" : "Mis"} derechos y responsabilidades como paciente${pl ? "s" : ""}.`,
      "Las políticas de cancelación, pagos y asistencia.",
      "Las condiciones en las que el servicio puede ser suspendido.",
    ])}
    <p style="${S_P}margin-top:10px;">${pl ? "Manifestamos que aceptamos" : "Manifiesto que acepto"} libremente iniciar este proceso bajo las condiciones aquí establecidas.</p>
    ${firmasHTML(nombres)}
    ${pieHTML()}
    ${folio ? `<div style="text-align:right;font-size:7pt;color:#666;margin-top:6px;">Folio ${escH(folio)}</div>` : ""}
  `);
}

// ---------- Nota de sesión ----------
function encabezadoPaciente(p, extra) {
  return `<table style="width:100%;border-collapse:collapse;font-size:9.5pt;margin:6px 0 12px;"><tr>
    <td style="padding:3px 0;"><b>Paciente:</b> ${escH(p.nombre)}</td><td style="padding:3px 0;text-align:right;"><b>Folio:</b> ${escH(p.folio || "")}</td></tr>
    ${extra || ""}</table>`;
}
const confidencial = `<div style="font-size:7.5pt;color:#555;text-align:center;margin-top:18px;border-top:1px solid #ccc;padding-top:6px;">Documento confidencial. Contiene información clínica protegida; su divulgación sin autorización está prohibida.</div>`;
function notaBloque(s) {
  return window.noteFields(s).map((f) => `<div style="${S_H2}">${escH(f.label)}</div><p style="${S_P}">${nl2br(s[f.key])}</p>`).join("");
}
function notaHTML(p, s) {
  return docWrap(`${membreteHTML()}<div style="${S_H1}">NOTA DE SESIÓN</div>${HR}
    ${encabezadoPaciente(p, `<tr><td style="padding:3px 0;"><b>Fecha:</b> ${fechaLarga(s.fecha)}</td><td style="padding:3px 0;text-align:right;"><b>Duración:</b> ${escH(s.duracion || "")}</td></tr>`)}
    ${notaBloque(s)}
    ${firmasHTML([])}${confidencial}`);
}

// ---------- Expediente completo ----------
function expedienteHTML(p) {
  const row = (a, b) => `<tr><td style="padding:3px 8px 3px 0;width:34%;color:#444;vertical-align:top;">${a}</td><td style="padding:3px 0;vertical-align:top;">${escH(b || "—")}</td></tr>`;
  const r = p.riesgo;
  const sesiones = (p.historial || []).slice().sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  return docWrap(`${membreteHTML()}<div style="${S_H1}">EXPEDIENTE CLÍNICO</div>${HR}
    <div style="${S_H2}">Ficha de identificación</div>
    <table style="width:100%;border-collapse:collapse;font-size:9.5pt;">
      ${row("Nombre", p.nombre)}${row("Folio", p.folio)}${row("Fecha de ingreso", fechaLarga(p.alta))}${row("Edad", p.edad)}${row("Género", p.genero)}
      ${row("Teléfono", p.telefono)}${row("Correo", p.email)}${row("Dirección", p.direccion)}${row("Lugar de nacimiento", p.lugarNacimiento)}
      ${row("Estado civil", p.estadoCivil)}${row("Ocupación", p.ocupacion)}${row("Escolaridad", p.estudios)}${row("Vive con", p.viveCon)}${row("Hijos", p.hijos)}
      ${row("Contacto de emergencia", p.emergencia)}${row("Consentimiento informado", p.consentimiento ? "Firmado" + (p.fechaConsentimiento ? " el " + fechaLarga(p.fechaConsentimiento) : "") : "No registrado")}
    </table>
    <div style="${S_H2}">Motivo de consulta</div><p style="${S_P}">${nl2br(p.motivoConsulta || p.motivo)}</p>
    <div style="${S_H2}">Historia clínica</div><p style="${S_P}">${nl2br(p.historiaClinica || "—")}</p>
    ${r ? `<div style="${S_H2}">Última valoración de riesgo (${fechaLarga(r.fecha)})</div><p style="${S_P}">Nivel: <b>${escH(r.nivel)}</b>. Ideación: ${escH(r.ideacion)}. Intento previo: ${escH(r.intento)}. Acceso a medios: ${escH(r.medios)}.${r.protectores ? " Factores protectores: " + escH(r.protectores) + "." : ""}${r.notas ? "<br>" + nl2br(r.notas) : ""}</p>` : ""}
    <div style="${S_H2}">Notas de sesión (${sesiones.length})</div>
    ${sesiones.map((s, i) => `<div style="page-break-inside:avoid;border-top:1px solid #bbb;margin-top:10px;padding-top:6px;"><div style="font-weight:700;font-size:10pt;">Sesión ${i + 1} · ${fechaLarga(s.fecha)}${s.duracion ? " · " + escH(s.duracion) : ""}</div>${notaBloque(s)}</div>`).join("")}
    ${firmasHTML([])}${confidencial}`);
}

// ---------- Recibo ----------
function reciboHTML(p, g) {
  const T = window.THERAPIST;
  return docWrap(`${membreteHTML()}<div style="${S_H1}">RECIBO DE PAGO</div>${HR}
    <table style="width:100%;border-collapse:collapse;margin-bottom:12px;"><tr><td><b>Folio:</b> ${escH(g.folioRecibo || ("R-" + String(g.id).slice(-6).toUpperCase()))}</td><td style="text-align:right;"><b>Fecha:</b> ${fechaLarga(g.fecha)}</td></tr></table>
    <p style="${S_P}font-size:11pt;">Recibí de <b>${escH(p.nombre)}</b> la cantidad de <b>${money(g.monto)}</b> (${numLetras(g.monto)} pesos 00/100 M.N.) por concepto de <b>${escH(g.concepto)}</b>${g.metodo && g.metodo !== "—" ? `, pagado mediante <b>${escH(String(g.metodo).toLowerCase())}</b>` : ""}.</p>
    <div style="page-break-inside:avoid;margin-top:60px;text-align:center;"><div style="display:inline-block;min-width:260px;border-top:1.5px solid #000;padding-top:4px;font-size:9.5pt;font-weight:700;">${escH(((T.titulo ? T.titulo + " " : "") + (T.nombreCompleto || T.nombre)).toUpperCase())}</div>
    ${T.cedula ? `<div style="font-size:8.5pt;font-weight:700;">CÉD. PROF. ${escH(T.cedula)}</div>` : ""}</div>
    ${pieHTML()}`);
}

// ---------- Plan de seguridad ----------
const PLAN_SECCIONES = [
  { k: "senales", t: "1. Mis señales de alerta", h: "Pensamientos, emociones, situaciones o conductas que me avisan que se acerca una crisis." },
  { k: "internas", t: "2. Lo que puedo hacer yo solo/a para calmarme", h: "Actividades que me ayudan a distraerme sin contactar a nadie (respiración, caminar, música, ducharme…)." },
  { k: "social", t: "3. Personas y lugares que me ayudan a distraerme", h: "Con quién puedo estar o a dónde puedo ir para no estar solo/a." },
  { k: "ayuda", t: "4. Personas a quienes puedo pedir ayuda", h: "Nombre y teléfono de personas de confianza a quienes puedo decirles cómo me siento." },
  { k: "profesionales", t: "5. Profesionales y servicios de emergencia", h: "A quién llamar si lo anterior no fue suficiente." },
  { k: "entorno", t: "6. Cómo hacer mi entorno más seguro", h: "Qué medios voy a alejar o entregar a alguien de confianza." },
  { k: "razones", t: "7. Lo más importante para mí y por lo que vale la pena vivir", h: "" },
];
function planVacio() {
  const T = window.THERAPIST;
  return { senales: "", internas: "", social: "", ayuda: "", entorno: "", razones: "",
    profesionales: `${((T.titulo ? T.titulo + " " : "") + (T.nombreCompleto || T.nombre)).trim()}${T.telefono ? " · " + T.telefono : ""}\nLínea de la Vida (24 h, gratuita): 800 911 2000\nEmergencias: 911` };
}
function planHTML(p, plan) {
  return docWrap(`${membreteHTML()}<div style="${S_H1}">MI PLAN DE SEGURIDAD</div>${HR}
    <table style="width:100%;border-collapse:collapse;margin-bottom:6px;"><tr><td><b>Nombre:</b> ${escH(p.nombre)}</td><td style="text-align:right;"><b>Fecha:</b> ${fechaLarga(plan.fecha)}</td></tr></table>
    <p style="${S_P}">Este plan lo hicimos juntos para que sepas qué hacer si te sientes en crisis. Síguelo paso a paso, en orden, hasta sentirte a salvo. Tenlo a la mano (guárdale una foto en tu celular).</p>
    ${PLAN_SECCIONES.map((s) => `<div style="page-break-inside:avoid;border:1.5px solid #000;border-radius:8px;padding:8px 12px;margin:8px 0;">
      <div style="font-weight:700;font-size:10.5pt;">${s.t}</div>
      <div style="min-height:38px;margin-top:2px;">${plan[s.k] ? nl2br(plan[s.k]) : "&nbsp;"}</div></div>`).join("")}
    <p style="${S_P}font-weight:700;text-align:center;margin-top:10px;">Si estás en peligro inmediato, llama al 911 o acude al servicio de urgencias más cercano.</p>
    ${pieHTML()}`);
}

// ---------- Free-text document (AI summaries, reports, letters) ----------
function textoAHTML(txt) {
  const lines = String(txt || "").split(/\n/);
  let out = "", lista = [];
  const flush = () => { if (lista.length) { out += ul(lista); lista = []; } };
  lines.forEach((raw) => {
    const l = raw.trim();
    if (!l) { flush(); return; }
    if (/^[•\-–*]\s+/.test(l)) { lista.push(escH(l.replace(/^[•\-–*]\s+/, ""))); return; }
    flush();
    if (/^[A-ZÁÉÍÓÚÑÜ0-9 ,.()\/·-]{3,}:\s*$/.test(l) || /^[A-ZÁÉÍÓÚÑÜ ]{4,}:/.test(l) && l.length < 60) out += `<div style="${S_H2}">${escH(l)}</div>`;
    else out += `<p style="${S_P}">${escH(l)}</p>`;
  });
  flush();
  return out;
}
function docHTMLTexto(titulo, p, txt, fecha, conFirma) {
  return docWrap(`${membreteHTML()}<div style="${S_H1}">${escH(titulo)}</div>${HR}
    <div style="text-align:right;letter-spacing:1px;margin-bottom:10px;">${window.THERAPIST.ciudad ? escH(window.THERAPIST.ciudad) + ", a " : ""}${fechaLarga(fecha)}</div>
    ${conFirma ? "" : encabezadoPaciente(p)}
    ${textoAHTML(txt)}
    ${firmasHTML([])}${conFirma ? "" : confidencial}${pieHTML()}`);
}

// ---------- print / Word ----------
// Print from the page itself: the app is hidden and only the document is printed (works on iPhone, desktop and inside frames).
(function () {
  if (document.getElementById("psy-print-css")) return;
  const st = document.createElement("style"); st.id = "psy-print-css";
  st.textContent = "#psy-print{display:none}@media print{@page{size:letter;margin:1.8cm 2cm}html,body{height:auto!important;overflow:visible!important;background:#fff!important}body.psy-printing>*:not(#psy-print){display:none!important}body.psy-printing #psy-print{display:block!important}#psy-print *{-webkit-print-color-adjust:exact;print-color-adjust:exact}}";
  document.head.appendChild(st);
})();
function printHTML(html, title) {
  let el = document.getElementById("psy-print");
  if (!el) { el = document.createElement("div"); el.id = "psy-print"; document.body.appendChild(el); }
  el.innerHTML = html;
  const prevTitle = document.title;
  document.title = title || prevTitle;
  document.body.classList.add("psy-printing");
  let done = false;
  const fin = () => { if (done) return; done = true; document.body.classList.remove("psy-printing"); el.innerHTML = ""; document.title = prevTitle; window.removeEventListener("afterprint", fin); };
  window.addEventListener("afterprint", fin);
  setTimeout(() => { try { window.print(); } catch (e) { console.warn("[Psystema] print", e); } if (!window.ES_IOS) setTimeout(fin, 1500); else setTimeout(fin, 60000); }, 60);
}
function wordDownload(html, title) {
  const body = html.replace(/<svg[\s\S]*?<\/svg>/g, "");
  const doc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${escH(title)}</title><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]--><style>@page Section1{size:8.5in 11.0in;margin:1.8cm 2cm}div.Section1{page:Section1}</style></head><body><div class="Section1">${body}</div></body></html>`;
  return window.guardarArchivo(new Blob(["\ufeff", doc], { type: "application/msword" }), title.replace(/[\\/:*?"<>|]+/g, "-") + ".doc");
}

// ---------- UI: document preview (letter page) ----------
// Letter page at real size (8.5 × 11 in = 816 × 1056 px, same margins as print), scaled down only to fit — never reflowed.
const PAGE_W = 816, PAGE_H = 1056, M_TB = 68, M_LR = 76, CONTENT_H = PAGE_H - 2 * M_TB;
function DocPreview({ html, editable, onEdit }) {
  const ref = useDocR(null), wrap = useDocR(null), paper = useDocR(null);
  const [k, setK] = useDocS(1), [h, setH] = useDocS(PAGE_H);
  useDocE(() => { if (ref.current && ref.current.innerHTML !== html) ref.current.innerHTML = html; }, [html]);
  useDocE(() => {
    const measure = () => {
      const w = wrap.current, p = paper.current; if (!w || !p) return;
      const kk = Math.round(Math.min(1, Math.max(0.3, (w.clientWidth - 32) / PAGE_W)) * 1000) / 1000;
      setK((o) => Math.abs(o - kk) > 0.002 ? kk : o); setH((o) => Math.abs(o - p.offsetHeight) > 2 ? p.offsetHeight : o);
    };
    measure();
    if (typeof ResizeObserver === "undefined") { window.addEventListener("resize", measure); return () => window.removeEventListener("resize", measure); }
    const ro = new ResizeObserver(measure); ro.observe(wrap.current); ro.observe(paper.current);
    return () => ro.disconnect();
  }, []);
  const pages = Math.max(1, Math.ceil((h - 2 * M_TB) / CONTENT_H));
  return (
    <div ref={wrap} className="rounded-[12px] overflow-auto py-4" style={{ background: "#E9ECF1", maxHeight: "66vh" }}>
      <div style={{ width: PAGE_W * k, height: h * k, margin: "0 auto", position: "relative" }}>
        <div ref={paper} className="bg-white" style={{ width: PAGE_W, minHeight: PAGE_H * pages, padding: `${M_TB}px ${M_LR}px`, transform: `scale(${k})`, transformOrigin: "top left", position: "absolute", left: 0, top: 0, boxShadow: "0 2px 12px rgba(20,30,60,.14)", outline: editable ? "2px dashed var(--accent)" : "none" }}>
          <div ref={ref} contentEditable={!!editable} suppressContentEditableWarning
            onInput={(e) => onEdit && onEdit(e.currentTarget.innerHTML)}
            className="outline-none" style={{ cursor: editable ? "text" : "default" }} />
          {Array.from({ length: pages - 1 }).map((_, i) => (
            <div key={i} aria-hidden="true" className="absolute left-0 right-0 pointer-events-none" style={{ top: M_TB + (i + 1) * CONTENT_H, borderTop: "2px dashed #C9D0DB" }}>
              <span className="absolute right-2 -top-[18px] text-[11px] font-semibold px-1.5 rounded" style={{ color: "#8A92A0", background: "#fff" }}>Página {i + 2}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function DocActions({ html, title, extra }) {
  const [msg, setMsg] = useDocS("");
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {extra}
      <button onClick={() => printHTML(html, title)} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[9px] text-[13.5px] font-semibold text-white" style={{ background: "var(--accent)" }}><window.Icon name="printer" size={16} />Imprimir / PDF</button>
      <button onClick={() => setMsg(wordDownload(html, title) ? "" : "No se pudo descargar aquí; usa Imprimir / PDF.")} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[9px] text-[13.5px] font-semibold" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}><window.Icon name="file" size={16} />Word</button>
      {msg && <span className="text-[12px]" style={{ color: "#B23636" }}>{msg}</span>}
    </div>
  );
}

// Generic "view & print" modal for any document
function DocModal({ title, subtitle, html, onClose }) {
  return (
    <ModalShell maxW={860} icon="printer" title={title} subtitle={subtitle || "En el diálogo de impresión elige «Guardar como PDF» para obtener el archivo"} onClose={onClose}
      footer={<><BtnGhost onClick={onClose}>Cerrar</BtnGhost><DocActions html={html} title={title} /></>}>
      <DocPreview html={html} />
    </ModalShell>
  );
}

// ---------- Contract generator ----------
function ContratoModal({ pacientes, preselect, onClose, onSigned, onPoliticas }) {
  const [pid, setPid] = useDocS(preselect || "");
  const p = pacientes.find((x) => x.id === pid);
  const ms = (p && p.tipo === "Pareja" && p.miembros) || [];
  const [tipo, setTipo] = useDocS(p && p.tipo === "Pareja" ? "Pareja" : "Individual");
  const [n1, setN1] = useDocS(ms[0] ? ms[0].nombre : p ? p.nombre : "");
  const [n2, setN2] = useDocS(ms[1] ? ms[1].nombre : "");
  const [fecha, setFecha] = useDocS(window.todayISO());
  const [editar, setEditar] = useDocS(false);
  const [edited, setEdited] = useDocS(null);
  const year = window.todayISO().slice(0, 4);
  const usados = pacientes.flatMap((x) => (x.documentos || []).map((d) => d.folio)).filter((f) => String(f).indexOf("CT-" + year + "-") === 0).map((f) => Number(String(f).split("-")[2]) || 0);
  const folio = "CT-" + year + "-" + String((usados.length ? Math.max(...usados) : 0) + 1).padStart(3, "0");
  const nombres = [n1.trim(), tipo === "Pareja" ? n2.trim() : ""].filter(Boolean);
  const base = nombres.length ? contratoHTML({ nombres, fecha, tipo, folio }) : "";
  useDocE(() => { setEdited(null); }, [base]);
  const html = edited || base;
  const title = "Contrato " + (nombres.join(" y ") || "") + " " + fecha;
  const ok = nombres.length && (tipo === "Individual" || nombres.length === 2);
  return (
    <ModalShell maxW={1000} icon="file" title="Generar contrato" subtitle="Contrato de prestación de servicios y consentimiento informado" onClose={onClose}
      footer={<>
        <span className="mr-auto text-[12px] hidden sm:inline" style={{ color: "var(--ink-soft)" }}>Folio {folio}</span>
        <span className="hidden sm:inline"><BtnGhost onClick={onClose}>Cerrar</BtnGhost></span>
        {ok && <DocActions html={html} title={title} extra={p && <button onClick={() => onSigned({ pid, folio, fecha, tipo: "Contrato", titulo: "Contrato " + tipo.toLowerCase(), html })}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[9px] text-[13.5px] font-semibold" style={{ border: "1px solid #2F9469", color: "#256B4C", background: "#F1F8F4" }}><window.Icon name="check" size={16} />Marcar como firmado</button>} />}
      </>}>
      <div className="grid md:grid-cols-[260px_1fr] gap-5">
        <div className="flex flex-col gap-4">
          <Field label="Paciente">
            <select className={fieldCls} style={inputStyle()} value={pid} onChange={(e) => { const id = e.target.value; setPid(id); const x = pacientes.find((y) => y.id === id); if (x && x.tipo === "Pareja") { const m = x.miembros || []; setTipo("Pareja"); setN1((m[0] && m[0].nombre) || ""); setN2((m[1] && m[1].nombre) || ""); } else { setTipo("Individual"); setN1(x ? x.nombre : ""); } }} {...fx}>
              <option value="">Escribir nombre a mano…</option>
              {pacientes.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
            </select>
          </Field>
          <Field label="Tipo de terapia">
            <select className={fieldCls} style={inputStyle()} value={tipo} onChange={(e) => setTipo(e.target.value)} {...fx}><option>Individual</option><option>Pareja</option></select>
          </Field>
          <Field label={tipo === "Pareja" ? "Nombre completo (1)" : "Nombre completo del paciente"}>
            <input className={fieldCls} style={inputStyle()} value={n1} onChange={(e) => setN1(e.target.value)} placeholder="Nombre y apellidos" {...fx} />
          </Field>
          {tipo === "Pareja" && (
            <Field label="Nombre completo (2)">
              <input className={fieldCls} style={inputStyle()} value={n2} onChange={(e) => setN2(e.target.value)} placeholder="Nombre y apellidos" {...fx} />
            </Field>
          )}
          <Field label="Fecha"><input type="date" className={fieldCls} style={inputStyle()} value={fecha} onChange={(e) => setFecha(e.target.value)} {...fx} /></Field>
          <div className="rounded-[10px] p-3 text-[12px] leading-snug" style={{ background: "#F5F7FA", color: "var(--ink-soft)" }}>
            Tarifas, duraciones, aviso de cancelación y métodos de pago vienen de tus <button onClick={onPoliticas} className="font-semibold" style={{ color: "var(--accent)" }}>Políticas del consultorio</button>.
          </div>
          <Check checked={editar} onChange={setEditar}>Editar el texto de este contrato a mano</Check>
          {edited && <button onClick={() => setEdited(null)} className="text-[12.5px] font-semibold text-left" style={{ color: "var(--accent)" }}>Deshacer mis ediciones</button>}
          {!p && ok && <p className="text-[11.5px]" style={{ color: "var(--ink-soft)" }}>Elige un paciente de la lista para poder marcarlo como firmado en su expediente.</p>}
        </div>
        <div>
          {ok ? <DocPreview html={html} editable={editar} onEdit={setEdited} />
            : <div className="rounded-[12px] grid place-items-center text-[13px] h-[300px]" style={{ background: "#F5F7FA", color: "var(--ink-soft)" }}>Elige un paciente o escribe {tipo === "Pareja" ? "ambos nombres" : "el nombre"} para ver el contrato.</div>}
        </div>
      </div>
    </ModalShell>
  );
}

// ---------- Políticas del consultorio ----------
function PoliticasModal({ onClose, onSave, onPin }) {
  const [c, setC] = useDocS({ ...window.POLITICAS });
  const set = (k, num) => (e) => setC({ ...c, [k]: num ? e.target.value.replace(/[^\d]/g, "") : e.target.value });
  const numIn = (label, k, suf) => (
    <Field label={label}><div className="flex items-center gap-2"><input className={fieldCls} style={inputStyle()} inputMode="numeric" value={c[k]} onChange={set(k, true)} {...fx} />{suf && <span className="text-[12.5px] shrink-0" style={{ color: "var(--ink-soft)" }}>{suf}</span>}</div></Field>
  );
  const save = () => onSave({ ...c, tarifaIndividual: Number(c.tarifaIndividual) || 0, tarifaPareja: Number(c.tarifaPareja) || 0, durIndividual: Number(c.durIndividual) || 50, durPareja: Number(c.durPareja) || 80, horasAviso: Number(c.horasAviso) || 24, autoOcultarMin: Number(c.autoOcultarMin) || 0 });
  return (
    <ModalShell wide icon="shield" title="Políticas del consultorio" subtitle="Se usan en tus contratos y en la agenda" onClose={onClose}
      footer={<><BtnGhost onClick={onClose}>Cancelar</BtnGhost><BtnPrimary onClick={save}>Guardar</BtnPrimary></>}>
      <div className="grid grid-cols-2 gap-4">
        {numIn("Tarifa terapia individual", "tarifaIndividual", "MXN")}
        {numIn("Tarifa terapia de pareja", "tarifaPareja", "MXN")}
        {numIn("Duración individual", "durIndividual", "min")}
        {numIn("Duración pareja", "durPareja", "min")}
        {numIn("Aviso mínimo para cancelar", "horasAviso", "horas")}
        <Field label="Plataforma en línea"><input className={fieldCls} style={inputStyle()} value={c.plataforma} onChange={set("plataforma")} {...fx} /></Field>
        <Field label="Métodos de pago (como aparece en el contrato)" span><input className={fieldCls} style={inputStyle()} value={c.metodosPago} onChange={set("metodosPago")} {...fx} /></Field>
        <div className="col-span-2"><Check checked={!!c.cargoInasistencia} onChange={(v) => setC({ ...c, cargoInasistencia: v })}>Al marcar una cita como «No asistió» o «Cancelación tardía», generar el cargo de la sesión y avisar que la siguiente se paga por adelantado</Check></div>
        <div className="col-span-2 border-t pt-4" style={{ borderColor: "var(--line)" }}>
          <window.HorarioEditor value={c} onChange={setC} />
        </div>
        <div className="col-span-2 border-t pt-4 flex items-center gap-3 flex-wrap" style={{ borderColor: "var(--line)" }}>
          <div className="flex-1 min-w-[200px]">
            <div className="text-[13.5px] font-semibold" style={{ color: "var(--ink)" }}>PIN de acceso {window.PIN_ACTIVO_RUNTIME ? "· activo" : "· desactivado"}</div>
            <div className="text-[12px]" style={{ color: "var(--ink-soft)" }}>Pide un PIN al abrir la app y cifra tus expedientes en este navegador.</div>
          </div>
          <button type="button" onClick={onPin} className="h-9 px-3.5 rounded-[9px] text-[13px] font-semibold" style={{ border: "1px solid var(--line)", color: "var(--ink)" }}>{window.PIN_ACTIVO_RUNTIME ? "Cambiar o quitar PIN" : "Crear PIN"}</button>
        </div>
        <div className="col-span-2 border-t pt-4" style={{ borderColor: "var(--line)" }}>
          <Field label="Seguridad: ocultar la pantalla tras inactividad" hint="Cubre la app cuando no la usas (sin PIN por ahora). 0 = desactivado.">
            <div className="flex items-center gap-2"><input className={fieldCls + " max-w-[120px]"} style={inputStyle()} inputMode="numeric" value={c.autoOcultarMin} onChange={set("autoOcultarMin", true)} {...fx} /><span className="text-[12.5px]" style={{ color: "var(--ink-soft)" }}>minutos</span></div>
          </Field>
        </div>
      </div>
    </ModalShell>
  );
}

// ---------- Valoración de riesgo ----------
function sugerirNivel(v) {
  const activa = v.ideacion === "Activa sin plan" || v.ideacion === "Activa con plan";
  if (v.ideacion === "Activa con plan" || (activa && (v.intento === "Sí" || v.medios === "Sí"))) return "Alto";
  if (activa || v.autolesiones === "Sí, recientes" || (v.ideacion === "Pasiva (deseos de morir)" && v.intento === "Sí")) return "Moderado";
  return "Bajo";
}
function RiesgoModal({ paciente, onClose, onSave }) {
  const prev = paciente.riesgo || {};
  const [v, setV] = useDocS({ fecha: window.todayISO(), ideacion: "No", intento: prev.intento || "No", medios: "No", autolesiones: "No", consumo: "No", protectores: prev.protectores || "", notas: "", nivel: "" });
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const sug = sugerirNivel(v);
  const nivel = v.nivel || sug;
  const sel = (label, k, opts) => (
    <Field label={label}><select className={fieldCls} style={inputStyle()} value={v[k]} onChange={set(k)} {...fx}>{opts.map((o) => <option key={o}>{o}</option>)}</select></Field>
  );
  const col = { Bajo: ["#E4F2EB", "#256B4C"], Moderado: ["#FFF3DB", "#8A5A0E"], Alto: ["#FCE4E4", "#9B2222"] }[nivel];
  return (
    <ModalShell wide icon="shield" title="Valoración de riesgo" subtitle={paciente.nombre} onClose={onClose}
      footer={<><BtnGhost onClick={onClose}>Cancelar</BtnGhost><BtnPrimary onClick={() => onSave(paciente.id, { ...v, nivel, sugerido: sug })}>Guardar valoración</BtnPrimary></>}>
      <div className="grid grid-cols-2 gap-4">
        {sel("Ideación suicida", "ideacion", ["No", "Pasiva (deseos de morir)", "Activa sin plan", "Activa con plan"])}
        {sel("Intento(s) previo(s)", "intento", ["No", "Sí", "Se desconoce"])}
        {sel("Acceso a medios letales", "medios", ["No", "Sí", "Se desconoce"])}
        {sel("Autolesiones", "autolesiones", ["No", "Antecedente", "Sí, recientes"])}
        {sel("Consumo de alcohol/sustancias de riesgo", "consumo", ["No", "Sí"])}
        <Field label="Fecha"><input type="date" className={fieldCls} style={inputStyle()} value={v.fecha} onChange={set("fecha")} {...fx} /></Field>
        <Field label="Factores protectores" span><input className={fieldCls} style={inputStyle()} value={v.protectores} onChange={set("protectores")} placeholder="Red de apoyo, hijos, creencias, adherencia a tratamiento…" {...fx} /></Field>
        <Field label="Observaciones" span><textarea rows={3} className={areaCls} style={inputStyle()} value={v.notas} onChange={set("notas")} {...fx} /></Field>
      </div>
      <div className="mt-5 rounded-[12px] p-4 flex items-center gap-4 flex-wrap" style={{ background: col[0] }}>
        <div className="flex-1 min-w-[200px]">
          <div className="text-[12px] font-semibold" style={{ color: col[1] }}>NIVEL DE RIESGO</div>
          <div className="text-[12.5px] mt-0.5" style={{ color: col[1] }}>Sugerido por las respuestas: <b>{sug}</b>. Es solo una orientación: la decisión final es tu juicio clínico.</div>
        </div>
        <select value={nivel} onChange={set("nivel")} className="h-10 px-3 rounded-[9px] text-[14px] font-semibold bg-white outline-none" style={{ border: "1px solid var(--line)", color: col[1] }}>
          <option>Bajo</option><option>Moderado</option><option>Alto</option>
        </select>
      </div>
      {nivel !== "Bajo" && <p className="text-[12.5px] mt-3" style={{ color: "var(--ink-soft)" }}>Con riesgo {nivel.toLowerCase()} se mostrará una alerta en el expediente, la agenda y la consulta. Te recomiendo elaborar el plan de seguridad con el paciente en esta sesión.</p>}
    </ModalShell>
  );
}

// ---------- Plan de seguridad ----------
function PlanSeguridadModal({ paciente, onClose, onSave }) {
  const [plan, setPlan] = useDocS(() => ({ ...planVacio(), ...(paciente.planSeguridad || {}), fecha: (paciente.planSeguridad && paciente.planSeguridad.fecha) || window.todayISO() }));
  const [ver, setVer] = useDocS(false);
  const set = (k) => (e) => setPlan({ ...plan, [k]: e.target.value });
  const html = planHTML(paciente, plan);
  return (
    <ModalShell maxW={ver ? 860 : 680} icon="shield" title="Plan de seguridad" subtitle={paciente.nombre + " · llénalo junto con el paciente, con sus palabras"} onClose={onClose}
      footer={<>
        <span className="mr-auto"><BtnGhost onClick={() => setVer(!ver)}>{ver ? "Editar" : "Vista de impresión"}</BtnGhost></span>
        <BtnGhost onClick={onClose}>Cerrar</BtnGhost>
        <DocActions html={html} title={"Plan de seguridad " + paciente.nombre} />
        <BtnPrimary onClick={() => onSave(paciente.id, plan)}>Guardar</BtnPrimary>
      </>}>
      {ver ? <DocPreview html={html} /> : (
        <div className="flex flex-col gap-4">
          {PLAN_SECCIONES.map((s) => (
            <Field key={s.k} label={s.t} hint={s.h}>
              <textarea rows={s.k === "profesionales" ? 3 : 2} className={areaCls} style={inputStyle()} value={plan[s.k]} onChange={set(s.k)} {...fx} />
            </Field>
          ))}
        </div>
      )}
    </ModalShell>
  );
}

Object.assign(window, {
  docHTMLTexto, textoAHTML, fechaCortaLarga: fechaLarga,
  contratoHTML, notaHTML, expedienteHTML, reciboHTML, planHTML, printHTML, wordDownload, numLetras,
  DocModal, DocPreview, DocActions, ContratoModal, PoliticasModal, RiesgoModal, PlanSeguridadModal, sugerirNivel, fechaCorta,
});
