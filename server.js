const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// فایل‌های بازی
app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// بازیکنان آنلاین
const players = {};

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  // ساخت بازیکن جدید
  players[socket.id] = {
    id: socket.id,
    x: 400,
    y: 300,
    name: "Player",
    color: "#" + Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")
  };

  // فرستادن اطلاعات بازیکنان فعلی به بازیکن جدید
  socket.emit("currentPlayers", players);

  // اطلاع به بقیه بازیکنان
  socket.broadcast.emit("playerJoined", players[socket.id]);

  // دریافت حرکت بازیکن
  socket.on("playerMovement", (data) => {
    if (!players[socket.id]) return;

    if (typeof data.x === "number") {
      players[socket.id].x = data.x;
    }

    if (typeof data.y === "number") {
      players[socket.id].y = data.y;
    }

    if (typeof data.name === "string") {
      players[socket.id].name = data.name.slice(0, 20);
    }

    // ارسال حرکت به همه
    io.emit("playerMoved", players[socket.id]);
  });

  // تغییر اطلاعات بازیکن
  socket.on("updatePlayer", (data) => {
    if (!players[socket.id]) return;

    if (typeof data.name === "string") {
      players[socket.id].name = data.name.slice(0, 20);
    }

    if (typeof data.color === "string") {
      players[socket.id].color = data.color;
    }

    io.emit("playerUpdated", players[socket.id]);
  });

  // چت
  socket.on("chatMessage", (message) => {
    if (typeof message !== "string") return;

    message = message.trim().slice(0, 200);

    if (!message) return;

    io.emit("chatMessage", {
      id: socket.id,
      name: players[socket.id]?.name || "Player",
      message: message
    });
  });

  // قطع اتصال
  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);

    delete players[socket.id];

    io.emit("playerLeft", socket.id);
  });
});

// وضعیت سرور
app.get("/status", (req, res) => {
  res.json({
    online: true,
    players: Object.keys(players).length,
    uptime: process.uptime()
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
