import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatbotProps {
  apiUrl?: string; // URL del endpoint PHP, ej: "/api/chatbot.php"
  userName?: string;
  position?: "bottom-right" | "bottom-left";
}

// ─── Markdown renderer ligero ────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^\- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hul])(.+)$/gm, (m) =>
      m.startsWith("<") ? m : `<p>${m}</p>`
    );
}

// ─── Ícono Gemini-like ───────────────────────────────────────────────────────

function GeminiIcon({ size = 20, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={animated ? { animation: "spin-slow 3s linear infinite" } : {}}
    >
      <defs>
        <linearGradient id="gem-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="50%" stopColor="#9B72CB" />
          <stop offset="100%" stopColor="#D96570" />
        </linearGradient>
      </defs>
      <path
        d="M14 2C14 2 14 10 6 14C14 14 14 26 14 26C14 26 14 14 22 14C14 14 14 2 14 2Z"
        fill="url(#gem-grad)"
      />
    </svg>
  );
}

// ─── Componente de burbuja de mensaje ────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const time = message.timestamp.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        gap: 8,
        alignItems: "flex-end",
        marginBottom: 12,
        animation: "fadeSlideIn 0.25s ease-out both",
      }}
    >
      {!isUser && (
        <div style={{ flexShrink: 0, marginBottom: 4 }}>
          <GeminiIcon size={22} />
        </div>
      )}
      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: 3, alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div
          style={{
            padding: "10px 14px",
            borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            background: isUser
              ? "linear-gradient(135deg, #4285F4, #9B72CB)"
              : "var(--cb-surface)",
            color: isUser ? "#fff" : "var(--cb-text)",
            fontSize: 14,
            lineHeight: 1.55,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            border: isUser ? "none" : "1px solid var(--cb-border)",
          }}
          dangerouslySetInnerHTML={{
            __html: isUser
              ? message.content.replace(/\n/g, "<br/>")
              : renderMarkdown(message.content),
          }}
        />
        <span style={{ fontSize: 10, color: "var(--cb-text-muted)", paddingInline: 4 }}>{time}</span>
      </div>
    </div>
  );
}

