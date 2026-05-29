import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { CIIU_OPTS } from "../data/ciiucodes";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

// ─── Scoring data (extracted from ToolsComply JS) ────────────────────────────
const OCUPATION_OPTS = [
  {v:"1",foo:"5|0.10",l:"ABOGADO"},{v:"52",foo:"3|0.10",l:"ACTOR, ACTRIZ, ARTISTA"},{v:"53",foo:"1|0.10",l:"ACTUARIO"},{v:"2",foo:"4|0.10",l:"ADMINISTRADOR DE EMPRESAS"},{v:"54",foo:"1|0.10",l:"ADUANERO/AGENTE DE ADUANAS"},{v:"55",foo:"1|0.10",l:"AEROMOZO/ AZAFATA"},{v:"56",foo:"3|0.10",l:"AGENTE / INTERMEDIARIO"},{v:"57",foo:"3|0.10",l:"AGENTE DE BOLSA"},{v:"58",foo:"3|0.10",l:"AGENTE DE INMIGRACION"},{v:"59",foo:"3|0.10",l:"AGENTE DE TURISMO/VIAJES"},{v:"60",foo:"3|0.10",l:"AGENTE/INTERMEDIARIO/CORREDOR"},{v:"3",foo:"4|0.10",l:"AGRONOMO O AFINES"},{v:"61",foo:"4|0.10",l:"ALBANIL, OBRERO DE CONSTRUCC"},{v:"62",foo:"4|0.10",l:"AMA DE CASA"},{v:"63",foo:"4|0.10",l:"ANALISTAS DE SISTEMA Y COMPU"},{v:"4",foo:"1|0.10",l:"ANTROPOLOGO, ARQUEOLOGO"},{v:"5",foo:"1|0.10",l:"ARCHIVERO"},{v:"64",foo:"1|0.10",l:"ARMADOR DE BARCO"},{v:"6",foo:"1|0.10",l:"ARQUITECTO, URBANISTA"},{v:"65",foo:"1|0.10",l:"ARTESANO"},{v:"66",foo:"1|0.10",l:"AVICULTOR"},{v:"67",foo:"1|0.10",l:"BASURERO / BARRENDERO"},{v:"7",foo:"1|0.10",l:"BIBLIOTECARIO"},{v:"8",foo:"1|0.10",l:"BIOLOGO"},{v:"9",foo:"1|0.10",l:"BOTANICO Y ZOOLOGO"},{v:"68",foo:"1|0.10",l:"CAJERO"},{v:"69",foo:"1|0.10",l:"CAMARERO / BARMAN / MESERO"},{v:"70",foo:"1|0.10",l:"CAMBISTA, COMPRA/VENTA MONEDA"},{v:"71",foo:"1|0.10",l:"CAMPESINO"},{v:"72",foo:"1|0.10",l:"CAPATAZ"},{v:"73",foo:"1|0.10",l:"CARGADOR"},{v:"74",foo:"4|0.10",l:"CARPINTERO"},{v:"75",foo:"1|0.10",l:"CARTERO"},{v:"76",foo:"1|0.10",l:"CERRAJERO"},{v:"77",foo:"1|0.10",l:"COBRADOR"},{v:"78",foo:"4|0.10",l:"COMERCIANTE / VENDEDOR"},{v:"79",foo:"1|0.10",l:"CONDUCTOR, CHOFER / TAXISTA"},{v:"80",foo:"1|0.10",l:"CONSERJE / PORTERO"},{v:"81",foo:"1|0.10",l:"CONSTRUCTOR"},{v:"10",foo:"5|0.10",l:"CONTADOR"},{v:"82",foo:"3|0.10",l:"CONTRATISTA"},{v:"83",foo:"1|0.10",l:"CORTE Y CONFECCION DE ROPA"},{v:"84",foo:"1|0.10",l:"COSMETOLOGO, PELUQUERO"},{v:"85",foo:"1|0.10",l:"DECORADOR, DIBUJANTE"},{v:"86",foo:"1|0.10",l:"DEPORTISTA PROFESIONAL"},{v:"11",foo:"1|0.10",l:"DERECHO CIENCIAS ECONOMICAS"},{v:"87",foo:"1|0.10",l:"DISTRIBUIDOR"},{v:"12",foo:"1|0.10",l:"DOCTOR"},{v:"13",foo:"4|0.10",l:"ECONOMISTA"},{v:"88",foo:"1|0.10",l:"ELECTRICISTA"},{v:"89",foo:"4|0.10",l:"EMPLEADA DEL HOGAR / NANA"},{v:"90",foo:"4|0.10",l:"EMPRESARIO EXPORTADOR"},{v:"14",foo:"1|0.10",l:"ENFERMERIA"},{v:"91",foo:"1|0.10",l:"ENSAMBLADOR"},{v:"15",foo:"1|0.10",l:"ESCRITOR, ARTISTA CREATIVOS"},{v:"92",foo:"1|0.10",l:"ESCULTOR"},{v:"16",foo:"1|0.10",l:"ESPECIALISTA EN COOPERATIVISMO"},{v:"93",foo:"4|0.10",l:"ESTUDIANTE"},{v:"17",foo:"1|0.10",l:"FARMACEUTICO"},{v:"18",foo:"1|0.10",l:"FARMACOLOGO, PATOLOGO"},{v:"19",foo:"1|0.10",l:"FILOLOGO, TRADUCTOR"},{v:"20",foo:"1|0.10",l:"FILOSOFO"},{v:"21",foo:"1|0.10",l:"FISICO"},{v:"22",foo:"1|0.10",l:"FUERZAS ARMADAS"},{v:"94",foo:"1|0.10",l:"GANADERO"},{v:"95",foo:"1|0.10",l:"GASFITERO"},{v:"23",foo:"1|0.10",l:"GEOGRAFO"},{v:"24",foo:"1|0.10",l:"GEOLOGO, GEOFISICO"},{v:"96",foo:"1|0.10",l:"HISTORIADOR"},{v:"25",foo:"4|0.10",l:"INGENIERO CIVIL"},{v:"26",foo:"4|0.10",l:"INGENIERO DE MINAS"},{v:"27",foo:"4|0.10",l:"INGENIERO DE SISTEMA"},{v:"28",foo:"4|0.10",l:"INGENIERO ELECTRICISTA"},{v:"29",foo:"4|0.10",l:"INGENIERO ESTADISTICO"},{v:"30",foo:"4|0.10",l:"INGENIERO INDUSTRIAL"},{v:"31",foo:"4|0.10",l:"INGENIERO MECANICO"},{v:"32",foo:"4|0.10",l:"INGENIERO PESQUERO"},{v:"33",foo:"4|0.10",l:"INGENIERO QUIMICO"},{v:"97",foo:"1|0.10",l:"JARDINERO"},{v:"98",foo:"1|0.10",l:"JOCKEY"},{v:"99",foo:"4|0.10",l:"JOYERO Y/O PLATERO"},{v:"100",foo:"4|0.10",l:"JUBILADO / PENSIONISTA"},{v:"101",foo:"1|0.10",l:"LABORATORISTA"},{v:"102",foo:"1|0.10",l:"LIQUIDADOR"},{v:"103",foo:"4|0.10",l:"MAQUINISTA / OPERADOR"},{v:"104",foo:"1|0.10",l:"MARTILLERO / SUBASTADOR"},{v:"34",foo:"1|0.10",l:"MATEMATICO O AFINES"},{v:"105",foo:"1|0.10",l:"MAYORISTA"},{v:"106",foo:"1|0.10",l:"MECANICO"},{v:"107",foo:"1|0.10",l:"METALURGISTA"},{v:"35",foo:"1|0.10",l:"METEOROLOGO"},{v:"36",foo:"1|0.10",l:"MICROBIOLOGO"},{v:"37",foo:"4|0.10",l:"NOTARIO"},{v:"38",foo:"1|0.10",l:"NUTRICIONISTA"},{v:"39",foo:"1|0.10",l:"OBSTETRIZ"},{v:"40",foo:"1|0.10",l:"ODONTOLOGO"},{v:"41",foo:"1|0.10",l:"OFICIO"},{v:"108",foo:"1|0.10",l:"ORGANIZADOR DE EVENTOS"},{v:"42",foo:"2|0.10",l:"OTRA INGENIERIA"},{v:"43",foo:"4|0.10",l:"OTRAS PROFESIONES"},{v:"109",foo:"1|0.10",l:"PANADERO / PASTELERO"},{v:"110",foo:"1|0.10",l:"PARAMEDICO"},{v:"111",foo:"2|0.10",l:"PERIODISTA"},{v:"112",foo:"2|0.10",l:"PERITO"},{v:"113",foo:"1|0.10",l:"PESCADOR"},{v:"114",foo:"1|0.10",l:"PILOTO"},{v:"115",foo:"1|0.10",l:"PINTOR"},{v:"116",foo:"4|0.10",l:"POLICIA MUNICIPAL"},{v:"117",foo:"4|0.10",l:"POLICIA PNP"},{v:"118",foo:"3|0.10",l:"PRODUCTOR DE CINE / RADIO / TV"},{v:"119",foo:"3|0.10",l:"PRODUCTOR, CULTIVOS EXTENSIVOS"},{v:"44",foo:"1|0.10",l:"PROFESIONAL TRABAJO SOCIAL"},{v:"45",foo:"4|0.10",l:"PROFESOR"},{v:"120",foo:"1|0.10",l:"PROGRAMADOR"},{v:"46",foo:"1|0.10",l:"PSICOLOGO"},{v:"47",foo:"2|0.10",l:"QUIMICO"},{v:"121",foo:"1|0.10",l:"QUIROPRACTICO"},{v:"122",foo:"1|0.10",l:"RELACIONISTA PUBLICO"},{v:"123",foo:"1|0.10",l:"RELOJERO"},{v:"124",foo:"1|0.10",l:"REPARACION DE AUTOMOVILES"},{v:"125",foo:"1|0.10",l:"REPARADOR APARATOS ELECTRONICOS"},{v:"126",foo:"1|0.10",l:"REPARTIDOR"},{v:"48",foo:"1|0.10",l:"SACERDOTE O RELIGIOSO"},{v:"127",foo:"1|0.10",l:"SECRETARIA, RECEPCIONISTA"},{v:"128",foo:"1|0.10",l:"SEGURIDAD / GUARDAESPALDA"},{v:"129",foo:"1|0.10",l:"SERVICIO DE ALMACENAMIENTO"},{v:"130",foo:"1|0.10",l:"SERVICIO ALQUILER VEHICULO"},{v:"131",foo:"1|0.10",l:"SERVICIO ALQUILER VIDEO"},{v:"51",foo:"3|0.10",l:"SIN PROFESION"},{v:"132",foo:"1|0.10",l:"SOCIOLOGO"},{v:"133",foo:"1|0.10",l:"TASADOR"},{v:"49",foo:"4|0.10",l:"TECNICO"},{v:"134",foo:"1|0.10",l:"TORERO"},{v:"135",foo:"1|0.10",l:"TRAMITADOR"},{v:"136",foo:"4|0.10",l:"TRANSPORTE DE CARGA"},{v:"137",foo:"4|0.10",l:"TRANSPORTISTA"},{v:"138",foo:"1|0.10",l:"VENDEDOR AMBULANTE"},{v:"50",foo:"1|0.10",l:"VETERINARIO"},{v:"139",foo:"1|0.10",l:"VISITADOR MEDICO"},{v:"140",foo:"1|0.10",l:"ZAPATERO"},
];

