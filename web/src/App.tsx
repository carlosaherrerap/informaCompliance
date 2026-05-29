import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import SearchPage from "./pages/SearchPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import OperationsRegistryPage from "./pages/OperationsRegistryPage";
import RiskMatrixPage from "./pages/RiskMatrixPage";
import RiskRegisterPage from "./pages/RiskRegisterPage";
import CompletarPerfilPage from "./pages/CompletarPerfilPage";
import ScoringRiesgoPage from "./pages/ScoringRiesgoPage";
import ScoringNaturalPage from "./pages/ScoringNaturalPage";
import ScoringCompanyPage from "./pages/ScoringCompanyPage";
import CanalDenunciasPage from "./pages/CanalDenunciasPage";
import ReporteOperacionesPage from "./pages/ReporteOperacionesPage";
import { LoadPage } from "./pages/LoadPage";


function isTokenValid(): boolean {
  const t = localStorage.getItem("auth_token");
  if (!t) return false;
  const parts = t.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1]));
    const exp = Number(payload.exp || 0) * 1000;
    return Date.now() < exp;
  } catch {
    return false;
  }
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isTokenValid()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={isTokenValid() ? <Navigate to="/home" replace /> : <LoginPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/registro" element={isTokenValid() ? <Navigate to="/home" replace /> : <RegisterPage />} />
      <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
      <Route path="/perfil" element={<RequireAuth><ProfilePage /></RequireAuth>} />
      <Route path="/busqueda" element={<RequireAuth><SearchPage /></RequireAuth>} />
      <Route path="/registro-operaciones" element={<RequireAuth><OperationsRegistryPage /></RequireAuth>} />
      <Route path="/matriz-riesgos" element={<RequireAuth><RiskMatrixPage /></RequireAuth>} />
      <Route path="/registro-riesgo" element={<RequireAuth><RiskRegisterPage /></RequireAuth>} />
      <Route path="/registro-riesgo/:id" element={<RequireAuth><RiskRegisterPage /></RequireAuth>} />
      <Route path="/scoring" element={<RequireAuth><ScoringRiesgoPage /></RequireAuth>} />
      <Route path="/scoring/generate/natural" element={<RequireAuth><ScoringNaturalPage /></RequireAuth>} />
      <Route path="/scoring/generate/company" element={<RequireAuth><ScoringCompanyPage /></RequireAuth>} />
      <Route path="/denuncias" element={<CanalDenunciasPage />} />
      <Route path="/reporte-operaciones" element={<RequireAuth><ReporteOperacionesPage /></RequireAuth>} />
      <Route path="/completar-perfil" element={<RequireAuth><CompletarPerfilPage /></RequireAuth>} />
      <Route path="/load" element={<RequireAuth><LoadPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
