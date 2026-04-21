import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Flex, Text, Button, Table, Thead, Tbody, Tr, Th, Td, IconButton,
  HStack, Heading, Select, Input, Badge, Spinner
} from "@chakra-ui/react";
// Material Symbol Component Helper
const Icon = ({ name, size = "20px" }: { name: string, size?: string }) => (
  <Box as="span" className="material-symbols-outlined" fontSize={size}>{name}</Box>
);

// Mock/Helpful types
interface RiskAnalysis {
  id: number;
  titulo: string;
  fecha_creacion: string;
  fecha_cierre: string;
  riesgo_inherente_color: string;
  riesgo_residual_color: string;
  estado: string;
  probabilidad_nivel: string;
  impacto_nivel: string;
}

const HEATMAP_ROWS = ["Muy Alta", "Alta", "Media", "Baja", "Muy Baja"];
const HEATMAP_COLS = ["Insignificante", "Menor", "Moderado", "Mayor", "Catastrófico"];

// Matrix colors based on logic (standard Risk Matrix)
const HEATMAP_MATRIX = [
  ["#FFFF00", "#FFFF00", "#FF9900", "#FF0000", "#FF0000"], // Muy Alta
  ["#82E0AA", "#FFFF00", "#FFFF00", "#FF9900", "#FF0000"], // Alta
  ["#82E0AA", "#82E0AA", "#FFFF00", "#FFFF00", "#FF9900"], // Media
  ["#5DADE2", "#82E0AA", "#82E0AA", "#FFFF00", "#FFFF00"], // Baja
  ["#5DADE2", "#5DADE2", "#82E0AA", "#82E0AA", "#FFFF00"], // Muy Baja
];

const getCellColor = (probIdx: number, impIdx: number) => {
  if (probIdx < 0 || probIdx >= 5 || impIdx < 0 || impIdx >= 5) return "#FFFFFF";
  return HEATMAP_MATRIX[probIdx][impIdx];
};

