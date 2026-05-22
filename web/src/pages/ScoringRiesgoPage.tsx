import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function ScoringRiesgoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState('user');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'natural' | 'juridica'>('natural');
  const [isExecuting, setIsExecuting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [calculatedRisk, setCalculatedRisk] = useState<{ score: number, label: string, color: string } | null>(null);
  const [formData, setFormData] = useState<any>({
    nombre: "",
    documento: "",
    fecha: "",
    transaccion: "",
    tipoPJ: "SAC",
    tamano: "Micro",
    ciiu: "Comercio",
    sujetoObligado: "No",
    accionistas: "Bajo Riesgo",
    zonaNacional: "Perú - Lima",
    zonaResidencia: "Bajo Riesgo",
    zonaOficina: "Principal",
    producto: "Crédito Personal",
    moneda: "PEN",
    origenFondos: "Salarios",
    naturalNegocio: "No",
    clienteSensible: "No",
    ocupacion: "Empleado"
  });

  const modules = [
    { name: "Listas Negativas", icon: "search", enabled: true, href: "/busqueda" },
    { name: "Matriz de Riesgos", icon: "grid_on", enabled: true, href: "/matriz-riesgos" },
    { name: "Scoring de Riesgo", icon: "trending_up", enabled: true, href: "/scoring" },
    { name: "Canal de Denuncias", icon: "campaign", enabled: false, href: "/denuncias" },
    { name: "Registro de Operaciones", icon: "assignment", enabled: true, href: "/registro-operaciones" },
    { name: "Reporte de Operaciones", icon: "receipt_long", enabled: false, href: "/reporte-operaciones" },
    { name: "Administrador", icon: "admin_panel_settings", enabled: userRole === 'admin', href: "/load" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("auth_token") || "";
    if (token) {
      try {
        const payload: any = JSON.parse(atob(token.split(".")[1]));
        setUserRole(payload.role || 'user');
      } catch { }
    }
    setHistory([
      { id: 1, tipo: 'NATURAL', nombre: 'JUAN PEREZ GARCIA', doc: '45672831', fecha: '2024-05-22', riesgo: 'BAJO', score: 1.5 },
      { id: 2, tipo: 'JURIDICA', nombre: 'INVERSIONES PERU SAC', doc: '20601234567', fecha: '2024-05-21', riesgo: 'MEDIO', score: 2.8 },
    ]);
  }, []);

  const updateForm = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleEjecutar = () => {
    setIsExecuting(true);
    setCalculatedRisk(null);
    setTimeout(() => {
      const score = (Math.random() * 5).toFixed(2);
      let label = "BAJO";
      let color = "bg-green-500";
      if (Number(score) > 3.5) { label = "ALTO"; color = "bg-red-500"; }
      else if (Number(score) > 2) { label = "MEDIO"; color = "bg-orange-500"; }

      setCalculatedRisk({ score: Number(score), label, color });
      setIsExecuting(false);
    }, 1500);
  };

  return (
    <div className="h-screen flex flex-col bg-[#F4F7FA] overflow-hidden font-sans text-base text-[#111318]">
      <div className="flex h-screen overflow-hidden relative">
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 bg-[#111827] flex flex-col shrink-0 transition-all duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isCollapsed ? 'w-20' : 'w-72'}`}>
          <div className={`h-20 flex items-center px-6 bg-white border-b border-slate-200 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
            {!isCollapsed && (
              <Link to="/" className="flex items-center gap-3">
                <img src="/logo-informaPeru.jpg" alt="INFORMA PERÚ" className="h-8 w-auto object-contain" />
              </Link>
            )}
            {isCollapsed && (
              <Link to="/" className="flex items-center justify-center">
                <img src="/logo.png" alt="IP" className="h-10 w-10 object-contain" />
              </Link>
            )}
            <button className="lg:hidden text-slate-400" onClick={() => setIsSidebarOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <style>{`.sidebar-scroll{overflow-y:auto;-ms-overflow-style:none;scrollbar-width:none !important;}.sidebar-scroll::-webkit-scrollbar{display:none !important;}`}</style>
          <nav className="flex-1 px-4 py-6 space-y-4 flex flex-col sidebar-scroll" style={{msOverflowStyle:'none',scrollbarWidth:'none'}}>
            {/* Toggle Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex w-full items-center justify-center py-2 rounded-xl text-slate-500 hover:text-white hover:border hover:border-white transition-all mb-4"
            >
              <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none' }}>
                {isCollapsed ? 'menu_open' : 'menu_open'}
              </span>
            </button>

            <div className="space-y-4">
              {!isCollapsed && <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Sistemas</p>}
              <div className="space-y-2">
                {/* Inicio Button - Reubicado */}
                <button
                  onClick={() => navigate('/')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold uppercase text-[10px] tracking-wide text-slate-400 hover:text-white hover:border hover:border-white ${location.pathname === '/' ? 'border-2 border-white text-white' : 'border border-transparent'} ${isCollapsed ? 'justify-center' : ''}`}
                  style={{backgroundColor: 'transparent'}}
                >
                  <span className="material-symbols-outlined text-xl">home</span>
                  {!isCollapsed && <span>Inicio</span>}
                </button>

                {modules.map((m) => {
                  const isActive = location.pathname === m.href;
                  return (
                    <button
                      key={m.name}
                      disabled={!m.enabled}
                      onClick={() => navigate(m.href)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold uppercase text-[10px] tracking-wide text-slate-400 hover:text-white hover:border hover:border-white ${isActive ? 'border-2 border-white text-white' : 'border border-transparent'} ${!m.enabled ? 'opacity-50 cursor-not-allowed' : ''} ${isCollapsed ? 'justify-center' : ''}`}
                      style={{backgroundColor: 'transparent'}}
                    >
                      <span className="material-symbols-outlined text-xl">{m.icon}</span>
                      {!isCollapsed && <span>{m.name}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 mt-auto border-t border-white/5">
              <button
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:text-white hover:border hover:border-white transition-colors font-bold uppercase text-[10px] tracking-widest ${isCollapsed ? 'justify-center' : ''}`}
                onClick={() => { localStorage.removeItem("auth_token"); window.location.href = '/login'; }}
              >
                <span className="material-symbols-outlined text-xl">logout</span>
                {!isCollapsed && <span>CERRAR SESIÓN</span>}
              </button>
            </div>
          </nav>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-10 shrink-0 z-40 relative">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setIsSidebarOpen(true)}>
                <span className="material-symbols-outlined">menu</span>
              </button>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest hidden sm:block">Scoring de Riesgo</h2>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between overflow-hidden relative">
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Perfil de riesgos registrados</p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-[#32508E] leading-none">1.25</span>
                    <span className="text-xs font-bold text-green-500 uppercase pb-1">Promedio General</span>
                  </div>
                </div>
                <div className="size-24 relative">
                  <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray="251" strokeDashoffset="180" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-black text-green-600">65%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Distribución de perfiles</p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1">
                      <div className="size-2 bg-green-500 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-500">BAJO 65%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="size-2 bg-orange-500 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-500">MEDIO 25%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="size-2 bg-red-500 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-500">ALTO 10%</span>
                    </div>
                  </div>
                </div>
                <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-300 text-4xl">pie_chart</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setActiveTab('natural')}
                  className={`flex-1 py-6 font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'natural' ? 'text-primary border-b-4 border-primary bg-primary/5' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Persona Natural
                </button>
                <button
                  onClick={() => setActiveTab('juridica')}
                  className={`flex-1 py-6 font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'juridica' ? 'text-primary border-b-4 border-primary bg-primary/5' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Persona Jurídica
                </button>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                  <div className="xl:col-span-2 space-y-12">
                    <div className="space-y-6">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="size-2 bg-primary rounded-full" />
                        Datos del Cliente
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">{activeTab === 'natural' ? 'Nombre Completo' : 'Razón Social'}</label>
                          <input type="text" value={formData.nombre} onChange={e => updateForm('nombre', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase focus:ring-2 focus:ring-primary/20 outline-none" placeholder="EJ: INVERSIONES PERU" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">{activeTab === 'natural' ? 'DNI' : 'RUC'}</label>
                          <input type="text" value={formData.documento} onChange={e => updateForm('documento', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase focus:ring-2 focus:ring-primary/20 outline-none" placeholder="45672831" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Fecha de {activeTab === 'natural' ? 'Nacimiento' : 'Constitución'}</label>
                          <input type="date" value={formData.fecha} onChange={e => updateForm('fecha', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none" />
                        </div>

                        {activeTab === 'juridica' ? (
                          <>
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo de persona jurídica</label>
                              <select value={formData.tipoPJ} onChange={e => updateForm('tipoPJ', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none">
                                <option>SAC</option>
                                <option>SA</option>
                                <option>SRL</option>
                                <option>EIRL</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Tamaño de empresa</label>
                              <select value={formData.tamano} onChange={e => updateForm('tamano', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none">
                                <option>Micro</option>
                                <option>Pequeña</option>
                                <option>Mediana</option>
                                <option>Grande</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">CIIU</label>
                              <select value={formData.ciiu} onChange={e => updateForm('ciiu', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none">
                                <option>Comercio</option>
                                <option>Servicios</option>
                                <option>Manufactura</option>
                                <option>Construcción</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Composición accionaria</label>
                              <select value={formData.accionistas} onChange={e => updateForm('accionistas', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none">
                                <option>Bajo Riesgo</option>
                                <option>Presencia PEP</option>
                                <option>Socios Extranjeros</option>
                              </select>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Ocupación / Profesión</label>
                              <select value={formData.ocupacion} onChange={e => updateForm('ocupacion', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none">
                                <option>Empleado</option>
                                <option>Independiente</option>
                                <option>Funcionario Público</option>
                                <option>Estudiante</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Persona Natural con Negocio</label>
                              <select value={formData.naturalNegocio} onChange={e => updateForm('naturalNegocio', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none">
                                <option>No</option>
                                <option>Sí</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Cliente Sensible</label>
                              <select value={formData.clienteSensible} onChange={e => updateForm('clienteSensible', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none">
                                <option>No</option>
                                <option>Sí (PEPs/Vulnerables)</option>
                              </select>
                            </div>
                          </>
                        )}
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Sujeto obligado</label>
                          <select value={formData.sujetoObligado} onChange={e => updateForm('sujetoObligado', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none">
                            <option>No</option>
                            <option>Sí</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Transacción Estimada (S/. Mensual)</label>
                          <input type="number" value={formData.transaccion} onChange={e => updateForm('transaccion', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0.00" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="size-2 bg-orange-400 rounded-full" />
                        Zona Geográfica
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Nacional</label>
                          <select value={formData.zonaNacional} onChange={e => updateForm('zonaNacional', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none">
                            <option>Perú - Lima</option>
                            <option>Perú - Provincia</option>
                            <option>Extranjero</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Residencia</label>
                          <select value={formData.zonaResidencia} onChange={e => updateForm('zonaResidencia', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none">
                            <option>Bajo Riesgo</option>
                            <option>Medio Riesgo</option>
                            <option>Alto Riesgo</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Oficina Atenci&oacute;n</label>
                          <select value={formData.zonaOficina} onChange={e => updateForm('zonaOficina', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none">
                            <option>Principal</option>
                            <option>Sucursal Norte</option>
                            <option>Sucursal Sur</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="size-2 bg-green-400 rounded-full" />
                        Producto y Otros Factores
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Producto / Servicio</label>
                          <select value={formData.producto} onChange={e => updateForm('producto', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none">
                            <option>Crédito Personal</option>
                            <option>Cuenta Ahorros</option>
                            <option>Inversión</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Moneda</label>
                          <select value={formData.moneda} onChange={e => updateForm('moneda', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none">
                            <option>Soles (PEN)</option>
                            <option>Dólares (USD)</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Origen Fondos</label>
                          <select value={formData.origenFondos} onChange={e => updateForm('origenFondos', e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none">
                            <option>Salarios</option>
                            <option>Actividad Com.</option>
                            <option>Ahorros</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8 bg-slate-50 p-8 rounded-[2rem] border border-slate-200 flex flex-col items-center justify-center text-center">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultado Evaluaci&oacute;n</p>
                      {calculatedRisk ? (
                        <div className="space-y-4 animate-in zoom-in-95">
                          <div className={`px-6 py-2 rounded-full ${calculatedRisk.color} text-white font-black text-sm uppercase tracking-widest inline-block`}>
                            RIESGO: {calculatedRisk.label}
                          </div>
                          <p className="text-5xl font-black text-slate-900">{calculatedRisk.score}</p>
                        </div>
                      ) : (
                        <div className="py-8">
                          <span className="material-symbols-outlined text-slate-200 text-6xl">pending</span>
                          <p className="text-[10px] font-bold text-slate-300 uppercase mt-4">Esperando ejecuci&oacute;n</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleEjecutar}
                      disabled={isExecuting}
                      className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${isExecuting ? 'bg-slate-300 text-slate-500' : 'bg-[#6D28D9] text-white hover:bg-[#5B21B6] shadow-xl shadow-violet-200'}`}
                    >
                      {isExecuting ? (
                        <>
                          <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Ejecutando...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">play_arrow</span>
                          Ejecutar Scoring
                        </>
                      )}
                    </button>

                    <div className="w-full h-px bg-slate-200 my-4" />

                    <div className="grid grid-cols-2 gap-3 w-full">
                      <button className="py-3 border border-slate-200 text-slate-400 font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-colors">Cancelar</button>
                      <button className="py-3 bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all">Guardar</button>
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-12 border-t border-slate-100">
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observaciones Administrativas</label>
                    <textarea rows={4} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/10 outline-none" placeholder="Ingrese notas adicionales aquí..." />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Scoring Consultados Recientemente</h3>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    <input type="text" placeholder="BUSCAR..." className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none w-48" />
                  </div>
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
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Riesgo</th>
                      <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {history.map(h => (
                      <tr key={h.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5 text-[10px] font-bold text-slate-400">#{String(h.id).padStart(5, '0')}</td>
                        <td className="px-8 py-5">
                          <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[8px] font-black rounded uppercase">{h.tipo}</span>
                        </td>
                        <td className="px-8 py-5 text-[11px] font-black text-slate-800 uppercase">{h.nombre}</td>
                        <td className="px-8 py-5 text-[11px] font-bold text-slate-500 tabular-nums">{h.doc}</td>
                        <td className="px-8 py-5 text-[10px] font-bold text-slate-400">{h.fecha}</td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <div className={`size-2 rounded-full ${h.riesgo === 'BAJO' ? 'bg-green-500' : 'bg-orange-500'}`} />
                            <span className={`text-[10px] font-black ${h.riesgo === 'BAJO' ? 'text-green-600' : 'text-orange-600'}`}>{h.riesgo} ({h.score})</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-all">
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>{/* end flex-1 overflow-y-auto */}

          <footer className="py-4 bg-white border-t border-slate-100 flex items-center justify-center shrink-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center px-4">
              @COPYRIGHT; DESARROLLADO POR EL AREA DE TI - INFORMAPERU. TODOS LOS DERECHOS RESERVADOS 2026
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