const OBLIGATION_OPTS = [
  {v:"10",foo:"4|0.08",l:"AGENCIAS DE VIAJES Y TURISMO"},{v:"4",foo:"4|0.08",l:"EMP. CUYOS SISTEMAS INFORMATICA PERMITAN OP. SOSPECHOSAS"},{v:"15",foo:"4|0.08",l:"LA COMISION DE LUCHA CONTRA DELITOS ADUANEROS"},{v:"22",foo:"4|0.08",l:"LAB. Y EMP. QUE PRODUCEN INSUMOS QUIMICOS"},{v:"16",foo:"4|0.08",l:"LABORAT. QUE PRODUCEN INSUMOS QUIMICOS Y/O EXPLOSIVOS"},{v:"14",foo:"4|0.08",l:"LOS DESPACHADORES DE IMPORTACION Y EXPORTACION"},{v:"1",foo:"4|0.08",l:"LOS FIDUCIARIOS O ADMINISTRADORES DE BIENES"},{v:"19",foo:"4|0.08",l:"LOS GESTORES DE INTERESES EN LA ADMINISTRACION PUBLICA"},{v:"12",foo:"4|0.08",l:"LOS MARTILLEROS PUBLICOS"},{v:"11",foo:"4|0.08",l:"LOS NOTARIOS PUBLICOS"},{v:"23",foo:"0|0.08",l:"N.A."},{v:"21",foo:"4|0.08",l:"PJ QUE DISTRIB. INSUMOS QUIMICOS EN MINERIA ILEGAL"},{v:"3",foo:"4|0.08",l:"PN/PJ DEDICADAS A CONSTRUCCION E INMOBILIARIAS"},{v:"2",foo:"4|0.08",l:"PN/PJ COMPRA Y VENTA DE VEHICULOS, AERONAVES"},{v:"17",foo:"4|0.08",l:"PN/PJ COMPRAVENTA O IMPORTACIONES DE ARMAS"},{v:"18",foo:"4|0.08",l:"PN/PJ FABRICACION MATERIALES EXPLOSIVOS"},{v:"8",foo:"4|0.08",l:"PN/PJ COMERCIO METALES, PIEDRAS PRECIOSAS"},{v:"20",foo:"4|0.08",l:"PN/PJ QUE COMERCIALIZAN MAQUINARIAS ARANCELARIAS"},{v:"13",foo:"4|0.08",l:"PN/PJ QUE RECIBAN DONACIONES O APORTES"},{v:"5",foo:"4|0.08",l:"PN/PJ QUE SE DEDIQUEN A COMPRA Y VENTA DE DIVISAS"},{v:"9",foo:"4|0.08",l:"PN/PJ QUE SE DEDIQUEN A PRESTAMOS Y EMPEÑO"},{v:"7",foo:"4|0.08",l:"PN/PJ QUE SE DEDIQUEN AL COMERCIO DE ANTIGÜEDADES"},{v:"6",foo:"4|0.08",l:"PN/PJ QUE SE DEDIQUEN AL SERVICIO DE CORREO Y COURIER"},
];

