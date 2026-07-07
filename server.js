const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS allowed for cross-device connections
const io = new Server(server, {
  cors: {
    origin: "*", // Allows any client to connect; tighten this up later for security
    methods: ["GET", "POST"]
  }
});
// Serve your frontend folder files statically
app.use(express.static(__dirname));
const PORT = process.env.PORT || 3000;

// Basic health check route
app.get('/', (req, res) => {
  res.send('Skymingle Signaling Server is running via Socket.IO');
});

// Socket.IO Connection Event
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 1. Listen for a client joining a specific room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  // 2. Listen for signaling data (Offers, Answers, ICE Candidates) and broadcast it
  socket.on('signal', (data) => {
    // data should look like: { roomId: "room123", signalData: {...} }
    // This sends the data to everyone in the room except the original sender
    socket.to(data.roomId).emit('signal', {
      sender: socket.id,
      signalData: data.signalData
    });
  });

  // 3. Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});