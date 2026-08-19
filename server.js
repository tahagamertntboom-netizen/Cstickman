const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 8080;

// ======================================================
// EXPRESS
// ======================================================

app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// ======================================================
// ROOMS
// ======================================================

const rooms = {};

// ======================================================
// RANDOM ROOM CODE
// ======================================================

function generateRoomCode() {

    let code;

    do {

        code = String(
            Math.floor(
                100000 +
                Math.random() * 900000
            )
        );

    } while (rooms[code]);

    return code;
}

// ======================================================
// PLAYER
// ======================================================

function createPlayer(socket, name) {

    return {

        id: socket.id,

        name:
            String(name || "Player")
                .substring(0, 20),

        x: 300,

        y: 0,

        health: 100,

        level: 1,

        ready: false

    };
}

// ======================================================
// SOCKET.IO
// ======================================================

io.on("connection", (socket) => {

    console.log(
        "Player connected:",
        socket.id
    );

    // ==================================================
    // CREATE ROOM
    // ==================================================

    socket.on("createRoom", (data) => {

        const roomCode =
            generateRoomCode();

        const player =
            createPlayer(
                socket,
                data && data.name
            );

        rooms[roomCode] = {

            players: {},

            ready: {},

            started: false

        };

        rooms[roomCode].players[
            socket.id
        ] = player;

        socket.join(roomCode);

        socket.roomCode =
            roomCode;

        socket.player =
            player;

        socket.emit(
            "roomCreated",
            {
                roomCode,
                player
            }
        );

        console.log(
            `Room ${roomCode} created by ${player.name}`
        );

    });

    // ==================================================
    // JOIN ROOM
    // ==================================================

    socket.on("joinRoom", (data) => {

        const roomCode =
            String(
                data &&
                data.roomCode
                    ? data.roomCode
                    : ""
            ).replace(
                /\D/g,
                ""
            ).substring(0, 6);

        if (
            roomCode.length !== 6
        ) {

            socket.emit(
                "roomError",
                "کد اتاق باید ۶ رقمی باشد."
            );

            return;
        }

        const room =
            rooms[roomCode];

        if (!room) {

            socket.emit(
                "roomError",
                "این اتاق وجود ندارد."
            );

            return;
        }

        if (
            Object.keys(room.players).length >= 15
        ) {

            socket.emit(
                "roomError",
                "اتاق پر است."
            );

            return;
        }

        if (room.started) {

            socket.emit(
                "roomError",
                "بازی این اتاق شروع شده است."
            );

            return;
        }

        const player =
            createPlayer(
                socket,
                data && data.name
            );

        room.players[
            socket.id
        ] = player;

        socket.join(roomCode);

        socket.roomCode =
            roomCode;

        socket.player =
            player;

        socket.emit(
            "roomJoined",
            {
                roomCode,
                player
            }
        );

        io.to(roomCode).emit(
            "playersUpdate",
            Object.values(
                room.players
            )
        );

        console.log(
            `${player.name} joined room ${roomCode}`
        );

    });

    // ==================================================
    // READY
    // ==================================================

    socket.on("readyForGame", () => {

        const roomCode =
            socket.roomCode;

        if (!roomCode) {
            return;
        }

        const room =
            rooms[roomCode];

        if (!room) {
            return;
        }

        const player =
            room.players[
                socket.id
            ];

        if (!player) {
            return;
        }

        player.ready = true;

        room.ready[
            socket.id
        ] = true;

        const total =
            Object.keys(
                room.players
            ).length;

        const ready =
            Object.keys(
                room.ready
            ).filter(
                id =>
                    room.ready[id]
            ).length;

        io.to(roomCode).emit(
            "readyUpdate",
            {
                ready,
                total
            }
        );

        // حداقل 1 نفر آماده باشد بازی شروع می‌شود
        if (
            ready >= 1 &&
            total >= 1 &&
            !room.started
        ) {

            room.started = true;

            const groundY = 500;

            Object.values(
                room.players
            ).forEach(
                (p, index) => {

                    p.x =
                        250 +
                        index * 100;

                    p.y =
                        groundY;

                    p.health =
                        100;

                    p.level =
                        1;

                }
            );

            io.to(roomCode).emit(
                "playersUpdate",
                Object.values(
                    room.players
                )
            );

            io.to(roomCode).emit(
                "startGame"
            );

            console.log(
                `Game started in room ${roomCode}`
            );

        }

    });

    // ==================================================
    // PLAYER MOVEMENT
    // ==================================================

    socket.on(
        "playerMovement",
        (data) => {

            const roomCode =
                socket.roomCode;

            if (!roomCode) {
                return;
            }

            const room =
                rooms[roomCode];

            if (!room) {
                return;
            }

            const player =
                room.players[
                    socket.id
                ];

            if (!player) {
                return;
            }

            if (
                !data ||
                typeof data.x !== "number" ||
                typeof data.y !== "number"
            ) {

                return;

            }

            // جلوگیری از مختصات خراب
            player.x =
                Math.max(
                    0,
                    Math.min(
                        100000,
                        data.x
                    )
                );

            player.y =
                Math.max(
                    -5000,
                    Math.min(
                        5000,
                        data.y
                    )
                );

            socket.to(roomCode).emit(
                "playerMoved",
                player
            );

        }
    );

    // ==================================================
    // DISCONNECT
    // ==================================================

    socket.on("disconnect", () => {

        console.log(
            "Player disconnected:",
            socket.id
        );

        const roomCode =
            socket.roomCode;

        if (!roomCode) {
            return;
        }

        const room =
            rooms[roomCode];

        if (!room) {
            return;
        }

        delete room.players[
            socket.id
        ];

        delete room.ready[
            socket.id
        ];

        io.to(roomCode).emit(
            "playerLeft",
            socket.id
        );

        const remaining =
            Object.keys(
                room.players
            ).length;

        if (remaining > 0) {

            io.to(roomCode).emit(
                "playersUpdate",
                Object.values(
                    room.players
                )
            );

        }

        // اگر اتاق خالی شد حذفش کن
        if (remaining === 0) {

            delete rooms[
                roomCode
            ];

            console.log(
                `Room ${roomCode} deleted`
            );

        }

    });

});

// ======================================================
// START SERVER
// ======================================================

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `🎮 Stickman server running on port ${PORT}`
        );

    }
);
