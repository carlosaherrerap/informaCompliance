import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, Flex, Text, Button, VStack, HStack, Heading, Select, Input, Textarea,
  FormControl, FormLabel, Grid, GridItem, useToast, Spinner
} from "@chakra-ui/react";
// Material Symbol Component Helper
const Icon = ({ name, size = "18px" }: { name: string, size?: string }) => (
  <Box as="span" className="material-symbols-outlined" fontSize={size}>{name}</Box>
);

import AreaProcessModal from "../components/AreaProcessModal";

// --- CONSTANTS & LOGIC ---

const PROB_LEVELS = [
  { val: "Muy Alta", desc: "Se produce de 5 a más veces al año" },
  { val: "Alta", desc: "Se produce 2 a 4 veces al año" },
  { val: "Media", desc: "Se produce 1 vez cada año" },
  { val: "Baja", desc: "Se produce 1 vez cada 3 años" },
  { val: "Muy Baja", desc: "Se produce 1 vez cada 5 o más años" }
];

const IMPACT_LEVELS = [
  { val: "Insignificante", min: 0, max: 4599 },
  { val: "Menor", min: 4600, max: 229999 },
  { val: "Moderado", min: 230000, max: 459999 },
  { val: "Mayor", min: 460000, max: 919999 },
  { val: "Catastrófico", min: 920000, max: Infinity }
];

const ROWS_LABELS = ["Muy Alta", "Alta", "Media", "Baja", "Muy Baja"];
const COLS_LABELS = ["Insignificante", "Menor", "Moderado", "Mayor", "Catastrófico"];

// Lookup Tables for Residual Risk
// Values follow: [Operatividad(1..3)][Periocidad(1..3)]
const RESIDUAL_TABLES: Record<string, number[][]> = {
  // Scenario 1: DIRECTIVO + PREVENTIVO
  "NIVEL3: DIRECTIVO O AUTOMATICO_PREVENTIVO": [
    [0.8, 0.74, 0.66],
    [0.74, 0.679, 0.6],
    [0.66, 0.6, 0.52]
  ],
  // Scenario 2: DIRECTIVO + DETECTIVO
  "NIVEL3: DIRECTIVO O AUTOMATICO_DETECTIVO": [
    [0.7, 0.639, 0.56],
    [0.639, 0.58, 0.5],
    [0.56, 0.5, 0.42]
  ],
  // Scenario 3: ANALISTA + PREVENTIVO
  "NIVEL2: ANALISTA/COORDINADOR_PREVENTIVO": [
    [0.74, 0.68, 0.6],
    [0.68, 0.62, 0.54],
    [0.6, 0.54, 0.459]
  ],
  // Scenario 4: ANALISTA + DETECTIVO (Image capt_1 Table 1)
  "NIVEL2: ANALISTA/COORDINADOR_DETECTIVO": [
    [0.64, 0.58, 0.5],
    [0.58, 0.52, 0.439],
    [0.5, 0.439, 0.36]
  ],
  // Scenario 5: OPERATIVO + PREVENTIVO (Image capt_1 Table 2)
  "NIVEL3:OPERATIVO_PREVENTIVO": [
    [0.66, 0.6, 0.52],
    [0.6, 0.54, 0.46],
    [0.52, 0.46, 0.38]
  ],
  // Scenario 6: OPERATIVO + DETECTIVO (Image capt_1 Table 3)
  "NIVEL3:OPERATIVO_DETECTIVO": [
    [0.56, 0.499, 0.42],
    [0.499, 0.44, 0.36],
    [0.42, 0.36, 0.28]
  ]
};

