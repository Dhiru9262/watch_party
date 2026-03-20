import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { nanoid } from "nanoid";
import { useRoom } from "../hooks/useRoom";
import YouTubePlayer from "../components/YouTubePlayer";
import VideoControls from "../components/VideoControls";
import ParticipantsPanel from "../components/ParticipantsPanel";
import ChatPanel from "../components/ChatPanel";

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [userId] = useState(() => sessionStorage.getItem("userId") || nanoid(12));
  const [username] = useState(() => sessionStorage.getItem("username") || "Guest");
  const [activePanel, setActivePanel] = useState("participants"); // "participants" | "chat"
  const [copyDone, setCopyDone] = useState(false);

  useEffect(() => {
    sessionStorage.setItem("userId", userId);
  }, [userId]);

  const {
    participants, myRole, videoState, messages, error, joined, kicked, canControl, isHost,
    actions,
  } = useRoom(roomId, userId, username);

  useEffect(() => {
    if (kicked) {
      setTimeout(() => navigate("/"), 2000);
    }
  }, [kicked, navigate]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  };

  const roleColor = { host: "var(--host-color)", moderator: "var(--mod-color)", participant: "var(--participant-color)" };
  const roleLabel = { host: "HOST", moderator: "MOD", participant: "VIEWER" };

  if (kicked) {
    return (
      <div style={styles.center}>
        <div style={styles.kickedCard}>
          <span style={{ fontSize: 40 }}>🚫</span>
          <h2 style={{ fontFamily: "Syne", fontSize: 24, fontWeight: 800 }}>Removed from room</h2>
          <p style={{ color: "var(--text-secondary)" }}>The host removed you. Redirecting...</p>
        </div>
      </div>
    );
  }

  if (!joined) {
    return (
      <div style={styles.center}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={styles.spinner} />
          <p style={{ color: "var(--text-secondary)", fontFamily: "Syne", letterSpacing: "0.06em" }}>
            JOINING ROOM {roomId}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.layout}>
      {/* Top bar */}
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate("/")}>
          ← Leave
        </button>
        <div style={styles.roomInfo}>
          <span style={styles.roomCode}>{roomId}</span>
          <button style={styles.copyBtn} onClick={copyLink}>
            {copyDone ? "✓ Copied!" : "Copy Link"}
          </button>
        </div>
        <div style={styles.myRole}>
          <span style={{ color: roleColor[myRole], fontFamily: "Syne", fontWeight: 700, fontSize: 11, letterSpacing: "0.1em" }}>
            {roleLabel[myRole]}
          </span>
          <span style={styles.myName}>{username}</span>
        </div>
      </header>

      {/* Error toast */}
      {error && (
        <div style={styles.toast}>⚠ {error}</div>
      )}

      {/* Main content */}
      <div style={styles.main}>
        {/* Video column */}
        <div style={styles.videoColumn}>
          <YouTubePlayer
            videoState={videoState}
            canControl={canControl}
            onPlay={(t) => actions.play(t)}
            onPause={(t) => actions.pause(t)}
            onSeek={(t) => actions.seek(t)}
          />
          <VideoControls
            videoState={videoState}
            canControl={canControl}
            onChangeVideo={actions.changeVideo}
            onSync={actions.requestSync}
          />
          {!canControl && (
            <div style={styles.viewerBanner}>
              👁 You're a viewer — only Host and Moderators can control playback
            </div>
          )}
        </div>

        {/* Side panel */}
        <div style={styles.sidePanel}>
          {/* Panel tabs */}
          <div style={styles.panelTabs}>
            <button
              style={{ ...styles.panelTab, ...(activePanel === "participants" ? styles.panelTabActive : {}) }}
              onClick={() => setActivePanel("participants")}
            >
              People ({participants.length})
            </button>
            <button
              style={{ ...styles.panelTab, ...(activePanel === "chat" ? styles.panelTabActive : {}) }}
              onClick={() => setActivePanel("chat")}
            >
              Chat
              {messages.length > 0 && activePanel !== "chat" && (
                <span style={styles.chatBadge}>{messages.length > 99 ? "99+" : messages.length}</span>
              )}
            </button>
          </div>

          <div style={styles.panelContent}>
            {activePanel === "participants" ? (
              <ParticipantsPanel
                participants={participants}
                myUserId={userId}
                isHost={isHost}
                onAssignRole={actions.assignRole}
                onRemove={actions.removeParticipant}
              />
            ) : (
              <ChatPanel
                messages={messages}
                onSend={actions.sendMessage}
                myUserId={userId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background: "var(--bg-primary)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    height: 56,
    background: "var(--bg-secondary)",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
    gap: 16,
  },
  backBtn: {
    background: "transparent",
    color: "var(--text-secondary)",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "Syne, sans-serif",
    padding: "6px 12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    transition: "all 0.2s",
    flexShrink: 0,
  },
  roomInfo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  roomCode: {
    fontFamily: "Syne, sans-serif",
    fontWeight: 800,
    fontSize: 18,
    letterSpacing: "0.1em",
    color: "var(--text-primary)",
  },
  copyBtn: {
    background: "var(--bg-elevated)",
    color: "var(--teal)",
    border: "1px solid var(--teal-dim)",
    borderRadius: "var(--radius-sm)",
    padding: "5px 12px",
    fontSize: 12,
    fontWeight: 600,
    transition: "all 0.2s",
  },
  myRole: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  myName: {
    fontSize: 14,
    color: "var(--text-secondary)",
    fontWeight: 500,
  },
  toast: {
    background: "var(--accent-dim)",
    border: "1px solid rgba(230,57,70,0.3)",
    color: "var(--accent)",
    padding: "10px 20px",
    fontSize: 13,
    fontWeight: 500,
    textAlign: "center",
    flexShrink: 0,
    animation: "fadeIn 0.2s ease",
  },
  main: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
  },
  videoColumn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minWidth: 0,
  },
  viewerBanner: {
    padding: "10px 20px",
    background: "var(--bg-elevated)",
    color: "var(--text-muted)",
    fontSize: 13,
    textAlign: "center",
    borderTop: "1px solid var(--border)",
  },
  sidePanel: {
    width: 300,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    borderLeft: "1px solid var(--border)",
    overflow: "hidden",
  },
  panelTabs: {
    display: "flex",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
  },
  panelTab: {
    flex: 1,
    padding: "12px 8px",
    background: "transparent",
    color: "var(--text-muted)",
    fontFamily: "Syne, sans-serif",
    fontWeight: 600,
    fontSize: 12,
    letterSpacing: "0.04em",
    borderBottom: "2px solid transparent",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  panelTabActive: {
    color: "var(--text-primary)",
    borderBottomColor: "var(--accent)",
    background: "var(--bg-elevated)",
  },
  panelContent: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  chatBadge: {
    background: "var(--accent)",
    color: "white",
    borderRadius: 10,
    padding: "1px 6px",
    fontSize: 10,
    fontWeight: 700,
  },
  center: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  kickedCard: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 20,
    padding: 48,
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    alignItems: "center",
  },
  spinner: {
    width: 44,
    height: 44,
    border: "3px solid var(--border)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};
