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
    <div style={{ fontFamily: 'SF Pro Display, system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif', backgroundColor: '#f5f5f7', minHeight: '100vh', color: '#1d1d1f' }}>

      {/* ── Global Nav (Apple black bar) ─────────────────── */}
      <nav style={{ backgroundColor: '#000000', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <img src="/logo-informaPeru.jpg" alt="INFORMA PERÚ" style={{ height: 22, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          </button>
          {modules.filter(m => m.enabled).map(m => (
            <button key={m.name} onClick={() => navigate(m.href)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: location.pathname === m.href ? '#ffffff' : 'rgba(255,255,255,0.6)', fontSize: 12, letterSpacing: '-0.12px', padding: '0 4px', fontFamily: 'inherit', transition: 'color 0.15s' }}>
              {m.name}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '4px 10px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#2997ff' }}>database</span>
            <span style={{ fontSize: 12, color: '#ffffff', fontWeight: 600, letterSpacing: '-0.12px' }}>{tokens ?? '–'}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '-0.08px' }}>búsquedas</span>
          </div>
          <button
            onClick={() => { localStorage.removeItem('auth_token'); window.location.href = '/'; }}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 12, borderRadius: 8, padding: '5px 12px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, transition: 'background 0.15s' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>logout</span>
            <span style={{ letterSpacing: '-0.12px' }}>Salir</span>
          </button>
        </div>
      </nav>

      {/* ── Sub-nav frosted strip (Apple product nav) ─────── */}
      <div style={{ backgroundColor: 'rgba(245,245,247,0.88)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.08)', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', position: 'sticky', top: 44, zIndex: 90 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#1d1d1f' }}>manage_search</span>
          <span style={{ fontSize: 21, fontWeight: 600, color: '#1d1d1f', letterSpacing: '0.231px' }}>Listas Negativas</span>
          {isSearching && (
            <span style={{ background: 'rgba(0,102,204,0.1)', color: '#0066cc', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 9999, letterSpacing: '-0.12px' }}>
              {results.length} resultado{results.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isSearching && total > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button disabled={page <= 1} onClick={() => consultar(page - 1)}
                style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9999, border: 'none', background: page <= 1 ? 'transparent' : 'rgba(0,0,0,0.05)', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.3 : 1 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
              </button>
              <span style={{ fontSize: 12, color: '#7a7a7a', letterSpacing: '-0.12px', minWidth: 40, textAlign: 'center' }}>pág. {page}</span>
              <button disabled={page * 10 >= total} onClick={() => consultar(page + 1)}
                style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9999, border: 'none', background: page * 10 >= total ? 'transparent' : 'rgba(0,0,0,0.05)', cursor: page * 10 >= total ? 'not-allowed' : 'pointer', opacity: page * 10 >= total ? 0.3 : 1 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
              </button>
            </div>
          )}
          <button
            onClick={() => { setShowProfileDropdown(!showProfileDropdown); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0066cc', color: '#ffffff', border: 'none', borderRadius: 9999, padding: '8px 18px', fontSize: 14, fontWeight: 400, cursor: 'pointer', letterSpacing: '-0.224px', fontFamily: 'inherit', transition: 'background 0.15s', position: 'relative' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>tune</span>
            Herramientas
          </button>

          {/* Profile/Tools dropdown */}
          {showProfileDropdown && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowProfileDropdown(false)} />
              <div style={{ position: 'absolute', top: 96, right: 32, width: 260, background: '#ffffff', borderRadius: 18, boxShadow: '0 4px 32px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden', zIndex: 200 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#7a7a7a', letterSpacing: '-0.12px', margin: 0 }}>Herramientas</p>
                </div>
                <div style={{ padding: 8 }}>
                  <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, border: 'none', background: 'none', cursor: 'pointer', color: '#0066cc', fontSize: 14, fontFamily: 'inherit', letterSpacing: '-0.224px', textAlign: 'left', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f7')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    onClick={() => { setShowProfileDropdown(false); (document.getElementById('massive-upload') as HTMLInputElement)?.click(); }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>upload_file</span>
                    Carga Masiva Excel
                  </button>
                  <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, border: 'none', background: 'none', cursor: 'pointer', color: '#1d1d1f', fontSize: 14, fontFamily: 'inherit', letterSpacing: '-0.224px', textAlign: 'left', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f7')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    onClick={() => { setShowProfileDropdown(false); setIsScheduleModalOpen(true); }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>calendar_add_on</span>
                    Programar Búsqueda
                  </button>
                  <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, border: 'none', background: 'none', cursor: 'pointer', color: '#1d1d1f', fontSize: 14, fontFamily: 'inherit', letterSpacing: '-0.224px', textAlign: 'left', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f7')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    onClick={() => { setShowProfileDropdown(false); setShowNotifDropdown(!showNotifDropdown); }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>notifications</span>
                    Alertas del Sistema
                    {notifications.length > 0 && (
                      <span style={{ marginLeft: 'auto', background: '#ff3b30', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 9999, padding: '1px 6px' }}>{notifications.length}</span>
                    )}
                  </button>
                  <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, border: 'none', background: 'none', cursor: 'pointer', color: '#0066cc', fontSize: 14, fontFamily: 'inherit', letterSpacing: '-0.224px', textAlign: 'left', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f7')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    onClick={() => { setShowProfileDropdown(false); downloadMassiveTemplate(); }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
                    Plantilla Excel
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Page canvas ───────────────────────────────────── */}
      <main style={{ maxWidth: 980, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Search form — white utility card */}
        <div style={{ background: '#ffffff', borderRadius: 18, border: '1px solid #e0e0e0', padding: 24, marginBottom: 32 }}>
          <h2 style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.374px', color: '#1d1d1f', margin: '0 0 4px' }}>Consultar Entidad</h2>
          <p style={{ fontSize: 17, fontWeight: 400, color: '#7a7a7a', letterSpacing: '-0.374px', margin: '0 0 24px', lineHeight: 1.47 }}>Busca personas naturales o jurídicas en las listas de sanciones y riesgo.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Nombres / Razón Social', placeholder: 'Ej: ALEJANDRO', value: qNombre, setter: setQNombre },
              { label: 'Apellido Paterno', placeholder: 'Ej: VAZQUEZ', value: qApePat, setter: setQApePat },
              { label: 'Apellido Materno', placeholder: 'Ej: RAMOS', value: qApeMat, setter: setQApeMat },
              { label: 'DNI / RUC', placeholder: '45672831', value: qDoc, setter: setQDoc },
            ].map(field => (
              <div key={field.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7a7a7a', letterSpacing: '-0.12px' }}>{field.label}</label>
                <input
                  value={field.value}
                  onChange={e => field.setter(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && consultar(1)}
                  placeholder={field.placeholder}
                  style={{ height: 44, borderRadius: 9999, border: '1px solid rgba(0,0,0,0.08)', padding: '0 20px', fontSize: 17, letterSpacing: '-0.374px', color: '#1d1d1f', background: '#f5f5f7', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                  onFocus={e => { e.target.style.borderColor = '#0066cc'; e.target.style.boxShadow = '0 0 0 3px rgba(0,102,204,0.1)'; e.target.style.background = '#fff'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.08)'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f5f5f7'; }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
            <button
              onClick={() => { setQNombre(''); setQApePat(''); setQApeMat(''); setQDoc(''); consultar(1); }}
              style={{ height: 44, padding: '0 22px', borderRadius: 9999, border: '1px solid #0066cc', background: 'transparent', color: '#0066cc', fontSize: 17, letterSpacing: '-0.374px', fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
              Limpiar
            </button>
            <button
              onClick={() => consultar(1)}
              style={{ height: 44, padding: '0 22px', borderRadius: 9999, border: 'none', background: '#0066cc', color: '#ffffff', fontSize: 17, letterSpacing: '-0.374px', fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0071e3')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0066cc')}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>search</span>
              Buscar
            </button>
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: '10px 16px', background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.2)', borderRadius: 11, color: '#ff3b30', fontSize: 14, fontWeight: 600, letterSpacing: '-0.224px' }}>
              {error}
            </div>
          )}
        </div>

        {/* Hidden file inputs */}
        <input id="massive-upload" type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleMassiveSearch(e.target.files[0]); }} />

        {/* Warning banner — no exact match */}
        {showExactMatchWarning && (
          <div style={{ background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.18)', borderRadius: 11, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="material-symbols-outlined" style={{ color: '#ff3b30', fontSize: 20 }}>info</span>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#ff3b30', letterSpacing: '-0.224px' }}>No se encontraron coincidencias exactas</p>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,59,48,0.7)', letterSpacing: '-0.12px' }}>Se muestran resultados similares a tu búsqueda</p>
              </div>
            </div>
            <button onClick={() => window.print()}
              style={{ background: '#ff3b30', color: '#fff', border: 'none', borderRadius: 9999, padding: '8px 18px', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 400, letterSpacing: '-0.224px', flexShrink: 0 }}>
              Descargar 0 resultados
            </button>
          </div>
        )}

        {/* Results section */}
        <div style={{ background: '#ffffff', borderRadius: 18, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
          {/* Section header */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ fontSize: 21, fontWeight: 600, letterSpacing: '0.231px', color: '#1d1d1f', margin: 0 }}>
                {isSearching ? 'Resultados Exactos' : 'Todos los Registros'}
              </h3>
              <span style={{ background: 'rgba(0,102,204,0.08)', color: '#0066cc', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 9999, letterSpacing: '-0.12px' }}>
                {isSearching ? results.length : total} registros
              </span>
            </div>
          </div>

          {loading ? <LoadingSkeleton /> : <ResultsTable isSearching={isSearching} data={results} onDetail={abrirDetalle} onPdf={exportarPDF} showWarning={false} />}
        </div>

        {/* Coincidences section */}
        {isSearching && coincidences.length > 0 && (
          <div style={{ background: '#ffffff', borderRadius: 18, border: '1px solid #e0e0e0', overflow: 'hidden', marginTop: 24, opacity: 0.75 }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e0e0e0' }} />
              <h3 style={{ fontSize: 17, fontWeight: 600, color: '#7a7a7a', margin: 0, letterSpacing: '-0.374px' }}>Sugerencias por Similitud</h3>
            </div>
            {loading ? <LoadingSkeleton /> : <ResultsTable isSearching={isSearching} data={coincidences} onDetail={abrirDetalle} onPdf={exportarPDF} showWarning={false} />}
          </div>
        )}

        {/* Footer */}
        <footer style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#7a7a7a', letterSpacing: '-0.12px', margin: 0 }}>
            © 2026 INFORMAPERU — Área de TI. Todos los derechos reservados.
          </p>
        </footer>
      </main>

      {/* ── Detail Modal ──────────────────────────────────── */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fafafc', width: '100%', maxWidth: 720, borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', border: '1px solid rgba(0,0,0,0.08)' }}>

            {/* Modal header — Apple near-black */}
            <div style={{ background: '#1d1d1f', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ color: '#ffffff', fontSize: 18 }}>folder_shared</span>
                <h3 style={{ color: '#ffffff', fontSize: 17, fontWeight: 600, letterSpacing: '-0.374px', margin: 0 }}>Expediente de Incumplimiento</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)}
                style={{ width: 32, height: 32, borderRadius: 9999, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              </button>
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              {loadingDetail ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 240, gap: 12 }}>
                  <div className="animate-spin" style={{ width: 36, height: 36, border: '3px solid #e0e0e0', borderTopColor: '#0066cc', borderRadius: '50%' }} />
                  <p style={{ fontSize: 12, color: '#7a7a7a', letterSpacing: '-0.12px', margin: 0 }}>Construyendo expediente...</p>
                </div>
              ) : detailData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Entity identity card */}
                  <div style={{ background: '#ffffff', borderRadius: 18, border: '1px solid #e0e0e0', padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 52, height: 52, background: '#1d1d1f', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ color: '#ffffff', fontSize: 28 }}>account_circle</span>
                      </div>
                      <div>
                        <h4 style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.374px', margin: '0 0 2px', textTransform: 'uppercase' }}>
                          {detailData.natural ? `${detailData.natural.nombre} ${detailData.natural.ape_pat} ${detailData.natural.ape_mat}` : detailData.juridica?.razon_social}
                        </h4>
                        <p style={{ fontSize: 12, color: '#7a7a7a', margin: 0, letterSpacing: '-0.12px' }}>
                          DOC: <span style={{ color: '#0066cc', fontWeight: 600 }}>{detailData.entidad.documento}</span> · ID #{String(detailData.entidad.id).padStart(5, '0')}
                        </p>
                      </div>
                    </div>
                    <div style={{ background: '#f5f5f7', borderRadius: 11, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e0e0e0' }}>
                      <span className="material-symbols-outlined" style={{ color: '#34c759', fontSize: 16 }}>database</span>
                      <div>
                        <p style={{ fontSize: 10, color: '#7a7a7a', margin: 0, letterSpacing: '-0.08px' }}>Búsquedas restantes</p>
                        <p style={{ fontSize: 17, fontWeight: 600, color: '#0066cc', margin: 0, letterSpacing: '-0.374px' }}>{tokens}</p>
                      </div>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ background: '#ffffff', borderRadius: 18, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                      <div style={{ padding: '10px 16px', background: '#f5f5f7', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0066cc', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.12px' }}>Información Personal</span>
                      </div>
                      <div style={{ padding: 0 }}>
                        <InfoRow label="Tipo Entidad" value={detailData.entidad.tipo_entidad} />
                        {detailData.natural && <InfoRow label="Género" value={detailData.natural.sexo === 'M' ? 'Masculino' : detailData.natural.sexo === 'F' ? 'Femenino' : '-'} />}
                        <InfoRow label="Ubicación" value={`${detailData.entidad.distrito}, ${detailData.entidad.departamento}`} />
                        <InfoRow label="Dirección" value={detailData.entidad.direccion} />
                        <InfoRow label="Rubro" value={detailData.entidad.rubro} />
                      </div>
                    </div>
                    <div style={{ background: '#ffffff', borderRadius: 18, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                      <div style={{ padding: '10px 16px', background: '#f5f5f7', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e0e0e0', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.12px' }}>Atributos Extendidos</span>
                      </div>
                      <div style={{ padding: 0 }}>
                        {detailData.extension.natural ? (
                          <>
                            <InfoRow label="Fec. Nacimiento" value={detailData.extension.natural.fec_nac ? new Date(detailData.extension.natural.fec_nac).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : ''} />
                            <InfoRow label="Nacionalidad" value={detailData.extension.natural.nacionalidad} />
                            <InfoRow label="Instrucción" value={detailData.extension.natural.grado_instruccion} />
                          </>
                        ) : detailData.extension.juridica ? (
                          <>
                            <InfoRow label="Representante" value="PENDIENTE DE CARGA" />
                            <InfoRow label="Capital Social" value="ALTO" />
                          </>
                        ) : (
                          <div style={{ padding: 24, textAlign: 'center' }}>
                            <p style={{ fontSize: 12, color: '#7a7a7a', margin: 0, fontStyle: 'italic' }}>Datos no disponibles</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Risk lists */}
                  {detailData.manchas.length > 0 ? (
                    <div style={{ background: '#ffffff', borderRadius: 18, border: '1px solid rgba(255,59,48,0.25)', overflow: 'hidden' }}>
                      <div style={{ padding: '10px 16px', background: '#ff3b30', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,59,48,0.4)' }}>
                        <span className="material-symbols-outlined" style={{ color: '#ffffff', fontSize: 16 }}>warning</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#ffffff', letterSpacing: '-0.12px' }}>Listas de Riesgo</span>
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                          <thead>
                            <tr style={{ background: '#f5f5f7' }}>
                              {['Lista', 'Descripción / Motivo', 'Enlace'].map(h => (
                                <th key={h} style={{ padding: '12px 20px', fontSize: 11, fontWeight: 600, color: '#7a7a7a', letterSpacing: '-0.12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {detailData.manchas.map((m: any) => (
                              <tr key={m.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '12px 20px' }}>
                                  <span style={{ background: 'rgba(255,59,48,0.08)', color: '#ff3b30', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 9999, border: '1px solid rgba(255,59,48,0.2)', letterSpacing: '-0.12px' }}>
                                    {m.tipo_lista_nombre || 'S/N'}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 20px' }}>
                                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '-0.374px' }}>{m.descripcion}</p>
                                  <p style={{ fontSize: 11, color: '#7a7a7a', margin: 0, letterSpacing: '-0.12px' }}>
                                    Registrado: {m.fecha_registro && !m.fecha_registro.startsWith('1970') && !m.fecha_registro.startsWith('1969') ? new Date(m.fecha_registro).toLocaleDateString('es-PE') : 'Pendiente'}
                                  </p>
                                </td>
                                <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                                  {m.link ? (
                                    <a href={m.link} target="_blank" rel="noreferrer" style={{ color: '#0066cc', fontSize: 13, fontWeight: 400, letterSpacing: '-0.374px', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                                      Oficial <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span>
                                    </a>
                                  ) : (
                                    <span style={{ fontSize: 11, color: '#e0e0e0' }}>Sin link</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: '#ffffff', borderRadius: 18, border: '1px solid rgba(52,199,89,0.3)', overflow: 'hidden' }}>
                      <div style={{ padding: '10px 16px', background: '#34c759', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ color: '#ffffff', fontSize: 16 }}>verified_user</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#ffffff', letterSpacing: '-0.12px' }}>Listas de Riesgo</span>
                      </div>
                      <div style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#34c759' }}>verified_user</span>
                        <p style={{ fontSize: 17, fontWeight: 600, color: '#34c759', margin: 0, letterSpacing: '-0.374px' }}>Entidad Conforme</p>
                        <p style={{ fontSize: 14, color: 'rgba(52,199,89,0.7)', margin: 0, letterSpacing: '-0.224px', maxWidth: 320 }}>No se registran antecedentes negativos en las bases consultadas.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div style={{ padding: '16px 24px', background: '#f5f5f7', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
              <button onClick={() => setIsModalOpen(false)}
                style={{ height: 44, padding: '0 22px', borderRadius: 9999, border: '1px solid #0066cc', background: 'transparent', color: '#0066cc', fontSize: 17, letterSpacing: '-0.374px', fontFamily: 'inherit', cursor: 'pointer' }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Cancelar
              </button>
              <button onClick={() => exportarPDF(detailData)}
                style={{ height: 44, padding: '0 22px', borderRadius: 9999, border: 'none', background: '#0066cc', color: '#ffffff', fontSize: 17, letterSpacing: '-0.374px', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#0071e3')}
                onMouseLeave={e => (e.currentTarget.style.background = '#0066cc')}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                Descargar Expediente
              </button>
            </div>
          </div>
        </div>
      )}

      {isScheduleModalOpen && <ScheduleSearchModal onClose={() => setIsScheduleModalOpen(false)} onScheduled={() => { setIsScheduleModalOpen(false); fetchTokens(); }} />}
    </div>
  );
}
function ResultsTable({ data, onDetail, onPdf, isSearching, showWarning = false }: { data: any[], onDetail: (id: number) => void, onPdf: (e: any) => void, isSearching: boolean, showWarning?: boolean }) {
  return (
    <div>
      {data.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
            <thead>
              <tr style={{ background: '#f5f5f7', borderBottom: '1px solid #e0e0e0' }}>
                {isSearching && <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#7a7a7a', letterSpacing: '-0.12px', textAlign: 'left' }}>Coincidencia</th>}
                <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#7a7a7a', letterSpacing: '-0.12px', textAlign: 'left' }}>Identidad / Razón Social</th>
                <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#7a7a7a', letterSpacing: '-0.12px', textAlign: 'left' }}>Identificación</th>
                <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#7a7a7a', letterSpacing: '-0.12px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={`${r.tipo}-${r.id}-${r.documento}`} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,102,204,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {isSearching && (
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 600, letterSpacing: '-0.12px',
                        background: r.match_count >= 4 ? 'rgba(0,102,204,0.08)' : r.match_count === 3 ? 'rgba(0,122,255,0.08)' : r.match_count === 2 ? 'rgba(255,149,0,0.08)' : 'rgba(255,59,48,0.08)',
                        color: r.match_count >= 4 ? '#0066cc' : r.match_count === 3 ? '#007aff' : r.match_count === 2 ? '#ff9500' : '#ff3b30',
                        border: `1px solid ${r.match_count >= 4 ? 'rgba(0,102,204,0.2)' : r.match_count === 3 ? 'rgba(0,122,255,0.2)' : r.match_count === 2 ? 'rgba(255,149,0,0.2)' : 'rgba(255,59,48,0.2)'}`
                      }}>
                        {r.match_count >= 4 ? 'Total' : r.match_count === 3 ? 'Alta' : r.match_count === 2 ? 'Media' : 'Baja'}
                      </span>
                    </td>
                  )}
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.224px', textTransform: 'uppercase', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.tipo === 'natural' ? `${r.nombre || ''} ${r.ape_pat || ''} ${r.ape_mat || ''}` : r.nombre}
                    </div>
                    <div style={{ fontSize: 11, color: '#7a7a7a', letterSpacing: '-0.12px', marginTop: 2 }}>#{String(r.id).padStart(5, '0')} · {r.tipo === 'natural' ? 'Natural' : 'Jurídica'}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.224px', fontVariantNumeric: 'tabular-nums' }}>{r.documento}</div>
                    <div style={{ fontSize: 11, color: '#7a7a7a', letterSpacing: '-0.12px', marginTop: 2 }}>{r.tipo_documento_nombre || 'Documento'}</div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => onDetail(r.id)}
                        style={{ height: 36, padding: '0 16px', borderRadius: 9999, border: 'none', background: '#0066cc', color: '#ffffff', fontSize: 14, fontWeight: 400, letterSpacing: '-0.224px', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#0071e3')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#0066cc')}
                        onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
                        onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>visibility</span>
                        Expediente
                      </button>
                      <button onClick={() => onPdf(r)} title="Descargar Ficha"
                        style={{ width: 36, height: 36, borderRadius: 9999, border: '1px solid rgba(0,0,0,0.08)', background: '#f5f5f7', color: '#7a7a7a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#0066cc'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#0066cc'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f5f5f7'; e.currentTarget.style.color = '#7a7a7a'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: '64px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#e0e0e0' }}>folder_open</span>
          <p style={{ fontSize: 14, color: '#cccccc', letterSpacing: '-0.224px', margin: 0 }}>Sin registros disponibles</p>
        </div>
      )}
    </div>
  );
}
function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: 12 }}>
      <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid #e0e0e0', borderTopColor: '#0066cc', borderRadius: '50%' }} />
      <p style={{ fontSize: 12, color: '#7a7a7a', letterSpacing: '-0.12px', margin: 0 }}>Procesando información...</p>
    </div>
  );
}
function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ padding: '10px 16px', background: '#f5f5f7', borderRight: '1px solid #f0f0f0', fontSize: 11, fontWeight: 600, color: '#7a7a7a', letterSpacing: '-0.12px', display: 'flex', alignItems: 'center' }}>
        {label}
      </div>
      <div style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.374px', display: 'flex', alignItems: 'center', textTransform: 'uppercase' }}>
        {value || '—'}
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
