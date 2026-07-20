
import { useState, useRef, useEffect } from "react";
export default function ChatBox({ connectionId, onDisconnected }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef(null);
  const [waitingForInterrupt, setWaitingForInterrupt] = useState(false);
const messagesEndRef = useRef(null);
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "end"
  });
}, [messages]);

const stopExecution = async () => {
  try {
    // Stop browser from receiving more streamed data
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Notify backend
    await fetch(`/cancel/${connectionId}`, {
      method: "POST",
    });

    setLoading(false);
    setWaitingForInterrupt(false);

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "⛔ Execution stopped.",
      },
    ]);
  } catch (err) {
    console.error(err);
  }
};
const sendMessage = async () => {
  if (!message.trim() || loading) return;

  const text = message;

  setMessages((prev) => [...prev, { role: "user", content: text }]);
  setMessage("");
  setLoading(true);

  // New controller for this request
  abortControllerRef.current = new AbortController();

  try {
    const response = await fetch("/chat", {
      method: "POST",
      signal: abortControllerRef.current.signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        connection_id: connectionId,
        message: text,
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;

        const evt = JSON.parse(line);

        if (evt.type === "error") {
          setLoading(false);

          if (evt.reason === "connection_lost") {
            alert("VPS disconnected.");
            onDisconnected();
            return;
          }

          alert(evt.message);
          return;
        }

        if (evt.type === "interrupt") {
          setWaitingForInterrupt(true);

          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: evt.content,
            },
          ]);
        }

        if (evt.type === "node") {
          setWaitingForInterrupt(false);

          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: evt.content,
            },
          ]);
        }

        if (evt.type === "done") {
          setLoading(false);
        }

        if (evt.type === "cancelled") {
          setLoading(false);
          setWaitingForInterrupt(false);
        }
      }
    }

    setLoading(false);
  } catch (err) {
    if (err.name === "AbortError") {
      console.log("Request aborted.");
      return;
    }

    console.error(err);
    setLoading(false);
    alert("Unable to connect to backend.");
  }
};
  return (
    <div style={{
      width: "100%",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#f0f2f5",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
     
      {/* Header */}
      {/* Header */}
<div
  style={{
    background: "white",
    padding: "16px 24px",
    borderBottom: "1px solid #e4e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
  }}
>
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <span
      style={{
        background: "#4ade80",
        width: 10,
        height: 10,
        borderRadius: "50%",
        display: "inline-block",
      }}
    />

    <span
      style={{
        fontWeight: 600,
        fontSize: 15,
        color: "#1a1a2e",
      }}
    >
      💬 Connected to VPS
    </span>
  </div>

  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}
  >
    <span
      style={{
        fontSize: 12,
        color: "#6b7280",
        background: "#f3f4f6",
        padding: "4px 10px",
        borderRadius: 12,
        fontFamily: "monospace",
      }}
    >
      {connectionId}
    </span>

    <button
      onClick={async () => {
        if (!window.confirm("Disconnect from VPS?")) return;

        try {
          await fetch(
            `/connection/${connectionId}`,
            {
              method: "DELETE",
            }
          );
        } catch (e) {
          console.log(e);
        }

        sessionStorage.removeItem("connection_id");
        onDisconnected();
      }}
      style={{
        padding: "8px 14px",
        border: "none",
        borderRadius: 8,
        background: "#ef4444",
        color: "white",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      Disconnect
    </button>
  </div>
</div>

      {/* Warning */}
      {waitingForInterrupt && (
        <div style={{
          background: "#fef3c7",
          color: "#92400e",
          padding: "8px 16px",
          fontSize: 13,
          fontWeight: 500,
          borderBottom: "1px solid #fcd34d",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <span>⚠️</span>
          Waiting for your response...
        </div>
      )}

      {/* Messages */}
      {/* Messages */}
<div
  style={{
    flex: 1,
    overflowY: "auto",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  }}
>
  {messages.length === 0 ? (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: "#9ca3af",
      }}
    >
      <span style={{ fontSize: 40, marginBottom: 8 }}>🤖</span>
      <p style={{ fontSize: 14, fontWeight: 500 }}>No messages yet</p>
      <p style={{ fontSize: 13 }}>Start a conversation with your VPS</p>
    </div>
  ) : (
    <>
      {messages.map((m, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "100%",
          }}
        >
          <div
            style={{
              maxWidth: "85%",
              padding: "10px 14px",
              borderRadius: 12,
              background: m.role === "user" ? "#667eea" : "white",
              color: m.role === "user" ? "white" : "#1a1a2e",
              boxShadow:
                m.role === "user"
                  ? "0 2px 8px rgba(102,126,234,.25)"
                  : "0 1px 4px rgba(0,0,0,.06)",
              border:
                m.role === "user"
                  ? "none"
                  : "1px solid #e4e7eb",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                opacity: m.role === "user" ? 0.85 : 0.6,
                marginBottom: 4,
              }}
            >
              {m.role === "user" ? "👤 You" : "🤖 Assistant"}
            </div>

            <div
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: 14,
                lineHeight: 1.6,
                fontFamily: "monospace",
                background:
                  m.role === "user" ? "transparent" : "#f8f9fa",
                padding: m.role === "user" ? 0 : "8px 12px",
                borderRadius: 6,
                marginTop: m.role === "user" ? 0 : 4,
              }}
            >
              {m.content}
            </div>
          </div>
        </div>
      ))}

      <div ref={messagesEndRef} />
    </>
  )}
</div>

      {/* Input */}
      <div style={{
        padding: "16px 24px",
        background: "white",
        borderTop: "1px solid #e4e7eb",
        flexShrink: 0,
        display: "flex",
        gap: 10
      }}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          disabled={loading}
          placeholder={loading ? "⏳ Processing..." : "✏️ Type your message..."}
          style={{
            flex: 1,
            padding: "10px 14px",
            border: "2px solid #e4e7eb",
            borderRadius: 8,
            fontSize: 14,
            outline: "none",
            background: loading ? "#f5f6f8" : "white",
            transition: "border-color 0.2s",
            ...(loading ? { opacity: 0.6 } : {})
          }}
          onFocus={(e) => {
            if (!loading) {
              e.target.style.borderColor = "#667eea";
            }
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e4e7eb";
          }}
        />

 <button
  onClick={loading ? stopExecution : sendMessage}
  style={{
    padding: "10px 20px",
    background: loading ? "#000" : "#667eea",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: 6,
    whiteSpace: "nowrap"
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-1px)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0)";
  }}
>
  {loading ? (
    <>
      <span
        style={{
          display: "inline-block",
          animation: "spin 1s linear infinite"
        }}
      >
        ⟳
      </span>
      Stop
    </>
  ) : (
    <>
      📤 Send
    </>
  )}
</button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}