// ─── Indicador de escritura ──────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 12 }}>
      <GeminiIcon size={22} />
      <div
        style={{
          padding: "12px 16px",
          borderRadius: "18px 18px 18px 4px",
          background: "var(--cb-surface)",
          border: "1px solid var(--cb-border)",
          display: "flex",
          gap: 5,
          alignItems: "center",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--cb-text-muted)",
              display: "block",
              animation: `typingBounce 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Sugerencias rápidas ─────────────────────────────────────────────────────

const QUICK_SUGGESTIONS = [
  "¿Qué canciones hay disponibles?",
  "Mostrar próximas reuniones",
  "Listar todos los equipos",
  "¿Qué tareas están pendientes?",
  "Ver listados de canciones",
  "Mostrar áreas de la organización",
];

// ─── Componente principal ────────────────────────────────────────────────────

export default function Chatbot({
  apiUrl = "/api/chatbot",
  userName = "Usuario",
  position = "bottom-right",
}: ChatbotProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const positionStyle: React.CSSProperties =
    position === "bottom-right"
      ? { bottom: 24, right: 24 }
      : { bottom: 24, left: 24 };

  // Scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Foco al input cuando se abre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Escuchar evento externo para abrir
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-chatbot', handleOpen);
    return () => window.removeEventListener('open-chatbot', handleOpen);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || isLoading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);
      setShowWelcome(false);

      // Preparar historial para el backend (últimos 10)
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}`,
          },
          body: JSON.stringify({ message: content, history }),
        });

        const data = await res.json();

        if (data.error) throw new Error(data.error);

        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (!isOpen) setUnreadCount((c) => c + 1);
      } catch (err) {
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: t('chat.error') || "Lo siento, ocurrió un error al procesar tu consulta. Por favor, intentalo de nuevo.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, apiUrl, isOpen]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const clearChat = () => {
    setMessages([]);
    setShowWelcome(true);
  };

  return (
    <>
      {/* ─── CSS ─────────────────────────────────────────────────── */}
      <style>{`
        :root {
          --cb-primary: #4285F4;
          --cb-primary-dark: #2c6fdb;
          --cb-surface: #ffffff;
          --cb-bg: #f8f9fa;
          --cb-border: #e8eaed;
          --cb-text: #202124;
          --cb-text-muted: #80868b;
          --cb-shadow: rgba(0,0,0,0.15);
          --cb-radius: 20px;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --cb-surface: #2d2d30;
            --cb-bg: #1e1e1e;
            --cb-border: #3c3c3c;
            --cb-text: #e8eaed;
            --cb-text-muted: #9aa0a6;
            --cb-shadow: rgba(0,0,0,0.4);
          }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85) translateY(16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pulse-badge {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .cb-fab {
          all: unset;
          cursor: pointer;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4285F4, #9B72CB);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 18px rgba(66,133,244,0.45);
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
        }
        .cb-fab:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 24px rgba(66,133,244,0.55);
        }
        .cb-fab:active { transform: scale(0.96); }
        .cb-window {
          position: fixed;
          width: 380px;
          height: 560px;
          background: var(--cb-surface);
          border-radius: var(--cb-radius);
          box-shadow: 0 8px 40px var(--cb-shadow);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: popIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both;
          border: 1px solid var(--cb-border);
          z-index: 9999;
        }
        @media (max-width: 480px) {
          .cb-window {
            width: 100vw !important;
            height: 85vh !important;
            bottom: 0 !important;
            right: 0 !important;
            left: 0 !important;
            border-radius: var(--cb-radius) var(--cb-radius) 0 0;
          }
        }
        .cb-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          background: linear-gradient(135deg, #4285F4 0%, #9B72CB 100%);
          color: #fff;
          flex-shrink: 0;
        }
        .cb-header-title {
          flex: 1;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.01em;
        }
        .cb-header-sub {
          font-size: 11px;
          opacity: 0.85;
          font-weight: 400;
        }
        .cb-icon-btn {
          all: unset;
          cursor: pointer;
          opacity: 0.85;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.15s, background 0.15s;
        }
        .cb-icon-btn:hover { opacity: 1; background: rgba(255,255,255,0.18); }
        .cb-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: var(--cb-bg);
          scroll-behavior: smooth;
        }
        .cb-messages::-webkit-scrollbar { width: 4px; }
        .cb-messages::-webkit-scrollbar-thumb { background: var(--cb-border); border-radius: 4px; }
        .cb-welcome {
          text-align: center;
          padding: 24px 16px 8px;
          animation: fadeSlideIn 0.4s ease-out both;
        }
        .cb-welcome-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--cb-text);
          margin: 12px 0 6px;
        }
        .cb-welcome-sub {
          font-size: 13px;
          color: var(--cb-text-muted);
          line-height: 1.5;
          margin-bottom: 18px;
        }
        .cb-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          margin-bottom: 8px;
        }
        .cb-suggestion-chip {
          all: unset;
          cursor: pointer;
          font-size: 12px;
          color: var(--cb-primary);
          border: 1px solid var(--cb-primary);
          border-radius: 20px;
          padding: 5px 12px;
          transition: background 0.15s, color 0.15s;
          background: transparent;
        }
        .cb-suggestion-chip:hover {
          background: var(--cb-primary);
          color: #fff;
        }
        .cb-input-area {
          padding: 12px 14px;
          border-top: 1px solid var(--cb-border);
          display: flex;
          gap: 8px;
          align-items: flex-end;
          background: var(--cb-surface);
          flex-shrink: 0;
        }
        .cb-textarea {
          flex: 1;
          resize: none;
          border: 1px solid var(--cb-border);
          border-radius: 22px;
          padding: 10px 14px;
          font-size: 14px;
          font-family: inherit;
          background: var(--cb-bg);
          color: var(--cb-text);
          outline: none;
          max-height: 100px;
          min-height: 42px;
          line-height: 1.5;
          transition: border-color 0.2s;
          overflow-y: auto;
        }
        .cb-textarea:focus { border-color: var(--cb-primary); }
        .cb-textarea::placeholder { color: var(--cb-text-muted); }
        .cb-send-btn {
          all: unset;
          cursor: pointer;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4285F4, #9B72CB);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.15s, opacity 0.15s;
          opacity: 0.5;
        }
        .cb-send-btn.active { opacity: 1; }
        .cb-send-btn.active:hover { transform: scale(1.08); }
        .cb-send-btn.active:active { transform: scale(0.94); }
      `}</style>

      {/* ─── FAB ─────────────────────────────────────────────────── */}
      <div style={{ position: "fixed", ...positionStyle, zIndex: 9998 }}>
        {!isOpen && (
          <button
            className="cb-fab"
            onClick={() => setIsOpen(true)}
            title="Asistente IA del sistema"
          >
            <GeminiIcon size={26} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "#ea4335",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "pulse-badge 1.5s ease-in-out infinite",
                  border: "2px solid #fff",
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* ─── Ventana de chat ─────────────────────────────────────── */}
      {isOpen && (
        <div
          className="cb-window"
          style={{
            position: "fixed",
            ...positionStyle,
            zIndex: 9999,
          }}
        >
          {/* Header */}
          <div className="cb-header">
            <GeminiIcon size={26} />
            <div style={{ flex: 1 }}>
              <div className="cb-header-title">{t('chat.title') || "Asistente del Sistema"}</div>
              <div className="cb-header-sub">{t('chat.headerSub') || "Consultá sobre canciones, reuniones, equipos y más"}</div>
            </div>
            <button
              className="cb-icon-btn"
              onClick={clearChat}
              title="Nueva conversación"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
            </button>
            <button
              className="cb-icon-btn"
              onClick={() => setIsOpen(false)}
              title="Cerrar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="cb-messages">
            {showWelcome && messages.length === 0 && (
              <div className="cb-welcome">
                <GeminiIcon size={48} animated />
                <div className="cb-welcome-title">¡Hola, {userName}!</div>
                <p className="cb-welcome-sub">
                  {t('chat.welcome') || "Soy el asistente del sistema. Puedo ayudarte a consultar canciones, reuniones, equipos, tareas y más."}
                </p>
                <div className="cb-suggestions">
                  {QUICK_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      className="cb-suggestion-chip"
                      onClick={() => handleSuggestion(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isLoading && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="cb-input-area">
            <textarea
              ref={inputRef}
              className="cb-textarea"
              placeholder={t('chat.inputPlaceholder') || "Consultá sobre el sistema..."}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-resize
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
              }}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading}
            />
            <button
              className={`cb-send-btn ${input.trim() && !isLoading ? "active" : ""}`}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              title="Enviar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22 11 13 2 9l20-7z" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
