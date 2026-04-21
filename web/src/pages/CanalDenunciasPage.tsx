import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function CanalDenunciasPage() {
  const [userRole, setUserRole] = useState("user");
  const [view, setView] = useState<"form" | "admin">("form");
  const [loading, setLoading] = useState(false);
  const [denuncias, setDenuncias] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    anonimo: true,
    nombre: "",
    contacto: "",
    titulo: "",
    detalle: "",
    evidencia_url: ""
  });

  const fetchDenuncias = async () => {
    const token = localStorage.getItem("auth_token");
    try {
      const r = await fetch(`${apiUrl}/denuncias`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) setDenuncias(await r.json());
    } catch {}
  };

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole(payload.role);
        if (payload.role === "admin") {
          setView("admin");
          fetchDenuncias();
        }
      } catch {}
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch(`${apiUrl}/denuncias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (r.ok) {
        alert("Denuncia enviada correctamente. Gracias por su compromiso ético.");
        setFormData({ anonimo: true, nombre: "", contacto: "", titulo: "", detalle: "", evidencia_url: "" });
      }
    } catch {
      alert("Error al enviar");
    } finally {
      setLoading(false);
    }
  };

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
      if (r.ok) fetchDenuncias();
    } catch {}
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'RECIBIDO': return 'bg-blue-100 text-blue-600';
      case 'EN PROCESO': return 'bg-orange-100 text-orange-600';
      case 'CERRADO': return 'bg-green-100 text-green-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="font-display bg-slate-50 dark:bg-background-dark min-h-screen">
      <div className="flex h-screen overflow-hidden">
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="p-6">
            <h1 className="font-black text-xl uppercase text-primary tracking-tighter">INFORMAPERU</h1>
          </div>
          <nav className="px-4 space-y-1">
            <Link to="/home" className="flex items-center gap-3 px-3 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
              <span className="material-symbols-outlined">home</span>
              <span className="text-sm font-bold uppercase">Inicio</span>
            </Link>
            <Link to="/denuncias" className="flex items-center gap-3 px-3 py-3 bg-primary/10 text-primary rounded-xl font-bold uppercase text-sm">
              <span className="material-symbols-outlined">campaign</span>
              <span>Canal Ético</span>
            </Link>
          </nav>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8">
            <div className="flex items-center gap-3">
              <button className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
                <span className="material-symbols-outlined">menu</span>
              </button>
              <h2 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Canal de Denuncias</h2>
            </div>
            {userRole === 'admin' && (
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button onClick={() => setView("form")} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${view === 'form' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400'}`}>Enviar</button>
                <button onClick={() => setView("admin")} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${view === 'admin' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400'}`}>Bandeja</button>
              </div>
            )}
          </header>

          <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            {view === "form" ? (
              <div className="max-w-2xl mx-auto">
                <section className="bg-white dark:bg-slate-900 p-8 lg:p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50">
                  <div className="mb-10 text-center">
                    <div className="size-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-4xl">gavel</span>
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Formulario de Denuncia</h3>
                    <p className="text-slate-500 text-sm mt-2 font-medium">Su reporte es confidencial y protege la integridad de la organización.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <input 
                        type="checkbox" 
                        id="anon" 
                        checked={formData.anonimo} 
                        onChange={e => setFormData({...formData, anonimo: e.target.checked})}
                        className="size-5 accent-primary" 
                      />
                      <label htmlFor="anon" className="text-xs font-black uppercase cursor-pointer">Denuncia Anónima</label>
                    </div>

                    {!formData.anonimo && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in zoom-in-95">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo</label>
                          <input className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 font-bold text-sm" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: JUAN PEREZ" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto (WhatsApp/Tel)</label>
                          <input className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 font-bold text-sm" value={formData.contacto} onChange={e => setFormData({...formData, contacto: e.target.value})} placeholder="+51 999..." />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título del Reporte</label>
                      <input required className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 font-bold text-sm" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} placeholder="Ej: Sospecha de lavado de activos" />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle de los Hechos</label>
                      <textarea required rows={5} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 font-medium text-sm" value={formData.detalle} onChange={e => setFormData({...formData, detalle: e.target.value})} placeholder="Describa lo ocurrido con la mayor cantidad de detalles posible..." />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evidencia (Link/Drive)</label>
                      <input className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 font-bold text-sm" value={formData.evidencia_url} onChange={e => setFormData({...formData, evidencia_url: e.target.value})} placeholder="URL a fotos o documentos" />
                    </div>

                    <button disabled={loading} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-red-200 dark:shadow-none hover:bg-red-700 transition-all">
                      {loading ? "Enviando..." : "Enviar Denuncia"}
                    </button>
                  </form>
                </section>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-black uppercase">Bandeja de Denuncias</h3>
                  <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">{denuncias.length} REPORTES</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {denuncias.map(d => (
                    <div key={d.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-sm hover:shadow-xl transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${getStatusColor(d.estado)}`}>
                          {d.estado}
                        </span>
                        <span className="text-[8px] text-slate-400 font-black uppercase">#{d.id}</span>
                      </div>
                      <h4 className="font-black text-sm uppercase mb-1">{d.titulo}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">
                        {d.anonimo ? '👤 ANÓNIMO' : `👤 ${d.denunciante_nombre}`}
                      </p>
                      <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl text-[11px] font-medium text-slate-600 dark:text-slate-400 italic mb-4 line-clamp-4">
                        "{d.detalle}"
                      </div>
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex gap-2">
                          <button onClick={() => updateStatus(d.id, 'EN PROCESO')} className="size-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center hover:bg-orange-100 transition-all" title="Investigar">
                            <span className="material-symbols-outlined text-sm">visibility</span>
                          </button>
                          <button onClick={() => updateStatus(d.id, 'CERRADO')} className="size-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center hover:bg-green-100 transition-all" title="Cerrar">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                          </button>
                        </div>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{new Date(d.fecha_creacion).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {denuncias.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No se han recibido denuncias aún.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
