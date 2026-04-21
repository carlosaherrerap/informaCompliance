import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function ReporteOperacionesPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("auth_token");
      try {
        const r = await fetch(`${apiUrl}/operaciones/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (r.ok) setStats(await r.json());
      } catch {}
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-20 text-center font-black uppercase text-xs animate-pulse">Cargando Analítica...</div>;

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
          </nav>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8">
            <div className="flex items-center gap-3">
              <button className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
                <span className="material-symbols-outlined">menu</span>
              </button>
              <h2 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Reporte de Operaciones</h2>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
              <span className="material-symbols-outlined text-sm">download</span>
              Exportar Todo
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Operaciones</p>
                <p className="text-3xl font-black">{stats?.summary?.[0]?.total_count || 0}</p>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-green-500 font-bold">
                  <span className="material-symbols-outlined text-xs">trending_up</span>
                  +12.5% este mes
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Volumen Total (PEN)</p>
                <p className="text-3xl font-black">S/ {Number(stats?.summary?.find((s:any)=>s.tipo_moneda==='PEN')?.total_volume || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Volumen Total (USD)</p>
                <p className="text-3xl font-black">$ {Number(stats?.summary?.find((s:any)=>s.tipo_moneda==='USD')?.total_volume || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Oficinas Activas</p>
                <p className="text-3xl font-black">{stats?.byOffice?.length || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* By Office table */}
              <section className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50">
                <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">store</span>
                  Volumen por Oficina
                </h3>
                <div className="space-y-4">
                  {stats?.byOffice?.map((off:any, idx:number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-xs font-black uppercase">{off.oficina}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{off.count} Operaciones</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black uppercase">S/ {Number(off.total).toLocaleString()}</p>
                        <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${Math.min(100, (off.total / 10000) * 100)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!stats?.byOffice || stats.byOffice.length === 0) && (
                    <div className="text-center py-20 text-slate-300 uppercase text-[10px] font-black">Sin datos registrados</div>
                  )}
                </div>
              </section>

              {/* Monthly Overview Mock */}
              <section className="bg-slate-900 text-white p-8 rounded-[3rem] relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-6 opacity-60">Resumen Semanal</h3>
                  <div className="flex items-end gap-2 h-48">
                    {[34, 56, 89, 45, 67, 100, 78].map((v, i) => (
                      <div key={i} className="flex-1 group relative">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {v}% CAP
                        </div>
                        <div className="w-full bg-primary/20 rounded-t-lg transition-all group-hover:bg-primary" style={{ height: `${v}%` }}></div>
                        <div className="text-[8px] font-black opacity-30 uppercase mt-2 text-center">
                          {['L','M','X','J','V','S','D'][i]}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span>Tendencia General</span>
                    <span className="text-green-400">+4.2%</span>
                  </div>
                </div>
                {/* Decorative blob */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
