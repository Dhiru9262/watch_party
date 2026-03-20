import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { nanoid } from "nanoid";

export default function Home() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [tab, setTab] = useState("create"); // "create" | "join"
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!username.trim()) {
      setError("Please enter your name");
      return;
    }
    try {
      const res = await fetch("/api/rooms/create", { method: "POST" });
      const data = await res.json();
      const userId = nanoid(12);
      sessionStorage.setItem("userId", userId);
      sessionStorage.setItem("username", username.trim());
      navigate(`/room/${data.roomId}`);
    } catch {
      setError("Failed to create room. Is the server running?");
    }
  };

  const handleJoin = () => {
    if (!username.trim()) { setError("Please enter your name"); return; }
    if (!roomCode.trim()) { setError("Please enter a room code"); return; }
    const userId = nanoid(12);
    sessionStorage.setItem("userId", userId);
    sessionStorage.setItem("username", username.trim());
    navigate(`/room/${roomCode.trim().toUpperCase()}`);
  };

  return (
    <div style={styles.page}>
      {/* Background grain + mesh */}
      <div style={styles.bgMesh} />

      {/* Logo / Hero */}
      <div style={styles.hero}>
        <div style={styles.logoMark}>
          <span style={styles.logoIcon}>▶</span>
        </div>
        <h1 style={styles.title}>WatchParty</h1>
        <p style={styles.subtitle}>Watch YouTube together, perfectly in sync.</p>
      </div>

      {/* Card */}
      <div style={styles.card}>
        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(tab === "create" ? styles.tabActive : {}) }}
            onClick={() => { setTab("create"); setError(""); }}
          >
            Create Room
          </button>
          <button
            style={{ ...styles.tab, ...(tab === "join" ? styles.tabActive : {}) }}
            onClick={() => { setTab("join"); setError(""); }}
          >
            Join Room
          </button>
        </div>

        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.fieldLabel}>Your Name</label>
            <input
              style={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (tab === "create" ? handleCreate() : handleJoin())}
              placeholder="Enter your display name"
              maxLength={24}
              autoFocus
            />
          </div>

          {tab === "join" && (
            <div style={styles.field}>
              <label style={styles.fieldLabel}>Room Code</label>
              <input
                style={{ ...styles.input, textTransform: "uppercase", letterSpacing: "0.15em" }}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="XXXXXXXX"
                maxLength={8}
              />
            </div>
          )}

          {error && <div style={styles.error}>{error}</div>}

          <button
            style={styles.btn}
            onClick={tab === "create" ? handleCreate : handleJoin}
          >
            {tab === "create" ? "Create Room →" : "Join Room →"}
          </button>
        </div>
      </div>

      {/* Features */}
      <div style={styles.features}>
        {[
          { icon: "⚡", label: "Real-time sync" },
          { icon: "🎭", label: "Role-based control" },
          { icon: "💬", label: "Live chat" },
        ].map((f) => (
          <div key={f.label} style={styles.feature}>
            <span style={styles.featureIcon}>{f.icon}</span>
            <span style={styles.featureLabel}>{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    position: "relative",
    overflow: "hidden",
    gap: 32,
  },
  bgMesh: {
    position: "fixed",
    inset: 0,
    background: `
      radial-gradient(ellipse 80% 60% at 20% 20%, rgba(230,57,70,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 60% 80% at 80% 80%, rgba(46,196,182,0.06) 0%, transparent 60%)
    `,
    pointerEvents: "none",
    zIndex: 0,
  },
  hero: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    position: "relative",
    zIndex: 1,
    animation: "fadeIn 0.6s ease",
  },
  logoMark: {
    width: 64,
    height: 64,
    background: "var(--accent)",
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 40px rgba(230,57,70,0.4)",
    marginBottom: 4,
  },
  logoIcon: {
    fontSize: 28,
    color: "white",
    marginLeft: 4,
  },
  title: {
    fontSize: "clamp(36px, 6vw, 56px)",
    fontWeight: 800,
    letterSpacing: "-0.04em",
    background: "linear-gradient(135deg, #f0f0f5 0%, #8888aa 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    color: "var(--text-secondary)",
    fontSize: 18,
    fontWeight: 300,
  },
  card: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 20,
    width: "100%",
    maxWidth: 440,
    overflow: "hidden",
    boxShadow: "var(--shadow-lg)",
    position: "relative",
    zIndex: 1,
    animation: "fadeIn 0.6s ease 0.1s both",
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid var(--border)",
  },
  tab: {
    flex: 1,
    padding: "16px",
    background: "transparent",
    color: "var(--text-muted)",
    fontFamily: "Syne, sans-serif",
    fontWeight: 600,
    fontSize: 14,
    letterSpacing: "0.04em",
    transition: "color 0.2s, background 0.2s",
    borderBottom: "2px solid transparent",
  },
  tabActive: {
    color: "var(--text-primary)",
    background: "var(--bg-elevated)",
    borderBottomColor: "var(--accent)",
  },
  form: {
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Syne, sans-serif",
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "var(--text-secondary)",
    textTransform: "uppercase",
  },
  input: {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-primary)",
    padding: "14px 16px",
    fontSize: 15,
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  error: {
    color: "var(--accent)",
    fontSize: 13,
    padding: "10px 14px",
    background: "var(--accent-dim)",
    borderRadius: "var(--radius-sm)",
    border: "1px solid rgba(230,57,70,0.2)",
  },
  btn: {
    background: "var(--accent)",
    color: "white",
    borderRadius: "var(--radius-sm)",
    padding: "14px",
    fontSize: 15,
    fontWeight: 700,
    fontFamily: "Syne, sans-serif",
    letterSpacing: "0.02em",
    transition: "background 0.2s, transform 0.1s, box-shadow 0.2s",
    boxShadow: "0 4px 20px rgba(230,57,70,0.3)",
  },
  features: {
    display: "flex",
    gap: 24,
    position: "relative",
    zIndex: 1,
    animation: "fadeIn 0.6s ease 0.2s both",
  },
  feature: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "var(--text-muted)",
    fontSize: 13,
  },
  featureIcon: {
    fontSize: 16,
  },
  featureLabel: {
    fontWeight: 500,
  },
};
