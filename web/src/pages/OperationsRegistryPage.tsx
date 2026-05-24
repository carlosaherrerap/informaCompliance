import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface Beneficiary {
  numero_beneficiario: string;
  apellidos_razon_social: string;
  id_tipo_doc: string;
  num_doc: string;
  fec_nac: string;
}

interface OperationData {
  empresa: string;
  numero_registro: string;
  oficina: string;
  fecha_registro: string;

  // Section II
  id_tipo_doc_fisica: string;
  num_doc_fisica: string;
  nombres_fisica: string;
  apellidos_fisica: string;
  fec_nac_fisica: string;
  nacionalidad_fisica: string;
  telefono_fisica: string;
  profesion_fisica: string;
  domicilio_fisica: string;
  cod_postal_fisica: string;
  departamento_fisica: string;
  provincia_fisica: string;
  distrito_fisica: string;

  // Section III
  id_tipo_doc_nombre: string;
  num_doc_nombre: string;
  nombres_nombre: string;
  apellidos_nombre: string;
  fec_nac_nombre: string;
  nacionalidad_nombre: string;
  telefono_nombre: string;
  profesion_nombre: string;
  domicilio_nombre: string;
  cod_postal_nombre: string;
  departamento_nombre: string;
  provincia_nombre: string;
  distrito_nombre: string;

  // Section IV
  fec_operacion: string;
  lugar_operacion: string;
  modalidad_pago: string;
  tipo_moneda: string;
  monto_operacion: string;
  tipo_operacion: string;
  nro_cuenta_1: string;
  nro_cuenta_2: string;
  nro_cuenta_3: string;

  beneficiarios: Beneficiary[];
}

const initialForm: OperationData = {
  empresa: "",
  numero_registro: "",
  oficina: "",
  fecha_registro: new Date().toISOString().split('T')[0],
  id_tipo_doc_fisica: "",
  num_doc_fisica: "",
  nombres_fisica: "",
  apellidos_fisica: "",
  fec_nac_fisica: "",
  nacionalidad_fisica: "",
  telefono_fisica: "",
  profesion_fisica: "",
  domicilio_fisica: "",
  cod_postal_fisica: "",
  departamento_fisica: "",
  provincia_fisica: "",
  distrito_fisica: "",
  id_tipo_doc_nombre: "",
  num_doc_nombre: "",
  nombres_nombre: "",
  apellidos_nombre: "",
  fec_nac_nombre: "",
  nacionalidad_nombre: "",
  telefono_nombre: "",
  profesion_nombre: "",
  domicilio_nombre: "",
  cod_postal_nombre: "",
  departamento_nombre: "",
  provincia_nombre: "",
  distrito_nombre: "",
  fec_operacion: new Date().toISOString().split('T')[0],
  lugar_operacion: "",
  modalidad_pago: "",
  tipo_moneda: "",
  monto_operacion: "",
  tipo_operacion: "",
  nro_cuenta_1: "",
  nro_cuenta_2: "",
  nro_cuenta_3: "",
  beneficiarios: []
};

import { Link } from "react-router-dom";
import { DEPARTAMENTOS, PROVINCIAS, DISTRITOS } from "../data/ubigeo";

