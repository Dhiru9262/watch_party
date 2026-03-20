import React, { useState } from "react";

function extractVideoId(input) {
  if (!input) return null;
  // Already an ID (11 chars, no slashes)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();
  // YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function VideoControls({ videoState, canControl, onChangeVideo, onSync }) {
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");

  const handleChangeVideo = () => {
    const vid = extractVideoId(urlInput);
    if (!vid) {
      setUrlError("Invalid YouTube URL or video ID");
      setTimeout(() => setUrlError(""), 2500);
      return;
    }
    onChangeVideo(vid);
    setUrlInput("");
  };

  return (
    <div style={styles.bar}>
      <div style={styles.left}>
        <div style={styles.nowPlaying}>
          <span style={styles.label}>NOW PLAYING</span>
          <code style={styles.videoId}>{videoState.videoId}</code>
        </div>
        <div style={styles.statusDot(videoState.playState)}>
          {videoState.playState === "playing" ? "▶ LIVE" : "⏸ PAUSED"}
        </div>
      </div>

      {canControl && (
        <div style={styles.right}>
          <div style={styles.inputGroup}>
            <input
              style={{ ...styles.input, borderColor: urlError ? "var(--accent)" : "var(--border)" }}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChangeVideo()}
              placeholder="Paste YouTube URL or video ID..."
            />
            <button style={styles.changeBtn} onClick={handleChangeVideo}>
              Change Video
            </button>
          </div>
          {urlError && <span style={styles.error}>{urlError}</span>}
        </div>
      )}

      <button style={styles.syncBtn} onClick={onSync} title="Sync with room">
        ↺ Sync
      </button>
    </div>
  );
}

const styles = {
  bar: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "12px 20px",
    background: "var(--bg-secondary)",
    borderTop: "1px solid var(--border)",
    flexWrap: "wrap",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flex: "0 0 auto",
  },
  nowPlaying: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  label: {
    fontSize: 9,
    fontFamily: "Syne, sans-serif",
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: "var(--text-muted)",
  },
  videoId: {
    fontSize: 12,
    color: "var(--teal)",
    fontFamily: "monospace",
  },
  statusDot: (state) => ({
    fontSize: 11,
    fontFamily: "Syne, sans-serif",
    fontWeight: 700,
    letterSpacing: "0.06em",
    color: state === "playing" ? "var(--accent)" : "var(--text-muted)",
    padding: "4px 10px",
    background: state === "playing" ? "var(--accent-dim)" : "var(--bg-elevated)",
    borderRadius: 20,
    animation: state === "playing" ? "pulse 2s ease infinite" : "none",
  }),
  right: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 280,
  },
  inputGroup: {
    display: "flex",
    gap: 8,
  },
  input: {
    flex: 1,
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-primary)",
    padding: "8px 14px",
    fontSize: 13,
    transition: "border-color 0.2s",
  },
  changeBtn: {
    background: "var(--accent)",
    color: "white",
    borderRadius: "var(--radius-sm)",
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: "nowrap",
    transition: "background 0.2s",
  },
  error: {
    fontSize: 12,
    color: "var(--accent)",
  },
  syncBtn: {
    background: "var(--bg-elevated)",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "8px 14px",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "Syne, sans-serif",
    letterSpacing: "0.04em",
    transition: "background 0.2s, color 0.2s",
    flexShrink: 0,
  },
};
