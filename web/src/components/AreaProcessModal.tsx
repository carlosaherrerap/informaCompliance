import React, { useState, useEffect } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Box, Flex, Text, List, ListItem, IconButton, useToast,
  Divider, Select, Heading, VStack, HStack, Spinner
} from "@chakra-ui/react";
// Material Symbol Component Helper
const Icon = ({ name, size = "18px" }: { name: string, size?: string }) => (
  <Box as="span" className="material-symbols-outlined" fontSize={size}>{name}</Box>
);

interface AreaProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiHost: string;
}

export default function AreaProcessModal({ isOpen, onClose, apiHost }: AreaProcessModalProps) {
  const [areas, setAreas] = useState<any[]>([]);
  const [procesos, setProcesos] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [newArea, setNewArea] = useState("");
  const [newProceso, setNewProceso] = useState("");
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [selectedProceso, setSelectedProceso] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [a, p, l] = await Promise.all([
        fetch(`${apiHost}/matriz-riesgo/areas`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${apiHost}/matriz-riesgo/procesos`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${apiHost}/matriz-riesgo/links`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
      ]);
      setAreas(a);
      setProcesos(p);
      setLinks(l);
    } catch (err) {
      toast({ title: "Error al cargar datos", status: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArea = async () => {
    if (!newArea) return;
    try {
      const res = await fetch(`${apiHost}/matriz-riesgo/areas`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: newArea })
      });
      if (res.ok) {
        setNewArea("");
        fetchData();
      }
    } catch (err) {
      toast({ title: "Error al crear área", status: "error" });
    }
  };

  const handleCreateProceso = async () => {
    if (!newProceso) return;
    try {
      const res = await fetch(`${apiHost}/matriz-riesgo/procesos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: newProceso })
      });
      if (res.ok) {
        setNewProceso("");
        fetchData();
      }
    } catch (err) {
      toast({ title: "Error al crear proceso", status: "error" });
    }
  };

  const handleLink = async () => {
    if (!selectedArea || !selectedProceso) {
      toast({ title: "Seleccione un área y un proceso", status: "warning" });
      return;
    }
    try {
      const res = await fetch(`${apiHost}/matriz-riesgo/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id_area: selectedArea, id_proceso: selectedProceso })
      });
      if (res.ok) {
        fetchData();
        toast({ title: "Vínculo creado con éxito", status: "success" });
      }
    } catch (err) {
      toast({ title: "Error al vincular", status: "error" });
    }
  };

  const handleDeleteArea = async (id: number) => {
    try {
      await fetch(`${apiHost}/matriz-riesgo/areas/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {}
  };

  const handleDeleteProceso = async (id: number) => {
    try {
      await fetch(`${apiHost}/matriz-riesgo/procesos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {}
  };

  const handleDeleteLink = async (id: number) => {
    try {
      await fetch(`${apiHost}/matriz-riesgo/links/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {}
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent bg="white" borderRadius="none">
        <ModalHeader bg="primary" color="white" py={2} fontSize="md" fontWeight="black">
          GUESTIÓN DE ÁREAS Y PROCESOS
        </ModalHeader>
        <ModalBody p={6}>
          <Flex gap={8} h="500px">
            {/* AREAS COLUMN */}
            <VStack flex={1} align="stretch" spacing={4}>
              <Box>
                 <HStack mb={2} spacing={2} w="100%">
                  <Input 
                    placeholder="Buscar o nueva área..." 
                    value={newArea} onChange={e => setNewArea(e.target.value)}
                    size="sm" borderRadius="md" flex={1}
                    bg="white" border="1px solid" borderColor="gray.400"
                  />
                  <Button 
                    colorScheme="blue" variant="solid" size="sm" onClick={handleCreateArea} px={4}
                    flexShrink={0} fontWeight="bold"
                  >
                    AGREGAR
                  </Button>
                </HStack>
              </Box>

              <Box flex={1} border="1px solid" borderColor="gray.200" borderRadius="md" overflowY="auto" bg="gray.50">
                 <List spacing={0}>
                  {areas.filter(a => a.nombre.toLowerCase().includes(newArea.toLowerCase())).map(a => (
                    <ListItem 
                      key={a.id} 
                      px={3} py={2} 
                      bg={selectedArea === a.id ? "gray.200" : "transparent"}
                      cursor="pointer"
                      onClick={() => setSelectedArea(a.id)}
                      _hover={{ bg: "gray.100" }}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Text fontSize="sm" isTruncated mr={2}>{a.nombre}</Text>
                      <IconButton 
                        aria-label="Eliminar área"
                        icon={<Icon name="delete" />} 
                        size="xs" 
                        colorScheme="red" 
                        variant="solid" 
                        flexShrink={0}
                        onClick={(e) => { e.stopPropagation(); handleDeleteArea(a.id); }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </VStack>

            {/* ACTION COLUMN */}
            <VStack justify="center" px={4} spacing={6}>
              <Button 
                onClick={handleLink}
                bg="#4A5568" 
                color="white" 
                py={8} px={6} 
                textAlign="center" 
                fontSize="xs" 
                fontWeight="black"
                whiteSpace="normal"
                lineHeight="shorter"
                borderRadius="lg"
                _hover={{ bg: "#2D3748" }}
              >
                AÑADIR ESTOS PROCESOS
              </Button>
              <Icon name="link" size="24px" />
            </VStack>

            {/* PROCESS COLUMN */}
            <VStack flex={1} align="stretch" spacing={4}>
              <Box>
                 <HStack mb={2} spacing={2} w="100%">
                  <Input 
                    placeholder="Buscar o nuevo proceso..." 
                    value={newProceso} onChange={e => setNewProceso(e.target.value)}
                    size="sm" borderRadius="md" flex={1}
                    bg="white" border="1px solid" borderColor="gray.400"
                  />
                  <Button 
                    colorScheme="blue" variant="solid" size="sm" onClick={handleCreateProceso} px={4}
                    flexShrink={0} fontWeight="bold"
                  >
                    AGREGAR
                  </Button>
                </HStack>
              </Box>

              <Box flex={1} border="1px solid" borderColor="gray.200" borderRadius="md" overflowY="auto" bg="gray.50">
                 <List spacing={0}>
                  {procesos.filter(p => p.nombre.toLowerCase().includes(newProceso.toLowerCase())).map(p => (
                    <ListItem 
                      key={p.id} 
                      px={3} py={2} 
                      bg={selectedProceso === p.id ? "gray.200" : "transparent"}
                      cursor="pointer"
                      onClick={() => setSelectedProceso(p.id)}
                      _hover={{ bg: "gray.100" }}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Text fontSize="sm" isTruncated mr={2}>{p.nombre}</Text>
                      <IconButton 
                        aria-label="Eliminar proceso"
                        icon={<Icon name="delete" />} 
                        size="xs" 
                        colorScheme="red" 
                        variant="solid" 
                        flexShrink={0}
                        onClick={(e) => { e.stopPropagation(); handleDeleteProceso(p.id); }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </VStack>

            {/* LINKS VIEW (MODIFIED FOR VISUAL LINKING) */}
            <VStack flex={1} align="stretch" spacing={4} borderLeft="1px solid" borderColor="gray.200" pl={8}>
              <Heading size="xs" color="primary">VÍNCULOS ACTUALES</Heading>
              <Box flex={1} border="1px solid" borderColor="gray.200" borderRadius="md" overflowY="auto" bg="gray.50">
                <List spacing={0}>
                  {links.map(l => (
                    <ListItem 
                      key={l.id} 
                      px={3} py={2} 
                      borderBottom="1px solid" 
                      borderColor="gray.100"
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box>
                        <Text fontSize="xs" fontWeight="bold" color="primary">{l.area_nombre}</Text>
                        <Text fontSize="xs">{l.proceso_nombre}</Text>
                      </Box>
                      <IconButton 
                        aria-label="Eliminar vínculo"
                        icon={<Icon name="delete" />} 
                        size="xs" 
                        colorScheme="red" 
                        variant="ghost" 
                        onClick={() => handleDeleteLink(l.id)}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </VStack>
          </Flex>
        </ModalBody>
        <ModalFooter bg="primary" p={1}>
           <Button colorScheme="white" variant="ghost" size="sm" onClick={onClose} fontWeight="black">VOLVER</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