const SCSTATUS_OPTS = [
  {v:"3",foo:"3|0.12",l:"Ama de casa"},{v:"1",foo:"2|0.12",l:"Dependiente"},{v:"6",foo:"5|0.12",l:"Estudiante"},{v:"7",foo:"4|0.12",l:"Fuerzas Armadas"},{v:"4",foo:"3|0.12",l:"Independiente"},{v:"5",foo:"3|0.12",l:"Jubilado"},{v:"12",foo:"3|0.12",l:"Otros"},{v:"2",foo:"3|0.12",l:"Pensionista"},{v:"9",foo:"4|0.12",l:"Persona Natural con Negocio"},{v:"8",foo:"3|0.12",l:"Religioso"},{v:"10",foo:"4|0.12",l:"Rentista"},{v:"11",foo:"3|0.12",l:"Sin empleo"},
];

const SENSIBLE_OPTS = [
  {v:"2",foo:"3|0.10",l:"Extranjero"},{v:"6",foo:"5|0.10",l:"Fideicomisos"},{v:"7",foo:"5|0.10",l:"Listas negativas"},{v:"1",foo:"2|0.10",l:"Nacional"},{v:"3",foo:"4|0.10",l:"No residente"},{v:"5",foo:"5|0.10",l:"ONG"},{v:"4",foo:"5|0.10",l:"PEP"},
];

// Countries (condensed – same foo pattern)
const COUNTRY_OPTS = [
  {v:"1",foo:"5|0.06",l:"AFGHANISTAN"},{v:"85",foo:"2|0.06",l:"ALEMANIA"},{v:"11",foo:"3|0.06",l:"ARGENTINA"},{v:"12",foo:"2|0.06",l:"AUSTRALIA"},{v:"13",foo:"1|0.06",l:"AUSTRIA"},{v:"26",foo:"3|0.06",l:"BRASIL"},{v:"38",foo:"2|0.06",l:"CANADA"},{v:"44",foo:"2|0.06",l:"CHILE"},{v:"49",foo:"4|0.06",l:"COLOMBIA"},{v:"55",foo:"4|0.06",l:"COSTA RICA"},{v:"57",foo:"5|0.06",l:"CUBA"},{v:"61",foo:"2|0.06",l:"DINAMARCA"},{v:"64",foo:"4|0.06",l:"ECUADOR"},{v:"65",foo:"4|0.06",l:"EL SALVADOR"},{v:"205",foo:"2|0.06",l:"ESPAÑA"},{v:"234",foo:"2|0.06",l:"ESTADOS UNIDOS DE AMERICA"},{v:"74",foo:"2|0.06",l:"FINLANDIA"},{v:"76",foo:"2|0.06",l:"FRANCIA"},{v:"85",foo:"2|0.06",l:"ALEMANIA"},{v:"89",foo:"2|0.06",l:"GREECE"},{v:"100",foo:"4|0.06",l:"HONDURAS"},{v:"104",foo:"4|0.06",l:"INDIA"},{v:"106",foo:"5|0.06",l:"IRAN"},{v:"107",foo:"5|0.06",l:"IRAQ"},{v:"108",foo:"2|0.06",l:"IRLANDA"},{v:"111",foo:"2|0.06",l:"ITALIA"},{v:"114",foo:"2|0.06",l:"JAPON"},{v:"141",foo:"4|0.06",l:"MEXICO"},{v:"163",foo:"2|0.06",l:"NORUEGA"},{v:"170",foo:"5|0.06",l:"PANAMA"},{v:"172",foo:"4|0.06",l:"PARAGUAY"},{v:"173",foo:"3|0.06",l:"PERU"},{v:"176",foo:"2|0.06",l:"POLAND"},{v:"177",foo:"2|0.06",l:"PORTUGAL"},{v:"231",foo:"2|0.06",l:"REINO UNIDO"},{v:"184",foo:"4|0.06",l:"RUSSIAN FEDERATION"},{v:"211",foo:"1|0.06",l:"SUECIA"},{v:"212",foo:"1|0.06",l:"SUIZA"},{v:"213",foo:"5|0.06",l:"SYRIAN ARAB REPUBLIC"},{v:"237",foo:"4|0.06",l:"URUGUAY"},{v:"239",foo:"5|0.06",l:"VENEZUELA"},{v:"242",foo:"5|0.06",l:"YEMEN"},
];

