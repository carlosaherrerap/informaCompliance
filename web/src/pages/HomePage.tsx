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
    { name: "Scoring de Riesgo", icon: "trending_up", enabled: true, href: "/scoring" },
    { name: "Canal de Denuncias", icon: "campaign", enabled: false, href: "/denuncias" },
    { name: "Registro de Operaciones", icon: "assignment", enabled: true, href: "/registro-operaciones" },

    { name: "Reporte de Operaciones", icon: "receipt_long", enabled: false, href: "/reporte-operaciones" },
    { name: "Administrador", icon: "admin_panel_settings", enabled: userRole === 'admin', href: "/load" },
  ];
  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden font-sans text-base text-[#111318]">
      {/* Header Global */}
      <header className="h-20 bg-white flex items-center px-10 shrink-0 z-30 relative">
        <img src="/logo-informaPeru.jpg" alt="INFORMA PERÚ" className="h-12 w-auto object-contain" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#EB3237]" />
      </header>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative bg-[#F4F7FA]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-2 mb-10">
            <h2 className="text-[#32508E] text-[2rem] lg:text-[2.5rem] font-bold leading-none uppercase tracking-tight">MODULOS DEL SISTEMA</h2>
            <div className="h-1 w-20 bg-[#EB3237]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {modules.map((m) => (
              <button
                key={m.name}
                className={`relative h-44 rounded-2xl overflow-hidden transition-all duration-500 group border text-left p-6 ${m.enabled
                  ? "bg-white border-slate-300 hover:bg-slate-50 hover:border-[#32508E] hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-200/80"
                  : "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                  }`}
                onClick={() => m.enabled ? navigate(m.href!) : null}
              >
                {/* Decorative ghost icon in bottom right */}
                {m.enabled && (
                  <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-slate-200 group-hover:text-slate-300 text-[120px] select-none pointer-events-none transition-colors">
                    {m.icon}
                  </span>
                )}

                <div className="h-full flex flex-col justify-between relative z-10">
                  {/* Top: Label and Icon */}
                  <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-2xl ${m.enabled ? "bg-slate-100 text-slate-700 group-hover:bg-slate-200 transition-colors" : "bg-slate-200 text-slate-400"}`}>
                      <span className="material-symbols-outlined text-3xl">
                        {m.icon}
                      </span>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${m.enabled ? "text-slate-400" : "text-slate-300"}`}>
                      Módulo Sistema
                    </span>
                  </div>

                  {/* Middle: Big Title */}
                  <div className="mt-4">
                    <h3 className={`text-xl font-bold leading-tight uppercase tracking-tight ${m.enabled ? "text-slate-800" : "text-slate-400"}`}>
                      {m.name}
                    </h3>
                  </div>

                  {/* Bottom: Subtitle */}
                  <div className="mt-2 flex items-center gap-2">
                    {!m.enabled && (
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Próximamente</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer Global */}
      <footer className="h-10 bg-[#32508E] flex items-center justify-center px-4 shrink-0 z-30">
        <p className="text-[12px] text-white/90 text-center uppercase tracking-widest">
          @COPYRIGHT; DESARROLLADO POR EL AREA DE TI - INFORMAPERU. TODOS LOS DERECHOS RESERVADOS 2026
        </p>
      </footer>
    </div>
  );
}
