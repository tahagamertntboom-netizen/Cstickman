const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const rooms = {};

function createRoomCode() {
  let code;

  do {
    code = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
  } while (rooms[code]);

  return code;
}

function sendRoomPlayers(roomCode) {
  const room = rooms[roomCode];

  if (!room) return;

  io.to(roomCode).emit(
    "roomPlayers",
    Object.values(room.players)
  );
}

function leaveRoom(socket) {
  const roomCode = socket.roomCode;

  if (!roomCode) return;

  const room = rooms[roomCode];

  if (!room) {
    socket.roomCode = null;
    return;
  }

  const wasHost = room.host === socket.id;

  delete room.players[socket.id];

  socket.leave(roomCode);
  socket.roomCode = null;

  io.to(roomCode).emit(
    "playerLeft",
    socket.id
  );

  if (wasHost) {
    const players = Object.keys(room.players);

    if (players.length > 0) {
      const newHost = players[0];

      room.host = newHost;

      room.players[newHost].isHost = true;

      io.to(roomCode).emit(
        "newHost",
        newHost
      );
    }
  }

  sendRoomPlayers(roomCode);

  if (
    Object.keys(room.players).length === 0
  ) {
    delete rooms[roomCode];

    console.log(
      "Room deleted:",
      roomCode
    );
  }
}

io.on("connection", (socket) => {
  console.log(
    "Player connected:",
    socket.id
  );

  // =========================
  // CREATE ROOM
  // =========================

  socket.on("createRoom", (data) => {
    const roomCode = createRoomCode();

    const player = {
      id: socket.id,
      name:
        typeof data?.name === "string"
          ? data.name.substring(0, 20)
          : "Player",
      x: 400,
      y: 300,
      color:
        typeof data?.color === "string"
          ? data.color
          : "#ffffff",
      isHost: true
    };

    rooms[roomCode] = {
      code: roomCode,
      host: socket.id,
      players: {}
    };

    rooms[roomCode].players[socket.id] =
      player;

    socket.join(roomCode);

    socket.roomCode = roomCode;

    console.log(
      "Room created:",
      roomCode
    );

    socket.emit(
      "roomCreated",
      {
        roomCode: roomCode,
        player: player,
        players:
          Object.values(
            rooms[roomCode].players
          )
      }
    );
  });

  // =========================
  // JOIN ROOM
  // =========================

  socket.on("joinRoom", (data) => {
    let roomCode = String(
      data?.roomCode || ""
    ).replace(/\D/g, "");

    if (roomCode.length !== 6) {
      socket.emit(
        "roomError",
        "کد اتاق باید ۶ رقمی باشد."
      );

      return;
    }

    const room = rooms[roomCode];

    if (!room) {
      socket.emit(
        "roomError",
        "این اتاق وجود ندارد."
      );

      return;
    }

    const player = {
      id: socket.id,

      name:
        typeof data?.name === "string"
          ? data.name.substring(0, 20)
          : "Player",

      x:
        300 +
        Math.floor(
          Math.random() * 300
        ),

      y: 300,

      color:
        typeof data?.color === "string"
          ? data.color
          : "#ffffff",

      isHost: false
    };

    room.players[socket.id] =
      player;

    socket.join(roomCode);

    socket.roomCode =
      roomCode;

    console.log(
      "Player joined:",
      socket.id,
      roomCode
    );

    socket.emit(
      "roomJoined",
      {
        roomCode: roomCode,
        player: player,
        players:
          Object.values(
            room.players
          )
      }
    );

    socket.to(roomCode).emit(
      "playerJoined",
      player
    );

    sendRoomPlayers(roomCode);
  });

  // =========================
  // MOVEMENT
  // =========================

  socket.on(
    "playerMovement",
    (data) => {
      const roomCode =
        socket.roomCode;

      if (!roomCode) return;

      const room =
        rooms[roomCode];

      if (!room) return;

      const player =
        room.players[socket.id];

      if (!player) return;

      if (
        typeof data?.x === "number"
      ) {
        player.x = data.x;
      }

      if (
        typeof data?.y === "number"
      ) {
        player.y = data.y;
      }

      socket.to(roomCode).emit(
        "playerMoved",
        player
      );
    }
  );

  // =========================
  // PLAYER UPDATE
  // =========================

  socket.on(
    "updatePlayer",
    (data) => {
      const roomCode =
        socket.roomCode;

      if (!roomCode) return;

      const room =
        rooms[roomCode];

      if (!room) return;

      const player =
        room.players[socket.id];

      if (!player) return;

      if (
        typeof data?.name === "string"
      ) {
        player.name =
          data.name.substring(
            0,
            20
          );
      }

      if (
        typeof data?.color === "string"
      ) {
        player.color =
          data.color;
      }

      io.to(roomCode).emit(
        "playerUpdated",
        player
      );
    }
  );

  // =========================
  // CHAT
  // =========================

  socket.on(
    "chatMessage",
    (message) => {
      const roomCode =
        socket.roomCode;

      if (!roomCode) return;

      const room =
        rooms[roomCode];

      if (!room) return;

      const player =
        room.players[socket.id];

      if (!player) return;

      if (
        typeof message !==
        "string"
      ) {
        return;
      }

      message =
        message
          .trim()
          .substring(0, 200);

      if (!message) return;

      io.to(roomCode).emit(
        "chatMessage",
        {
          id: socket.id,
          name: player.name,
          message: message
        }
      );
    }
  );

  // =========================
  // LEAVE
  // =========================

  socket.on(
    "leaveRoom",
    () => {
      leaveRoom(socket);
    }
  );

  // =========================
  // DISCONNECT
  // =========================

  socket.on(
    "disconnect",
    () => {
      console.log(
        "Player disconnected:",
        socket.id
      );

      leaveRoom(socket);
    }
  );
});

// =========================
// STATUS
// =========================

app.get(
  "/status",
  (req, res) => {
    let players = 0;

    Object.values(rooms).forEach(
      (room) => {
        players +=
          Object.keys(
            room.players
          ).length;
      }
    );

    res.json({
      online: true,
      rooms:
        Object.keys(rooms).length,
      players: players,
      uptime: process.uptime()
    });
  }
);

// =========================
// START
// =========================

server.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      "Server running on port " +
      PORT
    );
  }
);