const OFFICE_OPTS = [
  {v:"1",foo:"4|0.04",l:"Amazonas"},{v:"2",foo:"3|0.04",l:"Ancash"},{v:"3",foo:"1|0.04",l:"Apurimac"},{v:"4",foo:"3|0.04",l:"Arequipa"},{v:"5",foo:"5|0.04",l:"Ayacucho"},{v:"6",foo:"3|0.04",l:"Cajamarca"},{v:"7",foo:"3|0.04",l:"Callao"},{v:"8",foo:"5|0.04",l:"Cusco"},{v:"9",foo:"4|0.04",l:"Huancavelica"},{v:"10",foo:"2|0.04",l:"Huanuco"},{v:"11",foo:"3|0.04",l:"Ica"},{v:"12",foo:"4|0.04",l:"Junin"},{v:"13",foo:"4|0.04",l:"La Libertad"},{v:"14",foo:"2|0.04",l:"Lambayeque"},{v:"15",foo:"3|0.04",l:"Lima"},{v:"16",foo:"4|0.04",l:"Loreto"},{v:"17",foo:"3|0.04",l:"Madre de Dios"},{v:"18",foo:"1|0.04",l:"Moquegua"},{v:"19",foo:"4|0.04",l:"Pasco"},{v:"20",foo:"4|0.04",l:"Piura"},{v:"21",foo:"4|0.04",l:"Puno"},{v:"22",foo:"2|0.04",l:"San Martin"},{v:"23",foo:"3|0.04",l:"Tacna"},{v:"24",foo:"3|0.04",l:"Tumbes"},{v:"25",foo:"3|0.04",l:"Ucayali"},
];

const PRODUCT_OPTS = [
  {v:"19",foo:"4|0.12",l:"Agencias de viaje"},{v:"16",foo:"5|0.12",l:"Armas y municiones"},{v:"15",foo:"5|0.12",l:"Combustibles"},{v:"18",foo:"4|0.12",l:"Comercio de antiguedades"},{v:"3",foo:"5|0.12",l:"Criptomonedas"},{v:"17",foo:"5|0.12",l:"Explosivos"},{v:"5",foo:"5|0.12",l:"Fideicomisos"},{v:"2",foo:"5|0.12",l:"Fintech"},{v:"6",foo:"5|0.12",l:"Fondos de Inversion"},{v:"10",foo:"5|0.12",l:"Insumos químicos"},{v:"7",foo:"5|0.12",l:"Loterias"},{v:"12",foo:"4|0.12",l:"Metales preciosos"},{v:"1",foo:"5|0.12",l:"Nuevas tecnologías"},{v:"21",foo:"2|0.12",l:"Otros"},{v:"20",foo:"4|0.12",l:"Préstamos y empeño"},{v:"4",foo:"5|0.12",l:"Productos bancarios"},{v:"9",foo:"4|0.12",l:"Servicios contables"},{v:"11",foo:"4|0.12",l:"Servicios de transferencias de dinero"},{v:"8",foo:"4|0.12",l:"Servicios legales"},{v:"13",foo:"3|0.12",l:"Servicios notariales"},{v:"14",foo:"4|0.12",l:"Transferencias electrónicas"},
];

const FUNDING_OPTS = [
  {v:"10",foo:"3|0.10",l:"AHORROS EN EL SISTEMA FINANCIERO"},{v:"19",foo:"5|0.10",l:"AHORROS PERSONALES EN CASA"},{v:"27",foo:"3|0.10",l:"APORTE DE SOCIOS, ACCIONISTAS"},{v:"1",foo:"1|0.10",l:"CRÉDITO ENTIDAD"},{v:"12",foo:"3|0.10",l:"CUENTA CORRIENTE"},{v:"11",foo:"2|0.10",l:"DEPOSITOS A PLAZO"},{v:"2",foo:"5|0.10",l:"DONACIONES"},{v:"3",foo:"5|0.10",l:"ENDOSO DPF"},{v:"16",foo:"2|0.10",l:"FONDOS COLECTIVOS"},{v:"15",foo:"4|0.10",l:"FONDOS DE INVERSION"},{v:"14",foo:"1|0.10",l:"FONDOS MUTUOS"},{v:"4",foo:"1|0.10",l:"INDEMNIZACIONES LABORALES"},{v:"25",foo:"1|0.10",l:"INGRESOS POR VENTAS"},{v:"17",foo:"1|0.10",l:"INSTRUMENTOS FINANCIEROS CORTO PLAZO"},{v:"18",foo:"1|0.10",l:"INSTRUMENTOS FINANCIEROS LARGO PLAZO"},{v:"21",foo:"5|0.10",l:"JUNTAS O PANDEROS"},{v:"23",foo:"1|0.10",l:"LIQUIDACION DE BENEFICIOS SOCIALES"},{v:"20",foo:"5|0.10",l:"PRESTAMOS DE FAMILIARES, AMIGOS"},{v:"13",foo:"1|0.10",l:"PRESTAMOS DEL SISTEMA FINANCIERO"},{v:"5",foo:"3|0.10",l:"RECURSOS PROPIOS ACTIVIDAD"},{v:"26",foo:"3|0.10",l:"REMESAS DEL EXTERIOR"},{v:"6",foo:"1|0.10",l:"RESOLUCION JUBILACION ISS"},{v:"9",foo:"2|0.10",l:"SALARIO MENSUAL"},{v:"7",foo:"3|0.10",l:"SOSTENIMIENTO FAMILIAR"},{v:"22",foo:"2|0.10",l:"SUELDOS, HONORARIOS, PENSIONES"},{v:"24",foo:"1|0.10",l:"UTILIDADES"},{v:"8",foo:"4|0.10",l:"VENTA DE UN ACTIVO"},
];

