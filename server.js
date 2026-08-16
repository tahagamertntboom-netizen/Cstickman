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

// فایل‌های بازی
app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/*
==================================================
ROOM SYSTEM
==================================================
*/

const rooms = {};

// ساخت کد اتاق فقط عددی - ۶ رقمی
function makeRoomCode() {
  let code;

  do {
    code = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
  } while (rooms[code]);

  return code;
}

// ساخت اتاق
function createRoom(socket) {
  const roomCode = makeRoomCode();

  rooms[roomCode] = {
    code: roomCode,
    host: socket.id,
    players: {}
  };

  return roomCode;
}

// حذف اتاق خالی
function removeEmptyRoom(roomCode) {
  if (!rooms[roomCode]) return;

  if (
    Object.keys(rooms[roomCode].players).length === 0
  ) {
    delete rooms[roomCode];

    console.log("Room deleted:", roomCode);
  }
}

/*
==================================================
CONNECTION
==================================================
*/

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  /*
  ================================================
  CREATE ROOM
  ================================================
  */

  socket.on("createRoom", (data, callback) => {
    try {
      const roomCode = createRoom(socket);

      const player = {
        id: socket.id,

        name:
          data &&
          typeof data.name === "string"
            ? data.name.substring(0, 20)
            : "Player",

        x: 400,
        y: 300,

        color:
          data &&
          typeof data.color === "string"
            ? data.color
            : "#ffffff",

        isHost: true
      };

      rooms[roomCode].players[socket.id] =
        player;

      socket.join(roomCode);

      socket.roomCode = roomCode;

      console.log(
        "Room created:",
        roomCode,
        "Host:",
        socket.id
      );

      const result = {
        success: true,
        roomCode: roomCode,
        room: rooms[roomCode],
        player: player
      };

      if (typeof callback === "function") {
        callback(result);
      }

      socket.emit(
        "roomCreated",
        result
      );

    } catch (error) {
      console.error(
        "Create room error:",
        error
      );

      if (typeof callback === "function") {
        callback({
          success: false,
          message: "خطا در ساخت اتاق"
        });
      }
    }
  });

  /*
  ================================================
  JOIN ROOM
  ================================================
  */

  socket.on("joinRoom", (data, callback) => {
    try {
      if (!data || !data.roomCode) {
        const result = {
          success: false,
          message: "کد اتاق وارد نشده است."
        };

        if (typeof callback === "function") {
          callback(result);
        }

        return;
      }

      // فقط عدد قبول می‌شود
      const roomCode = String(
        data.roomCode
      )
        .replace(/\D/g, "")
        .trim();

      if (roomCode.length !== 6) {
        const result = {
          success: false,
          message:
            "کد اتاق باید ۶ رقمی باشد."
        };

        if (typeof callback === "function") {
          callback(result);
        }

        socket.emit(
          "roomError",
          result
        );

        return;
      }

      const room = rooms[roomCode];

      if (!room) {
        const result = {
          success: false,
          message:
            "این اتاق وجود ندارد."
        };

        if (typeof callback === "function") {
          callback(result);
        }

        socket.emit(
          "roomError",
          result
        );

        return;
      }

      const player = {
        id: socket.id,

        name:
          typeof data.name === "string"
            ? data.name.substring(0, 20)
            : "Player",

        x:
          400 +
          Math.floor(
            Math.random() * 100
          ),

        y: 300,

        color:
          typeof data.color === "string"
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
        "Room:",
        roomCode
      );

      const result = {
        success: true,
        roomCode: roomCode,
        room: room,
        player: player
      };

      if (typeof callback === "function") {
        callback(result);
      }

      // اطلاعات اتاق برای بازیکن
      socket.emit(
        "roomJoined",
        result
      );

      socket.emit(
        "currentPlayers",
        room.players
      );

      // اطلاع به بقیه
      socket.to(roomCode).emit(
        "playerJoined",
        player
      );

      io.to(roomCode).emit(
        "roomPlayers",
        room.players
      );

    } catch (error) {
      console.error(
        "Join room error:",
        error
      );

      if (typeof callback === "function") {
        callback({
          success: false,
          message:
            "خطا در ورود به اتاق"
        });
      }
    }
  });

  /*
  ================================================
  PLAYER MOVEMENT
  ================================================
  */

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
        room.players[
          socket.id
        ];

      if (!player) return;

      if (
        data &&
        typeof data.x === "number"
      ) {
        player.x = data.x;
      }

      if (
        data &&
        typeof data.y === "number"
      ) {
        player.y = data.y;
      }

      socket
        .to(roomCode)
        .emit(
          "playerMoved",
          player
        );
    }
  );

  /*
  ================================================
  UPDATE PLAYER
  ================================================
  */

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
        room.players[
          socket.id
        ];

      if (!player) return;

      if (
        data &&
        typeof data.name === "string"
      ) {
        player.name =
          data.name.substring(
            0,
            20
          );
      }

      if (
        data &&
        typeof data.color === "string"
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

  /*
  ================================================
  CHAT
  ================================================
  */

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
        room.players[
          socket.id
        ];

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

  /*
  ================================================
  GET ROOM
  ================================================
  */

  socket.on(
    "getRoom",
    (callback) => {
      const roomCode =
        socket.roomCode;

      if (
        !roomCode ||
        !rooms[roomCode]
      ) {
        if (
          typeof callback ===
          "function"
        ) {
          callback({
            success: false
          });
        }

        return;
      }

      if (
        typeof callback ===
        "function"
      ) {
        callback({
          success: true,
          room:
            rooms[roomCode]
        });
      }
    }
  );

  /*
  ================================================
  LEAVE ROOM
  ================================================
  */

  socket.on(
    "leaveRoom",
    () => {
      leaveRoom(socket);
    }
  );

  /*
  ================================================
  DISCONNECT
  ================================================
  */

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

/*
==================================================
LEAVE ROOM
==================================================
*/

function leaveRoom(socket) {
  const roomCode =
    socket.roomCode;

  if (!roomCode) return;

  const room =
    rooms[roomCode];

  if (!room) {
    socket.roomCode =
      null;

    return;
  }

  const wasHost =
    room.host === socket.id;

  delete room.players[
    socket.id
  ];

  socket.leave(roomCode);

  socket.roomCode =
    null;

  // اطلاع خروج بازیکن
  io.to(roomCode).emit(
    "playerLeft",
    socket.id
  );

  io.to(roomCode).emit(
    "roomPlayers",
    room.players
  );

  /*
  اگر میزبان خارج شد،
  بازیکن بعدی میزبان شود
  */

  if (wasHost) {
    const remainingPlayers =
      Object.keys(
        room.players
      );

    if (
      remainingPlayers.length >
      0
    ) {
      const newHost =
        remainingPlayers[0];

      room.host =
        newHost;

      room.players[
        newHost
      ].isHost = true;

      io.to(roomCode).emit(
        "newHost",
        room.players[
          newHost
        ]
      );
    }
  }

  removeEmptyRoom(
    roomCode
  );
}

/*
==================================================
SERVER STATUS
==================================================
*/

app.get(
  "/status",
  (req, res) => {
    let totalPlayers = 0;

    Object.values(rooms).forEach(
      (room) => {
        totalPlayers +=
          Object.keys(
            room.players
          ).length;
      }
    );

    res.json({
      online: true,
      rooms:
        Object.keys(
          rooms
        ).length,
      players:
        totalPlayers,
      uptime:
        process.uptime()
    });
  }
);

/*
==================================================
START SERVER
==================================================
*/

server.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Server running on port ${PORT}`
    );
  }
);
