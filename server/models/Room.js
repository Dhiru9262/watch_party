import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  role: {
    type: String,
    enum: ["host", "moderator", "participant"],
    default: "participant",
  },
  socketId: { type: String },
  joinedAt: { type: Date, default: Date.now },
});

const roomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },
    hostId: { type: String, required: true },
    videoState: {
      videoId: { type: String, default: "dQw4w9WgXcQ" },
      playState: { type: String, enum: ["playing", "paused"], default: "paused" },
      currentTime: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
    },
    participants: [participantSchema],
    messages: [
      {
        userId: String,
        username: String,
        text: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Room", roomSchema);
