// ============ Psystema — shared UI ============
const { Icon, Logo } = window;

const initials = (n) => n.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const fmtMoney = (n) => "$" + n.toLocaleString("es-MX");
const pidIndex = (pid) => Math.max(0, window.PACIENTES.findIndex((p) => p.id === pid));

function Avatar({ nombre, idx = 0, size = 38, ring = false }) {
  const t = window.tint(idx);
  return (
    <div className="grid place-items-center shrink-0 font-semibold select-none"
      style={{ width: size, height: size, borderRadius: size * 0.32, background: t.bg, color: t.fg,
        fontSize: size * 0.36, boxShadow: ring ? `0 0 0 3px ${t.bg}` : "none" }}>
      {initials(nombre)}
    </div>
  );
}

function EstadoBadge({ estado }) {
  const map = {
    Confirmada: { c: "var(--accent)", b: "var(--accent-soft)" },
    Pendiente: { c: "#B8862F", b: "#FBF2DE" },
    Activo: { c: "#2F9469", b: "#E6F3EC" },
    Nuevo: { c: "var(--accent)", b: "var(--accent-soft)" },
    Pagado: { c: "#2F9469", b: "#E6F3EC" },
    Realizada: { c: "#2F9469", b: "#E6F3EC" },
    Cancelada: { c: "#B23636", b: "#FCEDED" },
    "No asistió": { c: "#9A5B12", b: "#FBF0E1" },
    "En pausa": { c: "#6B7280", b: "#F1F3F6" },
    "Cancelación tardía": { c: "#9A5B12", b: "#FBF0E1" },
    "Riesgo bajo": { c: "#256B4C", b: "#E4F2EB" },
    "Riesgo moderado": { c: "#7A4F0E", b: "#FFF3DB" },
    "Riesgo alto": { c: "#9B2222", b: "#FCE4E4" },
    Alta: { c: "#5E6A7D", b: "#EEF1F5" },
  };
  const s = map[estado] || { c: "#6B7280", b: "#F1F3F6" };
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium rounded-full px-2.5 py-1 whitespace-nowrap"
      style={{ color: s.c, background: s.b }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.c }}></span>{estado}
    </span>
  );
}

function NavItem({ icon, label, active, onClick, dark, badge }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-3 rounded-[10px] text-[14px] transition-colors relative group"
      style={{
        height: "var(--nav-h)",
        color: active ? (dark ? "#fff" : "var(--ink)") : (dark ? "rgba(255,255,255,.62)" : "var(--ink-soft)"),
        background: active ? (dark ? "rgba(255,255,255,.08)" : "var(--accent-soft)") : "transparent",
        fontWeight: active ? 600 : 500,
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = dark ? "rgba(255,255,255,.04)" : "#F2F4F7"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: "var(--accent)" }}></span>}
      <span style={{ color: active ? "var(--accent)" : "inherit" }}><Icon name={icon} size={19} /></span>
      <span className="truncate">{label}</span>
      {badge != null && (
        <span className="ml-auto text-[11px] font-semibold rounded-full px-1.5 py-0.5 min-w-[20px] text-center"
          style={{ background: active ? "var(--accent)" : (dark ? "rgba(255,255,255,.12)" : "#E7EAF0"), color: active ? "#fff" : (dark ? "rgba(255,255,255,.7)" : "var(--ink-soft)") }}>{badge}</span>
      )}
    </button>
  );
}