const CURRENCY_OPTS = [
  {v:"1",foo:"1|0.02",l:"PEN (Soles)"},{v:"2",foo:"2|0.02",l:"USD (Dólares)"},
];

// ─── Algorithm (exact replica from ToolsComply) ───────────────────────────────
function calc(foo: string): number {
  const [pts, wt] = foo.split("|");
  return Number(pts) * Number(wt);
}

function calcAmount(amount: number): number {
  let risk = 0;
  if (amount >= 0 && amount <= 770.64) risk = 1;
  else if (amount <= 11305.89) risk = 2;
  else if (amount <= 103690.66) risk = 3;
  else if (amount <= 196075.42) risk = 4;
  else if (amount <= 1000000) risk = 5;
  return risk * 0.05;
}

function calcAge(age: number): number {
  let risk = 0;
  if (age >= 0 && age <= 20) risk = 4;
  else if (age <= 38) risk = 3;
  else if (age <= 57) risk = 2;
  else if (age <= 120) risk = 1;
  return risk * 0.05;
}

function getAge(birthday: string): number {
  const diff = Date.now() - new Date(birthday).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
}

function getRiskLevel(total: number) {
  if (total <= 1.8) return { label: "Mínimo", color: "#469BE7", bg: "#EBF4FD", badge: "bg-blue-100 text-blue-700" };
  if (total <= 2.6) return { label: "Leve", color: "#429A46", bg: "#EAF5EA", badge: "bg-green-100 text-green-700" };
  if (total <= 3.4) return { label: "Moderado", color: "#B8A700", bg: "#FFFBE6", badge: "bg-yellow-100 text-yellow-700" };
  if (total <= 4.2) return { label: "Alto", color: "#FF8A00", bg: "#FFF3E0", badge: "bg-orange-100 text-orange-700" };
  return { label: "Muy Alto", color: "#FF0000", bg: "#FFEBEE", badge: "bg-red-100 text-red-700" };
}

