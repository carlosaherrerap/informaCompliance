import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

function Sidebar({ isOpen, isCollapsed, onClose, onToggle, userRole }: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const modules = [
    { name: "Listas Negativas", icon: "search", enabled: true, href: "/busqueda" },
    { name: "Matriz de Riesgos", icon: "grid_on", enabled: true, href: "/matriz-riesgos" },
    { name: "Scoring de Riesgo", icon: "trending_up", enabled: true, href: "/scoring" },
    { name: "Registro de Operaciones", icon: "assignment", enabled: true, href: "/registro-operaciones" },
    { name: "Canal de Denuncias", icon: "campaign", enabled: false, href: "/denuncias" },
    { name: "Mis Cursos", icon: "school", enabled: false, href: "/mis-cursos" },
    { name: "Administrador", icon: "admin_panel_settings", enabled: userRole === "admin", href: "/load" },
  ];
  return (
    <aside className={`fixed lg:static inset-y-0 left-0 z-50 bg-[#111827] flex flex-col shrink-0 transition-all duration-300 transform ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${isCollapsed ? "w-20" : "w-72"}`}>
      <div className={`h-20 flex items-center px-6 bg-white border-b border-slate-200 ${isCollapsed ? "justify-center px-0" : "justify-between"}`}>
        {!isCollapsed && (<Link to="/home" className="flex items-center gap-3"><img src="/logo-informaPeru.jpg" alt="INFORMA PERÚ" className="h-8 w-auto object-contain" /></Link>)}
        {isCollapsed && (<Link to="/home" className="flex items-center justify-center"><img src="/logo.png" alt="IP" className="h-10 w-10 object-contain" /></Link>)}
        <button className="lg:hidden text-slate-400" onClick={onClose}><span className="material-symbols-outlined">close</span></button>
      </div>
      <style>{`.sb-scroll{overflow-y:auto;-ms-overflow-style:none;scrollbar-width:none;}.sb-scroll::-webkit-scrollbar{display:none;}`}</style>
      <nav className="flex-1 px-4 py-6 space-y-4 flex flex-col sb-scroll">
        <button onClick={onToggle} className="hidden lg:flex w-full items-center justify-center py-2 rounded-xl text-slate-500 hover:text-white hover:border hover:border-white transition-all mb-4">
          <span className="material-symbols-outlined" style={{ transform: isCollapsed ? "rotate(180deg)" : "none" }}>menu_open</span>
        </button>
        <div className="space-y-4">
          {!isCollapsed && <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Sistemas</p>}
          <div className="space-y-2">
            <button onClick={() => navigate("/home")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold uppercase text-[10px] tracking-wide text-slate-400 hover:text-white hover:border hover:border-white ${location.pathname === "/home" ? "border-2 border-white text-white" : "border border-transparent"} ${isCollapsed ? "justify-center" : ""}`} style={{ backgroundColor: "transparent" }}>
              <span className="material-symbols-outlined text-xl">home</span>{!isCollapsed && <span>Inicio</span>}
            </button>
            {modules.map(m => {
              const isActive = location.pathname === m.href;
              return (
                <button key={m.name} disabled={!m.enabled} onClick={() => navigate(m.href)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold uppercase text-[10px] tracking-wide text-slate-400 hover:text-white hover:border hover:border-white ${isActive ? "border-2 border-white text-white" : "border border-transparent"} ${!m.enabled ? "opacity-50 cursor-not-allowed" : ""} ${isCollapsed ? "justify-center" : ""}`} style={{ backgroundColor: "transparent" }}>
                  <span className="material-symbols-outlined text-xl">{m.icon}</span>
                  {!isCollapsed && (<span className="flex items-center gap-1.5"><span>{m.name}</span>{!m.enabled && <span className="material-symbols-outlined text-[12px] text-slate-400">lock</span>}</span>)}
                </button>
              );
            })}
          </div>
        </div>
        <div className="pt-4 mt-auto border-t border-white/5">
          <button className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:text-white hover:border hover:border-white transition-colors font-bold uppercase text-[10px] tracking-widest ${isCollapsed ? "justify-center" : ""}`} onClick={() => { localStorage.removeItem("auth_token"); window.location.href = "/login"; }}>
            <span className="material-symbols-outlined text-xl">logout</span>{!isCollapsed && <span>CERRAR SESIÓN</span>}
          </button>
        </div>
      </nav>
    </aside>
  );
}

function getRiskColor(cat: string) {
  const norm = String(cat || "").toLowerCase();
  if (norm.includes("mínimo") || norm.includes("bajo") || norm.includes("minimo")) return { color: "#469BE7", text: "text-blue-600", bg: "bg-blue-100", dot: "bg-blue-500" };
  if (norm.includes("leve")) return { color: "#429A46", text: "text-green-600", bg: "bg-green-100", dot: "bg-green-500" };
  if (norm.includes("moderado") || norm.includes("medio")) return { color: "#B8A700", text: "text-yellow-600", bg: "bg-yellow-100", dot: "bg-yellow-500" };
  if (norm.includes("alto")) return { color: "#FF8A00", text: "text-orange-600", bg: "bg-orange-100", dot: "bg-orange-500" };
  return { color: "#FF0000", text: "text-red-600", bg: "bg-red-100", dot: "bg-red-500" };
}

export default function ScoringRiesgoPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState("user");
  const [history, setHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const hcRef = useRef<any>(null);

  const fetchHistory = async () => {
    const token = localStorage.getItem("auth_token") || "";
    try {
      const res = await fetch(`${apiUrl}/scoring`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("auth_token") || "";
    if (token) {
      try {
        const payload: any = JSON.parse(atob(token.split(".")[1]));
        setUserRole(payload.role || "user");
      } catch { }
    }
    fetchHistory();
  }, []);

  // Calculate statistics
  const totalCount = history.length;
  const avgScore = totalCount > 0 ? history.reduce((sum, h) => sum + Number(h.puntaje), 0) / totalCount : 0;

  const dist = { minimo: 0, leve: 0, moderado: 0, alto: 0, muyAlto: 0 };
  history.forEach(h => {
    const cat = String(h.categoria || "").toLowerCase();
    if (cat.includes("mínimo") || cat.includes("bajo") || cat.includes("minimo")) dist.minimo++;
    else if (cat.includes("leve")) dist.leve++;
    else if (cat.includes("moderado") || cat.includes("medio")) dist.moderado++;
    else if (cat.includes("alto")) dist.alto++;
    else dist.muyAlto++;
  });

  useEffect(() => {
    if (history.length === 0 || !chartRef.current) return;
    const HC = (window as any).Highcharts;
    if (!HC) {
      const existing = document.getElementById("hc-script");
      if (!existing) {
        const script = document.createElement("script");
        script.id = "hc-script";
        script.src = "https://code.highcharts.com/highcharts.js";
        script.onload = renderChart;
        document.head.appendChild(script);
      } else {
        existing.addEventListener("load", renderChart);
      }
    } else {
      renderChart();
    }

    function renderChart() {
      const HC = (window as any).Highcharts;
      if (!HC || !chartRef.current) return;
      if (hcRef.current) hcRef.current.destroy();

      hcRef.current = HC.chart(chartRef.current, {
        chart: { type: "pie", backgroundColor: "transparent", style: { fontFamily: "Inter, sans-serif" }, height: 260 },
        title: { text: "" },
        credits: { enabled: false },
        plotOptions: {
          pie: {
            allowPointSelect: true, cursor: "pointer", borderRadius: 8,
            dataLabels: { enabled: true, format: "<b>{point.name}</b>: {point.y} ({point.percentage:.1f}%)", style: { fontSize: "10px", fontWeight: "700", color: "#64748b" } }
          }
        },
        series: [{
          name: "Registros",
          colorByPoint: true,
          data: [
            { name: "Mínimo", y: dist.minimo, color: "#469BE7" },
            { name: "Leve", y: dist.leve, color: "#429A46" },
            { name: "Moderado", y: dist.moderado, color: "#BFAD00" },
            { name: "Alto", y: dist.alto, color: "#FF8A00" },
            { name: "Muy Alto", y: dist.muyAlto, color: "#FF0000" }
          ].filter(d => d.y > 0)
        }]
      });
    }

    return () => { if (hcRef.current) { hcRef.current.destroy(); hcRef.current = null; } };
  }, [history]);

  const filteredHistory = history.filter(h => {
    const name = String(h.entidad_nombre || "").toLowerCase();
    const doc = String(h.documento || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || doc.includes(q);
  });

  return (
    <div className="h-screen flex flex-col bg-[#F4F7FA] overflow-hidden font-sans">
      <div className="flex h-screen overflow-hidden relative">
        <Sidebar isOpen={sidebarOpen} isCollapsed={collapsed} onClose={() => setSidebarOpen(false)} onToggle={() => setCollapsed(!collapsed)} userRole={userRole} />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-10 shrink-0 z-40 relative">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setSidebarOpen(true)}>
                <span className="material-symbols-outlined">menu</span>
              </button>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Scoring de Riesgo</h2>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <span className="hidden sm:inline">Nuevo Análisis:</span>
              <button onClick={() => navigate("/scoring/generate/natural")} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all font-black uppercase text-[10px] tracking-widest">Persona Natural</button>
              <button onClick={() => navigate("/scoring/generate/company")} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all font-black uppercase text-[10px] tracking-widest">Persona Jurídica</button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Count & Avg */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden relative">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Resumen General</p>
                  <div className="space-y-4">
                    <div>
                      <span className="text-5xl font-black text-slate-900 leading-none">{totalCount}</span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Evaluaciones Realizadas</p>
                    </div>
                    <div>
                      <span className="text-4xl font-black text-indigo-600 leading-none">{avgScore.toFixed(2)}</span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Puntaje Promedio</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Card */}
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Distribución de perfiles de riesgo</p>
                {totalCount > 0 ? (
                  <div ref={chartRef} className="w-full" />
                ) : (
                  <div className="h-[260px] flex flex-col items-center justify-center text-slate-300">
                    <span className="material-symbols-outlined text-4xl mb-2">pie_chart</span>
                    <p className="text-[10px] font-bold uppercase tracking-widest">Sin registros suficientes para graficar</p>
                  </div>
                )}
              </div>
            </div>

            {/* History Table Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em]">Scoring consultados recientemente</h3>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                  <input type="text" placeholder="BUSCAR POR NOMBRE O DNI..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none w-64 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all uppercase" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Entidad / Persona</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Identificación</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Riesgo / Score</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredHistory.length > 0 ? (
                      filteredHistory.map(h => {
                        const style = getRiskColor(h.categoria);
                        const isNat = String(h.tipo || "").toLowerCase() === "natural";
                        return (
                          <tr key={h.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-5 text-[10px] font-bold text-slate-400">#{String(h.id).padStart(5, "0")}</td>
                            <td className="px-8 py-5">
                              <span className={`px-2 py-1 text-[8px] font-black rounded uppercase ${isNat ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"}`}>{isNat ? "Natural" : "Jurídica"}</span>
                            </td>
                            <td className="px-8 py-5 text-[11px] font-black text-slate-800 uppercase">{h.entidad_nombre}</td>
                            <td className="px-8 py-5 text-[11px] font-bold text-slate-500 tabular-nums">{h.documento}</td>
                            <td className="px-8 py-5 text-[10px] font-bold text-slate-400">{new Date(h.fecha_creacion).toLocaleDateString("es-PE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-2">
                                <div className={`size-2 rounded-full ${style.dot}`} />
                                <span className={`text-[10px] font-black ${style.text} uppercase`}>{h.categoria} ({Number(h.puntaje).toFixed(2)})</span>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <button onClick={() => setSelectedRecord(h)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all" title="Ver Detalle">
                                <span className="material-symbols-outlined text-lg">visibility</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-8 py-10 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">No se encontraron registros de scoring</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <footer className="py-4 bg-white border-t border-slate-100 flex items-center justify-center shrink-0">
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest text-center px-4">
              @COPYRIGHT · DESARROLLADO POR EL AREA DE TI - INFORMAPERU · 2026
            </p>
          </footer>
        </main>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setSelectedRecord(null)}>
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden scale-in duration-300" onClick={e => e.stopPropagation()}>
            <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-700">Detalle de Scoring #{String(selectedRecord.id).padStart(5, "0")}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Fecha: {new Date(selectedRecord.fecha_creacion).toLocaleString()}</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setSelectedRecord(null)}><span className="material-symbols-outlined">close</span></button>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cliente / Razón Social</label>
                  <p className="text-xs font-black text-slate-800 uppercase mt-0.5">{selectedRecord.entidad_nombre}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Identificación (DNI/RUC)</label>
                  <p className="text-xs font-bold text-slate-800 uppercase mt-0.5">{selectedRecord.documento}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo de Persona</label>
                  <p className="text-xs font-black text-slate-800 uppercase mt-0.5">{String(selectedRecord.tipo || "").toLowerCase() === "natural" ? "Persona Natural" : "Persona Jurídica"}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Puntaje / Categoría</label>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getRiskColor(selectedRecord.categoria).bg} ${getRiskColor(selectedRecord.categoria).text}`}>
                      Riesgo {selectedRecord.categoria}
                    </span>
                    <span className="text-xs font-black text-slate-800">{Number(selectedRecord.puntaje).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Form payload responses */}
              {selectedRecord.payload && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em]">Respuestas del Cuestionario</h4>
                  <div className="grid grid-cols-2 gap-3.5 text-[11px]">
                    {Object.entries(selectedRecord.payload).map(([k, v]: any) => {
                      if (!v || typeof v !== "string" || k.endsWith("Foo") || ["obs", "fullname", "razonSocial", "ruc", "identification"].includes(k)) return null;
                      // Try to translate keys to user-friendly titles
                      const labels: any = {
                        birthday: "Fecha de Nacimiento/Constitución", transaction: "Monto Transacción S/.", hasCompany: "Persona Natural con Negocio",
                        ocupation: "Ocupación/Profesión ID", obligation: "Sujeto Obligado ID", scstatus: "Estado Laboral ID",
                        sensible: "Cliente Sensible ID", country: "Nacionalidad ID", office: "Oficina ID",
                        residence: "Residencia ID", product: "Producto ID", funding: "Origen Fondos ID",
                        currency: "Moneda ID", pjType: "Tipo PJ ID", companySize: "Tamaño Empresa ID"
                      };
                      return (
                        <div key={k} className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-400 font-medium">{labels[k] || k}</span>
                          <span className="text-slate-700 font-bold uppercase">{v}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedRecord.sustento && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em]">Observaciones</h4>
                  <p className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-600 font-medium leading-relaxed italic">"{selectedRecord.sustento}"</p>
                </div>
              )}
            </div>
            <footer className="px-6 py-4 border-t border-slate-100 flex justify-end shrink-0 bg-slate-50">
              <button className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow" onClick={() => setSelectedRecord(null)}>Cerrar</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
