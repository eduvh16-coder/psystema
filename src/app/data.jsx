// ============ Psystema — data + local persistence ============
// Storage helpers (browser storage can be unavailable: always fail soft)
const LS_PREFIX = "psystema_";
function lsGet(key, def) {
  try { const v = window.localStorage.getItem(LS_PREFIX + key); return v == null ? def : JSON.parse(v); }
  catch (e) { return def; }
}
function lsSet(key, val) {
  try { window.localStorage.setItem(LS_PREFIX + key, JSON.stringify(val)); return true; }
  catch (e) { return false; }
}
function lsDel(key) { try { window.localStorage.removeItem(LS_PREFIX + key); } catch (e) {} }

// Save a generated file. On iPhone/iPad the share sheet ("Guardar en Archivos") is the reliable path.
const ES_IOS = /iP(hone|ad|od)/.test(navigator.userAgent || "") || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
function guardarArchivo(blob, nombre) {
  try {
    if (ES_IOS && navigator.canShare && typeof File === "function") {
      const file = new File([blob], nombre, { type: blob.type || "application/octet-stream" });
      if (navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: nombre }).catch(() => {}); return true; }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = nombre; a.rel = "noopener";
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    return true;
  } catch (e) { return false; }
}

// Local date helpers (never use toISOString for "today": it is UTC)
const pad2 = (n) => String(n).padStart(2, "0");
const isoLocal = (d) => d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
const addDays = (iso, n) => { const d = new Date(iso + "T12:00"); d.setDate(d.getDate() + n); return isoLocal(d); };
const todayISO = () => isoLocal(new Date());

const PERFIL_DEFAULT = {
  nombre: "Eduardo Vásquez",
  nombreCompleto: "Eduardo Vásquez Herrera",
  titulo: "Psic.",
  rol: "Psicólogo clínico",
  especialidad: "Terapia individual y de pareja",
  cedula: "15149069",
  telefono: "999-334-1334",
  genero: "Masculino",
};
const __perfil = lsGet("perfil_v1", {});
if (__perfil.nombre === "Eduardo Vázquez") __perfil.nombre = "Eduardo Vásquez"; // fix earlier typo
const THERAPIST = Object.assign({}, PERFIL_DEFAULT, __perfil);

// Consultorio policies (used by the contract generator and the agenda)
const POLITICAS_DEFAULT = {
  tarifaIndividual: 500, tarifaPareja: 700,
  durIndividual: 50, durPareja: 80,
  horasAviso: 24,
  metodosPago: "en efectivo o mediante transferencia bancaria",
  plataforma: "Google Meet",
  cargoInasistencia: true,
  autoOcultarMin: 0,
  // working hours: days 0=Sunday … 6=Saturday
  horario: { dias: [1, 2, 3, 4, 5, 6], inicio: "09:00", fin: "20:00" },
  // blocks: {id, titulo, tipo: "diario"|"semanal"|"fechas", dia, desde, hasta, fechaIni, fechaFin}
  bloqueos: [],
};
let POLITICAS = Object.assign({}, POLITICAS_DEFAULT, lsGet("politicas_v1", {}));
function setPoliticas(p) { POLITICAS = Object.assign({}, POLITICAS_DEFAULT, p); lsSet("politicas_v1", POLITICAS); window.POLITICAS = POLITICAS; }

const TINTS = [
  { bg: "#E8EEFE", fg: "#3D6FF6" },
  { bg: "#E6F3EC", fg: "#2F9469" },
  { bg: "#F3EBFB", fg: "#7C5CD6" },
  { bg: "#FBEEE6", fg: "#C2683F" },
  { bg: "#FDECEF", fg: "#D1496A" },
  { bg: "#E9F1F4", fg: "#3E7E94" },
  { bg: "#F4F0E6", fg: "#A98639" },
  { bg: "#EAEFE8", fg: "#5E8048" },
];
const tint = (i) => TINTS[i % TINTS.length];