// ─── Sidebar (same as other pages) ───────────────────────────────────────────
function Sidebar({ isOpen, isCollapsed, onClose, onToggle, userRole }: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const modules = [
    { name: "Listas Negativas", icon: "search", enabled: true, href: "/busqueda" },
    { name: "Matriz de Riesgos", icon: "grid_on", enabled: true, href: "/matriz-riesgos" },
    { name: "Scoring de Riesgo", icon: "trending_up", enabled: true, href: "/scoring" },
    { name: "Registro de Operaciones", icon: "assignment", enabled: true, href: "/registro-operaciones" },
    { name: "Canal de Denuncias", icon: "campaign", enabled: false, href: "/denuncias" },
    { name: "Mis Cursos", icon: "school", enabled: false, href: "/mis-cursos" },
    { name: "Administrador", icon: "admin_panel_settings", enabled: userRole === "admin", href: "/load" },
  ];
  return (
    <aside className={`fixed lg:static inset-y-0 left-0 z-50 bg-[#111827] flex flex-col shrink-0 transition-all duration-300 transform ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${isCollapsed ? "w-20" : "w-72"}`}>
      <div className={`h-20 flex items-center px-6 bg-white border-b border-slate-200 transition-all duration-300 ${isCollapsed ? "justify-center px-0" : "justify-between"}`}>
        {!isCollapsed && (<Link to="/home" className="flex items-center gap-3"><img src="/logo-informaPeru.jpg" alt="INFORMA PERÚ" className="h-8 w-auto object-contain" /></Link>)}
        {isCollapsed && (<Link to="/home" className="flex items-center justify-center"><img src="/logo.png" alt="IP" className="h-10 w-10 object-contain" /></Link>)}
        <button className="lg:hidden text-slate-400" onClick={onClose}><span className="material-symbols-outlined">close</span></button>
      </div>
      <style>{`.sb-scroll{overflow-y:auto;-ms-overflow-style:none;scrollbar-width:none;}.sb-scroll::-webkit-scrollbar{display:none;}`}</style>
      <nav className="flex-1 px-4 py-6 space-y-4 flex flex-col sb-scroll">
        <button onClick={onToggle} className="hidden lg:flex w-full items-center justify-center py-2 rounded-xl text-slate-500 hover:text-white hover:border hover:border-white transition-all mb-4">
          <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: isCollapsed ? "rotate(180deg)" : "none" }}>menu_open</span>
        </button>
        <div className="space-y-4">
          {!isCollapsed && <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Sistemas</p>}
          <div className="space-y-2">
            <button onClick={() => navigate("/home")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold uppercase text-[10px] tracking-wide text-slate-400 hover:text-white hover:border hover:border-white ${location.pathname === "/home" ? "border-2 border-white text-white" : "border border-transparent"} ${isCollapsed ? "justify-center" : ""}`} style={{ backgroundColor: "transparent" }}>
              <span className="material-symbols-outlined text-xl">home</span>
              {!isCollapsed && <span>Inicio</span>}
            </button>
            {modules.map((m) => {
              const isActive = location.pathname.startsWith(m.href);
              return (
                <button key={m.name} disabled={!m.enabled} onClick={() => navigate(m.href)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold uppercase text-[10px] tracking-wide text-slate-400 hover:text-white hover:border hover:border-white ${isActive ? "border-2 border-white text-white" : "border border-transparent"} ${!m.enabled ? "opacity-50 cursor-not-allowed" : ""} ${isCollapsed ? "justify-center" : ""}`} style={{ backgroundColor: "transparent" }}>
                  <span className="material-symbols-outlined text-xl">{m.icon}</span>
                  {!isCollapsed && (<span className="flex items-center gap-1.5"><span>{m.name}</span>{!m.enabled && <span className="material-symbols-outlined text-[12px] text-slate-400">lock</span>}</span>)}
                </button>
              );
            })}
          </div>
        </div>
        <div className="pt-4 mt-auto border-t border-white/5">
          <button className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:text-white hover:border hover:border-white transition-colors font-bold uppercase text-[10px] tracking-widest ${isCollapsed ? "justify-center" : ""}`} onClick={() => { localStorage.removeItem("auth_token"); window.location.href = "/login"; }}>
            <span className="material-symbols-outlined text-xl">logout</span>
            {!isCollapsed && <span>CERRAR SESIÓN</span>}
          </button>
        </div>
      </nav>
    </aside>
  );
}

// ─── Select Field Component ────────────────────────────────────────────────────
function ScoreSelect({ label, name, opts, value, onChange, required }: { label: string; name: string; opts: { v: string; foo: string; l: string }[]; value: string; onChange: (v: string, foo: string) => void; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select
        value={value}
        onChange={e => {
          const opt = opts.find(o => o.v === e.target.value);
          onChange(e.target.value, opt?.foo || "");
        }}
        className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all appearance-none cursor-pointer"
      >
        <option value="">Seleccione...</option>
        {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ScoringNaturalPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState("user");

  // Form state – foo values stored for scoring
  const [form, setForm] = useState({
    fullname: "", identification: "",
    birthday: "",
    transaction: "",
    hasCompany: "" as "" | "si" | "no",
    // scored fields
    ocupation: "", ocupationFoo: "",
    obligation: "", obligationFoo: "",
    ciu: "", ciuFoo: "",
    scstatus: "", scstatusFoo: "",
    sensible: "", sensibleFoo: "",
    country: "", countryFoo: "",
    office: "", officeFoo: "",
    residence: "", residenceFoo: "",
    product: "", productFoo: "",
    funding: "", fundingFoo: "",
    currency: "", currencyFoo: "",
    obs: "",
  });

  const [result, setResult] = useState<null | { total: number; client: number; location: number; other: number; risk: string; color: string; bg: string; badge: string }>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const hcRef = useRef<any>(null);

  useEffect(() => {
    const t = localStorage.getItem("auth_token") || "";
    if (t) { try { const p: any = JSON.parse(atob(t.split(".")[1])); setUserRole(p.role || "user"); } catch { } }
  }, []);

  // Load Highcharts dynamically
  useEffect(() => {
    if (!result || !chartRef.current) return;
    const existing = document.getElementById("hc-script");
    const render = () => {
      const HC = (window as any).Highcharts;
      if (!HC || !chartRef.current) return;
      if (hcRef.current) hcRef.current.destroy();
      hcRef.current = HC.chart(chartRef.current, {
        chart: { type: "bar", backgroundColor: "transparent", style: { fontFamily: "Inter, sans-serif" }, height: 220 },
        title: { text: "" },
        credits: { enabled: false },
        legend: { enabled: false },
        xAxis: { categories: ["Cliente", "Zona Geog.", "Producto/Otros"], labels: { style: { fontSize: "11px", fontWeight: "700", color: "#64748b" } }, lineWidth: 0, tickWidth: 0 },
        yAxis: { min: 0, max: 2, title: { text: "" }, labels: { style: { fontSize: "10px", color: "#94a3b8" } }, gridLineColor: "#f1f5f9" },
        plotOptions: {
          bar: {
            borderRadius: 6, dataLabels: { enabled: true, format: "{y:.2f}", style: { fontWeight: "800", fontSize: "11px" } },
            colorByPoint: true,
          },
        },
        colors: [result.color, result.color + "CC", result.color + "88"],
        series: [{
          name: "Puntaje",
          data: [
            { y: parseFloat(result.client.toFixed(2)), color: { linearGradient: { x1: 0, x2: 1, y1: 0, y2: 0 }, stops: [[0, result.color + "FF"], [1, result.color + "44"]] } },
            { y: parseFloat(result.location.toFixed(2)), color: { linearGradient: { x1: 0, x2: 1, y1: 0, y2: 0 }, stops: [[0, result.color + "CC"], [1, result.color + "22"]] } },
            { y: parseFloat(result.other.toFixed(2)), color: { linearGradient: { x1: 0, x2: 1, y1: 0, y2: 0 }, stops: [[0, result.color + "AA"], [1, result.color + "11"]] } },
          ],
        }],
        tooltip: { formatter: function (this: any) { return `<b>${this.x}</b>: <span style="color:${result.color}"><b>${this.y.toFixed(3)}</b></span>`; } },
      });
    };
    if (!existing) {
      const script = document.createElement("script");
      script.id = "hc-script";
      script.src = "https://code.highcharts.com/highcharts.js";
      script.onload = render;
      document.head.appendChild(script);
    } else {
      if ((window as any).Highcharts) render();
      else existing.addEventListener("load", render);
    }
    return () => { if (hcRef.current) { hcRef.current.destroy(); hcRef.current = null; } };
  }, [result]);

  const updateField = (field: string, value: string, fooField?: string, foo?: string) => {
    setForm(prev => ({ ...prev, [field]: value, ...(fooField ? { [fooField]: foo || "" } : {}) }));
  };

  const handleEjecutar = () => {
    if (!form.birthday) { alert("¡Completar Fecha de Nacimiento para realizar el cálculo!"); return; }
    if (!form.transaction) { alert("¡Completar Monto de Transacción para realizar el cálculo!"); return; }
    if (!form.hasCompany) { alert("¡Seleccionar Persona Natural con Negocio!"); return; }
    // Validate required scored fields
    const required = [
      { field: form.ocupationFoo, name: "Ocupación/Profesión" },
      { field: form.obligationFoo, name: "Condición Sujeto Obligado" },
      { field: form.hasCompany === "si" ? form.ciuFoo : form.scstatusFoo, name: "CIIU / Estado" },
      { field: form.sensibleFoo, name: "Cliente Sensible" },
      { field: form.countryFoo, name: "Nacionalidad" },
      { field: form.officeFoo, name: "Oficina de Atención" },
      { field: form.residenceFoo, name: "Residencia" },
      { field: form.productFoo, name: "Producto/Servicio" },
      { field: form.fundingFoo, name: "Origen de Fondos" },
      { field: form.currencyFoo, name: "Moneda" },
    ];
    for (const r of required) {
      if (!r.field) { alert(`¡Completar el campo ${r.name} para realizar el cálculo!`); return; }
    }
    setLoading(true);
    setSaved(false);
    setTimeout(() => {
      const age = getAge(form.birthday);
      const amount = Number(form.transaction);
      const clientScore =
        calc(form.ocupationFoo) +
        calc(form.obligationFoo) +
        (form.hasCompany === "si" ? calc(form.ciuFoo) : calc(form.scstatusFoo)) +
        calc(form.sensibleFoo) +
        calcAmount(amount) +
        calcAge(age);
      const locationScore =
        calc(form.countryFoo) +
        calc(form.officeFoo) +
        calc(form.residenceFoo);
      const otherScore =
        calc(form.productFoo) +
        calc(form.fundingFoo) +
        calc(form.currencyFoo);
      const total = clientScore + locationScore + otherScore;
      const risk = getRiskLevel(total);
      setResult({ total, client: clientScore, location: locationScore, other: otherScore, risk: risk.label, color: risk.color, bg: risk.bg, badge: risk.badge });
      setLoading(false);
    }, 600);
  };

  const handleSave = async () => {
    if (!result) return;
    const token = localStorage.getItem("auth_token") || "";
    try {
      await fetch(`${apiUrl}/scoring`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id_entidad: null,
          puntaje: result.total,
          sustento: form.obs || "",
          categoria: result.risk,
          payload: form,
          tipo: "natural",
        }),
      });
      setSaved(true);
    } catch { alert("Error al guardar el scoring."); }
  };

  return (
    <div className="h-screen flex flex-col bg-[#F4F7FA] overflow-hidden font-sans text-[#111318]">
      <div className="flex h-screen overflow-hidden relative">
        <Sidebar isOpen={sidebarOpen} isCollapsed={collapsed} onClose={() => setSidebarOpen(false)} onToggle={() => setCollapsed(!collapsed)} userRole={userRole} />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-8 shrink-0 z-40">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setSidebarOpen(true)}>
                <span className="material-symbols-outlined">menu</span>
              </button>
              <nav className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <button onClick={() => navigate("/scoring")} className="hover:text-slate-700 transition-colors">Scoring de Riesgo</button>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-indigo-600">Persona Natural</span>
              </nav>
            </div>
            <button onClick={() => navigate("/scoring")} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Volver
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Page title */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <span className="material-symbols-outlined text-white text-lg">person</span>
                </div>
                <div>
                  <h1 className="text-lg font-black text-slate-900 uppercase tracking-widest">Scoring — Persona Natural</h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Complete todos los campos y presione EJECUTAR</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* ── Form Column ─── */}
                <div className="xl:col-span-2 space-y-5">

                  {/* SECCIÓN: CLIENTE */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                      <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-indigo-600 text-[14px]">person</span>
                      </div>
                      <h2 className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Sección I — Datos del Cliente</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Non-scored fields */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre Completo</label>
                        <input value={form.fullname} onChange={e => updateField("fullname", e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-300 transition-all" placeholder="EJ: JUAN PEREZ GARCIA" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DNI</label>
                        <input value={form.identification} onChange={e => updateField("identification", e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-300 transition-all" placeholder="45672831" />
                      </div>
                      {/* Scored fields */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha de Nacimiento <span className="text-red-500">*</span></label>
                        <input type="date" value={form.birthday} onChange={e => updateField("birthday", e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-300 transition-all" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monto Transacción S/. <span className="text-red-500">*</span></label>
                        <input type="number" value={form.transaction} onChange={e => updateField("transaction", e.target.value)} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-300 transition-all" placeholder="0.00" />
                      </div>

                      <ScoreSelect label="Ocupación / Profesión *" name="ocupation" opts={OCUPATION_OPTS} value={form.ocupation}
                        onChange={(v, foo) => setForm(p => ({ ...p, ocupation: v, ocupationFoo: foo }))} />

                      <ScoreSelect label="Condición Sujeto Obligado *" name="obligation" opts={OBLIGATION_OPTS} value={form.obligation}
                        onChange={(v, foo) => setForm(p => ({ ...p, obligation: v, obligationFoo: foo }))} />

                      {/* PN con Negocio toggle */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Persona Natural con Negocio <span className="text-red-500">*</span></label>
                        <select value={form.hasCompany} onChange={e => setForm(p => ({ ...p, hasCompany: e.target.value as any, ciu: "", ciuFoo: "", scstatus: "", scstatusFoo: "" }))}
                          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-300 transition-all appearance-none">
                          <option value="">Seleccione...</option>
                          <option value="si">SÍ</option>
                          <option value="no">NO</option>
                        </select>
                      </div>

                      {form.hasCompany === "no" && (
                        <ScoreSelect label="Estado Laboral *" name="scstatus" opts={SCSTATUS_OPTS} value={form.scstatus}
                          onChange={(v, foo) => setForm(p => ({ ...p, scstatus: v, scstatusFoo: foo }))} />
                      )}

                      {form.hasCompany === "si" && (
                        <ScoreSelect label="CIIU (Giro del Negocio) *" name="ciu" opts={CIIU_OPTS} value={form.ciu}
                          onChange={(v, foo) => setForm(p => ({ ...p, ciu: v, ciuFoo: foo }))} />
                      )}

                      <ScoreSelect label="Cliente Sensible *" name="sensible" opts={SENSIBLE_OPTS} value={form.sensible}
                        onChange={(v, foo) => setForm(p => ({ ...p, sensible: v, sensibleFoo: foo }))} />
                    </div>
                  </div>

                  {/* SECCIÓN: ZONA GEOGRÁFICA */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                      <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-orange-500 text-[14px]">public</span>
                      </div>
                      <h2 className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Sección II — Zona Geográfica</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                      <ScoreSelect label="Nacionalidad (País) *" name="country" opts={COUNTRY_OPTS} value={form.country}
                        onChange={(v, foo) => setForm(p => ({ ...p, country: v, countryFoo: foo }))} />
                      <ScoreSelect label="Residencia *" name="residence" opts={COUNTRY_OPTS} value={form.residence}
                        onChange={(v, foo) => setForm(p => ({ ...p, residence: v, residenceFoo: foo }))} />
                      <ScoreSelect label="Oficina de Atención *" name="office" opts={OFFICE_OPTS} value={form.office}
                        onChange={(v, foo) => setForm(p => ({ ...p, office: v, officeFoo: foo }))} />
                    </div>
                  </div>

                  {/* SECCIÓN: PRODUCTO Y OTROS */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                      <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-emerald-600 text-[14px]">inventory_2</span>
                      </div>
                      <h2 className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Sección III — Producto y Otros Factores</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                      <ScoreSelect label="Producto / Servicio *" name="product" opts={PRODUCT_OPTS} value={form.product}
                        onChange={(v, foo) => setForm(p => ({ ...p, product: v, productFoo: foo }))} />
                      <ScoreSelect label="Origen de Fondos *" name="funding" opts={FUNDING_OPTS} value={form.funding}
                        onChange={(v, foo) => setForm(p => ({ ...p, funding: v, fundingFoo: foo }))} />
                      <ScoreSelect label="Moneda *" name="currency" opts={CURRENCY_OPTS} value={form.currency}
                        onChange={(v, foo) => setForm(p => ({ ...p, currency: v, currencyFoo: foo }))} />
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Observaciones</label>
                    <textarea value={form.obs} onChange={e => updateField("obs", e.target.value)} rows={3} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 outline-none focus:ring-2 focus:ring-indigo-300 transition-all resize-none" placeholder="Observaciones adicionales..." />
                  </div>
                </div>

                {/* ── Result Panel ─── */}
                <div className="space-y-5">
                  {/* Execute Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Clasificación de Riesgo</p>

                    {result ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: result.bg }}>
                          <div className="text-5xl font-black mb-2" style={{ color: result.color }}>{result.total.toFixed(2)}</div>
                          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest ${result.badge}`}>
                            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: result.color }}></span>
                            Riesgo {result.risk}
                          </span>
                        </div>

                        {/* Highcharts */}
                        <div ref={chartRef} className="rounded-xl overflow-hidden" />

                        {/* breakdown */}
                        <div className="space-y-2">
                          {[
                            { label: "Cliente", val: result.client },
                            { label: "Zona Geográfica", val: result.location },
                            { label: "Producto / Otros", val: result.other },
                          ].map(row => (
                            <div key={row.label} className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">{row.label}</span>
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 rounded-full w-24 bg-slate-100 overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (row.val / 5) * 100)}%`, backgroundColor: result.color }} />
                                </div>
                                <span className="text-[10px] font-black tabular-nums" style={{ color: result.color }}>{row.val.toFixed(3)}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {saved && (
                          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Guardado exitosamente</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-10 flex flex-col items-center gap-3 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                          <span className="material-symbols-outlined text-slate-300 text-3xl">analytics</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Complete el formulario y presione Ejecutar</p>
                      </div>
                    )}

                    <button
                      onClick={handleEjecutar}
                      disabled={loading}
                      className={`w-full py-3.5 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${loading ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5"}`}
                    >
                      {loading ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Calculando...</span></>
                      ) : (
                        <><span className="material-symbols-outlined text-[18px]">play_arrow</span><span>Ejecutar</span></>
                      )}
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => navigate("/scoring")} className="py-3 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
                        Cancelar
                      </button>
                      <button onClick={handleSave} disabled={!result || saved} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!result || saved ? "bg-slate-100 text-slate-300 cursor-not-allowed" : "bg-slate-900 text-white hover:bg-slate-800"}`}>
                        {saved ? "✓ Guardado" : "Guardar"}
                      </button>
                    </div>
                  </div>

                  {/* Risk Scale Legend */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Escala de Riesgo</p>
                    {[
                      { range: "0 – 1.80", label: "Mínimo", color: "#469BE7" },
                      { range: "1.80 – 2.60", label: "Leve", color: "#429A46" },
                      { range: "2.60 – 3.40", label: "Moderado", color: "#BFAD00" },
                      { range: "3.40 – 4.20", label: "Alto", color: "#FF8A00" },
                      { range: "4.20 – 5.00", label: "Muy Alto", color: "#FF0000" },
                    ].map(r => (
                      <div key={r.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                          <span className="text-[10px] font-black uppercase" style={{ color: r.color }}>{r.label}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 tabular-nums">{r.range}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer className="py-3 bg-white border-t border-slate-100 flex items-center justify-center shrink-0">
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">@COPYRIGHT · DESARROLLADO POR EL AREA DE TI - INFORMAPERU · 2026</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