const NACIONALIDADES_AMERICA = [
  { id: "Antigüense", nombre: "Antigüense" },
  { id: "Argentina", nombre: "Argentina" },
  { id: "Bahameña", nombre: "Bahameña" },
  { id: "Barbádense", nombre: "Barbádense" },
  { id: "Beliceña", nombre: "Beliceña" },
  { id: "Boliviana", nombre: "Boliviana" },
  { id: "Brasileña", nombre: "Brasileña" },
  { id: "Canadiense", nombre: "Canadiense" },
  { id: "Chilena", nombre: "Chilena" },
  { id: "Colombiana", nombre: "Colombiana" },
  { id: "Costarricense", nombre: "Costarricense" },
  { id: "Cubana", nombre: "Cubana" },
  { id: "Dominiquesa", nombre: "Dominiquesa" },
  { id: "Ecuatoriana", nombre: "Ecuatoriana" },
  { id: "Salvadoreña", nombre: "Salvadoreña" },
  { id: "Estadounidense", nombre: "Estadounidense" },
  { id: "Granadina", nombre: "Granadina" },
  { id: "Guatemalteca", nombre: "Guatemalteca" },
  { id: "Guyanesa", nombre: "Guyanesa" },
  { id: "Haitiana", nombre: "Haitiana" },
  { id: "Hondureña", nombre: "Hondureña" },
  { id: "Jamaiquina", nombre: "Jamaiquina" },
  { id: "Mexicana", nombre: "Mexicana" },
  { id: "Nicaragüense", nombre: "Nicaragüense" },
  { id: "Panameña", nombre: "Panameña" },
  { id: "Paraguaya", nombre: "Paraguaya" },
  { id: "Peruana", nombre: "Peruana" },
  { id: "Dominicana", nombre: "Dominicana" },
  { id: "Sancristobaleña", nombre: "Sancristobaleña" },
  { id: "Sanvicentina", nombre: "Sanvicentina" },
  { id: "Santalucense", nombre: "Santalucense" },
  { id: "Surinamesa", nombre: "Surinamesa" },
  { id: "Trinitense", nombre: "Trinitense" },
  { id: "Uruguaya", nombre: "Uruguaya" },
  { id: "Venezolana", nombre: "Venezolana" }
];

const MODALIDADES_PAGO = [
  { id: "Moneda nacional", nombre: "Moneda nacional" },
  { id: "Moneda extranjera", nombre: "Moneda extranjera" },
  { id: "Cheque de gerencia", nombre: "Cheque de gerencia" },
  { id: "Cheque de viajero", nombre: "Cheque de viajero" },
  { id: "Ordenes de pago", nombre: "Ordenes de pago" },
  { id: "Otros", nombre: "Otros" }
];

const TIPOS_MONEDA = [
  { id: "Soles", nombre: "Soles" },
  { id: "Dolares", nombre: "Dólares" },
  { id: "Euros", nombre: "Euros" }
];

const TIPOS_OPERACION = [
  { id: "Cuota inicial", nombre: "Cuota inicial" },
  { id: "Compra de inmueble", nombre: "Compra de inmueble" },
  { id: "Venta de inmueble", nombre: "Venta de inmueble" },
  { id: "Compra de vehículo", nombre: "Compra de vehículo" },
  { id: "Venta de vehículo", nombre: "Venta de vehículo" },
  { id: "Compra/venta de servicios", nombre: "Compra/venta de servicios" },
  { id: "Depósito bancario", nombre: "Depósito bancario" },
  { id: "Retiro de efectivo", nombre: "Retiro de efectivo" },
  { id: "Transferencias", nombre: "Transferencias" },
  { id: "Pago de préstamo o crédito", nombre: "Pago de préstamo o crédito" },
  { id: "Cobro de intereses", nombre: "Cobro de intereses" },
  { id: "Cobro de apertura a plazos", nombre: "Cobro de apertura a plazos" },
  { id: "Amortizaciones", nombre: "Amortizaciones" },
  { id: "Cancelación de préstamos", nombre: "Cancelación de préstamos" },
  { id: "Pago de tarjeta de crédito", nombre: "Pago de tarjeta de crédito" },
  { id: "Pago de impuestos", nombre: "Pago de impuestos" },
  { id: "Retención de impuestos", nombre: "Retención de impuestos" },
  { id: "Pago de sueldos", nombre: "Pago de sueldos" },
  { id: "Aportación a fondo de pensiones", nombre: "Aportación a fondo de pensiones" },
  { id: "Inversiones", nombre: "Inversiones" },
  { id: "Otros", nombre: "Otros" }
];

