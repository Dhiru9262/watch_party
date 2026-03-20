import { Participant, roomManager } from "./RoomManager.js";
import Room from "../models/Room.js";

/**
 * MessageHandler class - OOP encapsulation of all socket event handling
 */
export class MessageHandler {
  constructor(io) {
    this.io = io;
  }

  broadcast(roomId, event, data) {
    this.io.to(roomId).emit(event, data);
  }

  broadcastExcept(socketId, roomId, event, data) {
    this.io.to(roomId).except(socketId).emit(event, data);
  }

  async handleJoinRoom(socket, { roomId, username, userId }) {
    try {
      if (!roomId || !username || !userId) {
        socket.emit("error", { message: "Missing required fields" });
        return;
      }

      // Check if room exists in DB
      let dbRoom = await Room.findOne({ roomId, isActive: true });
      const isCreator = !dbRoom;

      // Create room in DB if first joiner
      if (isCreator) {
        dbRoom = new Room({
          roomId,
          hostId: userId,
          participants: [],
        });
        await dbRoom.save();
      }

      socket.join(roomId);

      // Manage in-memory state
      let room = roomManager.getRoom(roomId);
      const participant = new Participant({
        userId,
        username,
        socketId: socket.id,
        role: isCreator ? "host" : "participant",
      });

      if (!room) {
        room = roomManager.createRoom(roomId, participant);
      } else {
        // Reconnect case: check if participant already exists
        const existing = roomManager.getParticipant(roomId, userId);
        if (existing) {
          existing.socketId = socket.id;
        } else {
          roomManager.addParticipant(roomId, participant);
        }
      }

      const participants = roomManager.getParticipantsList(roomId);
      const videoState = room.videoState.toJSON();

      // Send current state to joiner
      socket.emit("room_joined", {
        roomId,
        userId,
        role: participant.role,
        videoState,
        participants,
        messages: room.messages.slice(-50),
      });

      // Notify others
      this.broadcastExcept(socket.id, roomId, "user_joined", {
        username,
        userId,
        role: participant.role,
        participants,
      });
    } catch (err) {
      console.error("join_room error:", err);
      socket.emit("error", { message: "Failed to join room" });
    }
  }

  handleLeaveRoom(socket, { roomId, userId }) {
    this._removeFromRoom(socket, roomId, userId);
  }

  handlePlay(socket, { roomId, userId, currentTime }) {
    const result = roomManager.updateVideoState(roomId, userId, {
      playState: "playing",
      currentTime,
    });
    if (!result.success) {
      socket.emit("error", { message: result.error });
      return;
    }
    this.broadcast(roomId, "sync_state", result.videoState);
  }

  handlePause(socket, { roomId, userId, currentTime }) {
    const result = roomManager.updateVideoState(roomId, userId, {
      playState: "paused",
      currentTime,
    });
    if (!result.success) {
      socket.emit("error", { message: result.error });
      return;
    }
    this.broadcast(roomId, "sync_state", result.videoState);
  }

  handleSeek(socket, { roomId, userId, time }) {
    const result = roomManager.updateVideoState(roomId, userId, {
      currentTime: time,
    });
    if (!result.success) {
      socket.emit("error", { message: result.error });
      return;
    }
    this.broadcastExcept(socket.id, roomId, "sync_state", result.videoState);
  }

  handleChangeVideo(socket, { roomId, userId, videoId }) {
    const result = roomManager.updateVideoState(roomId, userId, {
      videoId,
      currentTime: 0,
      playState: "paused",
    });
    if (!result.success) {
      socket.emit("error", { message: result.error });
      return;
    }
    this.broadcast(roomId, "sync_state", result.videoState);
  }

  handleAssignRole(socket, { roomId, requesterId, targetUserId, role }) {
    const validRoles = ["moderator", "participant"];
    if (!validRoles.includes(role)) {
      socket.emit("error", { message: "Invalid role" });
      return;
    }

    const result = roomManager.assignRole(roomId, requesterId, targetUserId, role);
    if (!result.success) {
      socket.emit("error", { message: result.error });
      return;
    }

    const participants = roomManager.getParticipantsList(roomId);
    this.broadcast(roomId, "role_assigned", {
      userId: targetUserId,
      username: result.participant.username,
      role,
      participants,
    });
  }

  handleRemoveParticipant(socket, { roomId, requesterId, targetUserId }) {
    const requester = roomManager.getParticipant(roomId, requesterId);
    if (!requester || requester.role !== "host") {
      socket.emit("error", { message: "Permission denied" });
      return;
    }

    const target = roomManager.getParticipant(roomId, targetUserId);
    if (!target) {
      socket.emit("error", { message: "User not found" });
      return;
    }

    const targetSocketId = target.socketId;
    roomManager.removeParticipant(roomId, targetUserId);

    const participants = roomManager.getParticipantsList(roomId);
    this.broadcast(roomId, "participant_removed", { userId: targetUserId, participants });

    // Force-disconnect the removed user
    if (targetSocketId) {
      this.io.to(targetSocketId).emit("kicked", { message: "You have been removed from the room" });
      const targetSocket = this.io.sockets.sockets.get(targetSocketId);
      if (targetSocket) targetSocket.leave(roomId);
    }
  }

  handleChatMessage(socket, { roomId, userId, text }) {
    const participant = roomManager.getParticipant(roomId, userId);
    if (!participant) {
      socket.emit("error", { message: "Not in room" });
      return;
    }
    if (!text || text.trim().length === 0) return;

    const message = roomManager.addMessage(roomId, {
      userId,
      username: participant.username,
      text: text.trim().slice(0, 500),
    });

    this.broadcast(roomId, "chat_message", message);
  }

  handleSyncRequest(socket, { roomId }) {
    const room = roomManager.getRoom(roomId);
    if (!room) return;
    socket.emit("sync_state", room.videoState.toJSON());
  }

  handleDisconnect(socket) {
    const found = roomManager.findRoomBySocketId(socket.id);
    if (!found) return;

    const { roomId, userId, participant } = found;
    this._removeFromRoom(socket, roomId, userId, participant.username);
  }

  _removeFromRoom(socket, roomId, userId, username) {
    const participant = roomManager.getParticipant(roomId, userId);
    const uname = username || participant?.username || "Unknown";

    roomManager.removeParticipant(roomId, userId);
    socket.leave(roomId);

    const room = roomManager.getRoom(roomId);
    const participants = room ? roomManager.getParticipantsList(roomId) : [];

    this.broadcast(roomId, "user_left", { username: uname, userId, participants });
  }
}
