import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Variable para editar el porcentaje de la transparencia del fondo azul
  // (0.0 es totalmente transparente, 1.0 es color sólido)
  const transparenciaAzul = 0.85;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const r = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, clave })
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "Login falló");
        return;
      }
      localStorage.setItem("auth_token", data.token);
      navigate("/home");
    } catch (err) {
      setError("Error de conexión con el servidor");
    }
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white font-display text-[#111318] relative">

      {/* Imagen base para el efecto cristal */}
      {/* Imagen base para el efecto cristal */}
      <div className="absolute inset-0 w-full lg:w-[55%] bg-cover bg-center z-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=2070&auto=format&fit=crop')" }} />

      {/* tipo crsital */}
      <div
        className="relative z-10 w-full lg:w-[55%] overflow-hidden flex flex-col justify-between p-10 lg:p-20 order-2 lg:order-1 min-h-[500px] lg:min-h-screen backdrop-blur-xl"
        style={{ backgroundColor: `rgba(45, 77, 245, ${transparenciaAzul})` }}
      >

        {/* fondo css */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-overlapping-arcs" />

        {/* Imagen balanza de justicia - Cortada a la mitad en el borde derecho */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 z-10 w-[500px] h-[500px] pointer-events-none select-none opacity-30" 
             style={{ transform: 'translate(50%, -50%) rotate(-15deg)' }}>
          <img 
            src="/balanza.jpeg" 
            alt="scales of justice" 
            className="w-full h-full object-contain mix-blend-multiply"
          />
        </div>

        {/* Logo e icono */}
        <div className="relative z-20">
          <img src="/logo.png" alt="INFORMAPERU Logo" className="h-20 w-auto object-contain brightness-0 invert" />
        </div>

        {/* Titulo y slogan */}
        <div className="relative z-20 flex flex-col gap-6 mt-16 max-w-[60%]">
          <h1 className="text-white font-black leading-[1.1] tracking-tight flex flex-col gap-1">
            <span className="text-base lg:text-lg font-medium opacity-80 tracking-widest uppercase">Bienvenido a ...</span>
            <span className="text-[2.2rem] lg:text-[3.8rem] uppercase font-black tracking-tighter whitespace-nowrap">INFORMAPERU</span>
          </h1>
          <p className="text-white/90 text-lg lg:text-xl font-medium leading-relaxed mt-2 max-w-md">
            Software de prevencion de Riesgos, Automatizacion y programacion de busquedas. Para ti, para tu empresa, Somos la mejor opcion
          </p>
        </div>

        {/* Footer*/}
        <div className="relative z-20 mt-auto pt-16">
        </div>
      </div>

      {/* formulario login*/}
      <div className="flex-1 bg-white flex flex-col items-center justify-center p-8 sm:p-12 lg:p-20 order-1 lg:order-2">
        <div className="w-full max-w-[400px] flex flex-col gap-8">

          {/* Header*/}
          <div className="flex flex-col gap-2 mb-8">
            <h2 className="text-[#111318] text-[2rem] font-bold leading-tight tracking-tight uppercase">PANEL DE ADMINISTRACION</h2>
          </div>

          <form className="flex flex-col gap-6" onSubmit={submit}>
            {/* inputs*/}
            <div className="flex flex-col gap-2">
              <label className="text-[#111318] text-xs font-bold uppercase tracking-wide">USUARIO</label>
              <div className="flex items-center bg-transparent border-b border-gray-300 focus-within:border-[#111318] transition-colors pb-2">
                <input className="w-full border-none px-0 py-2 focus:ring-0 text-base font-medium placeholder-[#616f89]/50 bg-transparent" placeholder="admin o usuario1" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#111318] text-xs font-bold uppercase tracking-wide">CONTRASEÑA</label>
              <div className="flex items-center bg-transparent border-b border-gray-300 focus-within:border-[#111318] transition-colors pb-2">
                <input className="w-full border-none px-0 py-2 focus:ring-0 text-base font-medium placeholder-[#616f89]/50 bg-transparent" type="password" placeholder="••••••••" value={clave} onChange={(e) => setClave(e.target.value)} />
              </div>
            </div>

            {error && <div className="text-red-500 text-xs font-bold uppercase mt-1">{error}</div>}

            <button className="w-full h-12 bg-[#1a1a1a] text-white font-semibold rounded-lg hover:bg-black transition-colors flex items-center justify-center text-sm shadow-sm border border-[#1a1a1a] mt-4" type="submit">
              INICIAR SESION
            </button>
            <button
              type="button"
              className="w-full h-12 bg-white text-[#111318] font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center text-sm shadow-sm border border-gray-300 uppercase tracking-wider"
              onClick={() => navigate("/registro")}
            >
              REGISTRARME
            </button>
          </form>

          {/* iconos opcionalaes*/}
          <div className="flex flex-col gap-6">
            <button
              type="button"
              className="flex items-center justify-center gap-3 w-full h-12 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-semibold text-gray-700 text-sm"
              onClick={() => window.location.href = `${apiUrl}/auth/google/login?redirect=${encodeURIComponent(window.location.origin + "/")}`}
            >
              <img
                src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                alt="Google"
                className="w-6 h-6"
              />
              <span>INICIAR SESION CON GOOGLE</span>
            </button>
          </div>

          {/* Form Footer */}
          <div className="flex justify-center mt-auto pt-12">
            <p className="text-[#616f89]/70 text-xs font-semibold">© 2026 INFORMAPERU. Todos los derechos reservados.</p>
          </div>

        </div>
      </div>

      <style>{`
        @font-face {
          font-family: 'SaintCarell';
          src: url('/src/fonts/SaintCarell.otf') format('opentype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        .font-saintcarell { font-family: 'SaintCarell', sans-serif; }

        /* Minimal arc lines to simulate the reference left background */
        .bg-overlapping-arcs {
          background-image: radial-gradient(circle at -20% 50%, transparent 60%, rgba(255,255,255,0.4) 61%, transparent 62%),
                            radial-gradient(circle at 120% -20%, transparent 60%, rgba(255,255,255,0.4) 61%, transparent 62%);
        }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 50px white inset; -webkit-text-fill-color: #111318; }
      `}</style>
    </div>
  );
}
