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
    {
      name: "Listas Negativas",
      icon: "search",
      enabled: true,
      href: "/busqueda",
      description: "Consulta y gestiona listas de sanciones y entidades riesgosas.",
      color: "#E84855",
      bgColor: "#FDECEA",
      blobColor: "#FBBDC0",
    },
    {
      name: "Matriz de Riesgos",
      icon: "grid_on",
      enabled: true,
      href: "/matriz-riesgos",
      description: "Identifica, evalúa y gestiona los riesgos de tu organización.",
      color: "#3A6FD8",
      bgColor: "#EBF1FB",
      blobColor: "#B8CFF5",
    },
    {
      name: "Scoring de Riesgo",
      icon: "trending_up",
      enabled: true,
      href: "/scoring",
      description: "Evalúa y cuantifica el nivel de riesgo de terceros.",
      color: "#2BAE8E",
      bgColor: "#E8F8F4",
      blobColor: "#A8E4D5",
    },
    {
      name: "Registro de Operaciones",
      icon: "assignment",
      enabled: true,
      href: "/registro-operaciones",
      description: "Registra y da seguimiento a las operaciones realizadas.",
      color: "#7B5EA7",
      bgColor: "#F2EEF9",
      blobColor: "#CFC0E8",
    },
    {
      name: "Reporte de Operaciones",
      icon: "receipt_long",
      enabled: true,
      href: "/reporte-operaciones",
      description: "Genera reportes detallados de las operaciones y actividades.",
      color: "#F08030",
      bgColor: "#FEF3EA",
      blobColor: "#F9C89A",
    },
    {
      name: "Administrador",
      icon: "admin_panel_settings",
      enabled: userRole === 'admin',
      href: "/load",
      description: "Administra usuarios, permisos y configuraciones del sistema.",
      color: "#2AA8A8",
      bgColor: "#E8F6F6",
      blobColor: "#A0DEDE",
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden font-sans text-base text-[#111318]">
      {/* Header Global */}
      <header className="h-20 bg-white flex items-center px-10 shrink-0 z-30 relative">
        <img src="/logo-informaPeru.jpg" alt="INFORMA PERÚ" className="h-12 w-auto object-contain" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#EB3237]" />
      </header>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative bg-[#F4F7FA]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-2 mb-10">
            <h2 className="text-[#32508E] text-[2rem] lg:text-[2.5rem] font-bold leading-none uppercase tracking-tight">
              MÓDULOS DE GESTIÓN
            </h2>
            <div className="h-1 w-20 bg-[#EB3237]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((m) => (
              <div
                key={m.name}
                className={`relative bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm p-6 flex flex-col gap-3 transition-all duration-300 ${m.enabled
                  ? "cursor-pointer hover:-translate-y-1 hover:shadow-lg"
                  : "opacity-50 cursor-not-allowed"
                  }`}
                style={{ minHeight: 210, borderBottom: `4px solid ${m.color}` }}
                onClick={() => (m.enabled ? navigate(m.href!) : null)}
              >
                {/* Top row: Icon and Title */}
                <div className="flex items-center space-x-3 mb-2">
                  {/* Ícono circular */}
                  <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0" style={{ background: m.bgColor }}>
                    <span className="material-symbols-outlined text-[1.8rem]" style={{ color: m.color }}>{m.icon}</span>
                  </div>
                  {/* Título */}
                  <h3 className="text-[1.05rem] font-bold leading-tight" style={{ color: m.enabled ? m.color : "#94a3b8" }}>{m.name}</h3>
                </div>

                {/* Bottom row: Description and Acceder button */}
                <div className="flex justify-between items-center">
                  <p className="text-sm text-slate-500 leading-relaxed flex-1 mr-2">
                    {m.enabled ? m.description : "Próximamente disponible."}
                  </p>
                  {m.enabled && (
                    <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: m.color }}>
                      {/* Acceder aquí*/}
                      <span className="material-symbols-outlined text-[2rem] opacity-50">arrow_forward</span>
                    </div>
                  )}
                </div>
              </div>
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
