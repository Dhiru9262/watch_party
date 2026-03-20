import React, { useEffect, useRef, useCallback, useState } from "react";

let ytApiLoaded = false;
let ytApiCallbacks = [];

function loadYTApi() {
  if (ytApiLoaded) return;
  if (window.YT && window.YT.Player) {
    ytApiLoaded = true;
    return;
  }

  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);

  window.onYouTubeIframeAPIReady = () => {
    ytApiLoaded = true;
    ytApiCallbacks.forEach((cb) => cb());
    ytApiCallbacks = [];
  };
}

function onYTReady(cb) {
  if (ytApiLoaded && window.YT?.Player) {
    cb();
  } else {
    ytApiCallbacks.push(cb);
    loadYTApi();
  }
}

export default function YouTubePlayer({ videoState, canControl, onPlay, onPause, onSeek }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const isSyncing = useRef(false);
  const lastVideoId = useRef(null);
  const seekTimeout = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);

  const createPlayer = useCallback((videoId) => {
    if (!containerRef.current) return;

    // Destroy existing player
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch {}
      playerRef.current = null;
    }

    const div = document.createElement("div");
    div.id = "yt-player-" + Date.now();
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(div);

    playerRef.current = new window.YT.Player(div.id, {
      videoId,
      playerVars: {
        autoplay: 0,
        controls: canControl ? 1 : 0,
        modestbranding: 1,
        rel: 0,
        enablejsapi: 1,
      },
      events: {
        onReady: (e) => {
          setPlayerReady(true);
          lastVideoId.current = videoId;
          // Apply initial state
          if (videoState.currentTime > 0) {
            e.target.seekTo(videoState.currentTime, true);
          }
          if (videoState.playState === "playing") {
            e.target.playVideo();
          }
        },
        onStateChange: (e) => {
          if (isSyncing.current) return;
          const player = e.target;
          const state = e.data;

          if (state === window.YT.PlayerState.PLAYING) {
            onPlay?.(player.getCurrentTime());
          } else if (state === window.YT.PlayerState.PAUSED) {
            onPause?.(player.getCurrentTime());
          }
        },
      },
    });
  }, [canControl]);

  // Initialize player
  useEffect(() => {
    onYTReady(() => {
      createPlayer(videoState.videoId);
    });
    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
      }
    };
  }, []);

  // Handle video ID change
  useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    if (videoState.videoId === lastVideoId.current) return;

    isSyncing.current = true;
    playerRef.current.loadVideoById(videoState.videoId, 0);
    lastVideoId.current = videoState.videoId;
    setTimeout(() => { isSyncing.current = false; }, 500);
  }, [videoState.videoId, playerReady]);

  // Sync play/pause/seek from server
  useEffect(() => {
    if (!playerReady || !playerRef.current) return;

    isSyncing.current = true;

    try {
      const currentTime = playerRef.current.getCurrentTime?.() || 0;
      const timeDiff = Math.abs(currentTime - videoState.currentTime);

      if (timeDiff > 1.5) {
        playerRef.current.seekTo(videoState.currentTime, true);
      }

      if (videoState.playState === "playing") {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch {}

    setTimeout(() => { isSyncing.current = false; }, 500);
  }, [videoState.playState, videoState.currentTime, playerReady]);

  return (
    <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", background: "#000" }}>
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />
      {!playerReady && (
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          background: "#0a0a0f", color: "#8888aa", flexDirection: "column", gap: 12,
        }}>
          <div style={{ width: 40, height: 40, border: "3px solid #2a2a3a", borderTopColor: "#e63946", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontFamily: "DM Sans", fontSize: 14 }}>Loading player...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
        </div>
      )}
    </div>
  );
}
