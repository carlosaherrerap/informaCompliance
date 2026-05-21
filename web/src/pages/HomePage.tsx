import React from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = React.useState<string>('user');

  React.useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setUserRole(decoded.role || 'user');
      } catch { }
    }
  }, []);

  const modules = [
    { name: "Listas Negativas", icon: "search", enabled: true, href: "/busqueda" },
    { name: "Matriz de Riesgos", icon: "grid_on", enabled: true, href: "/matriz-riesgos" },
    { name: "Scoring de Riesgo", icon: "trending_up", enabled: false, href: "/scoring" },
    { name: "Canal de Denuncias", icon: "campaign", enabled: false, href: "/denuncias" },
    { name: "Registro de Operaciones", icon: "assignment", enabled: true, href: "/registro-operaciones" },

    { name: "Reporte de Operaciones", icon: "receipt_long", enabled: false, href: "/reporte-operaciones" },
    { name: "Administrador", icon: "admin_panel_settings", enabled: userRole === 'admin', href: "/load" },
  ];
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-[#111318] font-display">
      <header className="h-20 bg-white border-b border-slate-100 flex items-center px-8 shrink-0">
        <img src="/logo-informaPeru.jpg" alt="INFORMA PERÚ Logo" className="h-12 w-auto object-contain" />
      </header>
      <main className="max-w-6xl mx-auto p-8">
        <h2 className="text-2xl font-black mb-6">MODULOS DEL SISTEMA</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {modules.map((m) => (
            <button key={m.name} className={`p-6 rounded-xl border ${m.enabled ? "border-primary/30 bg-white hover:bg-primary/5" : "border-[#dbdfe6] bg-white/60 cursor-not-allowed"} shadow-sm flex items-center gap-3 text-left transition-colors`} onClick={() => m.enabled ? navigate(m.href!) : null}>
              <div className={`size-10 rounded-lg flex items-center justify-center ${m.enabled ? "bg-primary/10 text-primary" : "bg-slate-200 text-slate-500"}`}>
                <span className="material-symbols-outlined">{m.icon}</span>
              </div>
              <div>
                <div className="text-lg font-bold">{m.name}</div>
                <div className={`text-xs ${m.enabled ? "text-primary" : "text-slate-400"}`}>{m.enabled ? "Habilitado" : "Próximamente"}</div>
              </div>
            </button>
          ))}
        </div>

        <footer className="py-10 bg-white border-t border-slate-100 flex items-center justify-center mt-12">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center max-w-2xl px-4">
            @COPYRIGHT; DESARROLLADO POR EL AREA DE TI - INFORMAPERU. TODOS LOS DERECHOS RESERVADOS 2026
          </p>
        </footer>
      </main>
    </div>
  );
}
