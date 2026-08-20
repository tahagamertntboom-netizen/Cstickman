const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 8080;

app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

const rooms = {};

function generateRoomCode() {
    let code;

    do {
        code = String(
            Math.floor(
                100000 + Math.random() * 900000
            )
        );
    } while (rooms[code]);

    return code;
}

function createPlayer(socket, name) {
    return {
        id: socket.id,
        name: String(name || "Player").substring(0, 20),
        x: 300,
        y: 0,
        health: 100,
        level: 1,
        ready: false
    };
}

// ======================================================
// MOB
// ======================================================

let nextMobId = 1;

function createMob(x, y) {
    return {
        id: "mob_" + nextMobId++,
        type: "monster",
        x,
        y,
        health: 100,
        maxHealth: 100,
        speed: 1.5,
        damageCooldown: 0,
        dead: false,
        respawnTimer: 0
    };
}

function createRoomMobs() {
    return [
        createMob(650, 500),
        createMob(950, 500),
        createMob(1250, 500)
    ];
}

function updateRoomMobs(roomCode, room) {
    if (!room.started) return;

    const players = Object.values(room.players);

    if (players.length === 0) return;

    const groundY = 500;

    room.mobs.forEach((mob) => {

        // مرده
        if (mob.dead) {

            mob.respawnTimer--;

            if (mob.respawnTimer <= 0) {
                mob.dead = false;
                mob.health = mob.maxHealth;

                mob.x =
                    500 +
                    Math.floor(Math.random() * 1200);

                mob.y = groundY;
                mob.damageCooldown = 0;
            }

            return;
        }

        // پیدا کردن نزدیک‌ترین بازیکن
        let target = null;
        let closest = Infinity;

        players.forEach((player) => {

            if (player.health <= 0) return;

            const distance =
                Math.abs(player.x - mob.x);

            if (distance < closest) {
                closest = distance;
                target = player;
            }
        });

        if (!target) return;

        // حرکت هیولا
        if (closest > 45) {

            if (target.x > mob.x) {
                mob.x += mob.speed;
            } else {
                mob.x -= mob.speed;
            }
        }

        mob.x = Math.max(
            40,
            Math.min(
                5000,
                mob.x
            )
        );

        mob.y = groundY;

        // کاهش cooldown
        if (mob.damageCooldown > 0) {
            mob.damageCooldown--;
        }

        // ضربه به بازیکن
        if (
            closest <= 55 &&
            mob.damageCooldown <= 0
        ) {

            target.health = Math.max(
                0,
                target.health - 10
            );

            mob.damageCooldown = 60;

            io.to(roomCode).emit(
                "playerHealth",
                {
                    id: target.id,
                    health: target.health
                }
            );
        }
    });

    io.to(roomCode).emit(
        "mobsUpdate",
        room.mobs
    );
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
            started: false,

            mobs: createRoomMobs()
        };

        rooms[roomCode].players[
            socket.id
        ] = player;

        socket.join(roomCode);

        socket.roomCode = roomCode;
        socket.player = player;

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
            )
                .replace(/\D/g, "")
                .substring(0, 6);

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

        socket.roomCode = roomCode;
        socket.player = player;

        socket.emit(
            "roomJoined",
            {
                roomCode,
                player
            }
        );

        io.to(roomCode).emit(
            "playersUpdate",
            Object.values(room.players)
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

        if (!roomCode) return;

        const room =
            rooms[roomCode];

        if (!room) return;

        const player =
            room.players[socket.id];

        if (!player) return;

        player.ready = true;

        room.ready[socket.id] = true;

        const total =
            Object.keys(room.players).length;

        const ready =
            Object.keys(room.ready)
                .filter(
                    id => room.ready[id]
                )
                .length;

        io.to(roomCode).emit(
            "readyUpdate",
            {
                ready,
                total
            }
        );

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

                    p.y = groundY;

                    p.health = 100;
                    p.level = 1;
                }
            );

            room.mobs =
                createRoomMobs();

            io.to(roomCode).emit(
                "playersUpdate",
                Object.values(room.players)
            );

            io.to(roomCode).emit(
                "mobsUpdate",
                room.mobs
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

            if (!roomCode) return;

            const room =
                rooms[roomCode];

            if (!room) return;

            const player =
                room.players[socket.id];

            if (!player) return;

            if (
                !data ||
                typeof data.x !== "number" ||
                typeof data.y !== "number"
            ) {
                return;
            }

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
    // ATTACK MOB
    // ==================================================

    socket.on("attackMob", (data) => {

        const roomCode =
            socket.roomCode;

        if (!roomCode) return;

        const room =
            rooms[roomCode];

        if (!room || !room.started) return;

        const player =
            room.players[socket.id];

        if (!player) return;

        const mob =
            room.mobs.find(
                m =>
                    m.id === data?.mobId
            );

        if (!mob || mob.dead) return;

        const distance =
            Math.abs(
                player.x - mob.x
            );

        if (distance > 120) return;

        mob.health =
            Math.max(
                0,
                mob.health - 25
            );

        if (mob.health <= 0) {

            mob.health = 0;
            mob.dead = true;
            mob.respawnTimer = 180;
        }

        io.to(roomCode).emit(
            "mobsUpdate",
            room.mobs
        );
    });

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

        if (!roomCode) return;

        const room =
            rooms[roomCode];

        if (!room) return;

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
                Object.values(room.players)
            );

        } else {

            delete rooms[roomCode];

            console.log(
                `Room ${roomCode} deleted`
            );
        }
    });
});

// ======================================================
// MOB GAME LOOP
// ======================================================

setInterval(() => {

    Object.keys(rooms).forEach(
        (roomCode) => {

            const room =
                rooms[roomCode];

            updateRoomMobs(
                roomCode,
                room
            );
        }
    );

}, 1000 / 30);

// ======================================================
// START
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
