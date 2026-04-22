import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

export default function OperationsRegistryPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "form">("list");
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OperationData>(initialForm);
  const [lookups, setLookups] = useState({
    tipo_doc: [] as any[],
    paises: [] as any[]
  });

  const apiHost = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    fetchRegistros();
    fetchLookups();
  }, []);

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
    setFormData(prev => ({ ...prev, [name]: value }));
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
      onChange={onChange || handleInputChange}
      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm shadow-sm focus:outline-none focus:border-indigo-500 transition-colors"
    />
  );

  const Select = ({ name, required, value, options, placeholder, onChange }: any) => (
    <select
      name={name}
      required={required}
      value={value}
      onChange={onChange || handleInputChange}
      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm shadow-sm focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
    >
      <option value="">-- {placeholder || 'Seleccione'} --</option>
      {options.map((o: any) => (
        <option key={o.id} value={o.id}>{o.nombre}</option>
      ))}
    </select>
  );

  if (view === "form") {
    return (
      <div className="min-h-screen bg-[#f1f5f9] font-display">
        <header className="px-8 py-4 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            <span className="text-indigo-600 cursor-pointer" onClick={() => navigate("/home")}>Inicio</span>
            <span className="mx-2">›</span>
            <span>Registro de Operaciones</span>
          </div>
          <button 
            onClick={() => setView("list")}
            className="bg-[#6200ee] text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-[#5000ca] transition-all"
          >
            VOLVER
          </button>
        </header>

        <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-8 pb-12">
          <SectionHeader title="SECCIÓN I - INFORMACIÓN DEL REGISTRO" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label required>Empresa</Label>
              <Input name="empresa" value={formData.empresa} required />
            </div>
            <div>
              <Label required>N° del registro</Label>
              <Input name="numero_registro" value={formData.numero_registro} required />
            </div>
            <div>
              <Label required>Oficina</Label>
              <Input name="oficina" value={formData.oficina} required />
            </div>
            <div>
              <Label>Fecha del registro</Label>
              <Input type="date" name="fecha_registro" value={formData.fecha_registro} />
            </div>
          </div>

          <SectionHeader title="SECCIÓN II - IDENTIDAD DE LA PERSONA QUE FÍSICAMENTE REALIZA LA OPERACIÓN" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Documento de Identidad</Label>
              <Select name="id_tipo_doc_fisica" value={formData.id_tipo_doc_fisica} options={lookups.tipo_doc} />
            </div>
            <div>
              <Label>N° de Documento</Label>
              <Input name="num_doc_fisica" value={formData.num_doc_fisica} />
            </div>
            <div>
              <Label>Nombres</Label>
              <Input name="nombres_fisica" value={formData.nombres_fisica} />
            </div>
            <div>
              <Label>Apellidos</Label>
              <Input name="apellidos_fisica" value={formData.apellidos_fisica} />
            </div>
            <div>
              <Label>Fecha de nacimiento</Label>
              <Input type="date" name="fec_nac_fisica" value={formData.fec_nac_fisica} />
            </div>
            <div>
              <Label>Nacionalidad</Label>
              <Select name="nacionalidad_fisica" value={formData.nacionalidad_fisica} options={lookups.paises} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input name="telefono_fisica" value={formData.telefono_fisica} />
            </div>
            <div>
              <Label>Profesión u ocupación</Label>
              <Input name="profesion_fisica" value={formData.profesion_fisica} />
            </div>
            <div className="md:col-span-1">
              <Label>Domicilio</Label>
              <Input name="domicilio_fisica" value={formData.domicilio_fisica} />
            </div>
            <div>
              <Label>Código Postal</Label>
              <Input name="cod_postal_fisica" value={formData.cod_postal_fisica} />
            </div>
            <div>
              <Label>Departamento</Label>
              <Select name="departamento_fisica" value={formData.departamento_fisica} options={[{id:'Lima', nombre:'Lima'}]} />
            </div>
            <div>
              <Label>Provincia</Label>
              <Select name="provincia_fisica" value={formData.provincia_fisica} options={[{id:'Lima', nombre:'Lima'}]} />
            </div>
            <div>
              <Label>Distrito</Label>
              <Select name="distrito_fisica" value={formData.distrito_fisica} options={[{id:'Miraflores', nombre:'Miraflores'}]} />
            </div>
          </div>

          <SectionHeader title="SECCIÓN III - PERSONA EN CUYO NOMBRE SE REALIZA LA OPERACIÓN" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Documento de Identidad</Label>
              <Select name="id_tipo_doc_nombre" value={formData.id_tipo_doc_nombre} options={lookups.tipo_doc} />
            </div>
            <div>
              <Label>N° de Documento</Label>
              <Input name="num_doc_nombre" value={formData.num_doc_nombre} />
            </div>
            <div>
              <Label>Nombres</Label>
              <Input name="nombres_nombre" value={formData.nombres_nombre} />
            </div>
            <div>
              <Label>Apellidos</Label>
              <Input name="apellidos_nombre" value={formData.apellidos_nombre} />
            </div>
            <div>
              <Label>Fecha de nacimiento</Label>
              <Input type="date" name="fec_nac_nombre" value={formData.fec_nac_nombre} />
            </div>
            <div>
              <Label>Nacionalidad</Label>
              <Select name="nacionalidad_nombre" value={formData.nacionalidad_nombre} options={lookups.paises} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input name="telefono_nombre" value={formData.telefono_nombre} />
            </div>
            <div>
              <Label>Profesión u ocupación</Label>
              <Input name="profesion_nombre" value={formData.profesion_nombre} />
            </div>
            <div>
              <Label>Domicilio</Label>
              <Input name="domicilio_nombre" value={formData.domicilio_nombre} />
            </div>
            <div>
              <Label>Código Postal</Label>
              <Input name="cod_postal_nombre" value={formData.cod_postal_nombre} />
            </div>
            <div>
              <Label>Departamento</Label>
              <Select name="departamento_nombre" value={formData.departamento_nombre} options={[{id:'Lima', nombre:'Lima'}]} />
            </div>
            <div>
              <Label>Provincia</Label>
              <Select name="provincia_nombre" value={formData.provincia_nombre} options={[{id:'Lima', nombre:'Lima'}]} />
            </div>
            <div>
              <Label>Distrito</Label>
              <Select name="distrito_nombre" value={formData.distrito_nombre} options={[{id:'Miraflores', nombre:'Miraflores'}]} />
            </div>
          </div>

          <SectionHeader title="SECCIÓN IV - DESCRIPCIÓN DE LA OPERACIÓN" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Fecha de la operación</Label>
              <Input type="date" name="fec_operacion" value={formData.fec_operacion} />
            </div>
            <div>
              <Label>Lugar de realización</Label>
              <Input name="lugar_operacion" value={formData.lugar_operacion} />
            </div>
            <div>
              <Label>Modalidad de pago</Label>
              <Select name="modalidad_pago" value={formData.modalidad_pago} options={[{id:'Efectivo', nombre:'Efectivo'}, {id:'Transferencia', nombre:'Transferencia'}]} />
            </div>
            <div>
              <Label>Tipo de Moneda</Label>
              <Select name="tipo_moneda" value={formData.tipo_moneda} options={[{id:'PEN', nombre:'Soles'}, {id:'USD', nombre:'Dolares'}]} />
            </div>
            <div>
              <Label>Monto de la operación</Label>
              <Input type="number" name="monto_operacion" value={formData.monto_operacion} />
            </div>
            <div>
              <Label>Tipo de operación</Label>
              <Select name="tipo_operacion" value={formData.tipo_operacion} options={[{id:'Compra', nombre:'Compra'}, {id:'Venta', nombre:'Venta'}]} />
            </div>
            <div>
              <Label>N° de cuenta 1</Label>
              <Input name="nro_cuenta_1" value={formData.nro_cuenta_1} />
            </div>
            <div>
              <Label>N° de cuenta 2</Label>
              <Input name="nro_cuenta_2" value={formData.nro_cuenta_2} />
            </div>
            <div>
              <Label>N° de cuenta 3</Label>
              <Input name="nro_cuenta_3" value={formData.nro_cuenta_3} />
            </div>
          </div>

          <div className="flex items-center justify-between mt-8 border-t border-slate-300 pt-4">
            <h3 className="text-sm font-bold text-[#1e293b] uppercase">SECCIÓN V - BENEFICIARIOS MÚLTIPLES</h3>
            <button 
              type="button"
              onClick={addBeneficiary}
              className="bg-[#6200ee] text-white px-4 py-2 rounded-lg text-xs font-bold shadow hover:bg-[#5000ca] uppercase transition-all"
            >
              AÑADIR BENEFICIARIO
            </button>
          </div>

          <div className="mt-4 overflow-hidden border border-slate-200 rounded-lg bg-white shadow-sm">
            <table className="w-full text-left text-xs">
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
              className={`bg-[#6200ee] text-white px-8 py-3 rounded-xl text-sm font-bold shadow-xl hover:bg-[#5000ca] transition-all uppercase tracking-wider ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? "GUARDANDO..." : "REGISTRAR"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-display">
      <header className="px-8 py-4 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          <span className="text-indigo-600 cursor-pointer" onClick={() => navigate("/home")}>Inicio</span>
          <span className="mx-2">›</span>
          <span>Registro de Operaciones</span>
        </div>
        <button 
          onClick={() => setView("form")}
          className="bg-[#6200ee] text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-[#5000ca] transition-all uppercase"
        >
          NUEVO REGISTRO
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center gap-4">
            <span className="text-xs text-slate-500">Show</span>
            <select className="border border-slate-300 rounded text-xs px-2 py-1 outline-none">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
            <span className="text-xs text-slate-500">entries</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] font-medium text-[#1e293b]">
              <thead className="bg-[#e2e8f0] border-b border-slate-300">
                <tr>
                  <th className="px-4 py-3 border-r border-slate-300 w-12 text-center uppercase">ID</th>
                  <th className="px-4 py-3 border-r border-slate-300 uppercase">N° de registro</th>
                  <th className="px-4 py-3 border-r border-slate-300 uppercase">Persona que físicamente realiza la operación</th>
                  <th className="px-4 py-3 border-r border-slate-300 uppercase">Persona en cuyo nombre se realiza la operación</th>
                  <th className="px-4 py-3 border-r border-slate-300 uppercase">Oficina</th>
                  <th className="px-4 py-3 border-r border-slate-300 uppercase">Fecha de registro</th>
                  <th className="px-4 py-3 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {registros.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-slate-400 font-semibold text-lg italic bg-slate-50">
                      No hay datos disponibles
                    </td>
                  </tr>
                ) : (
                  registros.map((r, idx) => (
                    <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 border-r border-slate-200 text-center">{r.id}</td>
                      <td className="px-4 py-3 border-r border-slate-200 font-bold">{r.numero_registro}</td>
                      <td className="px-4 py-3 border-r border-slate-200 uppercase">{r.nombres_fisica} {r.apellidos_fisica}</td>
                      <td className="px-4 py-3 border-r border-slate-200 uppercase">{r.nombres_nombre} {r.apellidos_nombre}</td>
                      <td className="px-4 py-3 border-r border-slate-300 uppercase">{r.oficina}</td>
                      <td className="px-4 py-3 border-r border-slate-300">{r.fecha_registro.split('T')[0]}</td>
                      <td className="px-4 py-3">
                        <button className="text-indigo-600 hover:underline">Ver detalle</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
            <button className="bg-[#eef2ff] text-slate-400 px-4 py-1 rounded text-xs font-semibold cursor-not-allowed">Anterior</button>
            <button className="bg-[#eef2ff] text-slate-400 px-4 py-1 rounded text-xs font-semibold cursor-not-allowed">Siguiente</button>
          </div>
        </div>
      </main>


    </div>
  );
}
