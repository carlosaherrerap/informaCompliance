import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';
import { io } from "socket.io-client";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function SearchPage() {
  const [qNombre, setQNombre] = useState("");
  const [qApePat, setQApePat] = useState("");
  const [qApeMat, setQApeMat] = useState("");
  const [qDoc, setQDoc] = useState("");

  const [results, setResults] = useState<any[]>([]);
  const [coincidences, setCoincidences] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [userRole, setUserRole] = useState('user');

  const modules = [
    { name: "Listas Negativas", icon: "search", enabled: true, href: "/busqueda" },
    { name: "Matriz de Riesgos", icon: "grid_on", enabled: true, href: "/matriz-riesgos" },
    { name: "Scoring de Riesgo", icon: "trending_up", enabled: true, href: "/scoring" },
    { name: "Registro de Operaciones", icon: "assignment", enabled: true, href: "/registro-operaciones" },
    { name: "Canal de Denuncias", icon: "campaign", enabled: false, href: "/denuncias" },
    { name: "Mis Cursos", icon: "school", enabled: false, href: "/mis-cursos" },
    { name: "Administrador", icon: "admin_panel_settings", enabled: userRole === 'admin', href: "/load" },
  ];

  const navigate = useNavigate();
  const location = useLocation();

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

  function downloadMassiveTemplate() {
    const headers = ["nombres", "documento", "cargo", "rubros", "tipo_entidad"];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Busqueda");
    XLSX.writeFile(wb, "plantilla_busqueda_masiva.xlsx");
  }

  async function handleMassiveSearch(file: File) {
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          setError("EL EXCEL ESTÁ VACÍO");
          setLoading(false);
          return;
        }

        const token = localStorage.getItem("auth_token") || "";
        let allResults: any[] = [];

        for (const row of json) {
          // Fields: nombres, documento, cargo, rubros, tipo_entidad
          const params = new URLSearchParams({
            nombre: row.nombres || "",
            documento: row.documento || "",
            rubro: row.rubros || "",
            tipo_entidad: row.tipo_entidad || ""
          });

          const r = await fetch(`${apiUrl}/search?${params.toString()}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });

          if (r.ok) {
            const resData = await r.json();
            if (resData.results && resData.results.length > 0) {
              allResults = [...allResults, ...resData.results];
            }
          }
        }

        setResults(allResults);
        setCoincidences([]);
        setIsSearching(true);
        setTotal(allResults.length);
      } catch (err) {
        setError("ERROR AL PROCESAR EXCEL");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function consultar(newPage: number = 1) {
    setError(null);
    setLoading(true);
    const token = localStorage.getItem("auth_token") || "";
    try {
      const params = new URLSearchParams({
        nombre: qNombre,
        ape_pat: qApePat,
        ape_mat: qApeMat,
        documento: qDoc,
        page: newPage.toString()
      });

      const r = await fetch(`${apiUrl}/search?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (r.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login");
        return;
      }

      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "Error");
        return;
      }
      setResults(data.results || []);
      setCoincidences(data.coincidences || []);
      setIsSearching(data.isSearching || false);
      setTotal(data.total || 0);
      setPage(data.page || 1);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTokens();
    fetchNotifications();
    consultar(1); // Load all on mount

    const token = localStorage.getItem("auth_token") || "";
    if (token) {
      try {
        const payload: any = JSON.parse(atob(token.split(".")[1]));
        setUserRole(payload.role || 'user');
        const socket = io(apiUrl.replace("/api", "")); // Adjust if needed
        socket.emit("join", payload.uid);
        socket.on("notification", () => {
          fetchNotifications();
        });
        return () => { socket.disconnect(); };
      } catch { }
    }
  }, []);

  async function abrirDetalle(id: number) {
    setLoadingDetail(true);
    setIsModalOpen(true);
    setError(null);
    const token = localStorage.getItem("auth_token") || "";
    try {
      const r = await fetch(`${apiUrl}/entity/${id}/detail-access`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.status === 401) {
        navigate("/login");
        return;
      }
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "No se pudo acceder al detalle");
        setIsModalOpen(false);
        return;
      }
      setDetailData(data);
      setTokens(data.tokens_left);
    } catch {
      setError("Error al cargar detalles");
      setIsModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  }

  const getBase64ImageFromUrl = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const formatDateTime = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');
    return `${day}-${month}-${year} ${strHours}:${minutes}:${seconds} ${ampm}`;
  };

  const exportarPDF = async (entity: any) => {
    let fullData = entity;
    const token = localStorage.getItem("auth_token") || "";

    if (!entity.manchas || !entity.entidad) {
      try {
        const entityId = entity.id;
        if (entityId) {
          const r = await fetch(`${apiUrl}/entity/${entityId}/detail-access`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (r.ok) {
            fullData = await r.json();
          }
        }
      } catch (e) {
        console.error("Error fetching detail for PDF", e);
      }
    }

    const doc = new jsPDF();
    
    try {
      const logoBase64 = await getBase64ImageFromUrl("/logo-informaPeru.jpg");
      doc.addImage(logoBase64, 'JPEG', 14, 10, 48, 16);
    } catch (e) {
      console.warn("Could not load logo image for PDF", e);
    }

    let username = "Advisor Tools Comply";
    if (token) {
      try {
        const payload: any = JSON.parse(atob(token.split(".")[1]));
        if (payload.username) {
          username = payload.username;
        } else if (payload.email) {
          username = payload.email.split("@")[0];
        }
      } catch {}
    }

    const formattedDate = formatDateTime(new Date());

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Lista Negativa", 14, 38);

    doc.setFontSize(11);
    doc.setFont("Helvetica", "bold");
    doc.text("Usuario:", 14, 46);
    doc.setFont("Helvetica", "normal");
    doc.text(username, 32, 46);

    doc.setFont("Helvetica", "bold");
    doc.text("Fecha:", 14, 53);
    doc.setFont("Helvetica", "normal");
    doc.text(formattedDate, 28, 53);

    const ent = fullData.entidad || fullData;
    const isNatural = ent.tipo_entidad === 'natural' || ent.tipo === 'natural';
    
    const detailRows = [
      [
        `TIPO: ${isNatural ? 'N' : 'J'}`,
        `CARGO: ${ent.cargo || '-'}`
      ],
      [
        `APELLIDOS: ${isNatural ? `${fullData.natural?.ape_pat || ent.ape_pat || ""} ${fullData.natural?.ape_mat || ent.ape_mat || ""}`.trim().toUpperCase() : '-'}`,
        `FECHA DE REGISTRO/NACIMIENTO: ${fullData.extension?.natural?.fec_nac ? new Date(fullData.extension.natural.fec_nac).toLocaleDateString('es-PE').replace(/\//g, '-') : '-'}`
      ],
      [
        `NOMBRES: ${isNatural ? (fullData.natural?.nombre || ent.nombre || "").toUpperCase() : (fullData.juridica?.razon_social || ent.nombre || "").toUpperCase()}`,
        `LUGAR DE NACIMIENTO: ${fullData.extension?.natural?.nacionalidad || ent.distrito || '-'}`
      ],
      [
        `IDENTIFICACIÓN: ${ent.documento || '-'}`,
        `LISTA: ${fullData.manchas?.[0]?.tipo_lista_nombre || 'NINGUNA'}`
      ],
      [
        `DIRECCIÓN/PASAPORTE: ${ent.direccion || '-'}`,
        ''
      ]
    ];

    autoTable(doc, {
      startY: 60,
      head: [[{ content: 'DETALLE', colSpan: 2 }]],
      body: detailRows,
      theme: 'grid',
      headStyles: {
        fillColor: [50, 80, 142], // Brand Blue #32508E
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left',
      },
      bodyStyles: {
        textColor: [30, 41, 59], // slate-800
        fontSize: 8,
        fontStyle: 'bold',
        cellPadding: 3,
        lineColor: [226, 232, 240], // slate-200
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { cellWidth: 91 },
        1: { cellWidth: 91 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // slate-50
      }
    });

    const finalYOfFirstTable = (doc as any).lastAutoTable.finalY || 120;
    const obsRows: any[] = [];
    
    if (fullData.manchas && fullData.manchas.length > 0) {
      fullData.manchas.forEach((m: any, index: number) => {
        if (index > 0) {
          obsRows.push([{ content: '------------------------------------------------------------------------------------------', colSpan: 2, styles: { halign: 'center', textColor: [148, 163, 184] } }]);
        }
        obsRows.push([{ content: `DESCRIPCIÓN: ${m.descripcion || '-'}`, colSpan: 2 }]);
        obsRows.push([
          `ALIAS: ${m.alias || '-'}`,
          `LINK: ${m.link || '-'}`
        ]);
      });
    } else {
      obsRows.push([{ content: 'DESCRIPCIÓN: CONFORME. NO SE REGISTRAN ANTECEDENTES NEGATIVOS EN LAS BASES CONSULTADAS.', colSpan: 2 }]);
      obsRows.push([
        'ALIAS: -',
        'LINK: -'
      ]);
    }

    autoTable(doc, {
      startY: finalYOfFirstTable + 8,
      head: [[{ content: 'OBSERVACIONES', colSpan: 2 }]],
      body: obsRows,
      theme: 'grid',
      headStyles: {
        fillColor: [50, 80, 142], // Brand Blue #32508E
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left',
      },
      bodyStyles: {
        textColor: [30, 41, 59], // slate-800
        fontSize: 8,
        fontStyle: 'bold',
        cellPadding: 3,
        lineColor: [226, 232, 240], // slate-200
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { cellWidth: 91 },
        1: { cellWidth: 91 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // slate-50
      }
    });

    doc.save(`Ficha_${ent.documento}.pdf`);
  };

  const filledFieldsCount = [qNombre, qApePat, qApeMat, qDoc].filter(val => val.trim() !== "").length;
  const hasExactMatch = results.some(r => r.match_count >= filledFieldsCount);
  const showExactMatchWarning = isSearching && !hasExactMatch;

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="flex h-screen overflow-hidden relative">
        {/* Overlay mobile */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

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
              className="hidden lg:flex w-full items-center justify-center py-2 rounded-xl text-slate-500 hover:bg-white/5 hover:text-white transition-all mb-4"
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

                {modules.map((m) => (
                  <button
                    key={m.name}
                    disabled={!m.enabled}
                    onClick={() => navigate(m.href)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold uppercase text-[10px] tracking-wide text-slate-400 hover:text-white hover:border hover:border-white ${location.pathname === m.href ? 'border-2 border-white text-white' : 'border border-transparent'} ${!m.enabled ? 'opacity-50 cursor-not-allowed' : ''} ${isCollapsed ? 'justify-center' : ''}`}
                    style={{backgroundColor: 'transparent'}}
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

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-10 shrink-0 z-40 relative">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setIsSidebarOpen(true)}>
                <span className="material-symbols-outlined">menu</span>
              </button>
            </div>

            <div className="flex items-center gap-4 relative">
              {/* Tokens usage info in header */}
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="material-symbols-outlined text-primary text-xl">database</span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-primary uppercase leading-tight">{tokens ?? "-"}</span>
                  <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Busquedas</span>
                </div>
              </div>

              {/* Perfil Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-300 ${showProfileDropdown ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold'}`}
                >
                  <span className="material-symbols-outlined text-2xl">account_circle</span>
                  <span className="text-[10px] uppercase tracking-widest hidden sm:block">Mi Cuenta</span>
                  <span className={`material-symbols-outlined text-lg transition-transform duration-300 ${showProfileDropdown ? 'rotate-180' : ''}`}>expand_more</span>
                </button>

                {showProfileDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                    <div className="absolute right-0 mt-3 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Acciones y Herramientas</p>
                      </div>
                      <div className="p-2 space-y-1">
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-blue-600 hover:bg-blue-50 transition-colors font-bold uppercase text-[10px] tracking-wide text-left" onClick={() => { setShowProfileDropdown(false); }}>
                          <span className="material-symbols-outlined text-xl text-blue-500">verified</span>
                          <span>DDA (Ampliada)</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-green-600 hover:bg-green-50 transition-colors font-bold uppercase text-[10px] tracking-wide text-left" onClick={() => { setShowProfileDropdown(false); (document.getElementById('massive-upload') as HTMLInputElement)?.click(); }}>
                          <span className="material-symbols-outlined text-xl text-green-500">upload_file</span>
                          <span>Cargar Masiva</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold uppercase text-[10px] tracking-wide text-left" onClick={() => { setShowProfileDropdown(false); setIsScheduleModalOpen(true); }}>
                          <span className="material-symbols-outlined text-xl">calendar_add_on</span>
                          <span>Programar Búsqueda</span>
                        </button>

                        <div className="h-px bg-slate-100 my-2 mx-4" />

                        <button className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors font-bold uppercase text-[10px] tracking-wide" onClick={() => { setShowNotifDropdown(!showNotifDropdown); }}>
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-xl">notifications</span>
                            <span>Alertas Sistema</span>
                          </div>
                          {notifications.length > 0 && <span className="size-5 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full shadow-lg shadow-red-200">{notifications.length}</span>}
                        </button>

                        <button
                          className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-red-500 hover:bg-red-50 transition-colors font-bold uppercase text-[10px] tracking-[0.2em] mt-2 bg-red-50/30"
                          onClick={() => { localStorage.removeItem("auth_token"); navigate("/login"); }}
                        >
                          <span className="material-symbols-outlined text-xl">logout</span>
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8">
            <section>
              <div className="mb-6 text-center lg:text-left">
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Listas Negativas </h2>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 lg:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.15em]">Nombres / Razón Social</label>
                    <input className="input-partial-border rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-sm font-bold uppercase" placeholder="Ej: ALEJANDRO" value={qNombre} onChange={(e) => setQNombre(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.15em]">Apellido Paterno</label>
                    <input className="input-partial-border rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-sm font-bold uppercase" placeholder="Ej: VAZQUEZ" value={qApePat} onChange={(e) => setQApePat(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.15em]">Apellido Materno</label>
                    <input className="input-partial-border rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-sm font-bold uppercase" placeholder="Ej: RAMOS" value={qApeMat} onChange={(e) => setQApeMat(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.15em]">DNI / RUC</label>
                    <input className="input-partial-border rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-sm font-bold uppercase" placeholder="45672831" value={qDoc} onChange={(e) => setQDoc(e.target.value)} />
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                  <button className="px-6 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-2" onClick={() => { setQNombre(""); setQApePat(""); setQApeMat(""); setQDoc(""); consultar(1); }}>
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    Limpiar
                  </button>
                  <button className="px-10 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20" onClick={() => consultar(1)}>
                    <span className="material-symbols-outlined text-sm">search</span>
                    Buscar
                  </button>
                </div>
                {error && <div className="text-red-600 mt-3 text-xs font-bold uppercase p-3 bg-red-50 rounded-lg">{error}</div>}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black uppercase tracking-tight">{isSearching ? "Resultados Exactos" : "TODOS LOS RESULTADOS"}</h3>
                  <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">{isSearching ? results.length : total} REGISTROS</span>
                </div>
                {!isSearching && (
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
                    <button disabled={page <= 1} onClick={() => consultar(page - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 disabled:opacity-20 transition-colors">
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    <span className="text-[10px] font-black uppercase px-2">pg. {page}</span>
                    <button disabled={page * 10 >= total} onClick={() => consultar(page + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 disabled:opacity-20 transition-colors">
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto min-h-[200px]">
                {loading ? <LoadingSkeleton /> : <ResultsTable isSearching={isSearching} data={results} onDetail={abrirDetalle} onPdf={exportarPDF} showWarning={showExactMatchWarning} />}
              </div>

               {isSearching && coincidences.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="size-2 bg-slate-400 rounded-full"></div>
                    <h3 className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Sugerencias por Similitud</h3>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dotted border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto opacity-75 grayscale-[0.3]">
                    {loading ? <LoadingSkeleton /> : <ResultsTable isSearching={isSearching} data={coincidences} onDetail={abrirDetalle} onPdf={exportarPDF} showWarning={false} />}
                  </div>
                </div>
              )}
            </section>

            <footer className="py-10 bg-white border-t border-slate-100 flex items-center justify-center mt-12">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center max-w-2xl px-4">
                @COPYRIGHT; DESARROLLADO POR EL AREA DE TI - INFORMAPERU. TODOS LOS DERECHOS RESERVADOS 2026
              </p>
            </footer>
          </div>
        </main>
      </div>

      {/* DETALLES MODAL */}
      {
        isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-slate-100 dark:bg-slate-950 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200 dark:border-slate-800">
              <div className="px-6 py-4 bg-[#32508E] dark:bg-slate-900 border-b border-[#243d70] dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-white text-xl">folder_shared</span>
                  <h3 className="font-black text-white text-xs sm:text-sm tracking-wider uppercase">EXPEDIENTE DE INCUMPLIMIENTO</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="size-9 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                  <span className="material-symbols-outlined font-bold text-lg">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {loadingDetail ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-b-primary"></div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Construyendo Informe...</p>
                  </div>
                ) : detailData && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="size-14 bg-[#32508E] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#32508E]/20">
                          <span className="material-symbols-outlined text-3xl">account_circle</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-black uppercase text-slate-900 dark:text-white leading-tight">
                            {detailData.natural ? `${detailData.natural.nombre} ${detailData.natural.ape_pat} ${detailData.natural.ape_mat}` : detailData.juridica?.razon_social}
                          </h4>
                          <p className="text-slate-700 dark:text-slate-300 font-extrabold tracking-wider text-[10px] uppercase mt-1">
                            DOC: <span className="text-[#32508E] font-black">{detailData.entidad.documento}</span> • ID: #{String(detailData.entidad.id).padStart(5, '0')}
                          </p>
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3 self-start sm:self-center">
                        <span className="material-symbols-outlined text-green-600 text-lg">database</span>
                        <div>
                          <p className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none mb-1">Búsquedas Restantes</p>
                          <p className="text-sm font-black text-[#32508E] dark:text-blue-400 leading-none">{tokens}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* INFORMACION PERSONAL */}
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                          <span className="size-2 rounded-full bg-[#32508E]"></span>
                          <h5 className="font-black text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-widest">INFORMACIÓN PERSONAL</h5>
                        </div>
                        <div className="p-4 space-y-1.5 flex-1 bg-white dark:bg-slate-900">
                          <InfoRow label="Tipo Entidad" value={detailData.entidad.tipo_entidad} />
                          {detailData.natural && <InfoRow label="Género" value={detailData.natural.sexo === 'M' ? 'Masculino' : detailData.natural.sexo === 'F' ? 'Femenino' : '-'} />}
                          <InfoRow label="Ubicación" value={`${detailData.entidad.distrito}, ${detailData.entidad.departamento}`} />
                          <InfoRow label="Dirección" value={detailData.entidad.direccion} />
                          <InfoRow label="Rubro" value={detailData.entidad.rubro} />
                        </div>
                      </div>

                      {/* ATRIBUTOS EXTENDIDOS */}
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                          <span className="size-2 rounded-full bg-slate-600"></span>
                          <h5 className="font-black text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-widest">Atributos Extendidos</h5>
                        </div>
                        <div className="p-4 space-y-1.5 flex-1 bg-white dark:bg-slate-900">
                          {detailData.extension.natural ? (
                            <>
                              <InfoRow label="Fec. Nacimiento" value={
                                detailData.extension.natural.fec_nac
                                  ? new Date(detailData.extension.natural.fec_nac).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
                                  : ''
                              } />
                              <InfoRow label="Nacionalidad" value={detailData.extension.natural.nacionalidad} />
                              <InfoRow label="Instrucción" value={detailData.extension.natural.grado_instruccion} />
                            </>
                          ) : detailData.extension.juridica ? (
                            <>
                              <InfoRow label="Representante" value="PENDIENTE DE CARGA" />
                              <InfoRow label="Capital Social" value="ALTO" />
                            </>
                          ) : (
                            <div className="flex h-full items-center justify-center py-6">
                              <p className="text-[10px] text-slate-400 italic font-bold uppercase">Datos no disponibles</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {detailData.manchas.length > 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-950/40 shadow-sm overflow-hidden">
                          <div className="px-4 py-2.5 bg-[#EB3237] border-b border-red-650 flex items-center gap-2">
                            <span className="material-symbols-outlined text-white text-base">warning</span>
                            <h5 className="font-black text-white uppercase text-[10px] tracking-widest">LISTAS DE RIESGO</h5>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                  <th className="px-6 py-4 text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Lista</th>
                                  <th className="px-6 py-4 text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Descripción / Motivo</th>
                                  <th className="px-6 py-4 text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 text-right">Enlace</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {detailData.manchas.map((m: any) => (
                                  <tr key={m.id} className="hover:bg-red-50/40 dark:hover:bg-red-950/10 transition-colors">
                                    <td className="px-6 py-4">
                                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[8px] font-black rounded uppercase border border-red-200 dark:border-red-900/55">
                                        {m.tipo_lista_nombre || 'S/N'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <p className="text-[11px] text-slate-900 dark:text-slate-100 font-extrabold leading-tight uppercase">{m.descripcion}</p>
                                      <p className="text-[8px] text-slate-500 dark:text-slate-400 uppercase mt-1.5 font-bold">
                                        Registrado el: {
                                          m.fecha_registro && !m.fecha_registro.startsWith('1970') && !m.fecha_registro.startsWith('1969')
                                            ? new Date(m.fecha_registro).toLocaleDateString('es-PE')
                                            : 'PENDIENTE'
                                        }
                                      </p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      {m.link ? (
                                        <a href={m.link} target="_blank" className="inline-flex items-center gap-1 text-[9px] text-[#32508E] font-black hover:underline uppercase">
                                          Oficial <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                        </a>
                                      ) : (
                                        <span className="text-[8px] font-black text-slate-400 uppercase">Sin link</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-green-200 dark:border-green-950/40 shadow-sm overflow-hidden">
                          <div className="px-4 py-2.5 bg-green-600 border-b border-green-700 flex items-center gap-2">
                            <span className="material-symbols-outlined text-white text-base">verified_user</span>
                            <h5 className="font-black text-white uppercase text-[10px] tracking-widest">LISTAS DE RIESGO</h5>
                          </div>
                          <div className="flex flex-col items-center justify-center p-10 text-center gap-2">
                            <span className="material-symbols-outlined text-4xl text-green-500 animate-bounce">verified_user</span>
                            <p className="text-xs font-black text-green-700 dark:text-green-400 uppercase tracking-widest">¡Entidad Conforme!</p>
                            <p className="text-[10px] text-green-600/80 font-bold max-w-sm uppercase">No se registran antecedentes negativos en las bases consultadas hoy.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-200/50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors order-2 sm:order-1">CANCELAR</button>
                <button onClick={() => exportarPDF(detailData)} className="px-10 py-3 bg-[#32508E] hover:bg-[#243d70] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-3 order-1 sm:order-2 transition-all">
                  <span className="material-symbols-outlined text-lg">download</span>
                  DESCARGAR
                </button>
              </div>
            </div>
          </div>
        )
      }

      <style>{`
        .sidebar-item-active { background-color: rgba(15, 73, 189, 0.08); border-right: 4px solid #0f49bd; color: #0f49bd; box-shadow: inset -4px 0 12px -8px #0f49bd; }
        .input-partial-border { border: 2px solid #edf2f7; border-bottom: 3px solid #0f49bd; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
        .input-partial-border:focus { outline: none; border-color: #0f49bd; background-color: white; transform: translateY(-1px); box-shadow: 0 12px 20px -10px rgba(15, 73, 189, 0.15); }
      `}</style>
      {isScheduleModalOpen && <ScheduleSearchModal onClose={() => setIsScheduleModalOpen(false)} onScheduled={() => { setIsScheduleModalOpen(false); fetchTokens(); }} />}
    </div >
  );
}

function ResultsTable({ data, onDetail, onPdf, isSearching, showWarning = false }: { data: any[], onDetail: (id: number) => void, onPdf: (e: any) => void, isSearching: boolean, showWarning?: boolean }) {
  return (
    <div className="space-y-6">
      {showWarning && (
        <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 rounded-r-2xl animate-in fade-in slide-in-from-top-2 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="size-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-600">
              <span className="material-symbols-outlined">info</span>
            </div>
            <div>
              <h4 className="text-[11px] font-black text-red-700 dark:text-red-400 uppercase tracking-widest">No se encontraron resultados exactos</h4>
              <p className="text-[10px] text-red-600/70 font-bold uppercase tracking-tighter">No hay coincidencias al 100% con los criterios buscados</p>
            </div>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200 dark:shadow-none">
            <span className="material-symbols-outlined text-xs">download</span>
            Descargar 0 Resultados
          </button>
        </div>
      )}

      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                {isSearching && <th className="px-6 py-5 text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest w-40">Nivel de Coincidencia</th>}
                <th className="px-6 py-5 text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Identidad / Razón</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Identificación</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest text-right">Consulta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.map((r) => (
                <tr key={`${r.tipo}-${r.id}-${r.documento}`} className="hover:bg-blue-50/30 dark:hover:bg-primary/5 transition-all group">
                  {isSearching && (
                    <td className="px-6 py-6 border-l-4 border-transparent group-hover:border-primary transition-all">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${r.match_count >= 4 ? 'bg-primary/10 text-primary border border-primary/20' :
                        r.match_count === 3 ? 'bg-blue-100 text-blue-600 border border-blue-200' :
                          r.match_count === 2 ? 'bg-yellow-100 text-yellow-600 border border-yellow-200' :
                            'bg-red-50 text-red-600 border border-red-200'
                        }`}>
                        {r.match_count >= 4 ? 'COINCIDENCIA TOTAL' :
                          r.match_count === 3 ? 'COINCIDENCIA ALTA' :
                            r.match_count === 2 ? 'COINCIDENCIA MEDIA' :
                              'COINCIDENCIA BAJA'}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-6">
                    <div className="font-black text-slate-900 dark:text-white uppercase truncate max-w-[280px] text-xs transition-colors group-hover:text-primary">
                      {r.tipo === "natural" ? `${r.nombre || ""} ${r.ape_pat || ""} ${r.ape_mat || ""}` : r.nombre}
                    </div>
                    <div className="text-[9px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">#{String(r.id).padStart(5, "0")} • {r.tipo === "natural" ? "Natural" : "Jurídica"}</div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-400 tabular-nums">{r.documento}</span>
                      <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{r.tipo_documento_nombre || 'Documento'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex justify-end items-center gap-3">
                      <button onClick={() => onDetail(r.id)} className="flex items-center gap-2 px-4 py-2 bg-[#32508E] hover:bg-[#243d70] text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md shadow-blue-200 dark:shadow-none">
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        Expediente
                      </button>
                      <button onClick={() => onPdf(r)} title="Descargar Ficha" className="size-9 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white rounded-xl text-slate-400 transition-all">
                        <span className="material-symbols-outlined text-lg">download</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-4xl text-slate-200">folder_open</span>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sin registros disponibles para mostrar</p>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-100 border-b-primary"></div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Procesando información...</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="grid grid-cols-2 text-xs border-b border-slate-200 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
      <div className="px-4 py-2 border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest text-[9px] flex items-center">
        {label}
      </div>
      <div className="px-4 py-2 font-black text-slate-900 dark:text-white uppercase text-xs flex items-center">
        {value || "---"}
      </div>
    </div>
  );
}
function ScheduleSearchModal({ onClose, onScheduled }: { onClose: () => void, onScheduled: () => void }) {
  const [tab, setTab] = useState<'manual' | 'excel'>('manual');
  const [formData, setFormData] = useState({ fullName: '', tipo_entidad: 'natural' });
  const [scheduledList, setScheduledList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchScheduledList() {
    const token = localStorage.getItem("auth_token") || "";
    try {
      const r = await fetch(`${apiUrl}/schedule`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) setScheduledList(await r.json());
    } catch { }
  }

  useEffect(() => {
    fetchScheduledList();
  }, []);

  async function removeScheduled(id: number) {
    const token = localStorage.getItem("auth_token") || "";
    try {
      const r = await fetch(`${apiUrl}/schedule/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) fetchScheduledList();
    } catch { }
  }

  async function handleSaveManual() {
    if (!formData.fullName) return setError("EL NOMBRE ES OBLIGATORIO");
    setLoading(true);
    try {
      // Store full name directly as requested
      const payload = {
        nombres: formData.fullName,
        tipo_entidad: formData.tipo_entidad,
        documento: "" // Could be extended if needed
      };

      const token = localStorage.getItem("auth_token") || "";
      const r = await fetch(`${apiUrl}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (r.ok) {
        setFormData({ fullName: '', tipo_entidad: 'natural' });
        fetchScheduledList();
      } else setError("ERROR AL GUARDAR");
    } catch { setError("ERROR DE CONEXIÓN"); }
    finally { setLoading(false); }
  }

  async function handleExcelUpload(file: File) {
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(sheet);

        const token = localStorage.getItem("auth_token") || "";
        for (const row of json) {
          await fetch(`${apiUrl}/schedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              nombres: row.nombres,
              documento: row.documento,
              cargo: row.cargo,
              rubros: row.rubros,
              tipo_entidad: row.tipo_entidad || 'natural'
            })
          });
        }
        fetchScheduledList();
      } catch { setError("ERROR AL PROCESAR EXCEL"); }
      finally { setLoading(false); }
    };
    reader.readAsArrayBuffer(file);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-black text-xl uppercase tracking-tight">Programar Búsqueda</h3>
          <button onClick={onClose} className="size-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><span className="material-symbols-outlined">close</span></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="p-2 bg-slate-50 dark:bg-slate-800/50 flex gap-1 mb-8 rounded-xl border border-slate-200 dark:border-slate-800">
            <button className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${tab === 'manual' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400'}`} onClick={() => setTab('manual')}>Ingreso Manual</button>
            <button className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${tab === 'excel' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400'}`} onClick={() => setTab('excel')}>Base Programada (Excel)</button>
          </div>

          {tab === 'manual' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombres / Razón Social</label>
                  <input className="input-partial-border rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-sm font-bold uppercase" placeholder="Ej: ALEJANDRO VAZQUEZ RAMOS" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</label>
                  <select className="input-partial-border rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-sm font-bold uppercase" value={formData.tipo_entidad} onChange={e => setFormData({ ...formData, tipo_entidad: e.target.value })}>
                    <option value="natural">Persona Natural</option>
                    <option value="juridica">Persona Jurídica</option>
                  </select>
                </div>
              </div>
              <button disabled={loading} onClick={handleSaveManual} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 disabled:opacity-50">
                {loading ? "Registrando..." : "Guardar en Base Programada"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] gap-4 bg-slate-50/50 dark:bg-slate-800/20">
              <span className="material-symbols-outlined text-4xl text-slate-300">upload_file</span>
              <div className="text-center">
                <p className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">Subir Plantilla Excel</p>
                <p className="text-[10px] font-medium text-slate-400 uppercase mt-1">Sube tu listado para monitoreo automático</p>
              </div>
              <button disabled={loading} className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase shadow-sm hover:shadow-md transition-all" onClick={() => (document.getElementById('excel-schedule') as HTMLInputElement)?.click()}>
                {loading ? "Procesando..." : "Seleccionar Archivo"}
                <input id="excel-schedule" type="file" accept=".xlsx,.xls" className="hidden" onChange={e => e.target.files?.[0] && handleExcelUpload(e.target.files[0])} />
              </button>
            </div>
          )}

          {error && <p className="text-red-500 text-[10px] font-black uppercase mt-4 text-center">{error}</p>}

          <div className="mt-12 space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-slate-200 pl-3">Entidades en Seguimiento</h4>
            <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="bg-white dark:bg-slate-900">
                    <th className="px-4 py-3 font-black uppercase border-b border-slate-100 dark:border-slate-800">Entidad</th>
                    <th className="px-4 py-3 font-black uppercase border-b border-slate-100 dark:border-slate-800">Tipo</th>
                    <th className="px-4 py-3 font-black uppercase border-b border-slate-100 dark:border-slate-800 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {scheduledList.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic font-bold">Sin entidades programadas</td></tr>
                  ) : scheduledList.map(item => (
                    <tr key={item.id} className="hover:bg-white dark:hover:bg-slate-800 transition-colors group">
                      <td className="px-4 py-3 font-black text-slate-700 dark:text-slate-300 uppercase">
                        {item.nombres}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-400 uppercase">{item.tipo_entidad}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {item.encontrado ? (
                            <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-black rounded uppercase text-[8px] animate-pulse">ENCONTRADO</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-black rounded uppercase text-[8px]">PENDIENTE</span>
                          )}
                          <button onClick={() => removeScheduled(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
