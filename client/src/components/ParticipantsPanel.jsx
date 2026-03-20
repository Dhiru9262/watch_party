import React, { useState } from "react";

const ROLE_COLORS = {
  host: "var(--host-color)",
  moderator: "var(--mod-color)",
  participant: "var(--participant-color)",
};

const ROLE_LABELS = {
  host: "HOST",
  moderator: "MOD",
  participant: "VIEWER",
};

export default function ParticipantsPanel({ participants, myUserId, isHost, onAssignRole, onRemove }) {
  const [openMenu, setOpenMenu] = useState(null);

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.title}>Participants</span>
        <span style={styles.count}>{participants.length}</span>
      </div>
      <div style={styles.list}>
        {participants.map((p) => (
          <div key={p.userId} style={styles.item}>
            <div style={styles.avatar(p.role)}>
              {p.username.charAt(0).toUpperCase()}
            </div>
            <div style={styles.info}>
              <span style={styles.name}>
                {p.username}
                {p.userId === myUserId && <span style={styles.you}> (you)</span>}
              </span>
              <span style={{ ...styles.badge, color: ROLE_COLORS[p.role] }}>
                {ROLE_LABELS[p.role] || p.role}
              </span>
            </div>
            {isHost && p.userId !== myUserId && p.role !== "host" && (
              <div style={styles.menuWrap}>
                <button style={styles.menuBtn} onClick={() => setOpenMenu(openMenu === p.userId ? null : p.userId)}>
                  ⋮
                </button>
                {openMenu === p.userId && (
                  <div style={styles.dropdown}>
                    {p.role !== "moderator" && (
                      <button style={styles.dropItem} onClick={() => { onAssignRole(p.userId, "moderator"); setOpenMenu(null); }}>
                        → Promote to Mod
                      </button>
                    )}
                    {p.role !== "participant" && (
                      <button style={styles.dropItem} onClick={() => { onAssignRole(p.userId, "participant"); setOpenMenu(null); }}>
                        → Demote to Viewer
                      </button>
                    )}
                    <button style={{ ...styles.dropItem, color: "var(--accent)" }} onClick={() => { onRemove(p.userId); setOpenMenu(null); }}>
                      ✕ Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
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
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
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
  count: {
    background: "var(--bg-elevated)",
    color: "var(--text-secondary)",
    borderRadius: 20,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 0",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 16px",
    transition: "background 0.15s",
    position: "relative",
  },
  avatar: (role) => ({
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "var(--bg-elevated)",
    border: `2px solid ${ROLE_COLORS[role] || "var(--border)"}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
    color: ROLE_COLORS[role],
    flexShrink: 0,
  }),
  info: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--text-primary)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  you: {
    fontSize: 11,
    color: "var(--text-muted)",
  },
  badge: {
    fontSize: 10,
    fontFamily: "Syne, sans-serif",
    fontWeight: 700,
    letterSpacing: "0.08em",
  },
  menuWrap: {
    position: "relative",
  },
  menuBtn: {
    background: "transparent",
    color: "var(--text-muted)",
    fontSize: 18,
    padding: "2px 8px",
    borderRadius: 4,
    lineHeight: 1,
    transition: "background 0.15s, color 0.15s",
  },
  dropdown: {
    position: "absolute",
    right: 0,
    top: "100%",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-light)",
    borderRadius: "var(--radius-sm)",
    boxShadow: "var(--shadow-lg)",
    zIndex: 100,
    minWidth: 160,
    padding: "6px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  dropItem: {
    background: "transparent",
    color: "var(--text-primary)",
    fontSize: 13,
    padding: "8px 12px",
    textAlign: "left",
    borderRadius: 6,
    transition: "background 0.15s",
    whiteSpace: "nowrap",
  },
};