// session: { fecha, duracion, temas, desarrollo, actividades, analisis, comentarios }
let PACIENTES = [
  {
    id: "p1", folio: "PSY-2025-014", nombre: "Lucía Fernández", edad: 28, genero: "Femenino",
    telefono: "+52 999 142 8830", email: "lucia.fdz@gmail.com",
    direccion: "Calle 60 #312 x 35 y 37, Col. Alcalá Martín, Mérida, Yuc.",
    lugarNacimiento: "Mérida, Yucatán", estadoCivil: "Soltera", ocupacion: "Diseñadora gráfica",
    estudios: "Licenciatura", viveCon: "Pareja", hijos: "No",
    emergencia: "Carmen Fernández (madre) · +52 999 110 2244",
    motivo: "Trastorno de ansiedad generalizada", estado: "Activo",
    motivoConsulta: "Acude por preocupación excesiva y persistente, dificultad para relajarse y rumiación nocturna que afecta su sueño y su desempeño laboral desde hace aproximadamente ocho meses.",
    historiaClinica: "Sin antecedentes psiquiátricos previos. Refiere madre con rasgos ansiosos. Primer episodio relevante coincide con un cambio de trabajo. No consume sustancias. Buena red de apoyo en su pareja. Niega ideación autolítica.",
    alta: "2025-02-11", tarifa: 850, sesiones: 14, enfoque: "Reestructuración cognitiva",
    proxima: "Hoy · 09:00", saldo: 0,
    tareas: [
      { titulo: "Autorregistro de pensamientos automáticos (5 días)", estado: "completada", fecha: "Vence 02 jun" },
      { titulo: "Práctica de respiración diafragmática antes de dormir", estado: "en curso", fecha: "Diario" },
      { titulo: "Exposición gradual: hablar en reunión breve", estado: "pendiente", fecha: "Vence 09 jun" },
    ],
    historial: [
      { fecha: "2026-06-02", duracion: "50 min",
        temas: "Anticipación ansiosa ante reunión de trabajo. Rumiación nocturna.",
        desarrollo: "La paciente reporta una semana con menor rumiación nocturna tras aplicar respiración diafragmática tres noches. Identificamos el patrón de catastrofización ('y si todo sale mal') asociado a la reunión del jueves. Trabajamos la técnica de descenso en la flecha hasta llegar al miedo nuclear: 'que piensen que soy incompetente'. Buena capacidad de insight; logró cuestionar la evidencia a favor y en contra del pensamiento.",
        actividades: "Continuar autorregistro. Preparar la presentación en bloques de 20 min con pausas. Ensayo conductual frente al espejo.",
        analisis: "Antecedente: reunión laboral. Pensamiento: 'me quedaré en blanco'. Emoción: ansiedad 8/10. Conducta: evitación/checking del correo. Consecuencia: alivio breve y aumento de la anticipación.",
        comentarios: "Adherencia muy buena. Reforzar logros para sostener motivación." },
      { fecha: "2026-05-26", duracion: "50 min",
        temas: "Catastrofización. Autorregistros.",
        desarrollo: "Revisamos los autorregistros de la semana. Se observa un patrón claro de sobreestimación de la probabilidad y del costo de los escenarios temidos. Psicoeducación sobre el ciclo de la ansiedad.",
        actividades: "Autorregistro de pensamientos automáticos.",
        analisis: "Sesgo de catastrofización y de probabilidad.",
        comentarios: "Avanza de forma constante." },
    ],
  },
  {
    id: "p2", folio: "PSY-2025-031", nombre: "Mateo Rivas", edad: 34, genero: "Masculino",
    telefono: "+52 999 330 1192", email: "mrivas@outlook.com",
    direccion: "Av. Tecnológico #88, Col. Centro, Mérida, Yuc.",
    lugarNacimiento: "Campeche, Camp.", estadoCivil: "Divorciado", ocupacion: "Contador",
    estudios: "Licenciatura", viveCon: "Solo", hijos: "Sí, 1",
    emergencia: "Laura Rivas (hermana) · +52 981 220 7788",
    motivo: "Episodio depresivo moderado", estado: "Activo",
    motivoConsulta: "Refiere estado de ánimo bajo la mayor parte del día, pérdida de interés, fatiga y aislamiento social desde su divorcio hace cinco meses.",
    historiaClinica: "Un episodio depresivo previo en la adolescencia, no tratado. Divorcio reciente como detonante actual. Consumo de alcohol social. Comparte custodia de su hijo. Niega ideación suicida estructurada.",
    alta: "2025-04-03", tarifa: 850, sesiones: 9, enfoque: "Activación conductual",
    proxima: "Hoy · 10:00", saldo: 850,
    tareas: [
      { titulo: "Programación de actividades gratificantes (semana)", estado: "en curso", fecha: "Diario" },
      { titulo: "Registro actividad–estado de ánimo", estado: "en curso", fecha: "Diario" },
      { titulo: "Caminata de 20 min, 3 veces", estado: "pendiente", fecha: "Vence 08 jun" },
    ],
    historial: [
      { fecha: "2026-06-01", duracion: "50 min",
        temas: "Activación conductual. Aislamiento de fin de semana.",
        desarrollo: "Completó 4 de 6 actividades programadas. Reporta leve mejoría en el ánimo matutino, sobre todo los días que caminó al parque. Persiste el aislamiento los fines de semana sin estructura. Trabajamos la jerarquía de actividades gratificantes y su relación con el estado de ánimo.",
        actividades: "Programar mínimo una actividad social el fin de semana. Mantener registro actividad–ánimo.",
        analisis: "Antecedente: domingo sin planes. Pensamiento: 'nada va a cambiar'. Conducta: permanecer en cama. Consecuencia: culpa que confirma la idea de inutilidad.",
        comentarios: "Saldo pendiente de la sesión anterior. Recordar amablemente." },
      { fecha: "2026-05-25", duracion: "50 min",
        temas: "Jerarquía de actividades.",
        desarrollo: "Identifica que caminar al parque le genera alivio. Acordamos un registro de actividad y ánimo para detectar qué actividades elevan su estado.",
        actividades: "Registro actividad–estado de ánimo.",
        analisis: "Evitación conductual que mantiene la anhedonia.",
        comentarios: "" },
    ],
  },
  {
    id: "p3", folio: "PSY-2025-052", nombre: "Sofía Herrera", edad: 19, genero: "Femenino",
    telefono: "+52 999 871 4420", email: "sofia.herrera@gmail.com",
    direccion: "Calle 21 #145, Fracc. Las Américas, Mérida, Yuc.",
    lugarNacimiento: "Mérida, Yucatán", estadoCivil: "Soltera", ocupacion: "Estudiante",
    estudios: "Bachillerato", viveCon: "Padres", hijos: "No",
    emergencia: "Jorge Herrera (padre) · +52 999 445 0091",
    motivo: "Fobia social", estado: "Activo",
    motivoConsulta: "Ansiedad intensa ante situaciones sociales y de evaluación, con evitación de exposiciones en clase y temor a la crítica desde la secundaria.",
    historiaClinica: "Niña tímida según los padres. Sin tratamientos previos. Buen rendimiento académico salvo en exposiciones orales. Apoyo familiar adecuado. Sin consumo de sustancias.",
    alta: "2025-09-15", tarifa: 700, sesiones: 6, enfoque: "Exposición + habilidades sociales",
    proxima: "Hoy · 11:30", saldo: 0,
    tareas: [
      { titulo: "Jerarquía de exposición social (paso 4)", estado: "en curso", fecha: "Semana" },
      { titulo: "Registro de predicciones vs. resultado real", estado: "pendiente", fecha: "Vence 06 jun" },
    ],
    historial: [
      { fecha: "2026-05-30", duracion: "50 min",
        temas: "Exposición en vivo. Predicciones catastróficas.",
        desarrollo: "Logró pedir información en una tienda manteniendo contacto visual. La ansiedad descendió de 9 a 5 durante la exposición, confirmando el proceso de habituación. Revisamos sus predicciones ('todos lo notarán y se reirán') frente al resultado real, que fue neutro.",
        actividades: "Avanzar al paso 4 de la jerarquía: hacer una pregunta en clase.",
        analisis: "Antecedente: situación social evaluativa. Pensamiento: 'me juzgarán'. Conducta: evitación. Consecuencia: refuerzo del miedo.",
        comentarios: "Gran avance. Muy motivada." },
    ],
  },
  {
    id: "p4", folio: "PSY-2025-067", nombre: "Diego Morales", edad: 41, genero: "Masculino",
    telefono: "+52 999 204 7781", email: "dmorales.work@gmail.com",
    direccion: "Calle 19 #402, Col. México Norte, Mérida, Yuc.",
    lugarNacimiento: "Villahermosa, Tab.", estadoCivil: "Casado", ocupacion: "Gerente de operaciones",
    estudios: "Maestría", viveCon: "Esposa e hijos", hijos: "Sí, 2",
    emergencia: "Ana Patrón (esposa) · +52 999 330 5512",
    motivo: "Estrés laboral · burnout", estado: "Activo",
    motivoConsulta: "Agotamiento físico y emocional, irritabilidad y dificultad para desconectar del trabajo, con insomnio de conciliación en los últimos tres meses.",
    historiaClinica: "Sin antecedentes psiquiátricos. Alta carga laboral y dificultad para delegar. Patrón de autoexigencia marcado. Buen soporte familiar. Consumo de cafeína elevado.",
    alta: "2025-11-20", tarifa: 900, sesiones: 5, enfoque: "Manejo de estrés",
    proxima: "Hoy · 13:00", saldo: 0,
    tareas: [
      { titulo: "Definir horario de desconexión digital", estado: "completada", fecha: "Vence 28 may" },
      { titulo: "Pausas activas cada 90 min", estado: "en curso", fecha: "Diario" },
    ],
    historial: [
      { fecha: "2026-05-28", duracion: "50 min",
        temas: "Límites laborales. Autoexigencia.",
        desarrollo: "Establecimos límites concretos de horario y un ritual de cierre de jornada. Practicó decir 'no' a una tarea fuera de su rol; refiere culpa pero también alivio. Trabajamos la creencia 'si no respondo de inmediato, quedo mal'.",
        actividades: "Mantener horario de desconexión digital. Pausas activas cada 90 min.",
        analisis: "Antecedente: correo del jefe a las 22:00. Pensamiento: 'debo responder ya'. Conducta: responder de inmediato. Consecuencia: insomnio y agotamiento.",
        comentarios: "Responde bien a la psicoeducación sobre burnout." },
    ],
  },
  {
    id: "p5", folio: "PSY-2025-040", nombre: "Valentina Cruz", edad: 25, genero: "Femenino",
    telefono: "+52 999 615 0093", email: "vale.cruz@gmail.com",
    direccion: "Calle 50 #210, Col. Itzimná, Mérida, Yuc.",
    lugarNacimiento: "Mérida, Yucatán", estadoCivil: "Unión libre", ocupacion: "Enfermera",
    estudios: "Licenciatura", viveCon: "Pareja", hijos: "No",
    emergencia: "Mónica Cruz (madre) · +52 999 778 1130",
    motivo: "Trastorno de pánico", estado: "Activo",
    motivoConsulta: "Crisis de pánico recurrentes con palpitaciones y miedo a perder el control, con evitación creciente del transporte público.",
    historiaClinica: "Primera crisis hace un año durante una guardia. Sin antecedentes médicos relevantes (descartado origen cardiológico). Conductas de seguridad presentes. Sin consumo de sustancias.",
    alta: "2025-07-08", tarifa: 850, sesiones: 11, enfoque: "Exposición interoceptiva",
    proxima: "Mañana · 12:00", saldo: 0,
    tareas: [
      { titulo: "Exposición interoceptiva (hiperventilación controlada)", estado: "en curso", fecha: "3x semana" },
      { titulo: "Registro de crisis: disparador e intensidad", estado: "en curso", fecha: "Diario" },
    ],
    historial: [
      { fecha: "2026-05-29", duracion: "50 min",
        temas: "Reinterpretación de sensaciones corporales. Conductas de seguridad.",
        desarrollo: "Tuvo una crisis en la semana frente a tres la semana previa. Aplicó la reinterpretación de las sensaciones corporales ('mi corazón se acelera, no es peligroso'). Trabajamos el retiro progresivo de las conductas de seguridad en el transporte.",
        actividades: "Exposición interoceptiva 3x semana. Registro de crisis.",
        analisis: "Antecedente: palpitaciones en el autobús. Pensamiento: 'me va a dar un infarto'. Conducta: bajarse/huir. Consecuencia: evitación del transporte.",
        comentarios: "Reducción clara de la frecuencia de crisis." },
    ],
  },
  {
    id: "p6", folio: "PSY-2026-003", nombre: "Andrés Gallardo", edad: 52, genero: "Masculino",
    telefono: "+52 999 448 2210", email: "agallardo52@gmail.com",
    direccion: "Calle 31 #98, Col. García Ginerés, Mérida, Yuc.",
    lugarNacimiento: "Mérida, Yucatán", estadoCivil: "Viudo", ocupacion: "Arquitecto",
    estudios: "Licenciatura", viveCon: "Solo", hijos: "Sí, 3",
    emergencia: "Daniela Gallardo (hija) · +52 999 556 4421",
    motivo: "Proceso de duelo", estado: "Activo",
    motivoConsulta: "Duelo por el fallecimiento de su esposa hace seis meses, con tristeza intensa, evitación de recuerdos y dificultad para retomar rutinas.",
    historiaClinica: "Sin antecedentes psiquiátricos. Matrimonio de 25 años. Buen soporte de sus hijos. Sin ideación autolítica. Duelo de evolución normal con momentos de evitación.",
    alta: "2026-01-14", tarifa: 900, sesiones: 7, enfoque: "Elaboración del duelo",
    proxima: "Jue · 17:00", saldo: 0,
    tareas: [
      { titulo: "Carta de despedida (escritura terapéutica)", estado: "pendiente", fecha: "Sin fecha" },
    ],
    historial: [
      { fecha: "2026-05-27", duracion: "50 min",
        temas: "Recuerdos sin evitación. Reorganización de rutinas.",
        desarrollo: "Pudo hablar de los recuerdos compartidos sin evitarlos. El llanto estuvo presente pero fue tolerado y validado. Trabajamos la reorganización de sus rutinas cotidianas sin su esposa y la recuperación de actividades significativas.",
        actividades: "Iniciar la carta de despedida cuando se sienta listo.",
        analisis: "Evitación experiencial de los recuerdos dolorosos.",
        comentarios: "Proceso de duelo dentro de lo esperado." },
    ],
  },
  {
    id: "p7", folio: "PSY-2025-049", nombre: "Camila Ortega", edad: 31, genero: "Femenino",
    telefono: "+52 999 776 5512", email: "camila.ortega@gmail.com",
    direccion: "Calle 14 #77, Fracc. Montecristo, Mérida, Yuc.",
    lugarNacimiento: "Cancún, Q. Roo", estadoCivil: "Casada", ocupacion: "Abogada",
    estudios: "Licenciatura", viveCon: "Esposo", hijos: "No",
    emergencia: "Raúl Méndez (esposo) · +52 998 220 1190",
    motivo: "Trastorno obsesivo-compulsivo", estado: "Activo",
    motivoConsulta: "Pensamientos intrusivos de contaminación y rituales de lavado y comprobación que consumen varias horas al día.",
    historiaClinica: "Inicio de síntomas en la universidad. Sin tratamiento previo estructurado. Familia con rasgos de orden y control. Buen funcionamiento laboral pese a los síntomas.",
    alta: "2025-10-02", tarifa: 850, sesiones: 12, enfoque: "EPR (exposición con prevención de respuesta)",
    proxima: "Vie · 10:00", saldo: 0,
    tareas: [
      { titulo: "EPR jerarquía nivel 3 (no lavar tras tocar dinero)", estado: "en curso", fecha: "Diario" },
    ],
    historial: [
      { fecha: "2026-05-31", duracion: "50 min",
        temas: "EPR. Reducción de checking nocturno.",
        desarrollo: "Avanza en EPR: tocó el picaporte sin lavarse durante 30 minutos; la ansiedad descendió por habituación. Reduce el checking nocturno de cerraduras de 8 a 3 comprobaciones. Reforzamos la prevención de respuesta.",
        actividades: "EPR nivel 3: no lavar tras tocar dinero.",
        analisis: "Antecedente: pensamiento de contaminación. Conducta: lavado repetido. Consecuencia: alivio breve y refuerzo del ciclo TOC.",
        comentarios: "Excelente tolerancia a la exposición." },
    ],
  },
  {
    id: "p8", folio: "PSY-2026-011", nombre: "Tomás Vega", edad: 16, genero: "Masculino",
    telefono: "+52 999 011 3398", email: "fam.vega@gmail.com",
    direccion: "Calle 7 #221, Col. Pensiones, Mérida, Yuc.",
    lugarNacimiento: "Mérida, Yucatán", estadoCivil: "Soltero", ocupacion: "Estudiante",
    estudios: "Secundaria", viveCon: "Padres", hijos: "No",
    emergencia: "Patricia Solís (madre) · +52 999 778 9921",
    motivo: "Problemas de conducta (adolescente)", estado: "Activo",
    motivoConsulta: "Conductas oposicionistas en casa y en la escuela, dificultad para seguir reglas y conflictos frecuentes con los padres.",
    historiaClinica: "Llega derivado por la escuela. Padres con estilos de crianza poco consistentes. Sin consumo de sustancias confirmado. Buen vínculo con un docente. Sin antecedentes médicos.",
    alta: "2026-03-19", tarifa: 750, sesiones: 4, enfoque: "Manejo conductual + familia",
    proxima: "Vie · 16:00", saldo: 750,
    tareas: [
      { titulo: "Registro conductual con los padres (semana)", estado: "en curso", fecha: "Diario" },
    ],
    historial: [
      { fecha: "2026-05-24", duracion: "60 min",
        temas: "Economía de fichas. Reglas claras.",
        desarrollo: "Sesión con apoyo de los padres. Definimos un sistema de economía de fichas con reglas y consecuencias consistentes. Tomás participó en acordar las reglas, lo que mejoró su disposición y sentido de control.",
        actividades: "Registro conductual diario con los padres durante una semana.",
        analisis: "Antecedente: petición de los padres. Conducta: oposición. Consecuencia: atención y escalada del conflicto.",
        comentarios: "Saldo pendiente. Coordinar con los padres." },
    ],
  },
  {
    id: "p9", folio: "PSY-2026-018", nombre: "Emilia Castro", edad: 23, genero: "Femenino",
    telefono: "+52 999 559 8841", email: "emilia.castro@gmail.com",
    direccion: "Calle 24 #156, Col. Buenavista, Mérida, Yuc.",
    lugarNacimiento: "Tizimín, Yuc.", estadoCivil: "Soltera", ocupacion: "Pasante de psicología",
    estudios: "Licenciatura (en curso)", viveCon: "Roommates", hijos: "No",
    emergencia: "Rosa Castro (madre) · +52 986 110 3320",
    motivo: "Insomnio + ansiedad", estado: "Nuevo",
    motivoConsulta: "Dificultad para conciliar el sueño y despertares frecuentes asociados a preocupación, que afectan su energía y concentración diurnas.",
    historiaClinica: "Primera consulta. Sin antecedentes psiquiátricos. Estrés académico por titulación. Higiene del sueño deficiente (pantallas, horarios irregulares). Consumo de cafeína por la tarde.",
    alta: "2026-06-04", tarifa: 800, sesiones: 1, enfoque: "Higiene del sueño + TCC-I",
    proxima: "Lun · 18:00", saldo: 0,
    tareas: [
      { titulo: "Diario de sueño (7 días)", estado: "pendiente", fecha: "Vence 11 jun" },
    ],
    historial: [
      { fecha: "2026-06-04", duracion: "60 min",
        temas: "Evaluación inicial. Patrón de sueño.",
        desarrollo: "Primera consulta y evaluación inicial. Latencia de sueño aproximada de 90 minutos con despertares frecuentes. Identificamos hábitos a modificar (uso de pantallas, cafeína vespertina). Psicoeducación sobre higiene del sueño y modelo TCC-I.",
        actividades: "Llevar un diario de sueño durante 7 días.",
        analisis: "Hiperactivación cognitiva al momento de dormir mantenida por la preocupación.",
        comentarios: "Paciente nueva. Encuadre y consentimiento informado firmados." },
    ],
  },
];

