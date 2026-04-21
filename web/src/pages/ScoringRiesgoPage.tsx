import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function ScoringRiesgoPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Search part
  const [qDoc, setQDoc] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Scoring part
  const [score, setScore] = useState(50);
  const [sustento, setSustento] = useState("");
  const [categoria, setCategoria] = useState("MEDIO");

  const fetchHistory = async () => {
    const token = localStorage.getItem("auth_token");
    try {
      const r = await fetch(`${apiUrl}/scoring`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) setHistory(await r.json());
    } catch {}
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSearch = async () => {
    if (!qDoc) return;
    setIsSearching(true);
    const token = localStorage.getItem("auth_token");
    try {
      const r = await fetch(`${apiUrl}/search?documento=${qDoc}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await r.json();
      if (data.results && data.results.length > 0) {
        setSearchResult(data.results[0]);
      } else {
        alert("Entidad no encontrada");
        setSearchResult(null);
      }
    } catch {
      alert("Error en búsqueda");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveScoring = async () => {
    if (!searchResult) return;
    setLoading(true);
    const token = localStorage.getItem("auth_token");
    try {
      const r = await fetch(`${apiUrl}/scoring`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id_entidad: searchResult.id,
          puntaje: score,
          sustento,
          categoria
        })
      });
      if (r.ok) {
        alert("Scoring guardado");
        setSearchResult(null);
        setQDoc("");
        setSustento("");
        setScore(50);
        fetchHistory();
      }
    } catch {
      alert("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (cat: string) => {
    if (cat === "ALTO") return "text-red-500 bg-red-50";
    if (cat === "MEDIO") return "text-orange-500 bg-orange-50";
    return "text-green-500 bg-green-50";
  };

  return (
    <div className="font-display bg-slate-50 dark:bg-background-dark min-h-screen">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar (simplified) */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="p-6">
            <h1 className="font-black text-xl uppercase text-primary tracking-tighter">INFORMAPERU</h1>
          </div>
          <nav className="px-4 space-y-1">
            <Link to="/home" className="flex items-center gap-3 px-3 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
              <span className="material-symbols-outlined">home</span>
              <span className="text-sm font-bold uppercase">Inicio</span>
            </Link>
            <Link to="/scoring" className="flex items-center gap-3 px-3 py-3 bg-primary/10 text-primary rounded-xl font-bold uppercase text-sm">
              <span className="material-symbols-outlined">trending_up</span>
              <span>Scoring de Riesgo</span>
            </Link>
          </nav>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8">
            <div className="flex items-center gap-3">
              <button className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
                <span className="material-symbols-outlined">menu</span>
              </button>
              <h2 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Scoring de Riesgo</h2>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Seccion Nuevo Scoring */}
              <section className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50">
                <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">add_circle</span>
                  Nueva Evaluación
                </h3>

                <div className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento de Identidad (DNI/RUC)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={qDoc} 
                        onChange={e => setQDoc(e.target.value)}
                        placeholder="Ej: 1045678321"
                        className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700 font-bold"
                      />
                      <button 
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="px-6 py-2 bg-primary text-white font-black rounded-xl text-xs uppercase hover:bg-blue-700 transition-all shadow-lg shadow-primary/20"
                      >
                        {isSearching ? "..." : "Buscar"}
                      </button>
                    </div>
                  </div>

                  {searchResult && (
                    <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-primary/20 space-y-6 animate-in fade-in slide-in-from-top-4">
                      <div className="flex items-center gap-4">
                        <div className="size-12 bg-primary text-white rounded-2xl flex items-center justify-center">
                          <span className="material-symbols-outlined">person</span>
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase">{searchResult.nombre || searchResult.razon_social}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{searchResult.documento}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] font-black uppercase tracking-widest">Nivel de Riesgo (0-100)</label>
                            <span className="text-xl font-black text-primary">{score}</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" max="100" 
                            value={score} 
                            onChange={e => {
                              const v = parseInt(e.target.value);
                              setScore(v);
                              if (v > 75) setCategoria("ALTO");
                              else if (v > 30) setCategoria("MEDIO");
                              else setCategoria("BAJO");
                            }}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                          <div className="flex justify-between mt-2">
                            <span className="text-[8px] font-black text-green-500 uppercase">Seguro</span>
                            <span className="text-[8px] font-black text-orange-500 uppercase">Precaución</span>
                            <span className="text-[8px] font-black text-red-500 uppercase">Crítico</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest">Sustento / Calificación</label>
                          <textarea 
                            value={sustento}
                            onChange={e => setSustento(e.target.value)}
                            rows={3}
                            placeholder="Describa el motivo de esta calificación..."
                            className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-medium"
                          />
                        </div>

                        <button 
                          onClick={handleSaveScoring}
                          disabled={loading}
                          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all"
                        >
                          {loading ? "Guardando..." : "Registrar Calificación"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Historial */}
              <section className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 flex flex-col">
                <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">history</span>
                  Historial de Evaluaciones
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {history.length === 0 ? (
                    <div className="text-center py-20 text-slate-300">
                      <span className="material-symbols-outlined text-4xl block mb-2">analytics</span>
                      <p className="text-[10px] font-black uppercase tracking-widest">No hay registros aún</p>
                    </div>
                  ) : history.map(item => (
                    <div key={item.id} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all group">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black uppercase group-hover:text-primary transition-colors">{item.entidad_nombre}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{item.documento}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black ${getScoreColor(item.categoria)}`}>
                          {item.categoria} ({item.puntaje})
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-3 italic line-clamp-2">{item.sustento}</p>
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <span className="text-[8px] text-slate-400 font-bold uppercase">{new Date(item.fecha_creacion).toLocaleDateString()}</span>
                        <button className="text-[8px] font-black text-primary uppercase hover:underline">Ver Detalle</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
