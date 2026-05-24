import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>('user');

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    navigate("/login");
  };

  // Chat and AI Assistant States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    {
      sender: "bot",
      text: "¡Hola! Soy Celina, tu asistente de cumplimiento normativo de INFORMAPERU AI. ¿Tienes alguna pregunta sobre los módulos del sistema y para qué sirven?",
      audioText: "Hola, soy Celina, tu asistente de cumplimiento normativo de INFORMAPERU AI. ¿Tienes alguna pregunta sobre los módulos del sistema y para qué sirven?"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [hasWelcomePlayed, setHasWelcomePlayed] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setUserRole(decoded.role || 'user');
      } catch { }
    }
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatLoading]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Audio Playback Helpers
  const playAudio = (url: string, index: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.ontimeupdate = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current.onended = null;
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingIndex(index);
    setAudioCurrentTime(0);

    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration);
    };

    audio.ontimeupdate = () => {
      setAudioCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setPlayingIndex(null);
      setAudioCurrentTime(0);
    };

    audio.play().catch(e => console.error("Error playing audio:", e));
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingIndex(null);
    }
  };

  const seekAudio = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setAudioCurrentTime(time);
    }
  };

  const skipAudio = (seconds: number) => {
    if (audioRef.current) {
      let newTime = audioRef.current.currentTime + seconds;
      if (newTime < 0) newTime = 0;
      if (newTime > audioRef.current.duration) newTime = audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setAudioCurrentTime(newTime);
    }
  };

  // Deepgram TTS call
  const speakWithDeepgram = async (textToSpeak: string, messageIndex: number) => {
    console.log("Deepgram API Key cargada:", !!import.meta.env.VITE_DEEPGRAM_API_KEY);
    try {
      const response = await fetch("https://api.deepgram.com/v1/speak?model=aura-2-celeste-es", {
        method: "POST",
        headers: {
          "Authorization": `Token ${import.meta.env.VITE_DEEPGRAM_API_KEY || ""}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: textToSpeak })
      });
      if (!response.ok) throw new Error("Deepgram API synthesis failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      setMessages(prev => {
        const updated = [...prev];
        if (updated[messageIndex]) {
          updated[messageIndex] = { ...updated[messageIndex], audioUrl: url };
        }
        return updated;
      });

      // Play audio automatically
      playAudio(url, messageIndex);
    } catch (err) {
      console.error("Deepgram TTS Error:", err);
    }
  };

  // Safe JSON Parsing from Deepseek response
  const parseDeepseekResponse = (rawText: string) => {
    try {
      let jsonString = rawText.trim();
      if (jsonString.startsWith("```")) {
        const match = jsonString.match(/```(?:json)?([\s\S]*?)```/);
        if (match && match[1]) {
          jsonString = match[1].trim();
        }
      }
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("JSON parse failed, falling back:", e);
      return {
        text: rawText,
        audio_text: rawText.substring(0, 150)
      };
    }
  };

  // Deepseek LLM call
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Stop any playing audio
    pauseAudio();

    const userMsg = { sender: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setChatLoading(true);

    const systemPrompt = `Eres Celina, la asistente inteligente de cumplimiento normativo de INFORMAPERU AI. Tu único propósito es responder preguntas sobre los módulos del sistema disponibles en la vista Home de forma clara y útil.
      
    Módulos del sistema:
    1. Listas Negativas: Consulta y gestiona listas de sanciones y entidades riesgosas.
    2. Matriz de Riesgos: Identifica, evalúa y gestiona los riesgos de la organización.
    3. Scoring de Riesgo: Evalúa y cuantifica el nivel de riesgo de terceros.
    4. Registro de Operaciones: Registra y da seguimiento a las operaciones realizadas.
    5. Canal de Denuncias: Canal seguro para presentar denuncias confidenciales (bloqueado actualmente).
    6. Mis Cursos: Plataforma de capacitación y cursos de cumplimiento normativo (bloqueado actualmente).
    7. Administrador: Permite cargar datos y administrar usuarios (solo para administradores).

    Si el usuario te pregunta sobre cualquier otro tema que no esté relacionado con estos módulos o su utilidad, dile amablemente en español que solo estás capacitada para responder preguntas sobre los módulos del sistema de INFORMAPERU AI.

    Debes responder estrictamente en formato JSON válido con la siguiente estructura:
    {
      "text": "Tu respuesta detallada estructurada en 2 o 3 párrafos muy cortos separados por saltos de línea (\\n\\n). Debe ser amigable y profesional.",
      "audio_text": "Explicación detallada en español para ser leída en voz alta. Su extensión debe variar entre 30 palabras (mínimo de ~10 segundos) y 650 palabras (máximo de ~5 minutos) dependiendo de la complejidad de la respuesta."
    }
    No agregues explicaciones fuera del JSON.`;

    const payloadMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.sender === "user" ? m.text : JSON.stringify({ text: m.text, audio_text: m.audioText || "" })
      })),
      { role: "user", content: text }
    ];

    const currentBotIndex = messages.length + 1; // position of the bot message once added

    try {
      console.log("Deepseek API Key cargada:", !!import.meta.env.VITE_DEEPSEEK_API_KEY);
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY || ""}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: payloadMessages,
          temperature: 0.3,
          stream: false
        })
      });

      if (!response.ok) throw new Error("Deepseek connection failed");
      const data = await response.json();
      const rawContent = data.choices[0].message.content;
      const parsed = parseDeepseekResponse(rawContent);

      setMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: parsed.text,
          audioText: parsed.audio_text
        }
      ]);

      if (parsed.audio_text) {
        speakWithDeepgram(parsed.audio_text, currentBotIndex);
      }
    } catch (err) {
      console.error("Deepseek Chat Error:", err);
      setMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: "Lo siento, tuve un problema para conectarme con mi servicio de inteligencia. Por favor, intenta de nuevo.",
          audioText: "Lo siento, tuve un problema de conexión. Intenta de nuevo."
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen && !hasWelcomePlayed) {
      speakWithDeepgram(messages[0].audioText, 0);
      setHasWelcomePlayed(true);
    }
  };

  const modules = [
    {
      name: "Listas Negativas",
      icon: "search",
      enabled: true,
      href: "/busqueda",
      description: "Consulta y gestiona listas de sanciones y entidades riesgosas.",
      color: "#E84855",
      bgColor: "#FDECEA",
      blobColor: "#FBBDC0",
    },
    {
      name: "Matriz de Riesgos",
      icon: "grid_on",
      enabled: true,
      href: "/matriz-riesgos",
      description: "Identifica, evalúa y gestiona los riesgos de tu organización.",
      color: "#3A6FD8",
      bgColor: "#EBF1FB",
      blobColor: "#B8CFF5",
    },
    {
      name: "Scoring de Riesgo",
      icon: "trending_up",
      enabled: true,
      href: "/scoring",
      description: "Evalúa y cuantifica el nivel de riesgo de terceros.",
      color: "#2BAE8E",
      bgColor: "#E8F8F4",
      blobColor: "#A8E4D5",
    },
    {
      name: "Registro de Operaciones",
      icon: "assignment",
      enabled: true,
      href: "/registro-operaciones",
      description: "Registra y da seguimiento a las operaciones realizadas.",
      color: "#7B5EA7",
      bgColor: "#F2EEF9",
      blobColor: "#CFC0E8",
    },
    {
      name: "Canal de Denuncias",
      icon: "campaign",
      enabled: false,
      href: "/denuncias",
      description: "Canal seguro para presentar denuncias de manera confidencial.",
      color: "#F08030",
      bgColor: "#FEF3EA",
      blobColor: "#F9C89A",
    },
    {
      name: "Mis Cursos",
      icon: "school",
      enabled: false,
      href: "/mis-cursos",
      description: "Plataforma de capacitación y cursos de cumplimiento normativo.",
      color: "#8B5CF6",
      bgColor: "#F5F3FF",
      blobColor: "#DDD6FE",
    },
    {
      name: "Administrador",
      icon: "admin_panel_settings",
      enabled: userRole === 'admin',
      href: "/load",
      description: "Administra usuarios, permisos y configuraciones del sistema.",
      color: "#2AA8A8",
      bgColor: "#E8F6F6",
      blobColor: "#A0DEDE",
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden font-sans text-base text-[#111318]">
      {/* Header Global */}
      <header className="h-20 bg-white flex items-center justify-between px-10 shrink-0 z-30 relative shadow-sm">
        <img src="/logo-informaPeru.jpg" alt="INFORMA PERÚ" className="h-12 w-auto object-contain" />
        
        {/* Cerrar Sesión Button (Apple-design inspired subtle utility button) */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-[#1d1d1f] hover:text-[#0066cc] rounded-full text-xs font-semibold tracking-wide transition-all select-none active:scale-[0.95]"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          <span>Cerrar Sesión</span>
        </button>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#EB3237]" />
      </header>

      {/* Main content centered, radial gradient background, scrollbar hidden */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-10 relative flex flex-col justify-center items-center" style={{ background: 'radial-gradient(circle at top left, #f8fafc, #f1f5f9, #e2e8f0)' }}>
        <div className="max-w-6xl w-full mx-auto flex flex-col justify-center py-4">
          <div className="flex flex-col gap-2 mb-8 text-center">
            <h2 className="text-[#32508E] text-[1.8rem] lg:text-[2.2rem] font-black leading-none uppercase tracking-wider">
              MÓDULOS DE GESTIÓN
            </h2>
            <div className="h-1 w-20 bg-[#EB3237] mx-auto mt-1" />
          </div>

          <div className="flex flex-wrap justify-center gap-5 w-full">
            {modules.map((m) => (
              <div
                key={m.name}
                className={`relative bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm p-6 flex flex-col justify-between transition-all duration-300 w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] ${m.enabled
                  ? "cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:border-slate-200/80 group"
                  : "opacity-60 cursor-not-allowed bg-slate-50/50"
                  }`}
                style={{ borderBottom: `4px solid ${m.color}` }}
                onClick={() => (m.enabled ? navigate(m.href!) : null)}
              >
                {!m.enabled && (
                  <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100/80 text-slate-400 flex items-center justify-center border border-slate-200/60 shadow-sm z-20">
                    <span className="material-symbols-outlined text-sm font-bold">lock</span>
                  </div>
                )}

                <div className="flex flex-col gap-4 z-10 relative">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: m.bgColor }}>
                      <span className="material-symbols-outlined text-[1.6rem] transition-transform duration-300 group-hover:scale-110" style={{ color: m.color }}>{m.icon}</span>
                    </div>
                    <div className="flex flex-col pr-6">
                      <h3 className="text-[0.95rem] font-black uppercase tracking-wide leading-snug" style={{ color: m.enabled ? "#1e293b" : "#94a3b8" }}>
                        {m.name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                    {m.enabled ? m.description : "Módulo bloqueado. Por favor, comuníquese con el administrador para solicitar acceso."}
                  </p>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-50 z-10 relative">
                  {m.enabled ? (
                    <>
                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: m.color }}>INGRESAR</span>
                      <span className="material-symbols-outlined text-lg opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" style={{ color: m.color }}>arrow_forward</span>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <span className="material-symbols-outlined text-xs">lock</span>
                      <span>BLOQUEADO</span>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-b-3xl">
                  <svg className="absolute bottom-0 right-0 w-full h-[24%] pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M 0 100 Q 80 85 100 0 L 100 100 Z" fill={m.color} opacity="0.12" />
                  </svg>
                  <svg className="absolute bottom-0 right-0 w-full h-[16%] pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M 0 100 Q 70 95 100 0 L 100 100 Z" fill={m.color} opacity="0.25" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Meta-like 3D Orb */}
        <div
          onClick={handleToggleChat}
          className="meta-orb-3d meta-orb-floating"
        >
          <div className="orb-light-1" />
          <div className="orb-light-2" />
          <div className="orb-light-3" />
          <div className="orb-glass" />
          <div className="absolute inset-0 flex items-center justify-center z-10 select-none">
            <span className="material-symbols-outlined text-white text-[28px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] animate-orb-float">
              mode_comment
            </span>
          </div>
        </div>

        {/* Chat window */}
        {isChatOpen && (
          <div className="fixed bottom-24 right-6 w-96 h-[520px] bg-white rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col overflow-hidden z-50 animate-chat-fade">
            {/* Chat Header */}
            <div className="bg-[#111827] text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full meta-orb-3d relative overflow-hidden flex items-center justify-center">
                  <div className="orb-light-1" />
                  <div className="orb-light-2" />
                  <div className="orb-light-3" />
                  <div className="orb-glass" />
                </div>
                <div>
                  <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-100">INFORMAPERU AI</h4>
                  <p className="text-[9px] text-[#A8E4D5] font-black uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#2BAE8E] rounded-full animate-ping" />
                    Celina en línea
                  </p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-white transition-colors" onClick={() => setIsChatOpen(false)}>
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scrollbar-thin">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs shadow-sm ${
                    msg.sender === "user"
                      ? "bg-[#3A6FD8] text-white rounded-tr-none font-medium"
                      : "bg-white border border-slate-100 text-slate-700 rounded-tl-none font-semibold leading-relaxed"
                  }`}>
                    {msg.text.split('\n\n').map((para: string, pIdx: number) => (
                      <p key={pIdx} className={pIdx > 0 ? "mt-2" : ""}>{para}</p>
                    ))}

                    {/* TTS Audio Controls */}
                    {msg.sender === "bot" && msg.audioText && (
                      <div className="mt-3 pt-2 border-t border-slate-100 flex flex-col gap-2 select-none">
                        {msg.audioUrl ? (
                          <div className="flex flex-col gap-2">
                            {/* Controls row */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-1.5">
                                {/* Play/Pause */}
                                <button
                                  type="button"
                                  className="text-[#3A6FD8] hover:text-[#2552B4] transition-colors"
                                  onClick={() => playingIndex === idx ? pauseAudio() : playAudio(msg.audioUrl!, idx)}
                                >
                                  <span className="material-symbols-outlined text-lg">
                                    {playingIndex === idx ? 'pause_circle' : 'play_circle'}
                                  </span>
                                </button>

                                {/* Skip Backward 5s */}
                                <button
                                  type="button"
                                  className="text-slate-400 hover:text-slate-600 transition-colors"
                                  onClick={() => playingIndex === idx && skipAudio(-5)}
                                  disabled={playingIndex !== idx}
                                >
                                  <span className="material-symbols-outlined text-sm">replay_5</span>
                                </button>

                                {/* Skip Forward 5s */}
                                <button
                                  type="button"
                                  className="text-slate-400 hover:text-slate-600 transition-colors"
                                  onClick={() => playingIndex === idx && skipAudio(5)}
                                  disabled={playingIndex !== idx}
                                >
                                  <span className="material-symbols-outlined text-sm">forward_5</span>
                                </button>
                              </div>

                              {/* Time display */}
                              <span className="text-[9px] font-bold text-slate-400">
                                {playingIndex === idx
                                  ? `${formatTime(audioCurrentTime)} / ${formatTime(audioDuration)}`
                                  : 'Escuchar audio'}
                              </span>
                            </div>

                            {/* Progress Bar / Seeker */}
                            {playingIndex === idx && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max={audioDuration || 100}
                                  value={audioCurrentTime}
                                  onChange={(e) => seekAudio(Number(e.target.value))}
                                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#3A6FD8] outline-none"
                                  style={{ background: `linear-gradient(to right, #3A6FD8 0%, #3A6FD8 ${(audioCurrentTime / (audioDuration || 1)) * 100}%, #e2e8f0 ${(audioCurrentTime / (audioDuration || 1)) * 100}%, #e2e8f0 100%)` }}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider italic flex items-center gap-1">
                            <span className="w-1 h-1 bg-[#3A6FD8] rounded-full animate-bounce" />
                            Generando audio...
                          </span>
                        )}

                        {/* Soundwaves visualizer */}
                        {playingIndex === idx && (
                          <div className="flex items-center">
                            <div className="soundwave-bar" />
                            <div className="soundwave-bar" />
                            <div className="soundwave-bar" />
                            <div className="soundwave-bar" />
                            <div className="soundwave-bar" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex items-start">
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 text-xs shadow-sm text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-xs">sync</span>
                    <span>Escribiendo...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(inputText); }}
              className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0"
            >
              <input
                type="text"
                placeholder="Pregunta sobre los módulos..."
                className="flex-1 px-4 py-2 border border-slate-200 rounded-full text-xs font-semibold focus:outline-none focus:border-[#3A6FD8] placeholder:text-slate-400"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !inputText.trim()}
                className="w-8 h-8 rounded-full bg-[#3A6FD8] text-white flex items-center justify-center shadow hover:bg-[#2552B4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer Global */}
      <footer className="h-10 bg-[#32508E] flex items-center justify-center px-4 shrink-0 z-30 shadow-inner">
        <p className="text-[10px] text-white/90 text-center uppercase tracking-widest font-bold">
          @COPYRIGHT; DESARROLLADO POR EL AREA DE TI - INFORMAPERU. TODOS LOS DERECHOS RESERVADOS 2026
        </p>
      </footer>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }

        .meta-orb-floating {
          position: fixed !important;
          bottom: 24px;
          right: 24px;
          z-index: 9999 !important;
        }

        /* Meta 3D Orb style */
        .meta-orb-3d {
          position: relative;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          overflow: hidden;
          background: #090d16;
          box-shadow: 
            0 10px 30px rgba(58, 111, 216, 0.4), 
            0 0 20px rgba(139, 92, 246, 0.3),
            inset 0 0 20px rgba(255, 255, 255, 0.2);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.3s;
        }

        .meta-orb-3d:hover {
          transform: scale(1.08) translateY(-2px);
          box-shadow: 
            0 15px 40px rgba(58, 111, 216, 0.6), 
            0 0 30px rgba(139, 92, 246, 0.5),
            0 0 50px rgba(6, 182, 212, 0.4);
        }

        .meta-orb-3d:active {
          transform: scale(0.95);
        }

        /* Moving inner light layers for 3D depth */
        .orb-light-1 {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #3a6fd8 0%, #8b5cf6 40%, transparent 70%);
          filter: blur(4px);
          animation: orb-spin-clockwise 8s linear infinite;
          opacity: 0.8;
        }

        .orb-light-2 {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          background: radial-gradient(circle at 70% 70%, #ec4899 0%, #06b6d4 50%, transparent 80%);
          filter: blur(6px);
          animation: orb-spin-counter 6s linear infinite;
          opacity: 0.7;
        }

        .orb-light-3 {
          position: absolute;
          inset: 5px;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.4) 0%, transparent 60%);
          filter: blur(2px);
          z-index: 2;
        }

        /* Glass reflection overlay */
        .orb-glass {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          z-index: 5;
          box-shadow: 
            inset 0 4px 6px rgba(255, 255, 255, 0.6),
            inset 0 -10px 20px rgba(0, 0, 0, 0.6),
            inset 0 0 12px rgba(255, 255, 255, 0.3);
          background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 100%);
          pointer-events: none;
        }

        /* Keyframes */
        @keyframes orb-spin-clockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes orb-spin-counter {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes orb-float {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-3px) scale(1.05);
          }
        }

        .animate-orb-float {
          animation: orb-float 3s ease-in-out infinite;
        }

        @keyframes chat-fade {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-chat-fade {
          animation: chat-fade 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes wave-bounce {
          0%, 100% {
            transform: scaleY(0.3);
          }
          50% {
            transform: scaleY(1);
          }
        }
        
        .soundwave-bar {
          display: inline-block;
          width: 2.5px;
          height: 12px;
          background-color: #3A6FD8;
          border-radius: 1px;
          margin: 0 1px;
          transform-origin: bottom;
          animation: wave-bounce 1s ease-in-out infinite;
        }
        .soundwave-bar:nth-child(2) {
          animation-delay: 0.15s;
        }
        .soundwave-bar:nth-child(3) {
          animation-delay: 0.3s;
        }
        .soundwave-bar:nth-child(4) {
          animation-delay: 0.1s;
        }
        .soundwave-bar:nth-child(5) {
          animation-delay: 0.22s;
        }
      `}</style>
    </div>
  );
}