const getInherentColor = (prob: string, impLabel: string) => {
  const pIdx = ROWS_LABELS.indexOf(prob);
  const iIdx = COLS_LABELS.indexOf(impLabel);
  if (pIdx === -1 || iIdx === -1) return "#FFFFFF";
  
  // Matrix matching user image:
  // Rows: Muy Alta, Alta, Media, Baja, Muy Baja
  // Cols: Insignificante, Menor, Moderado, Mayor, Catastrófico
  const HEATMAP_MATRIX = [
    ["#FFFF00", "#FFFF00", "#FF9900", "#FF0000", "#FF0000"], // Muy Alta
    ["#82E0AA", "#FFFF00", "#FFFF00", "#FF9900", "#FF0000"], // Alta
    ["#82E0AA", "#82E0AA", "#FFFF00", "#FFFF00", "#FF9900"], // Media
    ["#5DADE2", "#82E0AA", "#82E0AA", "#FFFF00", "#FFFF00"], // Baja
    ["#5DADE2", "#5DADE2", "#82E0AA", "#82E0AA", "#FFFF00"], // Muy Baja
  ];

  return HEATMAP_MATRIX[pIdx][iIdx];
};

// --- COMPONENT ---

export default function RiskRegisterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [areas, setAreas] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({
    tipo_empresa: "",
    titulo: "",
    area_id: "",
    proceso_id: "",
    detalle_riesgo: "",
    factor: "",
    probabilidad_opcion: "",
    probabilidad_nivel: "", // Description
    impacto_estimado: "",
    impacto_nivel: "", // Label
    riesgo_inherente_valor: "",
    riesgo_inherente_color: "#FFFFFF",

    control_descripcion: "",
    control_documento: "",
    control_area_id: "",
    control_periocidad: "",
    control_operatividad: "",
    control_tipo: "",
    control_supervision: "",
    control_frecuencia_oportuna: "SI",
    control_seguimiento_adecuado: "SI",
    riesgo_residual_valor: 0,
    riesgo_residual_color: "#FFFFFF",

    plan_accion: "",
    area_responsable_id: "",
    fecha_inicio: "",
    fecha_cierre: ""
  });

  const apiHost = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    fetchCatalogs();
    if (id) fetchDetail();
  }, [id]);

  const fetchCatalogs = async () => {
    try {
      const [a, l] = await Promise.all([
        fetch(`${apiHost}/matriz-riesgo/areas`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${apiHost}/matriz-riesgo/links`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
      ]);
      setAreas(Array.isArray(a) ? a : []);
      setLinks(Array.isArray(l) ? l : []);
    } catch (err) {
      console.error("Error fetching catalogs:", err);
      setAreas([]);
      setLinks([]);
    }
  };

  const fetchDetail = async () => {
    try {
      const res = await fetch(`${apiHost}/matriz-riesgo/analisis/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Format dates for input type="date"
        if (data.fecha_inicio) data.fecha_inicio = data.fecha_inicio.split('T')[0];
        if (data.fecha_cierre) data.fecha_cierre = data.fecha_cierre.split('T')[0];
        setFormData(data);
      }
    } catch {}
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };


  // --- LOGIC: Section 1 ---
  // Immediate label and color updates
  useEffect(() => {
    const prob = PROB_LEVELS.find(p => p.desc === formData.probabilidad_opcion);
    const probVal = prob ? prob.val : "";
    const impVal = Number(formData.impacto_estimado);
    const imp = IMPACT_LEVELS.find(i => impVal >= i.min && impVal <= i.max);
    const impLabel = imp ? imp.val : "";

    const color = getInherentColor(probVal, impLabel);

    if (probVal !== formData.probabilidad_nivel || impLabel !== formData.impacto_nivel || color !== formData.riesgo_inherente_color) {
      setFormData(prev => ({
        ...prev,
        probabilidad_nivel: probVal,
        impacto_nivel: impLabel,
        riesgo_inherente_color: color
      }));
    }
  }, [formData.probabilidad_opcion, formData.impacto_estimado]);

  const calculateInherent = () => {
    const probVal = formData.probabilidad_nivel;
    const impLabel = formData.impacto_nivel;
    const color = getInherentColor(probVal, impLabel);
    setFormData((prev: any) => ({
      ...prev,
      riesgo_inherente_color: color
    }));
  };

  // --- LOGIC: Section 2 ---
  // Automatic residual risk updates
  useEffect(() => {
    const key = `${formData.control_supervision}_${formData.control_tipo}`;
    const table = RESIDUAL_TABLES[key];
    
    const pOptions = ["PERMANENTE", "PERIODICO", "EVENTUAL"];
    const pIdx = pOptions.indexOf(formData.control_periocidad);
    
    const oOptions = ["AUTOMATICO", "SEMI-AUTOMATICO", "MANUAL"];
    const oIdx = oOptions.indexOf(formData.control_operatividad);

    if (table && pIdx !== -1 && oIdx !== -1) {
      let result = table[oIdx][pIdx];
      
      if (formData.control_frecuencia_oportuna === "NO") result = result / 2;
      if (formData.control_seguimiento_adecuado === "NO") result = result / 2;

      let color = "#82E0AA"; // Green (safe)
      if (result < 0.4) color = "#FF0000"; // Red (dangerous)
      else if (result < 0.6) color = "#FF9900"; // Orange
      
      const resVal = result.toFixed(3);
      if (resVal !== String(formData.riesgo_residual_valor) || color !== formData.riesgo_residual_color) {
        setFormData((prev: any) => ({
          ...prev,
          riesgo_residual_valor: resVal,
          riesgo_residual_color: color
        }));
      }
    }
  }, [
    formData.control_supervision, formData.control_tipo, 
    formData.control_periocidad, formData.control_operatividad,
    formData.control_frecuencia_oportuna, formData.control_seguimiento_adecuado
  ]);

  const handleSave = async (estado: "EDITANDO" | "REGISTRADO") => {
    setLoading(true);
    try {
      // Sanitize fields for backend (empty strings as null)
      const sanitized = { ...formData, estado };
      const toNull = ["area_id", "proceso_id", "control_area_id", "area_responsable_id", "impacto_estimado", "riesgo_residual_valor"];
      toNull.forEach(f => {
         if (sanitized[f] === "" || sanitized[f] === undefined) sanitized[f] = null;
      });

      // Map Booleans
      sanitized.control_frecuencia_oportuna = sanitized.control_frecuencia_oportuna === "SI";
      sanitized.control_seguimiento_adecuado = sanitized.control_seguimiento_adecuado === "SI";

      const url = id ? `${apiHost}/matriz-riesgo/analisis/${id}` : `${apiHost}/matriz-riesgo/analisis`;
      const method = id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(sanitized)
      });
      if (res.ok) {
        toast({ title: "Guardado con éxito", status: "success" });
        navigate("/matriz-riesgos");
      }
    } catch (err) {
      toast({ title: "Error al guardar", status: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Filter processes based on selected area
  const filteredProcesos = Array.isArray(links) 
    ? links.filter(l => String(l.id_area) === String(formData.area_id))
    : [];

  const HeatMapPreview = ({ prob, imp }: { prob: string, imp: string }) => (
    <Box border="1px solid" borderColor="gray.300" borderRadius="md" p={2} bg="gray.50">
       <Grid templateColumns="40px repeat(5, 1fr)" templateRows="repeat(5, 40px)" gap={1}>
          {ROWS_LABELS.map((row, rIdx) => (
             <React.Fragment key={row}>
                <GridItem display="flex" alignItems="center" justifyContent="center">
                   <Text fontSize="8px" fontWeight="bold" textAlign="center">{row}</Text>
                </GridItem>
                {COLS_LABELS.map((col, cIdx) => (
                   <GridItem 
                     key={col} 
                     bg={getInherentColor(row, col)} 
                     border="1px solid" borderColor="gray.800"
                     display="flex" alignItems="center" justifyContent="center"
                   >
                      {(row === prob && col === imp) && (
                         <Box boxSize={4} bg="black" borderRadius="full" border="2px solid white"></Box>
                      )}
                   </GridItem>
                ))}
             </React.Fragment>
          ))}
          <GridItem colStart={2} colSpan={5} pt={1}>
             <Flex justify="space-between">
                {COLS_LABELS.map(c => <Text key={c} fontSize="8px" fontWeight="bold" w="100%" textAlign="center">{c}</Text>)}
             </Flex>
          </GridItem>
       </Grid>
    </Box>
  );

  return (
    <Box minH="screen" bg="#F1F5F9" p={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <HStack fontSize="xs" color="gray.500" mb={1}>
            <Text color="primary" cursor="pointer" onClick={() => navigate("/home")}>Inicio</Text>
            <Text>›</Text>
            <Text>Registro de Riesgo</Text>
          </HStack>
          <Heading size="lg" fontWeight="black">Registro de Riesgo</Heading>
        </Box>
        <HStack>
           <Button leftIcon={<Icon name="settings" />} colorScheme="blue" variant="solid" onClick={() => setModalOpen(true)} fontWeight="bold">
               Vincular Áreas y Procesos
            </Button>
           <Button variant="solid" bg="#6200EE" color="white" size="sm" onClick={() => navigate("/matriz-riesgos")}>
              VOLVER
           </Button>
        </HStack>
      </Flex>

      <VStack spacing={8} align="stretch">
        {/* SECTION I: INHERENT RISK */}
        <Box bg="white" borderRadius="xl" shadow="sm" p={6} border="1px solid" borderColor="gray.200">
           <Heading size="sm" color="primary" mb={6}>Riesgo Inherente</Heading>
           <Flex gap={12}>
              <VStack flex={1} spacing={4} align="stretch">
                 <FormControl>
                    <FormLabel fontSize="sm" fontWeight="bold">Tipo de empresa</FormLabel>
                    <Select size="sm" name="tipo_empresa" value={formData.tipo_empresa} onChange={handleChange}>
                       <option value="">Seleccione el tipo</option>
                       <option>Pequeña empresa</option>
                       <option>Microempresa</option>
                       <option>Mediana empresa</option>
                       <option>Gran empresa</option>
                    </Select>
                 </FormControl>
                 <FormControl>
                    <FormLabel fontSize="sm" fontWeight="bold">Título</FormLabel>
                    <Input size="sm" name="titulo" value={formData.titulo} onChange={handleChange} />
                 </FormControl>
                 <Flex gap={4}>
                    <FormControl>
                       <FormLabel fontSize="sm" fontWeight="bold">Área de la empresa</FormLabel>
                       <Select size="sm" name="area_id" value={formData.area_id} onChange={handleChange}>
                          <option value="">Seleccione una área</option>
                          {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                       </Select>
                    </FormControl>
                    <FormControl>
                       <FormLabel fontSize="sm" fontWeight="bold">Proceso</FormLabel>
                        <Select size="sm" name="proceso_id" value={formData.proceso_id} onChange={handleChange} borderColor="gray.400">
                           <option value="">Seleccione un proceso</option>
                           {filteredProcesos.map(l => <option key={l.id_proceso} value={l.id_proceso}>{l.proceso_nombre}</option>)}
                        </Select>
                    </FormControl>
                 </Flex>
                 <FormControl>
                    <FormLabel fontSize="sm" fontWeight="bold">Detalle del Riesgo</FormLabel>
                    <Textarea size="sm" name="detalle_riesgo" value={formData.detalle_riesgo} onChange={handleChange} />
                 </FormControl>
                 <FormControl>
                    <FormLabel fontSize="sm" fontWeight="bold">Factor</FormLabel>
                    <Select size="sm" name="factor" value={formData.factor} onChange={handleChange}>
                       <option value="">Seleccione un factor</option>
                       <option>Eventos externos</option>
                       <option>Personas</option>
                       <option>Tecnología</option>
                       <option>Procesos</option>
                    </Select>
                 </FormControl>
                 <FormControl>
                    <FormLabel fontSize="sm" fontWeight="bold">Probabilidad</FormLabel>
                    <Select size="sm" name="probabilidad_opcion" value={formData.probabilidad_opcion} onChange={handleChange}>
                       <option value="">Seleccione una probabilidad</option>
                       {PROB_LEVELS.map(p => <option key={p.val} value={p.desc}>{p.desc}</option>)}
                    </Select>
                    <Text fontSize="xs" color="indigo.600" mt={1} fontWeight="bold">{formData.probabilidad_nivel || "..."}</Text>
                 </FormControl>
                 <FormControl>
                    <FormLabel fontSize="sm" fontWeight="bold">Impacto estimado (S/)</FormLabel>
                    <Input size="sm" type="number" name="impacto_estimado" value={formData.impacto_estimado} onChange={handleChange} />
                    <Text fontSize="xs" color="indigo.600" mt={1} fontWeight="bold">{formData.impacto_nivel || "..."}</Text>
                 </FormControl>
                 <Button colorScheme="blue" variant="solid" size="sm" w="fit-content" onClick={calculateInherent} fontWeight="bold">VER RIESGO INHERENTE</Button>
              </VStack>
              <Box flex={1} py={10}>
                 <HeatMapPreview prob={formData.probabilidad_nivel} imp={formData.impacto_nivel} />
              </Box>
           </Flex>
        </Box>

        {/* SECTION II: CONTROLS */}
        <Box bg="white" borderRadius="xl" shadow="sm" p={6} border="1px solid" borderColor="gray.200">
           <Heading size="sm" color="primary" mb={6}>Identificación de controles</Heading>
           <Flex gap={12}>
              <VStack flex={1} spacing={4} align="stretch">
                 <FormControl>
                    <FormLabel fontSize="sm" fontWeight="bold">Descripción del control</FormLabel>
                    <Textarea size="sm" name="control_descripcion" value={formData.control_descripcion} onChange={handleChange} />
                 </FormControl>
                 <FormControl>
                    <FormLabel fontSize="sm" fontWeight="bold">Documento fuente</FormLabel>
                    <Input size="sm" name="control_documento" value={formData.control_documento} onChange={handleChange} />
                 </FormControl>
                 <FormControl>
                    <FormLabel fontSize="sm" fontWeight="bold">Área de ejecución</FormLabel>
                    <Select size="sm" name="control_area_id" value={formData.control_area_id} onChange={handleChange}>
                       <option value="">Seleccione una área</option>
                       {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </Select>
                 </FormControl>
                 
                 <Heading size="xs" color="indigo.600" pt={4}>Diseño y ejecución</Heading>
                 <Flex gap={4}>
                    <FormControl>
                       <FormLabel fontSize="xs" fontWeight="bold">Periocidad</FormLabel>
                       <Select size="xs" name="control_periocidad" value={formData.control_periocidad} onChange={handleChange}>
                          <option value="">Seleccione periocidad</option>
                          <option>PERMANENTE</option>
                          <option>PERIODICO</option>
                          <option>EVENTUAL</option>
                       </Select>
                    </FormControl>
                    <FormControl>
                       <FormLabel fontSize="xs" fontWeight="bold">Operatividad</FormLabel>
                       <Select size="xs" name="control_operatividad" value={formData.control_operatividad} onChange={handleChange}>
                          <option value="">Seleccione operatividad</option>
                          <option>AUTOMATICO</option>
                          <option>SEMI-AUTOMATICO</option>
                          <option>MANUAL</option>
                       </Select>
                    </FormControl>
                 </Flex>
                 <Flex gap={4}>
                    <FormControl>
                       <FormLabel fontSize="xs" fontWeight="bold">Tipo de control</FormLabel>
                       <Select size="xs" name="control_tipo" value={formData.control_tipo} onChange={handleChange}>
                          <option value="">Seleccione tipo</option>
                          <option>PREVENTIVO</option>
                          <option>DETECTIVO</option>
                       </Select>
                    </FormControl>
                    <FormControl>
                       <FormLabel fontSize="xs" fontWeight="bold">Supervisión</FormLabel>
                       <Select size="xs" name="control_supervision" value={formData.control_supervision} onChange={handleChange}>
                          <option value="">Seleccione supervisión</option>
                          <option>NIVEL3: DIRECTIVO O AUTOMATICO</option>
                          <option>NIVEL2: ANALISTA/COORDINADOR</option>
                          <option>NIVEL3:OPERATIVO</option>
                       </Select>
                    </FormControl>
                 </Flex>
                 <Flex gap={4}>
                    <FormControl>
                       <FormLabel fontSize="xs" fontWeight="bold">Frecuencia oportuna de control</FormLabel>
                       <Select size="xs" name="control_frecuencia_oportuna" value={formData.control_frecuencia_oportuna} onChange={handleChange}>
                          <option>SI</option>
                          <option>NO</option>
                       </Select>
                    </FormControl>
                    <FormControl>
                       <FormLabel fontSize="xs" fontWeight="bold">Seguimiento adecuado</FormLabel>
                       <Select size="xs" name="control_seguimiento_adecuado" value={formData.control_seguimiento_adecuado} onChange={handleChange}>
                          <option>SI</option>
                          <option>NO</option>
                       </Select>
                    </FormControl>
                 </Flex>
                 
                 <Box py={2}>
                    <Text fontSize="md" fontWeight="black" color="indigo.800">
                       VALOR RESIDUAL: {formData.riesgo_residual_valor}
                    </Text>
                 </Box>
              </VStack>
              <Box flex={1} py={10}>
                 <HeatMapPreview prob={formData.probabilidad_nivel} imp={formData.impacto_nivel} />
              </Box>
           </Flex>
        </Box>

        {/* SECTION III: TREATMENT */}
        <Box bg="white" borderRadius="xl" shadow="sm" p={6} border="1px solid" borderColor="gray.200">
           <Heading size="sm" color="primary" mb={6}>Tratamiento e implementación</Heading>
           <Grid templateColumns="repeat(4, 1fr)" gap={6}>
              <GridItem colSpan={2}>
                 <FormControl>
                    <FormLabel fontSize="sm" fontWeight="bold">Plan de Acción</FormLabel>
                    <Textarea size="sm" name="plan_accion" value={formData.plan_accion} onChange={handleChange} />
                 </FormControl>
              </GridItem>
              <GridItem>
                 <FormControl>
                    <FormLabel fontSize="sm" fontWeight="bold">Área responsable</FormLabel>
                    <Select size="sm" name="area_responsable_id" value={formData.area_responsable_id} onChange={handleChange}>
                       <option value="">Seleccione una área</option>
                       {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </Select>
                 </FormControl>
              </GridItem>
              <GridItem>
                 <FormControl>
                    <FormLabel fontSize="sm" fontWeight="bold">Fecha de inicio</FormLabel>
                    <Input size="sm" type="date" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleChange} />
                 </FormControl>
                 <FormControl mt={4}>
                    <FormLabel fontSize="sm" fontWeight="bold">Fecha de cierre</FormLabel>
                    <Input size="sm" type="date" name="fecha_cierre" value={formData.fecha_cierre} onChange={handleChange} />
                 </FormControl>
              </GridItem>
           </Grid>
        </Box>

        {/* FOOTER BUTTONS */}
        <HStack pt={6} pb={12} spacing={4}>
           <Button bg="red.500" color="white" onClick={() => navigate("/matriz-riesgos")} _hover={{ bg: "red.600" }}>CANCELAR</Button>
            <Button colorScheme="blue" variant="solid" onClick={() => handleSave("EDITANDO")} isLoading={loading} fontWeight="bold">
               GUARDAR PROGRESO
            </Button>
            <Button colorScheme="green" variant="solid" onClick={() => handleSave("REGISTRADO")} isLoading={loading} fontWeight="bold">
               FINALIZAR REGISTRO
            </Button>
        </HStack>
      </VStack>

      <AreaProcessModal 
         isOpen={modalOpen} 
         onClose={() => { setModalOpen(false); fetchCatalogs(); }} 
         apiHost={apiHost} 
      />
    </Box>
  );
}