// Small popover menu (click-outside closes)
function MenuPop({ items, onClose, className = "", style }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
      <div className={"absolute z-50 w-[248px] rounded-[12px] border bg-white py-1.5 " + className}
        style={{ borderColor: "var(--line)", boxShadow: "0 12px 34px rgba(20,30,60,.18)", ...style }}>
        {items.map((it, i) => it === "-" ? <div key={i} className="my-1.5 border-t" style={{ borderColor: "var(--line)" }}></div> : (
          <button key={i} onClick={() => { onClose(); it.onClick(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-medium transition hover:bg-[#F5F7FA]"
            style={{ color: it.danger ? "#B23636" : "var(--ink)" }}>
            <span style={{ color: it.danger ? "#B23636" : "var(--ink-soft)" }}><Icon name={it.icon} size={15} /></span>{it.label}
          </button>
        ))}
      </div>
    </>
  );
}

function Sidebar({ view, setView, dark, citasCount, onMenu }) {
  const [menu, setMenu] = React.useState(false);
  const T = window.THERAPIST;
  const group = (label) => (
    <div className="px-3 pt-5 pb-1.5 text-[11px] font-semibold tracking-[0.13em]"
      style={{ color: dark ? "rgba(255,255,255,.34)" : "#9AA1AD" }}>{label}</div>
  );
  return (
    <aside className="h-full flex flex-col shrink-0 border-r"
      style={{ width: "var(--side-w)", background: dark ? "var(--side-dark)" : "#fff", borderColor: dark ? "rgba(255,255,255,.07)" : "var(--line)" }}>
      <div className="flex items-center gap-2.5 px-5" style={{ height: "var(--top-h)" }}>
        <span style={{ color: "var(--accent)" }}><Logo size={26} /></span>
        <span className="text-[18px] font-bold tracking-[-0.02em]" style={{ color: dark ? "#fff" : "var(--ink)" }}>
          Psystema
        </span>
      </div>
      <nav className="flex-1 px-3 overflow-y-auto">
        {group("PRINCIPAL")}
        <NavItem icon="dashboard" label="Inicio" active={view === "dashboard"} onClick={() => setView("dashboard")} dark={dark} />
        <NavItem icon="calendar" label="Agenda" active={view === "agenda"} onClick={() => setView("agenda")} dark={dark} badge={citasCount} />
        {group("CLÍNICA")}
        <NavItem icon="users" label="Pacientes" active={view === "pacientes"} onClick={() => setView("pacientes")} dark={dark} />
        {group("GESTIÓN")}
        <NavItem icon="wallet" label="Finanzas" active={view === "finanzas"} onClick={() => setView("finanzas")} dark={dark} />
      </nav>
      <div className="p-3 border-t relative" style={{ borderColor: dark ? "rgba(255,255,255,.07)" : "var(--line)" }}>
        <button onClick={() => setMenu((v) => !v)} aria-label="Menú de cuenta"
          className="w-full flex items-center gap-3 px-2 py-2 rounded-[10px] text-left transition"
          onMouseEnter={(e) => e.currentTarget.style.background = dark ? "rgba(255,255,255,.05)" : "#F2F4F7"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
          <Avatar nombre={T.nombre} idx={0} size={36} />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold truncate" style={{ color: dark ? "#fff" : "var(--ink)" }}>{(T.titulo ? T.titulo + " " : "") + T.nombre}</div>
            <div className="text-[11.5px] truncate" style={{ color: dark ? "rgba(255,255,255,.55)" : "var(--ink-soft)" }}>{T.rol}</div>
          </div>
          <span style={{ color: dark ? "rgba(255,255,255,.55)" : "#8A92A0" }}><Icon name="dot-menu" size={18} /></span>
        </button>
        {menu && (
          <MenuPop onClose={() => setMenu(false)} className="left-3 bottom-[64px]" items={[
            { icon: "user", label: "Mi perfil", onClick: () => onMenu("perfil") },
            { icon: "sparkles", label: "Plantilla de notas y dictado", onClick: () => onMenu("plantilla") },
            { icon: "shield", label: "Políticas del consultorio", onClick: () => onMenu("politicas") },
            { icon: "file", label: "Generar contrato", onClick: () => onMenu("contrato") },
            "-",
            { icon: "external", label: "Respaldo: exportar / importar", onClick: () => onMenu("respaldo") },
            window.PSY_CLOUD
              ? { icon: "logout", label: "Cerrar sesión", danger: true, onClick: () => onMenu("salir") }
              : { icon: "x", label: "Empezar sin datos de ejemplo", danger: true, onClick: () => onMenu("limpiar") },
          ]} />
        )}
      </div>
    </aside>
  );
}

function QuickAction({ icon, label, onClick, primary }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-2 h-9 px-3.5 rounded-[9px] text-[13px] font-semibold transition-all active:scale-[.97]"
      style={primary
        ? { background: "var(--accent)", color: "#fff", boxShadow: "0 1px 2px rgba(20,40,90,.18)" }
        : { background: "#fff", color: "var(--ink)", border: "1px solid var(--line)" }}
      onMouseEnter={(e) => { if (primary) e.currentTarget.style.filter = "brightness(.94)"; else e.currentTarget.style.background = "#F7F8FA"; }}
      onMouseLeave={(e) => { if (primary) e.currentTarget.style.filter = "none"; else e.currentTarget.style.background = "#fff"; }}>
      <Icon name={icon} size={16} /><span>{label}</span>
    </button>
  );
}

function Topbar({ title, subtitle, onAction, onSesion, search, setSearch, showSearch, avisos = [], menuItems = [], onOcultar }) {
  const [bell, setBell] = React.useState(false);
  const [more, setMore] = React.useState(false);
  return (
    <header className="flex items-center gap-4 px-6 md:px-8 border-b bg-[var(--bg)]/85 backdrop-blur-md shrink-0 sticky top-0 z-20"
      style={{ height: "var(--top-h)", borderColor: "var(--line)" }}>
      <div className="min-w-0">
        <h1 className="text-[19px] md:text-[21px] font-bold tracking-[-0.02em] leading-tight truncate" style={{ color: "var(--ink)" }}>{title}</h1>
        {subtitle && <p className="text-[12.5px] -mt-0.5" style={{ color: "var(--ink-soft)" }}>{subtitle}</p>}
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        {showSearch && (
          <div className="hidden lg:flex items-center gap-2 h-9 px-3 rounded-[9px] bg-white border w-[230px]" style={{ borderColor: "var(--line)" }}>
            <span style={{ color: "#A6ADB8" }}><Icon name="search" size={16} /></span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar paciente…"
              className="bg-transparent outline-none text-[13px] w-full" style={{ color: "var(--ink)" }} />
          </div>
        )}
        <button onClick={onSesion} title="Escribe o narra la nota de una sesión que ya terminó"
          className="inline-flex items-center gap-2 h-9 px-2.5 sm:px-3.5 rounded-[9px] text-[13px] font-semibold transition-colors"
          style={{ background: "var(--ink)", color: "#fff" }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = ".88"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
          <Icon name="mic" size={16} /><span className="hidden sm:inline">Registrar sesión</span>
        </button>
        {onOcultar && (
          <button onClick={onOcultar} aria-label="Ocultar pantalla" title="Ocultar pantalla (datos sensibles)" className="grid place-items-center w-9 h-9 rounded-[9px] bg-white border" style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}>
            <Icon name="eye-off" size={18} />
          </button>
        )}
        <div className="relative hidden sm:block">
          <button onClick={() => setBell((v) => !v)} aria-label="Avisos" className="relative grid place-items-center w-9 h-9 rounded-[9px] bg-white border" style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}>
            <Icon name="bell" size={18} />
            {avisos.length > 0 && <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold text-white grid place-items-center" style={{ background: "#D14343" }}>{avisos.length}</span>}
          </button>
          {bell && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setBell(false)}></div>
              <div className="absolute right-0 top-11 z-50 w-[300px] rounded-[12px] border bg-white py-2" style={{ borderColor: "var(--line)", boxShadow: "0 12px 34px rgba(20,30,60,.18)" }}>
                <div className="px-4 pb-2 text-[12px] font-semibold" style={{ color: "var(--ink-soft)" }}>AVISOS</div>
                {avisos.length === 0 && <div className="px-4 py-3 text-[13px]" style={{ color: "var(--ink-soft)" }}>Todo al día.</div>}
                {avisos.map((a, i) => (
                  <button key={i} onClick={() => { setBell(false); a.onClick && a.onClick(); }} className="w-full flex items-start gap-2.5 px-4 py-2 text-left hover:bg-[#F5F7FA]">
                    <span className="mt-0.5" style={{ color: a.color || "var(--accent)" }}><Icon name={a.icon} size={15} /></span>
                    <span className="text-[13px] leading-snug" style={{ color: "var(--ink)" }}>{a.text}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="relative md:hidden">
          <button onClick={() => setMore((v) => !v)} aria-label="Más opciones" className="grid place-items-center w-9 h-9 rounded-[9px] bg-white border" style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}>
            <Icon name="dot-menu" size={18} />
          </button>
          {more && <MenuPop onClose={() => setMore(false)} className="right-0 top-11" items={avisos.map((a) => ({ icon: a.icon, label: a.text, onClick: a.onClick || (() => {}) })).concat(avisos.length ? ["-"] : [], menuItems)} />}
        </div>
      </div>
    </header>
  );
}

function MobileTabBar({ view, setView, onAdd }) {
  const tab = (id, icon, label) => (
    <button onClick={() => setView(id)} className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
      style={{ color: view === id ? "var(--accent)" : "var(--ink-soft)" }}>
      <Icon name={icon} size={22} stroke={view === id ? 2 : 1.6} />
      <span className="text-[10.5px]" style={{ fontWeight: view === id ? 600 : 500 }}>{label}</span>
    </button>
  );
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t flex items-stretch px-1 z-30" style={{ borderColor: "var(--line)", height: "calc(64px + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)" }}>
      {tab("dashboard", "dashboard", "Inicio")}
      {tab("agenda", "calendar", "Agenda")}
      <div className="flex-1 grid place-items-center">
        <button onClick={onAdd} className="w-12 h-12 -mt-5 rounded-2xl grid place-items-center text-white shadow-lg active:scale-95 transition" style={{ background: "var(--accent)", boxShadow: "0 6px 16px var(--accent-glow)" }}>
          <Icon name="plus" size={24} stroke={2.2} />
        </button>
      </div>
      {tab("pacientes", "users", "Pacientes")}
      {tab("finanzas", "wallet", "Finanzas")}
    </nav>
  );
}

Object.assign(window, { Avatar, EstadoBadge, NavItem, Sidebar, Topbar, QuickAction, MobileTabBar, MenuPop, initials, fmtMoney, pidIndex });
