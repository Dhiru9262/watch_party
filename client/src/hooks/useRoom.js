import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "../context/SocketContext";

export function useRoom(roomId, userId, username) {
  const { socket } = useSocket();
  const [participants, setParticipants] = useState([]);
  const [myRole, setMyRole] = useState("participant");
  const [videoState, setVideoState] = useState({
    videoId: "dQw4w9WgXcQ",
    playState: "paused",
    currentTime: 0,
  });
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [joined, setJoined] = useState(false);
  const [kicked, setKicked] = useState(false);

  const canControl = myRole === "host" || myRole === "moderator";
  const isHost = myRole === "host";

  useEffect(() => {
    if (!socket || !roomId || !userId || !username) return;

    // Join the room
    socket.emit("join_room", { roomId, userId, username });

    socket.on("room_joined", (data) => {
      setParticipants(data.participants);
      setMyRole(data.role);
      setVideoState(data.videoState);
      setMessages(data.messages || []);
      setJoined(true);
    });

    socket.on("sync_state", (state) => {
      setVideoState((prev) => ({ ...prev, ...state }));
    });

    socket.on("user_joined", ({ participants }) => {
      setParticipants(participants);
    });

    socket.on("user_left", ({ participants }) => {
      setParticipants(participants);
    });

    socket.on("role_assigned", ({ userId: uid, role, participants }) => {
      setParticipants(participants);
      if (uid === userId) setMyRole(role);
    });

    socket.on("participant_removed", ({ participants }) => {
      setParticipants(participants);
    });

    socket.on("chat_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("kicked", ({ message }) => {
      setKicked(true);
      setError(message);
    });

    socket.on("error", ({ message }) => {
      setError(message);
      setTimeout(() => setError(null), 3000);
    });

    return () => {
      socket.emit("leave_room", { roomId, userId });
      socket.off("room_joined");
      socket.off("sync_state");
      socket.off("user_joined");
      socket.off("user_left");
      socket.off("role_assigned");
      socket.off("participant_removed");
      socket.off("chat_message");
      socket.off("kicked");
      socket.off("error");
    };
  }, [socket, roomId, userId, username]);

  const play = useCallback((currentTime) => {
    if (!canControl) return;
    socket?.emit("play", { roomId, userId, currentTime });
  }, [socket, roomId, userId, canControl]);

  const pause = useCallback((currentTime) => {
    if (!canControl) return;
    socket?.emit("pause", { roomId, userId, currentTime });
  }, [socket, roomId, userId, canControl]);

  const seek = useCallback((time) => {
    if (!canControl) return;
    socket?.emit("seek", { roomId, userId, time });
  }, [socket, roomId, userId, canControl]);

  const changeVideo = useCallback((videoId) => {
    if (!canControl) return;
    socket?.emit("change_video", { roomId, userId, videoId });
  }, [socket, roomId, userId, canControl]);

  const assignRole = useCallback((targetUserId, role) => {
    if (!isHost) return;
    socket?.emit("assign_role", { roomId, requesterId: userId, targetUserId, role });
  }, [socket, roomId, userId, isHost]);

  const removeParticipant = useCallback((targetUserId) => {
    if (!isHost) return;
    socket?.emit("remove_participant", { roomId, requesterId: userId, targetUserId });
  }, [socket, roomId, userId, isHost]);

  const sendMessage = useCallback((text) => {
    socket?.emit("chat_message", { roomId, userId, text });
  }, [socket, roomId, userId]);

  const requestSync = useCallback(() => {
    socket?.emit("sync_request", { roomId });
  }, [socket, roomId]);

  return {
    participants,
    myRole,
    videoState,
    messages,
    error,
    joined,
    kicked,
    canControl,
    isHost,
    actions: { play, pause, seek, changeVideo, assignRole, removeParticipant, sendMessage, requestSync },
  };
}