export default function RiskMatrixPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<RiskAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const apiHost = "http://localhost:8080";
  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${apiHost}/matriz-riesgo/analisis`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCountInCell = (row: string, col: string) => {
    return data.filter(d => d.probabilidad_nivel === row && d.impacto_nivel === col).length;
  };

  const getDistributionData = () => {
    const counts = { blue: 0, green: 0, yellow: 0, orange: 0, red: 0 };
    data.forEach(d => {
       const col = d.riesgo_residual_color?.toUpperCase();
       if (col === "#5DADE2") counts.blue++;
       else if (col === "#82E0AA") counts.green++;
       else if (col === "#FFFF00") counts.yellow++;
       else if (col === "#FF9900") counts.orange++;
       else if (col === "#FF0000") counts.red++;
    });
    const total = data.length || 1;
    return {
      blue: (counts.blue / total) * 100,
      green: (counts.green / total) * 100,
      yellow: (counts.yellow / total) * 100,
      orange: (counts.orange / total) * 100,
      red: (counts.red / total) * 100,
      counts
    };
  };

  const dist = getDistributionData();

  return (
    <Box minH="screen" bg="#F1F5F9" p={8}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <HStack fontSize="xs" color="gray.500" mb={1}>
            <Text color="primary" cursor="pointer" onClick={() => navigate("/home")}>Inicio</Text>
            <Text>›</Text>
            <Text>Matriz de Riesgos</Text>
          </HStack>
          <Heading size="lg" fontWeight="black">Matriz de Riesgos</Heading>
        </Box>
        <Button 
          bg="#6200EE" color="white" borderRadius="lg" px={8} size="md" 
          onClick={() => navigate("/registro-riesgo")}
          _hover={{ bg: "#5000ca" }}
          fontWeight="bold"
        >
          + NUEVO ANÁLISIS DE RIESGOS
        </Button>
      </Flex>

      {/* Top Section: Charts */}
      <Flex gap={8} mb={8}>
        {/* Heatmap Card */}
        <Box flex={1.5} bg="white" borderRadius="xl" shadow="sm" p={6}>
          <Heading size="sm" mb={6} color="gray.700">Mapa de calor de Riesgos Inherentes</Heading>
          <Flex>
             <Box w="40px" display="flex" alignItems="center" justifyContent="center">
                <Text style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} fontWeight="bold" fontSize="sm">Probabilidad</Text>
             </Box>
             <Box flex={1}>
                <Table variant="unstyled" border="1px solid" borderColor="gray.800" style={{ tableLayout: 'fixed' }}>
                  <Tbody>
                    {HEATMAP_ROWS.map((row, rIdx) => (
                      <Tr key={row} h="60px">
                        <Td border="1px solid" borderColor="gray.800" w="100px" p={1} textAlign="center" fontWeight="bold" fontSize="xs" bg="gray.50">{row}</Td>
                        {HEATMAP_COLS.map((col, cIdx) => {
                          const count = getCountInCell(row, col);
                          return (
                            <Td 
                              key={col} 
                              bg={getCellColor(rIdx, cIdx)} 
                              border="1px solid" borderColor="gray.800"
                              textAlign="center"
                              fontWeight="bold"
                              fontSize="md"
                            >
                              {count > 0 ? count : ""}
                            </Td>
                          );
                        })}
                      </Tr>
                    ))}
                    <Tr h="30px">
                      <Td></Td>
                      {HEATMAP_COLS.map(col => (
                        <Td key={col} textAlign="center" fontSize="xs" fontWeight="bold" pt={2}>{col}</Td>
                      ))}
                    </Tr>
                  </Tbody>
                </Table>
                <Box textAlign="center" mt={4} fontWeight="black" fontSize="md" textTransform="uppercase">Impacto</Box>
             </Box>
          </Flex>
        </Box>

        {/* Distribution Card */}
        <Box flex={1} bg="white" borderRadius="xl" shadow="sm" p={6}>
          <Heading size="sm" mb={6} color="gray.700">Gráfico de distribución de riesgos</Heading>
          <Flex align="center" justify="center" h="250px">
              <Box 
                position="relative" w="180px" h="180px" borderRadius="full" 
                style={{
                  background: `conic-gradient(
                    #5DADE2 0% ${dist.blue}%, 
                    #82E0AA ${dist.blue}% ${dist.blue + dist.green}%, 
                    #FFFF00 ${dist.blue + dist.green}% ${dist.blue + dist.green + dist.yellow}%, 
                    #FF9900 ${dist.blue + dist.green + dist.yellow}% ${dist.blue + dist.green + dist.yellow + dist.orange}%, 
                    #FF0000 ${dist.blue + dist.green + dist.yellow + dist.orange}% 100%
                  )`
                }}
              >
                {/* Center hole for doughnut effect */}
                <Box position="absolute" top="15%" left="15%" w="70%" h="70%" bg="white" borderRadius="full"></Box>
                
                <Flex direction="column" position="absolute" right="-140px" top="0" gap={3}>
                   <HStack><Box boxSize={4} borderRadius="full" bg="#5DADE2"></Box><Text fontSize="xs">Mínimo ({dist.counts.blue})</Text></HStack>
                   <HStack><Box boxSize={4} borderRadius="full" bg="#82E0AA"></Box><Text fontSize="xs">Leve ({dist.counts.green})</Text></HStack>
                   <HStack><Box boxSize={4} borderRadius="full" bg="#FFFF00"></Box><Text fontSize="xs">Moderado ({dist.counts.yellow})</Text></HStack>
                   <HStack><Box boxSize={4} borderRadius="full" bg="#FF9900"></Box><Text fontSize="xs">Alto ({dist.counts.orange})</Text></HStack>
                   <HStack><Box boxSize={4} borderRadius="full" bg="#FF0000"></Box><Text fontSize="xs">Muy alto ({dist.counts.red})</Text></HStack>
                </Flex>
              </Box>
          </Flex>
        </Box>
      </Flex>

      {/* BOTTOM SECTION: LIST */}
      <Box bg="white" borderRadius="xl" shadow="sm" overflow="hidden">
        <Box p={4} borderBottom="1px solid" borderColor="gray.200">
           <Heading size="xs" color="gray.600" textTransform="uppercase">LISTADO DE ANÁLISIS DE RIESGOS</Heading>
        </Box>
        
        <Box p={4} borderBottom="1px solid" borderColor="gray.100">
           <Flex justify="space-between" align="center">
              <HStack fontSize="xs" color="gray.500">
                 <Text>Mostrar</Text>
                 <Select size="xs" w="60px" borderRadius="md"><option>10</option></Select>
                 <Text>registros</Text>
              </HStack>
              <HStack>
                 <Text fontSize="xs">Buscar:</Text>
                 <Input size="xs" borderRadius="md" w="200px" />
              </HStack>
           </Flex>
        </Box>

        <Table variant="simple" size="sm">
          <Thead bg="gray.100">
            <Tr>
              <Th py={4} borderRight="1px solid" borderColor="gray.200">ID</Th>
              <Th borderRight="1px solid" borderColor="gray.200" w="30%">TÍtulo</Th>
              <Th borderRight="1px solid" borderColor="gray.200">Fecha de Creación</Th>
              <Th borderRight="1px solid" borderColor="gray.200">Fecha Fin de Tratamiento</Th>
              <Th borderRight="1px solid" borderColor="gray.200">Riesgo Inherente</Th>
              <Th borderRight="1px solid" borderColor="gray.200">Riesgo Residual</Th>
              <Th borderRight="1px solid" borderColor="gray.200">Estado</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
             {loading ? (
               <Tr><Td colSpan={8} py={10} textAlign="center"><Spinner color="primary" /></Td></Tr>
             ) : data.length === 0 ? (
               <Tr><Td colSpan={8} py={10} textAlign="center" color="gray.400">No hay registros aún</Td></Tr>
             ) : data.map(item => (
               <Tr key={item.id} _hover={{ bg: "gray.50" }}>
                 <Td>{item.id}</Td>
                 <Td fontWeight="bold">{item.titulo}</Td>
                 <Td>{new Date(item.fecha_creacion).toLocaleString()}</Td>
                 <Td>{item.fecha_cierre ? new Date(item.fecha_cierre).toLocaleDateString() : "-"}</Td>
                 <Td textAlign="center">
                    <Box boxSize={8} bg={item.riesgo_inherente_color} borderRadius="md" mx="auto"></Box>
                 </Td>
                 <Td textAlign="center">
                    <Box boxSize={8} bg={item.riesgo_residual_color} borderRadius="md" mx="auto"></Box>
                 </Td>
                  <Td>
                     <Badge colorScheme={item.estado === "REGISTRADO" ? "green" : "blue"} borderRadius="full" px={3}>
                        {item.estado === "REGISTRADO" ? "CERRADO" : "EDITANDO"}
                     </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                        {item.estado === "EDITANDO" ? (
                           <IconButton 
                              aria-label="Editar" icon={<Icon name="edit" />} size="xs" colorScheme="purple" variant="solid" 
                              onClick={() => navigate(`/registro-riesgo/${item.id}`)}
                           />
                        ) : (
                           <>
                              <IconButton 
                                 aria-label="Ver" icon={<Icon name="visibility" />} size="xs" colorScheme="purple" variant="ghost" 
                                 onClick={() => navigate(`/registro-riesgo/${item.id}`)}
                              />
                              <IconButton aria-label="Imprimir" icon={<Icon name="print" />} size="xs" colorScheme="blue" variant="ghost" />
                              <IconButton aria-label="Descargar" icon={<Icon name="download" />} size="xs" colorScheme="blue" variant="ghost" />
                           </>
                        )}
                    </HStack>
                  </Td>
               </Tr>
             ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
}
