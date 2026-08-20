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

const ADMIN_NAME = "tahagamertnt";

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
    const safeName =
        String(name || "Player")
            .substring(0, 20);

    return {
        id: socket.id,
        name: safeName,

        x: 300,
        y: 0,

        health: 100,
        maxHealth: 100,

        level: 1,
        ready: false,

        isAdmin:
            safeName === ADMIN_NAME,

        dead: false
    };
}

function getRoom(socket) {
    if (!socket.roomCode) return null;
    return rooms[socket.roomCode] || null;
}

function getPlayer(socket) {
    const room = getRoom(socket);

    if (!room) return null;

    return room.players[socket.id] || null;
}

function broadcastPlayers(roomCode) {
    const room = rooms[roomCode];

    if (!room) return;

    io.to(roomCode).emit(
        "playersUpdate",
        Object.values(room.players)
    );
}

function sendAdminState(socket) {
    const player = getPlayer(socket);

    if (!player) return;

    socket.emit("adminState", {
        isAdmin: player.isAdmin
    });
}

/* =====================================================
   CONNECTION
===================================================== */

io.on("connection", (socket) => {

    console.log(
        "Player connected:",
        socket.id
    );

    /* =================================================
       CREATE ROOM
    ================================================= */

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
            monsters: {}
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

        sendAdminState(socket);

        console.log(
            `Room ${roomCode} created by ${player.name}`
        );
    });

    /* =================================================
       JOIN ROOM
    ================================================= */

    socket.on("joinRoom", (data) => {

        const roomCode =
            String(
                data && data.roomCode
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

        socket.roomCode = roomCode;
        socket.player = player;

        socket.emit(
            "roomJoined",
            {
                roomCode,
                player
            }
        );

        broadcastPlayers(roomCode);

        sendAdminState(socket);

        console.log(
            `${player.name} joined room ${roomCode}`
        );
    });

    /* =================================================
       READY
    ================================================= */

    socket.on("readyForGame", () => {

        const room =
            getRoom(socket);

        const player =
            getPlayer(socket);

        if (!room || !player) return;

        player.ready = true;

        room.ready[
            socket.id
        ] = true;

        const total =
            Object.keys(room.players).length;

        const ready =
            Object.keys(room.ready)
                .filter(
                    id => room.ready[id]
                )
                .length;

        io.to(socket.roomCode).emit(
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

                    p.y =
                        groundY;

                    p.health = 100;
                    p.maxHealth = 100;

                    p.level = 1;
                    p.dead = false;
                }
            );

            broadcastPlayers(
                socket.roomCode
            );

            io.to(socket.roomCode).emit(
                "startGame"
            );

            console.log(
                `Game started in room ${socket.roomCode}`
            );
        }
    });

    /* =================================================
       PLAYER MOVEMENT
    ================================================= */

    socket.on(
        "playerMovement",
        (data) => {

            const room =
                getRoom(socket);

            const player =
                getPlayer(socket);

            if (!room || !player) return;

            if (
                !data ||
                typeof data.x !== "number" ||
                typeof data.y !== "number"
            ) {
                return;
            }

            if (player.dead) return;

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

            socket.to(
                socket.roomCode
            ).emit(
                "playerMoved",
                player
            );
        }
    );

    /* =================================================
       PLAYER ATTACK
    ================================================= */

    socket.on("attack", (data) => {

        const room =
            getRoom(socket);

        const attacker =
            getPlayer(socket);

        if (!room || !attacker) return;

        if (attacker.dead) return;

        if (
            !data ||
            typeof data.x !== "number"
        ) {
            return;
        }

        const ATTACK_RANGE = 110;
        const DAMAGE = 25;

        Object.values(
            room.players
        ).forEach(
            (target) => {

                if (
                    target.id === attacker.id
                ) {
                    return;
                }

                if (target.dead) {
                    return;
                }

                const distance =
                    Math.abs(
                        target.x -
                        attacker.x
                    );

                if (
                    distance <= ATTACK_RANGE
                ) {

                    target.health =
                        Math.max(
                            0,
                            target.health - DAMAGE
                        );

                    if (
                        target.health <= 0
                    ) {

                        target.health = 0;
                        target.dead = true;

                        target.y = 500;

                        io.to(
                            socket.roomCode
                        ).emit(
                            "playerDied",
                            {
                                id: target.id,
                                attacker:
                                    attacker.id
                            }
                        );

                        setTimeout(
                            () => {

                                const currentRoom =
                                    rooms[
                                        socket.roomCode
                                    ];

                                if (!currentRoom) {
                                    return;
                                }

                                const currentPlayer =
                                    currentRoom.players[
                                        target.id
                                    ];

                                if (!currentPlayer) {
                                    return;
                                }

                                currentPlayer.health =
                                    100;

                                currentPlayer.dead =
                                    false;

                                currentPlayer.x =
                                    300 +
                                    Math.random() *
                                    300;

                                currentPlayer.y =
                                    500;

                                broadcastPlayers(
                                    socket.roomCode
                                );

                            },
                            2500
                        );
                    }

                    io.to(
                        socket.roomCode
                    ).emit(
                        "healthUpdate",
                        {
                            id: target.id,
                            health:
                                target.health
                        }
                    );
                }
            }
        );
    });

    /* =================================================
       ADMIN COMMAND
    ================================================= */

    socket.on(
        "adminCommand",
        (data) => {

            const room =
                getRoom(socket);

            const admin =
                getPlayer(socket);

            if (!room || !admin) return;

            if (!admin.isAdmin) {

                socket.emit(
                    "commandResult",
                    {
                        success: false,
                        message:
                            "❌ اجازه دسترسی نداری."
                    }
                );

                return;
            }

            if (
                !data ||
                typeof data.command !== "string"
            ) {
                return;
            }

            const command =
                data.command
                    .trim();

            if (!command) return;

            const parts =
                command.split(/\s+/);

            const cmd =
                parts[0]
                    .toLowerCase();

            /* ================================
               /heal
            ================================= */

            if (cmd === "/heal") {

                admin.health =
                    admin.maxHealth;

                admin.dead = false;

                broadcastPlayers(
                    socket.roomCode
                );

                socket.emit(
                    "commandResult",
                    {
                        success: true,
                        message:
                            "❤️ جانت کامل شد."
                    }
                );

                return;
            }

            /* ================================
               /kill NAME
            ================================= */

            if (cmd === "/kill") {

                const targetName =
                    parts
                        .slice(1)
                        .join(" ");

                if (!targetName) {

                    socket.emit(
                        "commandResult",
                        {
                            success: false,
                            message:
                                "استفاده: /kill اسم"
                        }
                    );

                    return;
                }

                const target =
                    Object.values(
                        room.players
                    ).find(
                        p =>
                            p.name ===
                            targetName
                    );

                if (!target) {

                    socket.emit(
                        "commandResult",
                        {
                            success: false,
                            message:
                                "❌ پلیر پیدا نشد."
                        }
                    );

                    return;
                }

                target.health = 0;
                target.dead = true;

                io.to(
                    socket.roomCode
                ).emit(
                    "playerDied",
                    {
                        id: target.id,
                        attacker: admin.id
                    }
                );

                broadcastPlayers(
                    socket.roomCode
                );

                socket.emit(
                    "commandResult",
                    {
                        success: true,
                        message:
                            `💀 ${target.name} کشته شد.`
                    }
                );

                return;
            }

            /* ================================
               /monster
            ================================= */

            if (cmd === "/monster") {

                const monsterId =
                    "monster_" +
                    Date.now() +
                    "_" +
                    Math.floor(
                        Math.random() * 9999
                    );

                const monster = {

                    id: monsterId,

                    name: "هیولا",

                    x:
                        admin.x +
                        250,

                    y: 500,

                    health: 150,

                    maxHealth: 150,

                    speed: 1.8,

                    damage: 15
                };

                room.monsters[
                    monsterId
                ] = monster;

                io.to(
                    socket.roomCode
                ).emit(
                    "monsterSpawn",
                    monster
                );

                socket.emit(
                    "commandResult",
                    {
                        success: true,
                        message:
                            "👹 هیولا اسپان شد."
                    }
                );

                return;
            }

            /* ================================
               /give NAME ability
            ================================= */

            if (cmd === "/give") {

                const targetName =
                    parts[1];

                const ability =
                    parts[2];

                if (
                    !targetName ||
                    !ability
                ) {

                    socket.emit(
                        "commandResult",
                        {
                            success: false,
                            message:
                                "استفاده: /give اسم قابلیت"
                        }
                    );

                    return;
                }

                const target =
                    Object.values(
                        room.players
                    ).find(
                        p =>
                            p.name ===
                            targetName
                    );

                if (!target) {

                    socket.emit(
                        "commandResult",
                        {
                            success: false,
                            message:
                                "❌ پلیر پیدا نشد."
                        }
                    );

                    return;
                }

                io.to(
                    target.id
                ).emit(
                    "abilityGranted",
                    {
                        ability
                    }
                );

                socket.emit(
                    "commandResult",
                    {
                        success: true,
                        message:
                            `✅ قابلیت ${ability} به ${target.name} داده شد.`
                    }
                );

                return;
            }

            /* ================================
               /speed
            ================================= */

            if (cmd === "/speed") {

                const value =
                    Number(parts[1]);

                if (
                    !Number.isFinite(value)
                ) {

                    socket.emit(
                        "commandResult",
                        {
                            success: false,
                            message:
                                "استفاده: /speed عدد"
                        }
                    );

                    return;
                }

                io.to(
                    admin.id
                ).emit(
                    "abilityGranted",
                    {
                        ability:
                            "speed",
                        value:
                            Math.max(
                                1,
                                Math.min(
                                    20,
                                    value
                                )
                            )
                    }
                );

                socket.emit(
                    "commandResult",
                    {
                        success: true,
                        message:
                            "⚡ سرعت تغییر کرد."
                    }
                );

                return;
            }

            socket.emit(
                "commandResult",
                {
                    success: false,
                    message:
                        "❓ دستور ناشناخته است."
                }
            );
        }
    );

    /* =================================================
       DISCONNECT
    ================================================= */

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

        broadcastPlayers(
            roomCode
        );

        const remaining =
            Object.keys(
                room.players
            ).length;

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

/* =====================================================
   START
===================================================== */

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `🎮 Stickman server running on port ${PORT}`
        );

    }
);