const SectionHeader = ({ title }: { title: string }) => (
  <div className="border-t border-slate-300 pt-4 mt-6 mb-4">
    <h3 className="text-sm font-bold text-[#1e293b] uppercase">{title}</h3>
  </div>
);

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="block text-xs font-medium text-slate-600 mb-1">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const Input = ({ name, type = "text", placeholder, required, value, onChange }: any) => (
  <input
    type={type}
    name={name}
    required={required}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm shadow-sm focus:outline-none focus:border-[#32508E] transition-colors"
  />
);

const Select = ({ name, required, value, options = [], placeholder, onChange }: any) => (
  <select
    name={name}
    required={required}
    value={value}
    onChange={onChange}
    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm shadow-sm focus:outline-none focus:border-[#32508E] transition-colors appearance-none"
  >
    <option value="">-- {placeholder || 'Seleccione'} --</option>
    {options.map((o: any) => (
      <option key={o.id} value={o.id}>{o.nombre}</option>
    ))}
  </select>
);

export default function OperationsRegistryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState<"list" | "form">("list");
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [formData, setFormData] = useState<OperationData>(initialForm);
  const [userRole, setUserRole] = useState<string>('user');

  const [lookups, setLookups] = useState({
    tipo_doc: [] as any[],
    paises: [] as any[]
  });

  const apiHost = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    fetchRegistros();
    fetchLookups();

    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setUserRole(decoded.role || 'user');
      } catch { }
    }
  }, []);

  const modules = [
    { name: "Listas Negativas", icon: "search", enabled: true, href: "/busqueda" },
    { name: "Matriz de Riesgos", icon: "grid_on", enabled: true, href: "/matriz-riesgos" },
    { name: "Scoring de Riesgo", icon: "trending_up", enabled: true, href: "/scoring" },
    { name: "Registro de Operaciones", icon: "assignment", enabled: true, href: "/registro-operaciones" },
    { name: "Canal de Denuncias", icon: "campaign", enabled: false, href: "/denuncias" },
    { name: "Mis Cursos", icon: "school", enabled: false, href: "/mis-cursos" },
    { name: "Administrador", icon: "admin_panel_settings", enabled: userRole === 'admin', href: "/load" },
  ];

  const fetchRegistros = async () => {
    try {
      const res = await fetch(`${apiHost}/operaciones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setRegistros(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLookups = async () => {
    try {
      const [td, p] = await Promise.all([
        fetch(`${apiHost}/lookups/tipo-documento`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${apiHost}/lookups/pais`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
      ]);
      setLookups({ tipo_doc: td, paises: p });
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      // Reiniciar combos dependientes si cambia el de nivel superior
      if (name === "departamento_fisica") {
        updated.provincia_fisica = "";
        updated.distrito_fisica = "";
      } else if (name === "provincia_fisica") {
        updated.distrito_fisica = "";
      }

      if (name === "departamento_nombre") {
        updated.provincia_nombre = "";
        updated.distrito_nombre = "";
      } else if (name === "provincia_nombre") {
        updated.distrito_nombre = "";
      }

      return updated;
    });
  };

  const addBeneficiary = () => {
    setFormData(prev => ({
      ...prev,
      beneficiarios: [...prev.beneficiarios, {
        numero_beneficiario: (prev.beneficiarios.length + 1).toString(),
        apellidos_razon_social: "",
        id_tipo_doc: "",
        num_doc: "",
        fec_nac: ""
      }]
    }));
  };

  const updateBeneficiary = (index: number, field: string, value: string) => {
    const b = [...formData.beneficiarios];
    b[index] = { ...b[index], [field]: value };
    setFormData(prev => ({ ...prev, beneficiarios: b }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${apiHost}/operaciones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setView("list");
        setFormData(initialForm);
        fetchRegistros();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Listas filtradas para Ubigeo de Persona Física
  const listProvinciasFisica = formData.departamento_fisica ? (PROVINCIAS[formData.departamento_fisica] || []) : [];
  const listDistritosFisica = (formData.departamento_fisica && formData.provincia_fisica)
    ? (DISTRITOS[`${formData.departamento_fisica}_${formData.provincia_fisica}`] || [])
    : [];

  // Listas filtradas para Ubigeo de Persona a Nombre
  const listProvinciasNombre = formData.departamento_nombre ? (PROVINCIAS[formData.departamento_nombre] || []) : [];
  const listDistritosNombre = (formData.departamento_nombre && formData.provincia_nombre)
    ? (DISTRITOS[`${formData.departamento_nombre}_${formData.provincia_nombre}`] || [])
    : [];

  return (
    <div className="flex h-screen overflow-hidden relative bg-[#F4F7FA] font-sans text-base">
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
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest hidden sm:block">Registro de Operaciones</h2>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setView(view === "list" ? "form" : "list")}
              className="bg-[#6200ee] text-white px-6 py-2 rounded-lg text-[10px] font-bold shadow-lg hover:bg-[#5000ca] transition-all uppercase tracking-widest"
            >
              {view === "list" ? "NUEVO REGISTRO" : "VOLVER AL LISTADO"}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8">
          {view === "form" ? (
            <form onSubmit={handleSubmit} className="max-w-7xl mx-auto pb-12">
              <SectionHeader title="SECCIÓN I - INFORMACIÓN DEL REGISTRO" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <Label required>Empresa</Label>
                  <Input name="empresa" value={formData.empresa} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label required>N° del registro</Label>
                  <Input name="numero_registro" value={formData.numero_registro} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label required>Oficina</Label>
                  <Input name="oficina" value={formData.oficina} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label>Fecha del registro</Label>
                  <Input type="date" name="fecha_registro" value={formData.fecha_registro} onChange={handleInputChange} />
                </div>
              </div>

              <SectionHeader title="SECCIÓN II - IDENTIDAD DE LA PERSONA QUE FÍSICAMENTE REALIZA LA OPERACIÓN" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <Label>Documento de Identidad</Label>
                  <Select name="id_tipo_doc_fisica" value={formData.id_tipo_doc_fisica} onChange={handleInputChange} options={lookups.tipo_doc} />
                </div>
                <div>
                  <Label>N° de Documento</Label>
                  <Input name="num_doc_fisica" value={formData.num_doc_fisica} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>Nombres</Label>
                  <Input name="nombres_fisica" value={formData.nombres_fisica} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>Apellidos</Label>
                  <Input name="apellidos_fisica" value={formData.apellidos_fisica} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>Fecha de nacimiento</Label>
                  <Input type="date" name="fec_nac_fisica" value={formData.fec_nac_fisica} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>Nacionalidad</Label>
                  <Select name="nacionalidad_fisica" value={formData.nacionalidad_fisica} onChange={handleInputChange} options={NACIONALIDADES_AMERICA} />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input name="telefono_fisica" value={formData.telefono_fisica} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>Profesión u ocupación</Label>
                  <Input name="profesion_fisica" value={formData.profesion_fisica} onChange={handleInputChange} />
                </div>
                <div className="md:col-span-1">
                  <Label>Domicilio</Label>
                  <Input name="domicilio_fisica" value={formData.domicilio_fisica} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>Código Postal</Label>
                  <Input name="cod_postal_fisica" value={formData.cod_postal_fisica} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>Departamento</Label>
                  <Select name="departamento_fisica" value={formData.departamento_fisica} onChange={handleInputChange} options={DEPARTAMENTOS} />
                </div>
                <div>
                  <Label>Provincia</Label>
                  <Select name="provincia_fisica" value={formData.provincia_fisica} onChange={handleInputChange} options={listProvinciasFisica} />
                </div>
                <div>
                  <Label>Distrito</Label>
                  <Select name="distrito_fisica" value={formData.distrito_fisica} onChange={handleInputChange} options={listDistritosFisica} />
                </div>
              </div>

              <SectionHeader title="SECCIÓN III - PERSONA EN CUYO NOMBRE SE REALIZA LA OPERACIÓN" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <Label>Documento de Identidad</Label>
                  <Select name="id_tipo_doc_nombre" value={formData.id_tipo_doc_nombre} onChange={handleInputChange} options={lookups.tipo_doc} />
                </div>
                <div>
                  <Label>N° de Documento</Label>
                  <Input name="num_doc_nombre" value={formData.num_doc_nombre} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>Nombres</Label>
                  <Input name="nombres_nombre" value={formData.nombres_nombre} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>Apellidos</Label>
                  <Input name="apellidos_nombre" value={formData.apellidos_nombre} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>Fecha de nacimiento</Label>
                  <Input type="date" name="fec_nac_nombre" value={formData.fec_nac_nombre} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>Nacionalidad</Label>
                  <Select name="nacionalidad_nombre" value={formData.nacionalidad_nombre} onChange={handleInputChange} options={NACIONALIDADES_AMERICA} />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input name="telefono_nombre" value={formData.telefono_nombre} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>Profesión u ocupación</Label>
                  <Input name="profesion_nombre" value={formData.profesion_nombre} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>Domicilio</Label>
                  <Input name="domicilio_nombre" value={formData.domicilio_nombre} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>Código Postal</Label>
                  <Input name="cod_postal_nombre" value={formData.cod_postal_nombre} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>Departamento</Label>
                  <Select name="departamento_nombre" value={formData.departamento_nombre} onChange={handleInputChange} options={DEPARTAMENTOS} />
                </div>
                <div>
                  <Label>Provincia</Label>
                  <Select name="provincia_nombre" value={formData.provincia_nombre} onChange={handleInputChange} options={listProvinciasNombre} />
                </div>
                <div>
                  <Label>Distrito</Label>
                  <Select name="distrito_nombre" value={formData.distrito_nombre} onChange={handleInputChange} options={listDistritosNombre} />
                </div>
              </div>

              <SectionHeader title="SECCIÓN IV - DESCRIPCIÓN DE LA OPERACIÓN" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <Label>Fecha de la operación</Label>
                  <Input type="date" name="fec_operacion" value={formData.fec_operacion} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>Lugar de realización</Label>
                  <Input name="lugar_operacion" value={formData.lugar_operacion} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>Modalidad de pago</Label>
                  <Select name="modalidad_pago" value={formData.modalidad_pago} onChange={handleInputChange} options={MODALIDADES_PAGO} />
                </div>
                <div>
                  <Label>Tipo de Moneda</Label>
                  <Select name="tipo_moneda" value={formData.tipo_moneda} onChange={handleInputChange} options={TIPOS_MONEDA} />
                </div>
                <div>
                  <Label>Monto de la operación</Label>
                  <Input type="number" name="monto_operacion" value={formData.monto_operacion} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>Tipo de operación</Label>
                  <Select name="tipo_operacion" value={formData.tipo_operacion} onChange={handleInputChange} options={TIPOS_OPERACION} />
                </div>
                <div>
                  <Label>N° de cuenta 1</Label>
                  <Input name="nro_cuenta_1" value={formData.nro_cuenta_1} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>N° de cuenta 2</Label>
                  <Input name="nro_cuenta_2" value={formData.nro_cuenta_2} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>N° de cuenta 3</Label>
                  <Input name="nro_cuenta_3" value={formData.nro_cuenta_3} onChange={handleInputChange} />
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 border-t border-slate-300 pt-4">
                <h3 className="text-sm font-bold text-[#1e293b] uppercase">SECCIÓN V - BENEFICIARIOS MÚLTIPLES</h3>
                <button
                  type="button"
                  onClick={addBeneficiary}
                  className="bg-[#6200ee] text-white px-4 py-2 rounded-lg text-[10px] font-bold shadow hover:bg-[#5000ca] uppercase transition-all tracking-widest"
                >
                  AÑADIR BENEFICIARIO
                </button>
              </div>

              <div className="mt-4 overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-sm overflow-x-auto">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 border-r border-slate-200">N° BENEFICIARIO</th>
                      <th className="px-4 py-3 border-r border-slate-200 uppercase">Apellidos o Razón Social</th>
                      <th className="px-4 py-3 border-r border-slate-200 uppercase">Tipo de Documento</th>
                      <th className="px-4 py-3 border-r border-slate-200 uppercase">N° de Documento</th>
                      <th className="px-4 py-3 uppercase">Fecha de Nacimiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.beneficiarios.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">No se han añadido beneficiarios</td>
                      </tr>
                    ) : (
                      formData.beneficiarios.map((b, idx) => (
                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="px-4 py-2 border-r border-slate-100 text-center font-medium">{b.numero_beneficiario}</td>
                          <td className="px-4 py-2 border-r border-slate-100">
                            <input className="w-full bg-transparent outline-none focus:ring-1 ring-indigo-500 rounded px-1" value={b.apellidos_razon_social} onChange={e => updateBeneficiary(idx, 'apellidos_razon_social', e.target.value)} />
                          </td>
                          <td className="px-4 py-2 border-r border-slate-100">
                            <select className="w-full bg-transparent outline-none focus:ring-1 ring-indigo-500 rounded" value={b.id_tipo_doc} onChange={e => updateBeneficiary(idx, 'id_tipo_doc', e.target.value)}>
                              <option value="">-- Seleccione --</option>
                              {lookups.tipo_doc.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-2 border-r border-slate-100">
                            <input className="w-full bg-transparent outline-none focus:ring-1 ring-indigo-500 rounded px-1" value={b.num_doc} onChange={e => updateBeneficiary(idx, 'num_doc', e.target.value)} />
                          </td>
                          <td className="px-4 py-2">
                            <input type="date" className="w-full bg-transparent outline-none focus:ring-1 ring-indigo-500 rounded" value={b.fec_nac} onChange={e => updateBeneficiary(idx, 'fec_nac', e.target.value)} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  disabled={loading}
                  className={`bg-[#6200ee] text-white px-8 py-3 rounded-xl text-xs font-bold shadow-xl hover:bg-[#5000ca] transition-all uppercase tracking-wider ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? "GUARDANDO..." : "REGISTRAR OPERACIÓN"}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center gap-4 bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mostrar</span>
                <select className="border border-slate-200 rounded-lg text-[10px] font-bold px-3 py-1 outline-none bg-white">
                  <option>10</option>
                  <option>25</option>
                  <option>50</option>
                </select>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">registros</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px] font-medium text-[#1e293b]">
                  <thead className="bg-[#f8fafc] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-4 border-r border-slate-200 w-12 text-center uppercase tracking-widest">ID</th>
                      <th className="px-4 py-4 border-r border-slate-200 uppercase tracking-widest">N° registro</th>
                      <th className="px-4 py-4 border-r border-slate-200 uppercase tracking-widest">Persona (Física)</th>
                      <th className="px-4 py-4 border-r border-slate-200 uppercase tracking-widest">Persona (Nombre)</th>
                      <th className="px-4 py-4 border-r border-slate-200 uppercase tracking-widest text-center">Oficina</th>
                      <th className="px-4 py-4 border-r border-slate-200 uppercase tracking-widest text-center">Fecha</th>
                      <th className="px-4 py-4 uppercase tracking-widest text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-20 text-center text-slate-400 font-bold uppercase tracking-widest bg-slate-50/50">
                          No hay datos disponibles en el sistema
                        </td>
                      </tr>
                    ) : (
                      registros.map((r, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4 border-r border-slate-100 text-center text-slate-500">#{r.id}</td>
                          <td className="px-4 py-4 border-r border-slate-100 font-black text-[#32508E]">{r.numero_registro}</td>
                          <td className="px-4 py-4 border-r border-slate-100 uppercase">{r.nombres_fisica} {r.apellidos_fisica}</td>
                          <td className="px-4 py-4 border-r border-slate-100 uppercase">{r.nombres_nombre} {r.apellidos_nombre}</td>
                          <td className="px-4 py-4 border-r border-slate-100 uppercase text-center">{r.oficina}</td>
                          <td className="px-4 py-4 border-r border-slate-100 text-center">{r.fecha_registro.split('T')[0]}</td>
                          <td className="px-4 py-4 text-center">
                            <button className="text-[#32508E] hover:bg-[#32508E]/10 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all">Ver detalle</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50/50">
                <button className="bg-white border border-slate-200 text-slate-400 px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest cursor-not-allowed">Anterior</button>
                <button className="bg-white border border-slate-200 text-slate-400 px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest cursor-not-allowed">Siguiente</button>
              </div>
            </div>
          )}
        </div>

        <footer className="py-4 bg-white border-t border-slate-100 flex items-center justify-center shrink-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center px-4">
            @COPYRIGHT; DESARROLLADO POR EL AREA DE TI - INFORMAPERU. TODOS LOS DERECHOS RESERVADOS 2026
          </p>
        </footer>
      </main>
    </div>
  );
}
