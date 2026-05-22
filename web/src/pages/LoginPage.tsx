import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      img: "/slide-1.jpg",
      text: "Software de prevención de Riesgos, lavado de activos, fraudes y corrupción. Somos la mejor opción"
    },
    {
      img: "/slide-2.jpg",
      text: "Protección integral para tu empresa con tecnología de vanguardia"
    },
    {
      img: "/slide-3.jpg",
      text: "Automatización y seguridad en cada paso de tu debida diligencia"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
    <div className="flex flex-col h-screen overflow-hidden bg-white font-sans text-base text-[#111318]">

      {/* Header Global (MUY IMPORTANTE: Solo el logo) */}
      <header className="h-20 bg-white flex items-center px-10 shrink-0 z-30 relative overflow-hidden">
        <img src="/logo-informaPeru.jpg" alt="INFORMA PERÚ" className="h-12 w-auto object-contain" />
        {/* Borde inferior estático rojo */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#EB3237]" />
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Lado izquierdo: Slider */}
        <div className="relative w-full lg:w-[58%] overflow-hidden bg-slate-100 shrink-0">
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[6000ms] ease-linear"
                style={{
                  backgroundImage: `url('${slide.img}')`,
                  transform: idx === currentSlide ? 'scale(1)' : 'scale(1.1)'
                }}
              />
              <div className="absolute inset-0 bg-[#32508E]/50 backdrop-blur-[1px]" />

              {/* Frase al Centro (MUY IMPORTANTE: Centrada) */}
              <div className="absolute inset-0 flex items-center justify-center p-12 text-center">
                <div className="max-w-xl animate-in fade-in zoom-in-95 duration-1000">
                  <p className="text-white text-base leading-relaxed drop-shadow-md">
                    {slide.text}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Dots de navegación (Indicadores) */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`transition-all duration-300 rounded-full ${i === currentSlide
                  ? 'w-8 h-2 bg-white'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                  }`}
              />
            ))}
          </div>

          {/* Efecto Desvanecimiento hacia el formulario */}
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white via-white/40 to-transparent z-20 hidden lg:block" />
        </div>

        {/* Lado derecho: Formulario */}
        <div className="flex-1 bg-white flex flex-col items-center justify-center p-8 lg:p-12 overflow-hidden relative">
          {/* Contenedor animado con borde degradado */}
          <div className="w-full max-w-[420px] rounded-none p-[3px] animate-border-glow shadow-lg animate-in fade-in slide-in-from-right-8 duration-700">
            {/* Contenedor interior blanco */}
            <div className="bg-white rounded-none p-8 lg:p-10 flex flex-col gap-8 h-full relative overflow-hidden login-card">
              {/* Contenido con z-index para estar sobre el pseudo-elemento */}
              <div className="relative z-10 flex flex-col gap-8">
                <div className="flex flex-col items-center lg:items-start gap-2">
                  <h2 className="text-[#32508E] text-[2.5rem] lg:text-[2.8rem] font-bold leading-none mb-2 text-center lg:text-left w-full">Login</h2>
                </div>

                <form className="flex flex-col gap-5" onSubmit={submit}>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-600 text-sm font-semibold ml-1">USUARIO</label>
                    <div className="flex items-center bg-white border-2 border-[#32508E] rounded-none transition-all px-4 group">
                      <span className="material-symbols-outlined text-[#32508E] opacity-50 group-focus-within:opacity-100 transition-opacity">person</span>
                      <input
                        className="w-full border-none focus:ring-0 text-base py-3 px-3 placeholder:text-slate-400"
                        placeholder="Ingrese su usuario"
                        value={usuario}
                        onChange={(e) => setUsuario(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-600 text-sm font-semibold ml-1">CONTRASEÑA</label>
                    <div className="flex items-center bg-white border-2 border-[#32508E] rounded-none transition-all px-4 group">
                      <span className="material-symbols-outlined text-[#32508E] opacity-50 group-focus-within:opacity-100 transition-opacity">lock</span>
                      <input
                        className="w-full border-none focus:ring-0 text-base py-3 px-3 placeholder:text-slate-400"
                        type="password"
                        placeholder="Ingrese su contraseña"
                        value={clave}
                        onChange={(e) => setClave(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {error && <div className="text-red-500 text-sm font-medium text-center">{error}</div>}

                  <button
                    className="w-full h-12 bg-[#32508E] text-white text-base font-semibold rounded-none hover:bg-[#284175] transition-all flex items-center justify-center mt-4 active:scale-95 uppercase tracking-wide"
                    type="submit"
                  >
                    INGRESAR
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Global */}
      <footer className="h-10 bg-[#32508E] flex items-center justify-center px-4 shrink-0 z-30">
        <p className="text-[12px] text-white/90 text-center">
          @COPYRIGHT; DESARROLLADO POR EL AREA DE TI - INFORMAPERU. TODOS LOS DERECHOS RESERVADOS 2026
        </p>
      </footer>

      <style>{`
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 50px white inset; -webkit-text-fill-color: #111318; }
        
        @keyframes border-glow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-border-glow {
          background: linear-gradient(90deg, #32508E, #EEEEEE, #EB3237, #32508E);
          background-size: 300% 300%;
          animation: border-glow 8s linear infinite;
        }

        .login-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, white 0%, #EB3237 100%);
          clip-path: polygon(0 0, 35% 0, 0 65%);
          opacity: 0.15;
          pointer-events: none;
          z-index: 1;
        }
        
        .login-card::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(315deg, white 0%, #EB3237 100%);
          clip-path: polygon(100% 100%, 65% 100%, 100% 35%);
          opacity: 0.15;
          pointer-events: none;
          z-index: 1;
        }
      `}</style>
    </div>
  );
}