// Demo appointments are placed relative to the real current date
const __t = todayISO();
let CITAS = [
  { id: "c1", pid: "p1", fecha: __t, hora: "09:00", fin: "09:50", tipo: "Sesión", estado: "Confirmada", modalidad: "Presencial" },
  { id: "c2", pid: "p2", fecha: __t, hora: "10:00", fin: "10:50", tipo: "Sesión", estado: "Confirmada", modalidad: "Presencial" },
  { id: "c3", pid: "p3", fecha: __t, hora: "11:30", fin: "12:20", tipo: "Sesión", estado: "Pendiente", modalidad: "Online" },
  { id: "c4", pid: "p4", fecha: __t, hora: "13:00", fin: "13:50", tipo: "Seguimiento", estado: "Confirmada", modalidad: "Presencial" },
  { id: "c5", pid: "p9", fecha: __t, hora: "18:00", fin: "19:00", tipo: "Primera consulta", estado: "Confirmada", modalidad: "Presencial" },
  { id: "c6", pid: "p5", fecha: addDays(__t, 1), hora: "12:00", fin: "12:50", tipo: "Sesión", estado: "Confirmada", modalidad: "Presencial" },
  { id: "c7", pid: "p6", fecha: addDays(__t, 3), hora: "17:00", fin: "17:50", tipo: "Sesión", estado: "Confirmada", modalidad: "Presencial" },
  { id: "c8", pid: "p7", fecha: addDays(__t, 4), hora: "10:00", fin: "10:50", tipo: "Sesión", estado: "Pendiente", modalidad: "Online" },
];

