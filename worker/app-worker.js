// Psystema — app (static files) + AI endpoint (/api/ia) in one Cloudflare Worker.
// Variables/Secrets (Settings › Variables and Secrets):
//   ANTHROPIC_API_KEY (Secret)  · SUPABASE_URL · SUPABASE_ANON_KEY · ALLOWED_EMAILS (optional) · ANTHROPIC_MODEL (optional)
async function handleIA(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
    const okOrigin = allowed.length === 0 || allowed.includes(origin);
    const cors = {
      "Access-Control-Allow-Origin": okOrigin ? origin || "*" : allowed[0] || "null",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    };
    const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...cors } });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ error: "Usa POST" }, 405);
    if (!okOrigin) return json({ error: "Origen no permitido" }, 403);
    if (!env.ANTHROPIC_API_KEY) return json({ error: "Falta configurar ANTHROPIC_API_KEY en el Worker" }, 500);

    // 1) who is calling? (must be logged in to your Psystema)
    const auth = request.headers.get("Authorization") || "";
    if (!/^Bearer\s+\S+/.test(auth)) return json({ error: "No autorizado" }, 401);
    const u = await fetch(env.SUPABASE_URL.replace(/\/$/, "") + "/auth/v1/user", { headers: { Authorization: auth, apikey: env.SUPABASE_ANON_KEY } });
    if (!u.ok) return json({ error: "Tu sesión expiró. Vuelve a iniciar sesión." }, 401);
    const user = await u.json();
    const lista = (env.ALLOWED_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (lista.length && !lista.includes(String(user.email || "").toLowerCase())) return json({ error: "Tu cuenta no tiene acceso al asistente" }, 403);

    // 2) validate the request
    let body;
    try { body = await request.json(); } catch (e) { return json({ error: "Solicitud inválida" }, 400); }
    const system = String(body.system || "").slice(0, 20000);
    const messages = (Array.isArray(body.messages) ? body.messages : [])
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && String(m.content || "").trim())
      .slice(-12)
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 120000) }));
    if (!messages.length || messages[messages.length - 1].role !== "user") return json({ error: "Falta el texto a procesar" }, 400);
    const max_tokens = Math.min(Math.max(Number(body.max_tokens) || 4000, 256), 8000);

    // 3) ask Claude
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: env.ANTHROPIC_MODEL || "claude-sonnet-5-5", max_tokens, system: system || undefined, messages }),
    });
    let d = {};
    try { d = await r.json(); } catch (e) {}
    if (!r.ok) {
      const m = (d.error && d.error.message) || "Error del servicio de IA";
      return json({ error: r.status === 401 ? "La clave de Anthropic no es válida" : /credit|balance/i.test(m) ? "Tu cuenta de Anthropic no tiene saldo" : m }, r.status === 429 ? 429 : 502);
    }
    const text = (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    return json({ text });
  }

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/ia") return handleIA(request, env);
    return env.ASSETS.fetch(request);
  },
};
