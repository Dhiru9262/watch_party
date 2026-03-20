import express from "express";
import { nanoid } from "nanoid";
import Room from "../models/Room.js";

const router = express.Router();

// Create a new room
router.post("/create", async (req, res) => {
  try {
    const roomId = nanoid(8).toUpperCase();
    res.json({ roomId });
  } catch (err) {
    res.status(500).json({ error: "Failed to create room" });
  }
});

// Check if room exists
router.get("/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId, isActive: true });
    if (!room) {
      // Room might exist only in memory (first user hasn't fully joined yet)
      // Allow joining - it will be created on join_room event
      return res.json({ exists: false, roomId });
    }
    res.json({
      exists: true,
      roomId: room.roomId,
      participantCount: room.participants.length,
      videoId: room.videoState?.videoId,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to check room" });
  }
});

export default router;
