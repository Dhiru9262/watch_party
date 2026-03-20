import React, { useState, useEffect, useRef } from "react";

export default function ChatPanel({ messages, onSend, myUserId }) {
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.title}>Chat</span>
      </div>
      <div style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.empty}>No messages yet. Say hi!</div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ ...styles.message, animation: "fadeIn 0.2s ease" }}>
            <div style={styles.msgHeader}>
              <span style={{ ...styles.sender, color: msg.userId === myUserId ? "var(--teal)" : "var(--gold)" }}>
                {msg.username}
              </span>
              <span style={styles.time}>{formatTime(msg.timestamp)}</span>
            </div>
            <div style={styles.msgText}>{msg.text}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={styles.inputWrap}>
        <input
          style={styles.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          maxLength={500}
        />
        <button style={styles.sendBtn} onClick={handleSend} disabled={!text.trim()}>
          ↑
        </button>
      </div>
    </div>
  );
}

const styles = {
  panel: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "var(--bg-card)",
    borderLeft: "1px solid var(--border)",
  },
  header: {
    padding: "16px 20px",
    borderBottom: "1px solid var(--border)",
  },
  title: {
    fontFamily: "Syne, sans-serif",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--text-secondary)",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  empty: {
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: 13,
    marginTop: 20,
  },
  message: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  msgHeader: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
  },
  sender: {
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "Syne, sans-serif",
  },
  time: {
    fontSize: 10,
    color: "var(--text-muted)",
  },
  msgText: {
    fontSize: 14,
    color: "var(--text-primary)",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  inputWrap: {
    display: "flex",
    gap: 8,
    padding: "12px 16px",
    borderTop: "1px solid var(--border)",
  },
  input: {
    flex: 1,
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-primary)",
    padding: "10px 14px",
    fontSize: 14,
    transition: "border-color 0.2s",
  },
  sendBtn: {
    background: "var(--accent)",
    color: "white",
    borderRadius: "var(--radius-sm)",
    width: 40,
    fontSize: 18,
    fontWeight: 700,
    transition: "background 0.2s, transform 0.1s",
  },
};
