import React, { useState } from "react";
import * as XLSX from "xlsx";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface Involucrado {
  tipo: "NATURAL" | "JURIDICA";
  nombre: string;
  documento: string;
  rol: string;
  cargo: string;
}

export default function DenunciaFormPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [causa, setCausa] = useState("");
  const [relacion, setRelacion] = useState("");
  const [detalle, setDetalle] = useState("");
  const [receptor, setReceptor] = useState("CARLOS WIESSE");
  const [proponerOtro, setProponerOtro] = useState(false);
  const [otroReceptor, setOtroReceptor] = useState("");
  const [anonimo, setAnonimo] = useState(true);
  
  // Denunciante data
  const [nombre, setNombre] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  
  const [terminos, setTerminos] = useState(false);
  const [evidenciaUrl, setEvidenciaUrl] = useState("");
  const [involucrados, setInvolucrados] = useState<Involucrado[]>([]);

  // Modal states for adding involved person
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState<"NATURAL" | "JURIDICA" | "">("");
  const [modalRol, setModalRol] = useState<"TESTIGO" | "ENCARGADO" | "">("");
  const [modalDocumento, setModalDocumento] = useState("");
  const [modalNombre, setModalNombre] = useState("");
  const [modalCargo, setModalCargo] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  const openModal = () => {
    setModalTipo("");
    setModalRol("");
    setModalDocumento("");
    setModalNombre("");
    setModalCargo("");
    setModalError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const saveInvolucrado = () => {
    if (!modalTipo) {
      setModalError("Por favor, seleccione si es Persona natural o Persona jurídica.");
      return;
    }
    if (!modalRol) {
      setModalError("Por favor, seleccione el rol en el incidente.");
      return;
    }
    if (!modalNombre.trim()) {
      setModalError("Por favor, ingrese el nombre o razón social.");
      return;
    }
    if (!modalCargo.trim()) {
      setModalError("Por favor, ingrese el cargo.");
      return;
    }

    setInvolucrados(prev => [
      ...prev,
      {
        tipo: modalTipo,
        nombre: modalNombre.trim(),
        documento: modalDocumento.trim(),
        rol: modalRol,
        cargo: modalCargo.trim()
      }
    ]);
    setIsModalOpen(false);
  };

  const removeInvolucrado = (index: number) => {
    setInvolucrados(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!causa) { setError("Por favor, seleccione la causa de la denuncia."); return; }
    if (!relacion) { setError("Por favor, seleccione su relación con la empresa."); return; }
    if (!detalle.trim()) { setError("Por favor, detalle la descripción de los hechos."); return; }
    if (proponerOtro && !otroReceptor.trim()) { setError("Por favor, indique el nombre del otro receptor propuesto."); return; }
    if (!terminos) { setError("Debe aceptar los términos y condiciones para continuar."); return; }

    setLoading(true);
    setError(null);

    const targetReceptor = proponerOtro ? otroReceptor : receptor;
    const token = localStorage.getItem("auth_token") || "";

    const payload = {
      anonimo,
      denunciante_nombre: anonimo ? null : nombre,
      denunciante_contacto: anonimo ? null : (telefono || null),
      denunciante_documento: anonimo ? null : (documento || null),
      denunciante_telefono: anonimo ? null : (telefono || null),
      denunciante_email: anonimo ? null : (email || null),
      titulo: `Denuncia por ${causa}`,
      detalle,
      evidencia_url: evidenciaUrl || null,
      causa,
      relacion_empresa: relacion,
      receptor: targetReceptor,
      involucrados: involucrados.length > 0 ? involucrados : null
    };

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const r = await fetch(`${apiUrl}/denuncias`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      if (r.ok) {
        setSuccess(true);
        // Reset states
        setCausa("");
        setRelacion("");
        setDetalle("");
        setReceptor("CARLOS WIESSE");
        setProponerOtro(false);
        setOtroReceptor("");
        setNombre("");
        setDocumento("");
        setTelefono("");
        setEmail("");
        setTerminos(false);
        setEvidenciaUrl("");
        setInvolucrados([]);
      } else {
        const data = await r.json().catch(() => ({ error: "Error desconocido" }));
        setError(data.error || "Ocurrió un error al enviar el reporte.");
      }
    } catch {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#eef2f6] font-display">
        {/* Header simple */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center px-6 lg:px-12">
          <img src="/logo-informaPeru.jpg" alt="INFORMA PERÚ" className="h-10 w-auto object-contain" />
        </header>

        {/* Mensaje de éxito */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-2xl text-center space-y-6">
            <div className="size-16 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">¡Denuncia Enviada!</h2>
            <p className="text-sm font-semibold text-slate-500">
              Su reporte ha sido recibido correctamente bajo estrictos estándares de confidencialidad. 
              Agradecemos su compromiso con la ética y la transparencia de la organización.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-opacity-95 transition-all shadow-lg shadow-primary/20"
            >
              Enviar otra denuncia
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-8 bg-white border-t border-slate-200 flex items-center justify-center px-4">
          <p className="text-[10px] font-bold text-slate-400 tracking-widest text-center">
            @Copyright; Desarrollado por el área de TI-InformaPerú. Todos los derechos reservados 2026
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#eef2f6] font-display">
      {/* Header simple con logo */}
      <header className="h-20 bg-white border-b border-slate-200 flex items-center px-6 lg:px-12">
        <img src="/logo-informaPeru.jpg" alt="INFORMA PERÚ" className="h-10 w-auto object-contain" />
      </header>

      {/* Banner de título */}
      <div className="bg-gradient-to-r from-[#1E293B] to-[#2B3990] py-10 text-center text-white shrink-0">
        <h1 className="text-3xl font-black uppercase tracking-[0.2em] mb-2">CANAL DE DENUNCIA</h1>
        <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest">InformaPerú cumplimiento y ética corporativa</p>
      </div>

      {/* Contenedor del formulario */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 lg:py-12 space-y-8">
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
          
          {/* Instrucciones */}
          <div className="p-6 lg:p-8 bg-slate-50 border-b border-slate-200">
            <p className="text-xs font-bold text-slate-600 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">security</span>
              Usted está en un área segura y se tratará de manera confidencial las denuncias recibidas.
            </p>
            <h2 className="text-lg font-black text-primary uppercase mt-4 tracking-wider">Formulario de ingreso de denuncias</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold uppercase">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </div>
            )}

            {/* Fila 1: Causa y Relación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Causa de la denuncia *</label>
                <select
                  value={causa}
                  onChange={e => setCausa(e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all appearance-none"
                >
                  <option value="">-- Seleccione --</option>
                  <option value="SOBORNO">SOBORNO</option>
                  <option value="CONFLICTO">CONFLICTO</option>
                  <option value="ACOSO">ACOSO</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Relación con la empresa *</label>
                <select
                  value={relacion}
                  onChange={e => setRelacion(e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all appearance-none"
                >
                  <option value="">-- Seleccione --</option>
                  <option value="TRABAJADOR">TRABAJADOR</option>
                  <option value="CLIENTE">CLIENTE</option>
                  <option value="PROVEEDOR">PROVEEDOR</option>
                </select>
              </div>
            </div>

            {/* Fila 2: Detalle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descripción de la denuncia *</label>
              <textarea
                value={detalle}
                onChange={e => setDetalle(e.target.value)}
                rows={5}
                placeholder="Describa el incidente con fechas, nombres y detalles..."
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
              />
            </div>

            {/* Fila 3: Receptor */}
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Receptor de la denuncia *</label>
                {!proponerOtro ? (
                  <select
                    value={receptor}
                    onChange={e => setReceptor(e.target.value)}
                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all appearance-none"
                  >
                    <option value="CARLOS WIESSE">CARLOS WIESSE</option>
                    <option value="JUAN AZULA">JUAN AZULA</option>
                    <option value="ABEL CHAVEZ">ABEL CHAVEZ</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={otroReceptor}
                    onChange={e => setOtroReceptor(e.target.value)}
                    placeholder="Indique el nombre del receptor propuesto"
                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="proponer_receptor"
                  checked={proponerOtro}
                  onChange={e => setProponerOtro(e.target.checked)}
                  className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <label htmlFor="proponer_receptor" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer select-none">
                  Proponer otro receptor
                </label>
              </div>
            </div>

            {/* Fila 4: Documentación/Evidencia */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Documentación / Evidencia (URL o Ruta)</label>
              <input
                type="text"
                value={evidenciaUrl}
                onChange={e => setEvidenciaUrl(e.target.value)}
                placeholder="Ej. Enlace a Google Drive, Dropbox, etc."
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
              />
            </div>

            {/* Involucrados PN/PJ */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Personas y/o empresas involucradas *</label>
                <button
                  type="button"
                  onClick={openModal}
                  className="px-3 py-1.5 rounded-lg bg-primary text-white text-[9px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-sm"
                >
                  + Nueva Persona
                </button>
              </div>

              {involucrados.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-3 font-bold text-slate-500 text-[10px] uppercase">PN/PJ</th>
                        <th className="p-3 font-bold text-slate-500 text-[10px] uppercase">Nombre</th>
                        <th className="p-3 font-bold text-slate-500 text-[10px] uppercase">Documento</th>
                        <th className="p-3 font-bold text-slate-500 text-[10px] uppercase">Rol en el incidente</th>
                        <th className="p-3 font-bold text-slate-500 text-[10px] uppercase">Cargo</th>
                        <th className="p-3 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {involucrados.map((inv, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-3 py-3 font-bold text-slate-600 text-[10px] uppercase">
                            {inv.tipo === "NATURAL" ? "PERSONA NATURAL" : "PERSONA JURIDICA"}
                          </td>
                          <td className="px-3 py-3 font-bold text-slate-700">{inv.nombre}</td>
                          <td className="px-3 py-3 font-semibold text-slate-500">{inv.documento || "—"}</td>
                          <td className="px-3 py-3 font-bold text-slate-600 uppercase text-[10px]">{inv.rol}</td>
                          <td className="px-3 py-3 font-semibold text-slate-600">{inv.cargo}</td>
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeInvolucrado(idx)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-all"
                              title="Eliminar"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic font-semibold">No se han registrado personas o empresas involucradas aún.</p>
              )}
            </div>

            {/* Datos del denunciante */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Datos del denunciante</h3>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">
                  Los siguientes campos a llenar son opcionales, no es obligatorio para el envío de la denuncia.
                </p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <input
                  type="checkbox"
                  id="chk_anonimo"
                  checked={anonimo}
                  onChange={e => setAnonimo(e.target.checked)}
                  className="size-5 accent-primary cursor-pointer"
                />
                <label htmlFor="chk_anonimo" className="text-xs font-black text-slate-700 uppercase tracking-widest cursor-pointer select-none">
                  Marcar si desea que la denuncia sea anónima
                </label>
              </div>

              {!anonimo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre completo</label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={e => setNombre(e.target.value)}
                      placeholder="Ej. Juan Perez Gomez"
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento (DNI/RUC)</label>
                    <input
                      type="text"
                      value={documento}
                      onChange={e => setDocumento(e.target.value)}
                      placeholder="Ej. 12345678"
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono / Móvil</label>
                    <input
                      type="text"
                      value={telefono}
                      onChange={e => setTelefono(e.target.value)}
                      placeholder="Ej. +51 987 654 321"
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Correo electrónico</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Ej. juan.perez@email.com"
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Términos y submit */}
            <div className="pt-6 border-t border-slate-200 space-y-6">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="chk_terminos"
                  required
                  checked={terminos}
                  onChange={e => setTerminos(e.target.checked)}
                  className="size-5 accent-primary cursor-pointer mt-0.5"
                />
                <label htmlFor="chk_terminos" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer select-none leading-relaxed">
                  Sí - Estoy de acuerdo con los <span className="text-primary underline">términos y condiciones</span> para la formulación de esta denuncia *
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.25em] hover:bg-opacity-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Denunciar"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-slate-200 flex items-center justify-center px-4 shrink-0">
        <p className="text-[10px] font-bold text-slate-500 tracking-widest text-center">
          @Copyright; Desarrollado por el área de TI-InformaPerú. Todos los derechos reservados 2026
        </p>
      </footer>

      {/* Modal - Persona Involucrada */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg border border-slate-200 overflow-hidden shadow-2xl flex flex-col p-8 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Close "X" Button */}
            <button 
              type="button"
              onClick={closeModal}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>

            {/* Modal Header */}
            <div>
              <h3 className="text-base font-black text-primary uppercase tracking-wider">PERSONA INVOLUCRADA</h3>
            </div>

            {modalError && (
              <div className="text-red-600 text-xs font-semibold uppercase bg-red-50 border border-red-100 p-3 rounded-xl">
                {modalError}
              </div>
            )}

            {/* Modal Fields */}
            <div className="space-y-4">
              
              {/* Field 1: Tipo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Personal natural / Persona jurídica *</label>
                <select
                  value={modalTipo}
                  onChange={e => setModalTipo(e.target.value as any)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all appearance-none"
                >
                  <option value="">-- Seleccione --</option>
                  <option value="NATURAL">PERSONA NATURAL</option>
                  <option value="JURIDICA">PERSONA JURIDICA</option>
                </select>
              </div>

              {/* Field 2: Rol */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Rol en el incidente *</label>
                <select
                  value={modalRol}
                  onChange={e => setModalRol(e.target.value as any)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all appearance-none"
                >
                  <option value="">-- Seleccione --</option>
                  <option value="TESTIGO">TESTIGO</option>
                  <option value="ENCARGADO">ENCARGADO</option>
                </select>
              </div>

              {/* Field 3: Identificación / RUC */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Identificación / RUC</label>
                <input
                  type="text"
                  value={modalDocumento}
                  onChange={e => setModalDocumento(e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                />
              </div>

              {/* Field 4: Nombre */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Nombre / Razón Social *</label>
                <input
                  type="text"
                  value={modalNombre}
                  onChange={e => setModalNombre(e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                />
              </div>

              {/* Field 5: Cargo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Cargo *</label>
                <input
                  type="text"
                  value={modalCargo}
                  onChange={e => setModalCargo(e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                />
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-6 py-2.5 bg-white border border-red-500 hover:bg-red-50 text-red-500 rounded-xl text-xs font-bold uppercase transition-all"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={saveInvolucrado}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase hover:bg-opacity-90 transition-all shadow-md"
              >
                Guardar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