// External events pulled from the linked Google Calendar (read-only in Psystema)
let GCAL_EVENTS = [
  { id: "ge1", titulo: "Comida", hora: "14:00", fin: "15:00", color: "#EA4335", cal: "Personal" },
  { id: "ge2", titulo: "Supervisión clínica", hora: "16:00", fin: "17:00", color: "#4285F4", cal: "Trabajo", meet: true },
  { id: "ge3", titulo: "Recoger a los niños", hora: "17:15", fin: "17:45", color: "#34A853", cal: "Familia" },
];

let PAGOS = [
  { id: "g1", pid: "p1", fecha: "2026-06-02", concepto: "Sesión", monto: 850, metodo: "Transferencia", estado: "Pagado" },
  { id: "g2", pid: "p5", fecha: "2026-06-02", concepto: "Sesión", monto: 850, metodo: "Efectivo", estado: "Pagado" },
  { id: "g3", pid: "p7", fecha: "2026-06-01", concepto: "Sesión", monto: 850, metodo: "Tarjeta", estado: "Pagado" },
  { id: "g4", pid: "p4", fecha: "2026-05-31", concepto: "Seguimiento", monto: 900, metodo: "Transferencia", estado: "Pagado" },
  { id: "g5", pid: "p2", fecha: "2026-05-30", concepto: "Sesión", monto: 850, metodo: "—", estado: "Pendiente" },
  { id: "g6", pid: "p3", fecha: "2026-05-30", concepto: "Sesión", monto: 700, metodo: "Tarjeta", estado: "Pagado" },
  { id: "g7", pid: "p8", fecha: "2026-05-24", concepto: "Sesión familiar", monto: 750, metodo: "—", estado: "Pendiente" },
];

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const DIAS = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];

