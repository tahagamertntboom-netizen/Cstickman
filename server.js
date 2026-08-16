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

app.use(express.static(__dirname));

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

function sendPlayers(code) {
    const room = rooms[code];

    if (!room) return;

    io.to(code).emit(
        "playersUpdate",
        Object.values(room.players)
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

    delete room.players[socket.id];
    delete room.readyPlayers[socket.id];

    socket.leave(code);
    socket.roomCode = null;

    io.to(code).emit(
        "playerLeft",
        socket.id
    );

    const ids = Object.keys(room.players);

    if (ids.length > 0 && room.host === socket.id) {

        room.host = ids[0];

        room.players[room.host].isHost = true;

        io.to(code).emit(
            "newHost",
            room.host
        );
    }

    sendPlayers(code);

    if (ids.length === 0) {
        delete rooms[code];

        console.log(
            "ROOM DELETED:",
            code
        );
    }
}

io.on("connection", (socket) => {

    console.log(
        "CONNECTED:",
        socket.id
    );


    // ================================
    // ساخت اتاق
    // ================================

    socket.on("createRoom", (data) => {

        const code = makeRoomCode();

        let name = "Player";

        if (
            data &&
            typeof data.name === "string"
        ) {
            name =
                data.name
                    .trim()
                    .substring(0, 20);

            if (!name) {
                name = "Player";
            }
        }

        const player = {
            id: socket.id,
            name: name,

            x: 250,
            y: 0,

            color: "#22c55e",

            isHost: true,
            ready: false
        };

        rooms[code] = {
            code: code,

            host: socket.id,

            players: {
                [socket.id]: player
            },

            readyPlayers: {}
        };

        socket.join(code);

        socket.roomCode = code;

        console.log(
            "ROOM CREATED:",
            code
        );

        socket.emit(
            "roomCreated",
            {
                roomCode: code,
                player: player
            }
        );

        sendPlayers(code);
    });


    // ================================
    // ورود به اتاق
    // ================================

    socket.on("joinRoom", (data) => {

        const code = String(
            data && data.roomCode
                ? data.roomCode
                : ""
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
                "این اتاق وجود ندارد."
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

        let name = "Player";

        if (
            data &&
            typeof data.name === "string"
        ) {
            name =
                data.name
                    .trim()
                    .substring(0, 20);

            if (!name) {
                name = "Player";
            }
        }

        const player = {
            id: socket.id,
            name: name,

            x: 550,
            y: 0,

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

        socket.emit(
            "roomJoined",
            {
                roomCode: code,
                player: player
            }
        );

        sendPlayers(code);
    });


    // ================================
    // آماده برای بازی
    // ================================

    socket.on("readyForGame", () => {

        const code = socket.roomCode;

        if (!code) return;

        const room = rooms[code];

        if (!room) return;

        room.readyPlayers[socket.id] = true;

        if (room.players[socket.id]) {
            room.players[socket.id].ready = true;
        }

        const total =
            Object.keys(room.players).length;

        const ready =
            Object.keys(room.readyPlayers).length;

        io.to(code).emit(
            "readyUpdate",
            {
                ready: ready,
                total: total
            }
        );

        sendPlayers(code);

        if (
            total >= 2 &&
            ready >= 2
        ) {

            io.to(code).emit(
                "startGame"
            );
        }
    });


    // ================================
    // حرکت
    // ================================

    socket.on(
        "playerMovement",
        (data) => {

            const code =
                socket.roomCode;

            if (!code) return;

            const room =
                rooms[code];

            if (!room) return;

            const player =
                room.players[socket.id];

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

            socket.to(code).emit(
                "playerMoved",
                {
                    id: player.id,
                    x: player.x,
                    y: player.y
                }
            );
        }
    );


    // ================================
    // خروج
    // ================================

    socket.on(
        "leaveRoom",
        () => {
            leaveRoom(socket);
        }
    );


    // ================================
    // قطع اتصال
    // ================================

    socket.on(
        "disconnect",
        () => {

            console.log(
                "DISCONNECTED:",
                socket.id
            );

            leaveRoom(socket);
        }
    );
});


// ================================
// وضعیت سرور
// ================================

app.get("/status", (req, res) => {

    let players = 0;

    Object.values(rooms)
        .forEach((room) => {

            players +=
                Object.keys(
                    room.players
                ).length;
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
            "SERVER RUNNING ON PORT " +
            PORT
        );
    }
);
