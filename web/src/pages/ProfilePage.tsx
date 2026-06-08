import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

/* ─── Field helper ─────────────────────────────── */
function Field({
  label,
  value,
  editing,
  name,
  onChange,
  disabled = false,
  type = "text",
}: {
  label: string;
  value: string;
  editing: boolean;
  name: string;
  onChange: (n: string, v: string) => void;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      {editing && !disabled ? (
        <input
          type={type}
          value={value}
          onChange={e => onChange(name, e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800
                     focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
        />
      ) : (
        <p className={`text-sm px-4 py-3 rounded-xl font-bold ${disabled ? "text-slate-400 bg-slate-100" : "text-slate-800 bg-slate-50 border border-slate-200"}`}>
          {value || <span className="text-slate-300 italic font-medium">—</span>}
        </p>
      )}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────── */
export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // form state
  const [form, setForm] = useState({ nombres: "", ape_pat: "", ape_mat: "", cargo: "", empresa: "" });
  const [draft, setDraft] = useState({ ...form });

  const modules = [
    { name: "Listas Negativas",      icon: "search",                enabled: true,  href: "/busqueda" },
    { name: "Matriz de Riesgos",     icon: "grid_on",               enabled: true,  href: "/matriz-riesgos" },
    { name: "Scoring de Riesgo",     icon: "trending_up",           enabled: true,  href: "/scoring" },
    { name: "Registro de Operaciones", icon: "assignment",          enabled: true,  href: "/registro-operaciones" },
    { name: "Canal de Denuncias",    icon: "campaign",              enabled: true,  href: "/denuncias" },
    { name: "Mis Cursos",            icon: "school",                enabled: false, href: "/mis-cursos" },
    { name: "Mi Perfil",             icon: "manage_accounts",       enabled: true,  href: "/perfil" },
  ];

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  function handleChange(name: string, value: string) {
    setDraft(prev => ({ ...prev, [name]: value }));
  }

  function startEdit() {
    setDraft({ ...form });
    setEditing(true);
  }

  function cancelEdit() {
    setDraft({ ...form });
    setEditing(false);
  }

  async function saveEdit() {
    if (!draft.nombres.trim()) { showToast("err", "El campo Nombres es obligatorio."); return; }
    setSaving(true);
    const token = localStorage.getItem("auth_token") || "";
    try {
      const r = await fetch(`${API}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(draft),
      });
      if (r.ok) {
        const updated = await r.json();
        const next = {
          nombres: updated.nombres || "",
          ape_pat: updated.ape_pat || "",
          ape_mat: updated.ape_mat || "",
          cargo: updated.cargo || "",
          empresa: updated.empresa || "",
        };
        setUser(updated);
        setForm(next);
        setDraft(next);
        setEditing(false);
        showToast("ok", "Perfil actualizado correctamente.");
      } else {
        const err = await r.json().catch(() => ({ error: "Error desconocido" }));
        showToast("err", err.error || "Error al guardar.");
      }
    } catch { showToast("err", "Sin conexión al servidor."); }
    finally { setSaving(false); }
  }

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) { navigate("/login"); return; }
    fetch(`${API}/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.status === 401) { navigate("/login"); return null; }
        return r.ok ? r.json() : null;
      })
      .then(data => {
        if (data) {
          setUser(data);
          const next = {
            nombres: data.nombres || "",
            ape_pat: data.ape_pat || "",
            ape_mat: data.ape_mat || "",
            cargo: data.cargo || "",
            empresa: data.empresa || "",
          };
          setForm(next);
          setDraft(next);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#eef2f6]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Cargando perfil…</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#eef2f6] font-display dark:bg-[#101622]">

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR — idéntico a SearchPage ── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 bg-[#111827] flex flex-col shrink-0 transition-all duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isCollapsed ? 'w-20' : 'w-72'}`}>
        <div className={`h-20 flex items-center px-6 bg-white border-b border-slate-200 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
          {!isCollapsed && (
            <Link to="/home" className="flex items-center gap-3">
              <img src="/logo-informaPeru.jpg" alt="INFORMA PERÚ" className="h-8 w-auto object-contain" />
            </Link>
          )}
          {isCollapsed && (
            <Link to="/home" className="flex items-center justify-center">
              <img src="/logo.png" alt="IP" className="h-10 w-10 object-contain" />
            </Link>
          )}
          <button className="lg:hidden text-slate-400" onClick={() => setIsSidebarOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <style>{`.sidebar-scroll{overflow-y:auto;-ms-overflow-style:none;scrollbar-width:none !important;}.sidebar-scroll::-webkit-scrollbar{display:none !important;}`}</style>
        <nav className="flex-1 px-4 py-6 space-y-4 flex flex-col sidebar-scroll" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' } as React.CSSProperties}>
          {/* Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-full items-center justify-center py-2 rounded-xl text-slate-500 hover:bg-white/5 hover:text-white transition-all mb-4"
          >
            <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none' }}>
              menu_open
            </span>
          </button>

          <div className="space-y-4">
            {!isCollapsed && <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Sistemas</p>}
            <div className="space-y-2">
              {/* Inicio */}
              <button
                onClick={() => navigate('/home')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold uppercase text-[10px] tracking-wide text-slate-400 hover:text-white hover:border hover:border-white ${location.pathname === '/home' ? 'border-2 border-white text-white' : 'border border-transparent'} ${isCollapsed ? 'justify-center' : ''}`}
                style={{ backgroundColor: 'transparent' }}
              >
                <span className="material-symbols-outlined text-xl">home</span>
                {!isCollapsed && <span>Inicio</span>}
              </button>

              {modules.map((m) => (
                <button
                  key={m.name}
                  disabled={!m.enabled}
                  onClick={() => m.enabled && navigate(m.href)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold uppercase text-[10px] tracking-wide text-slate-400 hover:text-white hover:border hover:border-white ${location.pathname === m.href ? 'border-2 border-white text-white' : 'border border-transparent'} ${!m.enabled ? 'opacity-50 cursor-not-allowed' : ''} ${isCollapsed ? 'justify-center' : ''}`}
                  style={{ backgroundColor: 'transparent' }}
                >
                  <span className="material-symbols-outlined text-xl">{m.icon}</span>
                  {!isCollapsed && (
                    <span className="flex items-center gap-1.5">
                      <span>{m.name}</span>
                      {!m.enabled && (
                        <span className="material-symbols-outlined text-[12px] text-slate-400">lock</span>
                      )}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-auto border-t border-white/5">
            <button
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors font-bold uppercase text-[10px] tracking-widest ${isCollapsed ? 'justify-center' : ''}`}
              onClick={() => { localStorage.removeItem("auth_token"); window.location.href = '/login'; }}
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              {!isCollapsed && <span>CERRAR SESIÓN</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-10 shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setIsSidebarOpen(true)}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <button onClick={() => navigate('/home')} className="hover:text-primary transition-colors">Inicio</button>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-slate-700">Mi Perfil</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {editing ? (
              <>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {saving ? (
                    <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando…</>
                  ) : (
                    <><span className="material-symbols-outlined text-sm">save</span> Guardar</>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={startEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Editar perfil
              </button>
            )}
          </div>
        </header>

        {/* Content scroll area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8">

          {/* Toast */}
          {toast && (
            <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border
              ${toast.type === "ok"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"}`}
            >
              <span className={`material-symbols-outlined text-lg ${toast.type === "ok" ? "text-green-600" : "text-red-500"}`}>
                {toast.type === "ok" ? "check_circle" : "error"}
              </span>
              {toast.msg}
            </div>
          )}

          {/* Avatar card */}
          <section>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-4xl">account_circle</span>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    {user?.nombres} {user?.ape_pat} {user?.ape_mat}
                  </h2>
                  {editing && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-widest">
                      <span className="material-symbols-outlined text-[12px]">edit</span> Modo edición
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user?.cargo || "Sin cargo asignado"}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">{user?.correo}</p>
              </div>
            </div>
          </section>

          {/* Form grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Datos personales */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">person</span>
                <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Datos Personales</h3>
              </div>
              <div className="p-6 space-y-4">
                <Field label="Nombres *" value={draft.nombres} editing={editing} name="nombres" onChange={handleChange} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Apellido Paterno" value={draft.ape_pat} editing={editing} name="ape_pat" onChange={handleChange} />
                  <Field label="Apellido Materno" value={draft.ape_mat} editing={editing} name="ape_mat" onChange={handleChange} />
                </div>
                <Field label="Correo Electrónico" value={user?.correo || ""} editing={false} name="correo" onChange={() => {}} disabled />
                <p className="text-[9px] text-slate-400 font-bold flex items-center gap-1 -mt-1">
                  <span className="material-symbols-outlined text-[12px]">info</span>
                  El correo no puede ser modificado.
                </p>
              </div>
            </section>

            {/* Información laboral */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">business_center</span>
                <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Información Laboral</h3>
              </div>
              <div className="p-6 space-y-4">
                <Field label="Empresa / Institución" value={draft.empresa} editing={editing} name="empresa" onChange={handleChange} />
                <Field label="Cargo / Función" value={draft.cargo} editing={editing} name="cargo" onChange={handleChange} />
                <Field label="Usuario del Sistema" value={user?.usuario || ""} editing={false} name="usuario" onChange={() => {}} disabled />
                <p className="text-[9px] text-slate-400 font-bold flex items-center gap-1 -mt-1">
                  <span className="material-symbols-outlined text-[12px]">info</span>
                  El nombre de usuario no puede ser modificado.
                </p>
              </div>
            </section>
          </div>

          {/* Footer — idéntico a SearchPage */}
          <footer className="py-10 bg-white border-t border-slate-200 flex items-center justify-center mt-4">
            <p className="text-[10px] font-bold text-slate-500 tracking-widest text-center max-w-2xl px-4">
              @Copyright; Desarrollado por el área de TI-InformaPerú. Todos los derechos reservados 2026
            </p>
          </footer>

        </div>
      </main>
    </div>
  );
}
