import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

export function LoadPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    function downloadTemplate(type: 'natural' | 'juridica' | 'absoluta') {
        let headers: string[] = [];
        if (type === 'natural') {
            headers = ["nombres", "tipo_documento", "documento", "pais", "departamento", "provincia", "distrito", "direccion", "rubro", "tipo_lista", "descripcion_mancha", "link", "fecha_registro"];
        } else if (type === 'juridica') {
            headers = ["razon_social", "tipo_documento", "documento", "pais", "departamento", "provincia", "distrito", "direccion", "rubro", "tipo_lista", "descripcion_mancha", "link", "fecha_registro"];
        } else {
            // Absolute Base format
            headers = ["FECHA ACTUAL", "DOCUMENTO", "DENOMINACION", "OBSERVACION", "NOMBRE", "SEGUNDO NOMBRE", "APE PAT", "APE MAT"];
        }

        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
        XLSX.writeFile(wb, `plantilla_${type}.xlsx`);
    }

    async function handleUpload(file: File, entityType: 'natural' | 'juridica' | 'absoluta') {
        setLoading(true);
        setStatus("Procesando archivo...");
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' });
                const json: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { raw: false });
                const token = localStorage.getItem("auth_token") || "";

                for (const row of json) {
                    let payload: any = {};

                    if (entityType === 'absoluta') {
                        // Logic for Absolute Base
                        const isNatural = !!(row["APE PAT"] || row["APE MAT"] || row["NOMBRE"]);
                        const detectedType = isNatural ? 'natural' : 'juridica';
                        
                        payload = {
                            documento: row["DOCUMENTO"] || "",
                            tipo_entidad: detectedType,
                            tipo_documento: isNatural ? 1 : 2, // Default DNI for natural, RUC for juridica
                            tipo: 'entidad',
                            fecha_registro: row["FECHA ACTUAL"] || "",
                            descripcion_mancha: row["OBSERVACION"] || "",
                            tipo_lista: "BASE PROPIA", // Default list for absolute base
                            pais: "PERU" // Default
                        };

                        if (isNatural) {
                            payload.nombre = `${row["NOMBRE"] || ""} ${row["SEGUNDO NOMBRE"] || ""}`.trim();
                            payload.ape_pat = row["APE PAT"] || "";
                            payload.ape_mat = row["APE MAT"] || "";
                            // Fallback if NOMBRE is empty but DENOMINACION has the name
                            if (!payload.nombre && row["DENOMINACION"]) {
                                payload.nombre = row["DENOMINACION"];
                            }
                        } else {
                            payload.razon_social = row["DENOMINACION"] || "";
                            payload.nombre = row["DENOMINACION"] || ""; // Backup for some logic
                        }
                    } else {
                        // Original Logic
                        payload = { ...row, tipo_entidad: entityType, tipo: 'entidad' };
                        if (row.link) payload.link = row.link;
                        if (row.fecha_registro) payload.fecha_registro = row.fecha_registro;
                        if (row.pais) payload.pais = row.pais;

                        if (entityType === 'natural' && row.nombres) {
                            const words = row.nombres.trim().split(/\s+/);
                            // ... existing splitting logic ...
                            if (words.length >= 2) {
                                if (words.length === 5) {
                                    payload.nombre = words.slice(0, 3).join(" ");
                                    payload.ape_pat = words[3];
                                    payload.ape_mat = words[4];
                                } else if (words.length === 4) {
                                    payload.nombre = words.slice(0, 2).join(" ");
                                    payload.ape_pat = words[2];
                                    payload.ape_mat = words[3];
                                } else if (words.length === 3) {
                                    payload.nombre = words[0];
                                    payload.ape_pat = words[1];
                                    payload.ape_mat = words[2];
                                } else {
                                    payload.nombre = words[0];
                                    payload.ape_pat = words[1];
                                    payload.ape_mat = "";
                                }
                            }
                        }
                    }

                    await fetch(`${apiUrl}/entity`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify(payload)
                    });
                }
                setStatus("Carga completada con éxito");
            } catch (err) {
                setStatus("Error al procesar el archivo");
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-display p-4 lg:p-12">
            <div className="max-w-6xl mx-auto space-y-10">
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate("/home")} className="size-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-100 transition-all shadow-sm">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Panel Administrador</h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Carga Masiva de Entidades</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center gap-6">
                        <div className="size-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                            <span className="material-symbols-outlined text-3xl">person</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Persona Natural</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Nombres, Apellidos, DNI</p>
                        </div>
                        <div className="flex flex-col w-full gap-3 mt-4">
                            <button disabled={loading} onClick={() => downloadTemplate('natural')} className="w-full py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                                <span className="material-symbols-outlined text-sm">download</span> Descargar Plantilla
                            </button>
                            <button disabled={loading} onClick={() => (document.getElementById('upload-natural') as HTMLInputElement)?.click()} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-sm">upload</span> CARGAR ARCHIVO
                                <input id="upload-natural" type="file" accept=".xlsx,.xls" className="hidden" onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUpload(file, 'natural');
                                }} />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center gap-6">
                        <div className="size-16 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-inner">
                            <span className="material-symbols-outlined text-3xl">corporate_fare</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Persona Jurídica</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Razón Social, RUC</p>
                        </div>
                        <div className="flex flex-col w-full gap-3 mt-4">
                            <button disabled={loading} onClick={() => downloadTemplate('juridica')} className="w-full py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                                <span className="material-symbols-outlined text-sm">download</span> Descargar Plantilla
                            </button>
                            <button disabled={loading} onClick={() => (document.getElementById('upload-juridica') as HTMLInputElement)?.click()} className="w-full py-4 bg-slate-900 text-white dark:bg-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-sm">upload</span> CARGAR ARCHIVO
                                <input id="upload-juridica" type="file" accept=".xlsx,.xls" className="hidden" onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUpload(file, 'juridica');
                                }} />
                            </button>
                        </div>
                    </div>

                    {/* NEW CARD: BASE ABSOLUTA */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-indigo-500/20 dark:border-indigo-500/30 shadow-2xl shadow-indigo-200/50 flex flex-col items-center text-center gap-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 bg-indigo-500 text-white text-[8px] font-black uppercase tracking-tighter rotate-45 translate-x-4 -translate-y-1 w-24 text-center">NUEVO</div>
                        <div className="size-16 rounded-3xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-inner">
                            <span className="material-symbols-outlined text-3xl">database</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Base Absoluta</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Carga Mixta - Mapeo Directo</p>
                        </div>
                        <div className="flex flex-col w-full gap-3 mt-4">
                            <button disabled={loading} onClick={() => downloadTemplate('absoluta')} className="w-full py-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400">
                                <span className="material-symbols-outlined text-sm">download</span> Descargar Plantilla
                            </button>
                            <button disabled={loading} onClick={() => (document.getElementById('upload-absoluta') as HTMLInputElement)?.click()} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-sm">upload</span> CARGAR ABSOLUTA
                                <input id="upload-absoluta" type="file" accept=".xlsx,.xls" className="hidden" onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUpload(file, 'absoluta');
                                }} />
                            </button>
                        </div>
                    </div>
                </div>

                {status && (
                    <div className={`p-6 rounded-3xl text-center font-black uppercase text-[10px] tracking-widest shadow-sm ${status.includes('Error') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
}
