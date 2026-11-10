# Psystema

Expediente clínico, agenda y notas de sesión para psicoterapia.

- `dist/` — la app ya compilada (lo que se publica).
- `worker/app-worker.js` — Cloudflare Worker: sirve la app y el endpoint de IA `/api/ia`.
- `src/`, `web/`, `icons/`, `assets/` — código fuente; `tools/build.mjs` genera `dist/`.
- `supabase/schema.sql` — base de datos y reglas de privacidad (RLS).

Publicación: Cloudflare Workers Builds conectado a este repositorio (`npx wrangler deploy`).
El secreto `ANTHROPIC_API_KEY` se configura en Cloudflare (Settings › Variables and Secrets), nunca en este repositorio.

Este repositorio no contiene datos de pacientes: esos viven solo en la base de datos de Supabase, protegidos por usuario.
