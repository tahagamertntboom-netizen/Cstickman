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

function makeRoomCode() {
    let code;

    do {
        code = String(
            Math.floor(100000 + Math.random() * 900000)
        );
    } while (rooms[code]);

    return code;
}

function roomPlayers(room) {
    return Object.values(room.players);
}

function sendPlayers(roomCode) {
    const room = rooms[roomCode];

    if (!room) return;

    io.to(roomCode).emit(
        "playersUpdate",
        roomPlayers(room)
    );
}

function leaveRoom(socket) {
    const code = socket.roomCode;

    if (!code) return;

    const room = rooms[code];

    if (!room) {
        socket.roomCode = null;
        return;
    }

    const wasHost = room.host === socket.id;

    delete room.players[socket.id];

    if (room.readyPlayers) {
        delete room.readyPlayers[socket.id];
    }

    socket.leave(code);
    socket.roomCode = null;

    io.to(code).emit(
        "playerLeft",
        socket.id
    );

    if (wasHost) {
        const ids = Object.keys(room.players);

        if (ids.length > 0) {
            room.host = ids[0];

            io.to(code).emit(
                "newHost",
                room.host
            );
        }
    }

    sendPlayers(code);

    if (Object.keys(room.players).length === 0) {
        delete rooms[code];
        console.log("Room deleted:", code);
    }
}

io.on("connection", (socket) => {

    console.log("Connected:", socket.id);

    // ================================
    // ساخت اتاق
    // ================================

    socket.on("createRoom", (data) => {

        const code = makeRoomCode();

        const player = {
            id: socket.id,
            name:
                typeof data?.name === "string"
                    ? data.name.substring(0, 20)
                    : "Player",

            x: 250,
            y: 300,

            color: "#22c55e",

            isHost: true,
            ready: false
        };

        rooms[code] = {
            code: code,
            host: socket.id,
            players: {},
            readyPlayers: {}
        };

        rooms[code].players[socket.id] = player;

        socket.join(code);
        socket.roomCode = code;

        console.log("ROOM CREATED:", code);

        socket.emit("roomCreated", {
            roomCode: code,
            player: player
        });
    });

    // ================================
    // ورود به اتاق
    // ================================

    socket.on("joinRoom", (data) => {

        const code = String(
            data?.roomCode || ""
        ).replace(/\D/g, "");

        if (code.length !== 6) {
            socket.emit(
                "roomError",
                "کد اتاق باید ۶ رقمی باشد."
            );
            return;
        }

        const room = rooms[code];

        if (!room) {
            socket.emit(
                "roomError",
                "این اتاق پیدا نشد."
            );
            return;
        }

        if (
            Object.keys(room.players).length >= 10
        ) {
            socket.emit(
                "roomError",
                "اتاق پر است."
            );
            return;
        }

        const player = {
            id: socket.id,

            name:
                typeof data?.name === "string"
                    ? data.name.substring(0, 20)
                    : "Player",

            x: 550,
            y: 300,

            color: "#3b82f6",

            isHost: false,
            ready: false
        };

        room.players[socket.id] = player;

        socket.join(code);
        socket.roomCode = code;

        console.log(
            "PLAYER JOINED:",
            socket.id,
            code
        );

        socket.emit("roomJoined", {
            roomCode: code,
            player: player
        });

        sendPlayers(code);
    });

    // ================================
    // آماده شدن برای بازی
    // ================================

    socket.on("readyForGame", () => {

        const code = socket.roomCode;

        if (!code) return;

        const room = rooms[code];

        if (!room) return;

        if (!room.readyPlayers) {
            room.readyPlayers = {};
        }

        room.readyPlayers[socket.id] = true;

        const totalPlayers =
            Object.keys(room.players).length;

        const readyPlayers =
            Object.keys(room.readyPlayers).length;

        io.to(code).emit(
            "readyUpdate",
            {
                ready: readyPlayers,
                total: totalPlayers
            }
        );

        // وقتی حداقل دو نفر آماده باشند
        if (
            totalPlayers >= 2 &&
            readyPlayers >= 2
        ) {
            io.to(code).emit(
                "startGame"
            );
        }
    });

    // ================================
    // حرکت
    // ================================

    socket.on("playerMovement", (data) => {

        const code = socket.roomCode;

        if (!code) return;

        const room = rooms[code];

        if (!room) return;

        const player =
            room.players[socket.id];

        if (!player) return;

        if (typeof data?.x === "number") {
            player.x = data.x;
        }

        if (typeof data?.y === "number") {
            player.y = data.y;
        }

        socket.to(code).emit(
            "playerMoved",
            {
                id: player.id,
                x: player.x,
                y: player.y
            }
        );
    });

    // ================================
    // چت
    // ================================

    socket.on("chatMessage", (message) => {

        const code = socket.roomCode;

        if (!code) return;

        const room = rooms[code];

        if (!room) return;

        const player =
            room.players[socket.id];

        if (!player) return;

        if (typeof message !== "string") return;

        message =
            message.trim().substring(0, 200);

        if (!message) return;

        io.to(code).emit(
            "chatMessage",
            {
                name: player.name,
                message: message
            }
        );
    });

    // ================================
    // خروج
    // ================================

    socket.on("leaveRoom", () => {
        leaveRoom(socket);
    });

    socket.on("disconnect", () => {

        console.log(
            "Disconnected:",
            socket.id
        );

        leaveRoom(socket);
    });
});

// ================================
// وضعیت
// ================================

app.get("/status", (req, res) => {

    let players = 0;

    Object.values(rooms).forEach((room) => {
        players += Object.keys(room.players).length;
    });

    res.json({
        online: true,
        rooms: Object.keys(rooms).length,
        players: players
    });
});

// ================================
// شروع سرور
// ================================

server.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            "Server running on port " + PORT
        );
    }
);
