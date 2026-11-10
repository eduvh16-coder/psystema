// ============ Psystema — Google Calendar (REAL integration) ============
// Uses Google Identity Services (GIS) token flow + Calendar REST API.
// Requires the user to supply their own OAuth Client ID (stored locally)
// and to authorize this app's origin in Google Cloud Console.

const GCAL_SCOPE = "https://www.googleapis.com/auth/calendar.events email profile";
const GCAL_CFG_KEY = "psystema_gcal_cfg_v1";

function gcalCfg() {
  try { return JSON.parse(localStorage.getItem(GCAL_CFG_KEY)) || {}; }
  catch (e) { return {}; }
}
function gcalSetCfg(cfg) {
  localStorage.setItem(GCAL_CFG_KEY, JSON.stringify(cfg || {}));
}

// ---- Load Google Identity Services script once ----
let __gisPromise = null;
function loadGis() {
  if (window.google && window.google.accounts && window.google.accounts.oauth2) return Promise.resolve();
  if (__gisPromise) return __gisPromise;
  __gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => { __gisPromise = null; reject(new Error("No se pudo cargar Google Identity Services (revisa tu conexión).")); };
    document.head.appendChild(s);
  });
  return __gisPromise;
}

// ---- Request an access token (opens Google's consent popup) ----
async function gcalRequestToken(clientId) {
  await loadGis();
  return new Promise((resolve, reject) => {
    let settled = false;
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GCAL_SCOPE,
        callback: (resp) => {
          settled = true;
          if (resp && resp.access_token) {
            resolve({ token: resp.access_token, expiry: Date.now() + (Number(resp.expires_in || 3600) * 1000) });
          } else {
            reject(new Error(resp && resp.error_description ? resp.error_description : (resp && resp.error) || "No se recibió un token de acceso."));
          }
        },
        error_callback: (err) => {
          settled = true;
          const type = err && err.type;
          if (type === "popup_failed_to_open") {
            reject(new Error("popup_blocked"));
          } else if (type === "popup_closed") {
            reject(new Error("popup_closed"));
          } else {
            reject(new Error((err && err.message) || "No se pudo autorizar con Google."));
          }
        },
      });
      client.requestAccessToken({ prompt: "" });
    } catch (e) {
      if (!settled) reject(e);
    }
  });
}

// ---- Who is logged in ----
async function gcalUserInfo(token) {
  try {
    const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: "Bearer " + token } });
    if (!r.ok) return {};
    return await r.json();
  } catch (e) { return {}; }
}

// Google event colour palette (by colorId)
const GCAL_COLORS = {
  "1": "#7986CB", "2": "#33B679", "3": "#8E24AA", "4": "#E67C73", "5": "#F6BF26",
  "6": "#F4511E", "7": "#039BE5", "8": "#616161", "9": "#3F51B5", "10": "#0B8043", "11": "#D50000",
};

function __hhmm(iso) {
  const d = new Date(iso);
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

// ---- List today's events from the primary calendar ----
async function gcalListToday(token, dateISO) {
  const start = dateISO ? new Date(dateISO + "T00:00:00") : new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setHours(23, 59, 59, 999);
  const url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
    + "?timeMin=" + encodeURIComponent(start.toISOString())
    + "&timeMax=" + encodeURIComponent(end.toISOString())
    + "&singleEvents=true&orderBy=startTime&maxResults=50";
  const r = await fetch(url, { headers: { Authorization: "Bearer " + token } });
  if (r.status === 401) throw new Error("token_expired");
  if (!r.ok) { const t = await r.text(); throw new Error("Calendar API " + r.status + ": " + t.slice(0, 160)); }
  const data = await r.json();
  const timed = (data.items || []).filter((e) => e.start && e.start.dateTime && e.status !== "cancelled");
  return timed.map((e) => ({
    id: e.id,
    titulo: e.summary || "(Sin título)",
    hora: __hhmm(e.start.dateTime),
    fin: __hhmm(e.end.dateTime),
    color: GCAL_COLORS[e.colorId] || "#4285F4",
    cal: "Google Calendar",
    meet: !!(e.hangoutLink || (e.conferenceData && e.conferenceData.conferenceId)),
    htmlLink: e.htmlLink,
  }));
}

// ---- Create an event in the primary calendar ----
async function gcalInsert(token, { summary, dateISO, startHHMM, endHHMM, description }) {
  const mk = (hhmm) => {
    const [h, m] = String(hhmm).split(":");
    return dateISO + "T" + String(h).padStart(2, "0") + ":" + String(m || "00").padStart(2, "0") + ":00";
  };
  const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || "America/Mexico_City";
  const body = {
    summary, description: description || "",
    start: { dateTime: mk(startHHMM), timeZone: tz },
    end: { dateTime: mk(endHHMM), timeZone: tz },
  };
  const r = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (r.status === 401) throw new Error("token_expired");
  if (!r.ok) { const t = await r.text(); throw new Error("Insert " + r.status + ": " + t.slice(0, 160)); }
  return await r.json();
}

// ---- "Add to Google Calendar" link: works without any OAuth setup ----
function gcalTemplateUrl(cita, paciente) {
  const stamp = (fecha, hhmm) => fecha.replace(/-/g, "") + "T" + hhmm.replace(":", "") + "00";
  const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || "America/Mexico_City";
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: "Sesión · " + (paciente ? paciente.nombre : "Paciente"),
    dates: stamp(cita.fecha, cita.hora) + "/" + stamp(cita.fecha, cita.fin),
    ctz: tz,
    details: [cita.tipo, cita.modalidad, cita.nota].filter(Boolean).join(" · ") + "\nAgendado desde Psystema",
  });
  return "https://calendar.google.com/calendar/render?" + q.toString();
}

Object.assign(window, {
  gcalTemplateUrl,
  GCAL_SCOPE, gcalCfg, gcalSetCfg, loadGis,
  gcalRequestToken, gcalUserInfo, gcalListToday, gcalInsert,
});
