import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import roomRoutes from "./routes/rooms.js";
import { MessageHandler } from "./services/MessageHandler.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const io = new Server(httpServer, {
  cors: {
    origin: [CLIENT_URL, "http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: [CLIENT_URL, "http://localhost:5173", "http://localhost:3000"], credentials: true }));
app.use(express.json());

// Routes
app.use("/api/rooms", roomRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/watchparty";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Socket.IO setup with OOP MessageHandler
const handler = new MessageHandler(io);

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on("join_room", (data) => handler.handleJoinRoom(socket, data));
  socket.on("leave_room", (data) => handler.handleLeaveRoom(socket, data));
  socket.on("play", (data) => handler.handlePlay(socket, data));
  socket.on("pause", (data) => handler.handlePause(socket, data));
  socket.on("seek", (data) => handler.handleSeek(socket, data));
  socket.on("change_video", (data) => handler.handleChangeVideo(socket, data));
  socket.on("assign_role", (data) => handler.handleAssignRole(socket, data));
  socket.on("remove_participant", (data) => handler.handleRemoveParticipant(socket, data));
  socket.on("chat_message", (data) => handler.handleChatMessage(socket, data));
  socket.on("sync_request", (data) => handler.handleSyncRequest(socket, data));
  socket.on("disconnect", () => handler.handleDisconnect(socket));
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
