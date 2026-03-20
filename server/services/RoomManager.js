/**
 * OOP-based Room management for WebSocket server
 * Encapsulates room state, participant management, and broadcast logic
 */

export class Participant {
  constructor({ userId, username, socketId, role = "participant" }) {
    this.userId = userId;
    this.username = username;
    this.socketId = socketId;
    this.role = role;
    this.joinedAt = new Date();
  }

  canControl() {
    return this.role === "host" || this.role === "moderator";
  }

  canAssignRoles() {
    return this.role === "host";
  }

  toJSON() {
    return {
      userId: this.userId,
      username: this.username,
      role: this.role,
      joinedAt: this.joinedAt,
    };
  }
}

export class VideoState {
  constructor() {
    this.videoId = "dQw4w9WgXcQ";
    this.playState = "paused";
    this.currentTime = 0;
    this.lastUpdated = Date.now();
  }

  update({ videoId, playState, currentTime }) {
    if (videoId !== undefined) this.videoId = videoId;
    if (playState !== undefined) this.playState = playState;
    if (currentTime !== undefined) this.currentTime = currentTime;
    this.lastUpdated = Date.now();
  }

  toJSON() {
    return {
      videoId: this.videoId,
      playState: this.playState,
      currentTime: this.currentTime,
    };
  }
}

export class RoomManager {
  constructor() {
    // In-memory rooms map: roomId -> { participants: Map<userId, Participant>, videoState: VideoState }
    this.rooms = new Map();
  }

  createRoom(roomId, hostParticipant) {
    const room = {
      participants: new Map(),
      videoState: new VideoState(),
      messages: [],
    };
    hostParticipant.role = "host";
    room.participants.set(hostParticipant.userId, hostParticipant);
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  addParticipant(roomId, participant) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    room.participants.set(participant.userId, participant);
    return room;
  }

  removeParticipant(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    room.participants.delete(userId);
    if (room.participants.size === 0) {
      this.rooms.delete(roomId);
    }
    return room;
  }

  getParticipant(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    return room.participants.get(userId);
  }

  assignRole(roomId, requesterId, targetUserId, newRole) {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: "Room not found" };

    const requester = room.participants.get(requesterId);
    if (!requester || !requester.canAssignRoles()) {
      return { success: false, error: "Permission denied" };
    }

    const target = room.participants.get(targetUserId);
    if (!target) return { success: false, error: "Target user not found" };

    // Host cannot be demoted by assign_role
    if (target.role === "host") {
      return { success: false, error: "Cannot change host role" };
    }

    target.role = newRole;
    return { success: true, participant: target };
  }

  updateVideoState(roomId, requesterId, updates) {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: "Room not found" };

    const requester = room.participants.get(requesterId);
    if (!requester || !requester.canControl()) {
      return { success: false, error: "Permission denied" };
    }

    room.videoState.update(updates);
    return { success: true, videoState: room.videoState.toJSON() };
  }

  getParticipantsList(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.participants.values()).map((p) => p.toJSON());
  }

  addMessage(roomId, message) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const msg = { ...message, timestamp: new Date() };
    room.messages.push(msg);
    if (room.messages.length > 100) room.messages.shift();
    return msg;
  }

  findRoomBySocketId(socketId) {
    for (const [roomId, room] of this.rooms.entries()) {
      for (const [userId, participant] of room.participants.entries()) {
        if (participant.socketId === socketId) {
          return { roomId, userId, participant, room };
        }
      }
    }
    return null;
  }
}

export const roomManager = new RoomManager();
