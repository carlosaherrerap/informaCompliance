import React from "react";
import { useNavigate } from "react-router-dom";

export default function ScoringMain() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F7FA] p-8">
      <h1 className="text-3xl font-bold mb-8 text-[#111318]">Scoring de Riesgo</h1>
      <div className="grid gap-8 w-full max-w-2xl">
        <button
          onClick={() => navigate("/scoring/natural")}
          className="w-full py-4 bg-[#6D28D9] text-white rounded-xl hover:bg-[#5B21B6] transition-colors flex items-center justify-center"
        >
          <span className="material-symbols-outlined mr-2">person</span>
          Persona Natural
        </button>
        <button
          onClick={() => navigate("/scoring/company")}
          className="w-full py-4 bg-[#0D9488] text-white rounded-xl hover:bg-[#0B8775] transition-colors flex items-center justify-center"
        >
          <span className="material-symbols-outlined mr-2">business</span>
          Persona Jurídica
        </button>
      </div>
    </div>
  );
}
