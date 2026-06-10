// api/estructurar-sesion.js
// ── Backend para Psystema en Vercel ──────────────────────────────────────────
// Recibe la transcripción cruda del dictado + contexto del paciente y devuelve
// los 5 apartados estructurados en JSON, usando GPT-4o de OpenAI.
//
// La API key NUNCA va aquí: se lee de la variable de entorno OPENAI_API_KEY
// que configuras en el panel de Vercel (Settings → Environment Variables).
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres un asistente clínico experto en Terapia Cognitivo-Conductual (TCC) que ayuda a una psicóloga a redactar notas de sesión para un expediente psicológico profesional. Recibirás la TRANSCRIPCIÓN CRUDA del dictado de voz de la terapeuta: un relato informal, coloquial, en primera persona, con muletillas y desorden, sobre lo que ocurrió en la consulta.

Transforma ese relato en una nota clínica estructurada y devuelve EXCLUSIVAMENTE un objeto JSON válido (sin texto antes ni después, sin bloques de código) con exactamente estas cinco claves: "temas", "desarrollo", "actividades", "analisis", "comentarios".

PRINCIPIOS DE REDACCIÓN
- Convierte el lenguaje informal en lenguaje clínico formal, profesional y técnico, propio de un expediente con enfoque Cognitivo-Conductual.
- Usa terminología TCC cuando corresponda (pensamiento automático, distorsión cognitiva, catastrofización, reestructuración cognitiva, exposición graduada, flecha descendente, conducta de evitación, análisis funcional, habituación).
- Refiérete al consultante como "la paciente"/"el paciente" o por su nombre; nunca en primera persona del relato.
- No inventes datos clínicos que no estén en el dictado. Escribe en español, en pasado, tono objetivo. Corrige ortografía y gramática. Sin emojis ni Markdown dentro de los valores.

REGLAS POR APARTADO
1. "temas": viñetas con "• " separadas por "\\n". Generales y CONCISAS: idealmente 2-3, máximo 5-6 solo si la densidad lo exige. Son titulares, no párrafos.
2. "desarrollo": NARRATIVO en uno o más párrafos. Plasma todo lo narrado en lenguaje formal. NO incluyas aquí nada marcado para "comentarios".
3. "actividades": extrae SOLO del desarrollo las tareas/ejercicios que la terapeuta asignó al paciente (tarea para casa). Lista numerada "1. ", "2. "… separada por "\\n". Si no hubo, devuelve "".
4. "analisis": propuesta de análisis funcional a partir del desarrollo. Estructura por líneas ("\\n"): Antecedente / Pensamiento automático / Emoción / Conducta / Consecuencia. Cuando haya CONTEXTO DE SESIONES ANTERIORES, relaciona lógicamente esta sesión con ese historial (continuidad, evolución).
5. "comentarios": si la terapeuta marcó un fragmento con una frase clave (p. ej. "esto va en comentarios", "anota en comentarios", "off the record"), AÍSLALO, OMÍTELO del desarrollo y redáctalo aquí en lenguaje técnico. Si no hay nada marcado, devuelve "".

Devuelve solo el objeto JSON.`;

export default async function handler(req, res) {
  // ── CORS: permite que tu app (Psystema) llame a esta función ──
  res.setHeader("Access-Control-Allow-Origin", "*"); // en producción pon tu dominio exacto
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Usa POST" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Falta OPENAI_API_KEY en Vercel" });

  try {
    const { transcript = "", contexto = "" } = req.body || {};
    if (!transcript.trim()) return res.status(400).json({ error: "Transcripción vacía" });

    const userMsg =
      "[CONTEXTO DEL PACIENTE]\n" + (contexto || "No se proporcionó contexto.") +
      "\n\n[TRANSCRIPCIÓN DEL DICTADO]\n" + transcript +
      "\n\nDevuelve SOLO el objeto JSON con las 5 claves.";

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.2,
        response_format: { type: "json_object" }, // fuerza salida JSON
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: "Error de OpenAI", detail });
    }

    const data = await r.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const campos = JSON.parse(content);

    // Garantiza las 5 claves
    return res.status(200).json({
      temas: campos.temas || "",
      desarrollo: campos.desarrollo || "",
      actividades: campos.actividades || "",
      analisis: campos.analisis || "",
      comentarios: campos.comentarios || "",
    });
  } catch (err) {
    return res.status(500).json({ error: "Fallo al procesar", detail: String(err) });
  }
}
