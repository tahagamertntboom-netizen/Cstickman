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

function sendEnemies(code) {
    const room = rooms[code];
    if (!room) return;

    io.to(code).emit(
        "enemiesUpdate",
        Object.values(room.enemies)
    );
}

function createEnemy(room, level) {
    const types = {
        1: {
            name: "موجود سبز",
            emoji: "👹",
            color: "#ef4444",
            health: 50,
            damage: 5,
            speed: 1.2
        },

        2: {
            name: "گرگ",
            emoji: "🐺",
            color: "#64748b",
            health: 80,
            damage: 8,
            speed: 1.6
        },

        3: {
            name: "خفاش",
            emoji: "🦇",
            color: "#7c3aed",
            health: 110,
            damage: 10,
            speed: 2
        },

        4: {
            name: "هیولای آتش",
            emoji: "🔥",
            color: "#f97316",
            health: 160,
            damage: 14,
            speed: 2.2
        },

        5: {
            name: "باس نهایی",
            emoji: "👿",
            color: "#991b1b",
            health: 400,
            damage: 20,
            speed: 2.5
        }
    };

    const type =
        types[Math.min(level, 5)] ||
        types[1];

    const enemy = {
        id:
            "enemy_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .substring(2, 8),

        name: type.name,
        emoji: type.emoji,

        x:
            300 +
            Math.random() * 1200,

        y: 0,

        health: type.health,
        maxHealth: type.health,

        damage: type.damage,
        speed: type.speed,

        level: level
    };

    room.enemies[enemy.id] = enemy;

    return enemy;
}

function setupEnemies(room) {
    room.enemies = {};

    const count =
        Math.min(
            2 + room.level,
            8
        );

    for (let i = 0; i < count; i++) {
        createEnemy(
            room,
            room.level
        );
    }
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

    const ids =
        Object.keys(room.players);

    if (
        ids.length > 0 &&
        room.host === socket.id
    ) {
        room.host = ids[0];

        room.players[room.host].isHost =
            true;

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

    // ============================
    // CREATE ROOM
    // ============================

    socket.on(
        "createRoom",
        (data) => {

            const code =
                makeRoomCode();

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

                name,

                x: 250,
                y: 0,

                color: "#22c55e",

                health: 100,
                maxHealth: 100,

                level: 1,
                xp: 0,

                isHost: true,
                ready: false
            };

            rooms[code] = {

                code,

                host: socket.id,

                level: 1,

                players: {
                    [socket.id]: player
                },

                readyPlayers: {},

                enemies: {}
            };

            setupEnemies(
                rooms[code]
            );

            socket.join(code);

            socket.roomCode =
                code;

            socket.emit(
                "roomCreated",
                {
                    roomCode: code,
                    player
                }
            );

            sendPlayers(code);
            sendEnemies(code);
        }
    );

    // ============================
    // JOIN ROOM
    // ============================

    socket.on(
        "joinRoom",
        (data) => {

            const code =
                String(
                    data &&
                    data.roomCode
                        ? data.roomCode
                        : ""
                )
                    .replace(/\D/g, "");

            if (code.length !== 6) {

                socket.emit(
                    "roomError",
                    "کد اتاق باید ۶ رقمی باشد."
                );

                return;
            }

            const room =
                rooms[code];

            if (!room) {

                socket.emit(
                    "roomError",
                    "این اتاق وجود ندارد."
                );

                return;
            }

            if (
                Object.keys(
                    room.players
                ).length >= 10
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

                name,

                x:
                    350 +
                    Math.random() * 500,

                y: 0,

                color: "#3b82f6",

                health: 100,
                maxHealth: 100,

                level: 1,
                xp: 0,

                isHost: false,
                ready: false
            };

            room.players[
                socket.id
            ] = player;

            socket.join(code);

            socket.roomCode =
                code;

            socket.emit(
                "roomJoined",
                {
                    roomCode: code,
                    player
                }
            );

            sendPlayers(code);
            sendEnemies(code);
        }
    );

    // ============================
    // READY
    // ============================

    socket.on(
        "readyForGame",
        () => {

            const code =
                socket.roomCode;

            if (!code) return;

            const room =
                rooms[code];

            if (!room) return;

            room.readyPlayers[
                socket.id
            ] = true;

            if (
                room.players[
                    socket.id
                ]
            ) {

                room.players[
                    socket.id
                ].ready = true;
            }

            const total =
                Object.keys(
                    room.players
                ).length;

            const ready =
                Object.keys(
                    room.readyPlayers
                ).length;

            io.to(code).emit(
                "readyUpdate",
                {
                    ready,
                    total
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
        }
    );

    // ============================
    // MOVEMENT
    // ============================

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
                room.players[
                    socket.id
                ];

            if (!player) return;

            if (
                data &&
                Number.isFinite(
                    Number(data.x)
                )
            ) {

                player.x =
                    Number(data.x);
            }

            if (
                data &&
                Number.isFinite(
                    Number(data.y)
                )
            ) {

                player.y =
                    Number(data.y);
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

    // ============================
    // ATTACK
    // ============================

    socket.on(
        "playerAttack",
        () => {

            const code =
                socket.roomCode;

            if (!code) return;

            const room =
                rooms[code];

            if (!room) return;

            const player =
                room.players[
                    socket.id
                ];

            if (!player) return;

            const ATTACK_RANGE = 100;
            const ATTACK_DAMAGE = 25;

            Object.values(
                room.enemies
            ).forEach(
                (enemy) => {

                    const distance =
                        Math.abs(
                            player.x -
                            enemy.x
                        );

                    if (
                        distance <=
                        ATTACK_RANGE
                    ) {

                        enemy.health -=
                            ATTACK_DAMAGE;

                        io.to(code).emit(
                            "enemyHit",
                            {
                                id: enemy.id,
                                health:
                                    Math.max(
                                        0,
                                        enemy.health
                                    )
                            }
                        );

                        if (
                            enemy.health <= 0
                        ) {

                            delete room.enemies[
                                enemy.id
                            ];

                            player.xp += 25;

                            const needed =
                                player.level *
                                100;

                            if (
                                player.xp >=
                                needed
                            ) {

                                player.xp -=
                                    needed;

                                player.level++;

                                io.to(code).emit(
                                    "playerLevelUp",
                                    {
                                        id:
                                            player.id,
                                        level:
                                            player.level
                                    }
                                );
                            }

                            socket.emit(
                                "playerStats",
                                {
                                    health:
                                        player.health,
                                    level:
                                        player.level,
                                    xp:
                                        player.xp
                                }
                            );

                            setTimeout(
                                () => {

                                    if (
                                        rooms[code]
                                    ) {

                                        createEnemy(
                                            rooms[code],
                                            player.level
                                        );

                                        sendEnemies(
                                            code
                                        );
                                    }

                                },
                                1000
                            );
                        }
                    }
                }
            );

            sendEnemies(code);
            sendPlayers(code);
        }
    );

    // ============================
    // LEAVE
    // ============================

    socket.on(
        "leaveRoom",
        () => {

            leaveRoom(socket);

        }
    );

    // ============================
    // DISCONNECT
    // ============================

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


// ============================
// STATUS
// ============================

app.get(
    "/status",
    (req, res) => {

        let players = 0;

        Object.values(
            rooms
        ).forEach(
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
                Object.keys(
                    rooms
                ).length,
            players
        });
    }
);


// ============================
// SERVER
// ============================

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
