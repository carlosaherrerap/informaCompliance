import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function CanalDenunciasPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [denuncias, setDenuncias] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Search, Pagination and Rows Per Page
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Header stats and notifications
  const [tokens, setTokens] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Detail Modal State
  const [selectedDenuncia, setSelectedDenuncia] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const modules = [
    { name: "Listas Negativas", icon: "search", enabled: true, href: "/busqueda" },
    { name: "Matriz de Riesgos", icon: "grid_on", enabled: true, href: "/matriz-riesgos" },
    { name: "Scoring de Riesgo", icon: "trending_up", enabled: true, href: "/scoring" },
    { name: "Registro de Operaciones", icon: "assignment", enabled: true, href: "/registro-operaciones" },
    { name: "Canal de Denuncias", icon: "campaign", enabled: true, href: "/denuncias" },
    { name: "Mis Cursos", icon: "school", enabled: false, href: "/mis-cursos" },
    { name: "Administrador", icon: "admin_panel_settings", enabled: userRole === 'admin', href: "/load" },
  ];

  async function fetchTokens() {
    const token = localStorage.getItem("auth_token") || "";
    if (!token) return;
    try {
      const r = await fetch(`${apiUrl}/tokens`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        const data = await r.json();
        setTokens(data.current);
      }
    } catch { }
  }

  async function fetchNotifications() {
    const token = localStorage.getItem("auth_token") || "";
    if (!token) return;
    try {
      const r = await fetch(`${apiUrl}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        const data = await r.json();
        setNotifications(data);
      }
    } catch { }
  }

  async function markNotificationRead(id: number) {
    const token = localStorage.getItem("auth_token") || "";
    try {
      await fetch(`${apiUrl}/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { }
  }

  const fetchDenuncias = async () => {
    const token = localStorage.getItem("auth_token");
    setLoading(true);
    try {
      const r = await fetch(`${apiUrl}/denuncias`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        const data = await r.json();
        setDenuncias(data);
      }
    } catch { }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserRole(payload.role || "user");
      
      // Fetch initial details
      fetchTokens();
      fetchNotifications();
      fetchDenuncias();

      const socket = io(apiUrl.replace("/api", ""));
      socket.emit("join", payload.uid);
      socket.on("notification", () => {
        fetchNotifications();
      });
      return () => { socket.disconnect(); };
    } catch { }
  }, []);

  const updateStatus = async (id: number, status: string) => {
    const token = localStorage.getItem("auth_token");
    try {
      const r = await fetch(`${apiUrl}/denuncias/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ estado: status })
      });
      if (r.ok) {
        fetchDenuncias();
        if (selectedDenuncia && selectedDenuncia.id === id) {
          // Update the open modal state as well
          setSelectedDenuncia((prev: any) => ({
            ...prev,
            estado: status,
            fecha_cierre: status === "CERRADO" ? new Date().toISOString() : null
          }));
        }
      }
    } catch { }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECIBIDO':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-black uppercase rounded">Recibido</span>;
      case 'EN PROCESO':
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-[10px] font-black uppercase rounded">En Proceso</span>;
      case 'CERRADO':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded">Cerrado</span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-black uppercase rounded">{status}</span>;
    }
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return "—";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "—";
      return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return "—";
    }
  };

  // Filter complaints based on search input (checks ID, causa, relacion, receptor and detail)
  const filteredDenuncias = denuncias.filter(d => {
    const term = searchTerm.toLowerCase();
    return (
      String(d.id).includes(term) ||
      String(d.causa || "").toLowerCase().includes(term) ||
      String(d.relacion_empresa || "").toLowerCase().includes(term) ||
      String(d.receptor || "").toLowerCase().includes(term) ||
      String(d.detalle || "").toLowerCase().includes(term) ||
      String(d.titulo || "").toLowerCase().includes(term)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredDenuncias.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredDenuncias.slice(indexOfFirstRow, indexOfLastRow);

  return (
    <div className="flex h-screen overflow-hidden bg-[#eef2f6] font-display dark:bg-[#101622]">
      
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
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
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-10 shrink-0 z-40 relative">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setIsSidebarOpen(true)}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <button onClick={() => navigate('/home')} className="hover:text-primary transition-colors">Inicio</button>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-slate-700">Canal de Denuncias</span>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Tokens info */}
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="material-symbols-outlined text-primary text-xl">database</span>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-primary uppercase leading-tight">{tokens ?? "-"}</span>
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Busquedas</span>
              </div>
            </div>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifDropdown(!showNotifDropdown); setShowProfileDropdown(false); }}
                className={`relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-300 ${showNotifDropdown ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
              >
                <span className="material-symbols-outlined text-xl">notifications</span>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 size-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                    <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Alertas del Sistema</p>
                        {notifications.length > 0 && (
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5">{notifications.length} sin leer</p>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => { notifications.forEach(n => markNotificationRead(n.id)); }}
                          className="text-[9px] font-black text-primary hover:text-blue-700 uppercase tracking-widest transition-colors"
                        >
                          Marcar todas
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                          <span className="material-symbols-outlined text-3xl text-slate-200">notifications_off</span>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sin alertas pendientes</p>
                        </div>
                      ) : notifications.map((n: any) => (
                        <button
                          key={n.id}
                          onClick={() => { markNotificationRead(n.id); setShowNotifDropdown(false); }}
                          className="w-full text-left px-5 py-3.5 hover:bg-slate-50 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="size-2 rounded-full bg-primary mt-1.5 shrink-0 group-hover:bg-blue-700 transition-colors" />
                            <div>
                              <p className="text-[11px] font-black text-slate-800 uppercase leading-tight">Coincidencia detectada</p>
                              {n.ent_doc && <p className="text-[9px] text-slate-500 font-bold mt-0.5">Doc: {n.ent_doc}</p>}
                              <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                                {new Date(n.fecha_enviado).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowNotifDropdown(false); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-300 ${showProfileDropdown ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold'}`}
              >
                <span className="material-symbols-outlined text-2xl">account_circle</span>
                <span className="text-[10px] uppercase tracking-widest hidden sm:block">Mi Cuenta</span>
                <span className={`material-symbols-outlined text-lg transition-transform duration-300 ${showProfileDropdown ? 'rotate-180' : ''}`}>expand_more</span>
              </button>

              {showProfileDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                      <p className="text-xs font-semibold text-slate-500">Acciones y herramientas</p>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <button
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-primary hover:bg-primary/5 transition-colors text-sm font-medium text-left"
                        onClick={() => { setShowProfileDropdown(false); navigate('/perfil'); }}
                      >
                        <i className="bi bi-person-fill text-primary text-base w-4" />
                        Mi Perfil
                      </button>
                      <button
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors text-sm font-medium text-left"
                        onClick={() => { setShowProfileDropdown(false); localStorage.removeItem("auth_token"); window.location.href = '/login'; }}
                      >
                        <i className="bi bi-box-arrow-right text-base w-4" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
          
          {/* Main Card (Image 1 style) */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
            
            {/* Box Header */}
            <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Denuncias registradas</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {userRole === 'admin' ? "Bandeja de gestión ética administrativa" : "Seguimiento de sus reportes enviados"}
                </p>
              </div>

              {/* Botón Nueva Denuncia que abre en _blank */}
              <a
                href="/denunciar"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-opacity-95 transition-all shadow-lg shadow-primary/20 shrink-0"
              >
                <span>+ Denuncia</span>
              </a>
            </div>

            {/* Table Filters */}
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span>Mostrar</span>
                <select
                  value={rowsPerPage}
                  onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>registros</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Buscar:</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all w-full sm:w-64"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th className="px-6 py-4 font-black text-slate-700 text-[10px] uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 font-black text-slate-700 text-[10px] uppercase tracking-wider">Incidencia</th>
                    <th className="px-6 py-4 font-black text-slate-700 text-[10px] uppercase tracking-wider">Causa De La Denuncia</th>
                    <th className="px-6 py-4 font-black text-slate-700 text-[10px] uppercase tracking-wider">Relación Con La Empresa</th>
                    <th className="px-6 py-4 font-black text-slate-700 text-[10px] uppercase tracking-wider">Fecha de Creación</th>
                    <th className="px-6 py-4 font-black text-slate-700 text-[10px] uppercase tracking-wider">Fecha de Cierre</th>
                    <th className="px-6 py-4 font-black text-slate-700 text-[10px] uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 font-black text-slate-700 text-[10px] uppercase tracking-wider text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-slate-400 italic">
                        Cargando reportes...
                      </td>
                    </tr>
                  ) : currentRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-semibold italic">
                        No hay datos disponibles
                      </td>
                    </tr>
                  ) : currentRows.map((d: any) => (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-black text-slate-700">#{d.id}</td>
                      <td className="px-6 py-4 font-bold text-slate-800 uppercase max-w-xs truncate">
                        {d.titulo || d.detalle || "Denuncia"}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600 uppercase">{d.causa || "—"}</td>
                      <td className="px-6 py-4 font-semibold text-slate-600 uppercase">{d.relacion_empresa || "—"}</td>
                      <td className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest">{formatDate(d.fecha_creacion)}</td>
                      <td className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest">{formatDate(d.fecha_cierre)}</td>
                      <td className="px-6 py-4">{getStatusBadge(d.estado)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => { setSelectedDenuncia(d); setIsDetailModalOpen(true); }}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                            title="Ver detalles"
                          >
                            <span className="material-symbols-outlined text-base">visibility</span>
                          </button>
                          
                          {userRole === 'admin' && d.estado !== 'CERRADO' && (
                            <>
                              {d.estado === 'RECIBIDO' && (
                                <button
                                  onClick={() => updateStatus(d.id, 'EN PROCESO')}
                                  className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                  title="Iniciar investigación"
                                >
                                  <span className="material-symbols-outlined text-base">work_history</span>
                                </button>
                              )}
                              <button
                                onClick={() => updateStatus(d.id, 'CERRADO')}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                  title="Cerrar denuncia"
                              >
                                <span className="material-symbols-outlined text-base">check_circle</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs font-semibold text-slate-400 uppercase">
                Mostrando registros del {filteredDenuncias.length > 0 ? indexOfFirstRow + 1 : 0} al {Math.min(indexOfLastRow, filteredDenuncias.length)} de un total de {filteredDenuncias.length} registros
              </p>
              
              <div className="flex items-center gap-3">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black uppercase text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-xs font-bold text-slate-700">
                  Página {currentPage} de {totalPages || 1}
                </span>
                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black uppercase text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>

          </div>

          {/* Footer */}
          <footer className="py-10 bg-white border-t border-slate-200 flex items-center justify-center mt-6">
            <p className="text-[10px] font-bold text-slate-500 tracking-widest text-center px-4">
              @Copyright; Desarrollado por el área de TI-InformaPerú. Todos los derechos reservados 2026
            </p>
          </footer>

        </div>
      </main>

      {/* ── DETAIL MODAL ── */}
      {isDetailModalOpen && selectedDenuncia && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl border border-slate-200 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Detalles de denuncia #{selectedDenuncia.id}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Estado actual: {selectedDenuncia.estado}
                </p>
              </div>
              <button
                onClick={() => { setIsDetailModalOpen(false); setSelectedDenuncia(null); }}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-700">
              
              {/* Causa & Relación */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Causa de la denuncia</p>
                  <p className="text-xs font-bold text-slate-800 uppercase mt-1">{selectedDenuncia.causa || "—"}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Relación con la empresa</p>
                  <p className="text-xs font-bold text-slate-800 uppercase mt-1">{selectedDenuncia.relacion_empresa || "—"}</p>
                </div>
              </div>

              {/* Hechos */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Descripción de los hechos</p>
                <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap">{selectedDenuncia.detalle || "—"}</p>
              </div>

              {/* Receptor & Evidencia */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">person</span>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Receptor asignado</p>
                    <p className="text-xs font-bold text-slate-800 uppercase mt-0.5">{selectedDenuncia.receptor || "—"}</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-600 text-xl">folder_zip</span>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Documentación / Evidencia</p>
                    {selectedDenuncia.evidencia_url ? (
                      <a
                        href={selectedDenuncia.evidencia_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mt-0.5"
                      >
                        Ver evidencia <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                      </a>
                    ) : (
                      <p className="text-xs font-semibold text-slate-400 mt-0.5">Ninguna cargada</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Involucrados */}
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Personas / Empresas Involucradas</p>
                {selectedDenuncia.involucrados && selectedDenuncia.involucrados.length > 0 ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-3 font-bold text-slate-500 uppercase text-[9px]">PN/PJ</th>
                          <th className="p-3 font-bold text-slate-500 uppercase text-[9px]">Nombre</th>
                          <th className="p-3 font-bold text-slate-500 uppercase text-[9px]">Documento</th>
                          <th className="p-3 font-bold text-slate-500 uppercase text-[9px]">Rol</th>
                          <th className="p-3 font-bold text-slate-500 uppercase text-[9px]">Cargo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedDenuncia.involucrados.map((inv: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/20">
                            <td className="p-3 font-bold text-slate-600 uppercase text-[10px]">{inv.tipo}</td>
                            <td className="p-3 font-bold text-slate-700">{inv.nombre || "—"}</td>
                            <td className="p-3 font-semibold text-slate-500">{inv.documento || "—"}</td>
                            <td className="p-3 font-semibold text-slate-600">{inv.rol || "—"}</td>
                            <td className="p-3 font-semibold text-slate-600">{inv.cargo || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 font-semibold italic bg-slate-50 p-4 rounded-2xl border border-slate-200">Sin personas involucradas.</p>
                )}
              </div>

              {/* Datos del denunciante */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Datos del denunciante</p>
                {selectedDenuncia.anonimo ? (
                  <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-slate-400">visibility_off</span>
                    El denunciante solicitó que este reporte sea anónimo.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nombre</p>
                      <p className="text-xs font-bold text-slate-800 uppercase mt-0.5">{selectedDenuncia.denunciante_nombre || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Documento</p>
                      <p className="text-xs font-bold text-slate-800 uppercase mt-0.5">{selectedDenuncia.denunciante_documento || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Teléfono</p>
                      <p className="text-xs font-bold text-slate-800 uppercase mt-0.5">{selectedDenuncia.denunciante_contacto || selectedDenuncia.denunciante_telefono || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedDenuncia.denunciante_email || "—"}</p>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => { setIsDetailModalOpen(false); setSelectedDenuncia(null); }}
                className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-100 transition-all"
              >
                Cerrar
              </button>
              
              {userRole === 'admin' && selectedDenuncia.estado !== 'CERRADO' && (
                <>
                  {selectedDenuncia.estado === 'RECIBIDO' && (
                    <button
                      onClick={() => updateStatus(selectedDenuncia.id, 'EN PROCESO')}
                      className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-orange-600 transition-all shadow-md"
                    >
                      Investigar
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(selectedDenuncia.id, 'CERRADO')}
                    className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-green-700 transition-all shadow-md"
                  >
                    Cerrar Caso
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