// ---------- Note templates (how a session note is structured) ----------
// `ai` = what the assistant must write in that section.
const F = {
  temas: { key: "temas", label: "Temas vistos en sesión", rows: 2, ph: "Lista breve de los temas abordados…",
    ai: "Viñetas con \"• \" separadas por salto de línea. Titulares generales y concisos: idealmente 2-3, máximo 6." },
  desarrollo: { key: "desarrollo", label: "Desarrollo de sesión", rows: 9, big: true, ph: "Redacta tal cual todo lo que ocurrió durante la sesión…",
    ai: "Narrativo, en uno o más párrafos. Plasma TODO lo narrado en lenguaje clínico formal, sin omitir información relevante. No incluyas lo marcado para comentarios." },
  actividades: { key: "actividades", label: "Actividades / tareas", rows: 3, ph: "Tareas o ejercicios asignados para casa…",
    ai: "SOLO tareas o ejercicios que se asignaron al paciente. Lista numerada \"1. \", \"2. \" separada por salto de línea. Si no hubo, cadena vacía." },
  analisis: { key: "analisis", label: "Análisis funcional", rows: 4, ph: "Antecedente → pensamiento → emoción → conducta → consecuencia…",
    ai: "Propuesta de análisis funcional en líneas: Antecedente / Pensamiento automático / Emoción / Conducta / Consecuencia. Si hay sesiones anteriores, relaciónalas (continuidad, evolución)." },
  comentarios: { key: "comentarios", label: "Comentarios", rows: 2, ph: "Observaciones adicionales, acuerdos, pendientes…",
    ai: "Solo lo que el terapeuta marcó con una frase clave (\"esto va en comentarios\", \"anota en comentarios\", \"off the record\"), aislado y redactado en lenguaje técnico. Si no hubo, cadena vacía." },
  riesgo: { key: "riesgo", label: "Valoración de riesgo", rows: 2, ph: "Ideación suicida/autolesiva, riesgo a terceros, factores protectores…",
    ai: "Solo si el dictado menciona riesgo (ideación suicida, autolesiones, violencia, consumo) o su ausencia explícita. Redacta de forma objetiva. Si no se mencionó, cadena vacía. Nunca lo inventes." },
  subjetivo: { key: "subjetivo", label: "S · Subjetivo", rows: 5, big: true, ph: "Lo que refiere el paciente: quejas, estado de ánimo, eventos…",
    ai: "Lo que el paciente refirió con sus palabras (quejas, síntomas, eventos de la semana), redactado en tercera persona y lenguaje clínico." },
  objetivo: { key: "objetivo", label: "O · Objetivo", rows: 3, ph: "Observaciones del terapeuta: apariencia, afecto, conducta…",
    ai: "Observaciones del terapeuta: apariencia, afecto, conducta, lenguaje, resultados de escalas si se mencionan." },
  evaluacion: { key: "evaluacion", label: "A · Evaluación / análisis", rows: 4, ph: "Interpretación clínica, avances, hipótesis…",
    ai: "Interpretación clínica: avances, hipótesis, relación con el motivo de consulta y sesiones previas." },
  plan: { key: "plan", label: "P · Plan", rows: 3, ph: "Tareas, objetivos para la próxima sesión, derivaciones…",
    ai: "Plan: tareas asignadas, objetivos de la próxima sesión, ajustes de tratamiento, derivaciones. Lista numerada si hay varios puntos." },
  dinamica: { key: "dinamica", label: "Dinámica de pareja y patrón de conflicto", rows: 4, ph: "Cómo interactuaron, ciclo de conflicto, roles, comunicación…",
    ai: "Describe la dinámica observada entre ambos miembros: patrón o ciclo de conflicto, estilos de comunicación, posiciones de cada uno y cambios respecto a sesiones previas." },
  acuerdos: { key: "acuerdos", label: "Acuerdos y tareas de pareja", rows: 3, ph: "Acuerdos alcanzados y tareas para ambos…",
    ai: "SOLO los acuerdos alcanzados y las tareas asignadas a la pareja o a cada miembro. Lista numerada \"1. \" separada por salto de línea. Si no hubo, cadena vacía." },
  datos: { key: "datos", label: "D · Datos", rows: 7, big: true, ph: "Qué pasó en la sesión: lo que dijo e hizo el paciente…",
    ai: "Datos de la sesión: lo que el paciente dijo e hizo y las intervenciones realizadas, narrativo y formal." },
};
const PLANTILLAS = {
  tcc: { nombre: "TCC · 5 apartados", desc: "Temas, desarrollo, actividades, análisis funcional y comentarios.", fields: ["temas", "desarrollo", "actividades", "analisis", "comentarios"] },
  tcc_riesgo: { nombre: "TCC + valoración de riesgo", desc: "Igual que TCC, más un apartado de riesgo.", fields: ["temas", "desarrollo", "actividades", "analisis", "riesgo", "comentarios"] },
  soap: { nombre: "SOAP", desc: "Subjetivo, Objetivo, Evaluación y Plan.", fields: ["subjetivo", "objetivo", "evaluacion", "plan", "comentarios"] },
  pareja: { nombre: "Terapia de pareja", desc: "Se usa automáticamente en expedientes de pareja.", fields: ["temas", "desarrollo", "dinamica", "acuerdos", "comentarios"], soloPareja: true },
  dap: { nombre: "DAP", desc: "Datos, Evaluación y Plan (formato breve).", fields: ["datos", "evaluacion", "plan", "comentarios"] },
};
const NOTA_CFG_DEFAULT = { plantilla: "tcc", enfoque: "Terapia Cognitivo-Conductual (TCC)", instrucciones: "", backendUrl: "" };
let NOTA_CFG = Object.assign({}, NOTA_CFG_DEFAULT, lsGet("nota_cfg_v1", {}));
const fieldsFor = (plantilla) => ((PLANTILLAS[plantilla] || PLANTILLAS.tcc).fields).map((k) => F[k]);
let SESSION_FIELDS = fieldsFor(NOTA_CFG.plantilla);
function setNotaCfg(cfg) {
  NOTA_CFG = Object.assign({}, NOTA_CFG_DEFAULT, cfg);
  lsSet("nota_cfg_v1", NOTA_CFG);
  window.NOTA_CFG = NOTA_CFG;
  window.SESSION_FIELDS = fieldsFor(NOTA_CFG.plantilla);
}
const camposPara = (p) => (p && p.tipo === "Pareja" ? fieldsFor("pareja") : window.SESSION_FIELDS);
const emptySession = (fields) => { const o = {}; (fields || window.SESSION_FIELDS).forEach((f) => { o[f.key] = ""; }); return o; };
// The fields actually stored in a saved note, in a stable order
const noteFields = (s) => {
  const cur = window.SESSION_FIELDS.map((f) => f.key);
  const keys = cur.concat(Object.keys(F).filter((k) => !cur.includes(k)));
  return keys.filter((k) => s && typeof s[k] === "string" && s[k].trim()).map((k) => F[k]);
};

// ---------- Restore saved data (falls back to the demo set) ----------
// ---------- PIN + encryption (AES-GCM, key derived from the PIN with PBKDF2) ----------
const b64e = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b64d = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function pinKey(pin, saltB64) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(String(pin)), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: b64d(saltB64), iterations: 200000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function cifrar(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
  return { iv: b64e(iv), ct: b64e(ct) };
}
async function descifrar(key, blob) {
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64d(blob.iv) }, key, b64d(blob.ct));
  return JSON.parse(new TextDecoder().decode(pt));
}
const nuevaSal = () => b64e(crypto.getRandomValues(new Uint8Array(16)));
// returns the key when the PIN is right, else null
async function probarPin(pin) {
  const meta = lsGet("pin_v1", null); if (!meta) return null;
  try { const key = await pinKey(pin, meta.salt); const ok = await descifrar(key, meta.check); return ok === "psystema" ? key : null; }
  catch (e) { return null; }
}
// In the cloud app the PIN only locks the screen on this device (data is protected by the account + database rules).
const PIN_ACTIVO = window.PSY_CLOUD ? !!lsGet("pin_lock_v1", null) : !!lsGet("pin_v1", null);

const __saved = (PIN_ACTIVO || window.PSY_CLOUD) ? null : lsGet("datos_v1", null);
if (PIN_ACTIVO || window.PSY_CLOUD) { PACIENTES = []; PAGOS = []; CITAS = []; }
if (__saved && Array.isArray(__saved.pacientes)) {
  PACIENTES = __saved.pacientes;
  PAGOS = Array.isArray(__saved.pagos) ? __saved.pagos : [];
  CITAS = Array.isArray(__saved.citas) ? __saved.citas : [];
}
// derived balance: sum of a patient's pending charges
const saldoDe = (pid, pagos) => (pagos || window.PAGOS).filter((g) => g.pid === pid && g.estado === "Pendiente").reduce((a, g) => a + g.monto, 0);

Object.assign(window, {
  THERAPIST, PERFIL_DEFAULT, PACIENTES, CITAS, GCAL_EVENTS, PAGOS, TINTS, tint, MESES, DIAS,
  SESSION_FIELDS, emptySession, noteFields, FIELD_DEFS: F, PLANTILLAS, NOTA_CFG, setNotaCfg, fieldsFor,
  lsGet, lsSet, lsDel, isoLocal, addDays, todayISO, pad2, saldoDe,
  POLITICAS, POLITICAS_DEFAULT, setPoliticas, camposPara,
  pinKey, cifrar, descifrar, nuevaSal, probarPin, PIN_ACTIVO, guardarArchivo, ES_IOS,
});
