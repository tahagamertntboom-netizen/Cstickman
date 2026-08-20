const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();

const server =
    http.createServer(app);

const io =
    new Server(server);

const PORT =
    process.env.PORT || 8080;

app.use(
    express.static(__dirname)
);

app.get(
    "/",
    (req,res) => {

        res.sendFile(
            path.join(
                __dirname,
                "index.html"
            )
        );

    }
);

/* =====================================================
   ROOMS
===================================================== */

const rooms = {};

/* =====================================================
   ADMIN
===================================================== */

const ADMIN_NAME =
    "tahagamertnt";

/* =====================================================
   ROOM CODE
===================================================== */

function generateRoomCode() {

    let code;

    do {

        code =
            String(
                Math.floor(
                    100000 +
                    Math.random() * 900000
                )
            );

    } while (rooms[code]);

    return code;

}

/* =====================================================
   PLAYER
===================================================== */

function createPlayer(
    socket,
    name
) {

    const safeName =
        String(
            name || "Player"
        )
        .substring(0,20);

    return {

        id:
            socket.id,

        name:
            safeName,

        x:
            300,

        y:
            0,

        health:
            100,

        maxHealth:
            100,

        level:
            1,

        ready:
            false,

        speed:
            5,

        jump:
            13,

        fly:
            false,

        doubleJump:
            false,

        color:
            "#22c55e"

    };

}

/* =====================================================
   CHECK ADMIN
===================================================== */

function isAdmin(socket) {

    return (
        socket &&
        socket.player &&
        socket.player.name ===
            ADMIN_NAME
    );

}

/* =====================================================
   CODE PARSER
===================================================== */

function applyCodeToPlayer(
    player,
    code
) {

    if (!player) {

        return {
            ok:false,
            message:"بازیکن پیدا نشد."
        };

    }

    if (
        typeof code !==
        "string"
    ) {

        return {
            ok:false,
            message:"کد نامعتبر است."
        };

    }

    if (code.length > 3000) {

        return {
            ok:false,
            message:"کد بیش از حد طولانی است."
        };

    }

    const clean =
        code
            .replace(
                /\/\/.*$/gm,
                ""
            )
            .trim();

    if (!clean) {

        return {
            ok:false,
            message:"کدی وارد نشده."
        };

    }

    /*
       فقط دستورهای مجاز بازی.
       JavaScript syntax قبول می‌شود،
       اما اجرای JS آزاد روی سرور نداریم.
    */

    const commands =
        clean
            .split(";")
            .map(x => x.trim())
            .filter(Boolean);

    let changed = [];

    for (
        const command of commands
    ) {

        let match;

        match =
            command.match(
                /^speed\s*=\s*(\d+(?:\.\d+)?)$/
            );

        if (match) {

            const value =
                Number(match[1]);

            if (
                value < 1 ||
                value > 30
            ) {

                return {
                    ok:false,
                    message:
                        "speed باید بین 1 و 30 باشد."
                };

            }

            player.speed =
                value;

            changed.push(
                "speed"
            );

            continue;

        }

        match =
            command.match(
                /^jump\s*=\s*(\d+(?:\.\d+)?)$/
            );

        if (match) {

            const value =
                Number(match[1]);

            if (
                value < 1 ||
                value > 50
            ) {

                return {
                    ok:false,
                    message:
                        "jump باید بین 1 و 50 باشد."
                };

            }

            player.jump =
                value;

            changed.push(
                "jump"
            );

            continue;

        }

        match =
            command.match(
                /^health\s*=\s*(\d+(?:\.\d+)?)$/
            );

        if (match) {

            const value =
                Number(match[1]);

            if (
                value < 1 ||
                value > 10000
            ) {

                return {
                    ok:false,
                    message:
                        "health باید بین 1 و 10000 باشد."
                };

            }

            player.health =
                value;

            player.maxHealth =
                Math.max(
                    player.maxHealth || 100,
                    value
                );

            changed.push(
                "health"
            );

            continue;

        }

        match =
            command.match(
                /^fly\s*=\s*(true|false)$/
            );

        if (match) {

            player.fly =
                match[1] ===
                "true";

            changed.push(
                "fly"
            );

            continue;

        }

        match =
            command.match(
                /^doubleJump\s*=\s*(true|false)$/
            );

        if (match) {

            player.doubleJump =
                match[1] ===
                "true";

            changed.push(
                "doubleJump"
            );

            continue;

        }

        match =
            command.match(
                /^setColor\(\s*["'](#[0-9a-fA-F]{6})["']\s*\)$/
            );

        if (match) {

            player.color =
                match[1];

            changed.push(
                "color"
            );

            continue;

        }

        return {
            ok:false,
            message:
                "این دستور مجاز نیست: " +
                command
        };

    }

    return {

        ok:true,

        message:
            changed.length
                ? "قابلیت‌ها اعمال شدند: " +
                  changed.join(", ")
                : "هیچ تغییری انجام نشد."

    };

}

/* =====================================================
   SOCKET
===================================================== */

io.on(
    "connection",
    (socket) => {

        console.log(
            "Player connected:",
            socket.id
        );

        /* =============================================
           CREATE ROOM
        ============================================= */

        socket.on(
            "createRoom",
            (data) => {

                const roomCode =
                    generateRoomCode();

                const player =
                    createPlayer(
                        socket,
                        data &&
                        data.name
                    );

                rooms[roomCode] = {

                    players:{},

                    ready:{},

                    started:false,

                    mobs:{}

                };

                rooms[
                    roomCode
                ].players[
                    socket.id
                ] = player;

                socket.join(
                    roomCode
                );

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

            }
        );

        /* =============================================
           JOIN ROOM
        ============================================= */

        socket.on(
            "joinRoom",
            (data) => {

                const roomCode =
                    String(
                        data &&
                        data.roomCode
                            ? data.roomCode
                            : ""
                    )
                    .replace(
                        /\D/g,
                        ""
                    )
                    .substring(
                        0,
                        6
                    );

                if (
                    roomCode.length !==
                    6
                ) {

                    socket.emit(
                        "roomError",
                        "کد اتاق باید ۶ رقمی باشد."
                    );

                    return;

                }

                const room =
                    rooms[
                        roomCode
                    ];

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
                    ).length >= 15
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
                        data &&
                        data.name
                    );

                room.players[
                    socket.id
                ] = player;

                socket.join(
                    roomCode
                );

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

                io.to(
                    roomCode
                ).emit(
                    "playersUpdate",
                    Object.values(
                        room.players
                    )
                );

                console.log(
                    `${player.name} joined room ${roomCode}`
                );

            }
        );

        /* =============================================
           READY
        ============================================= */

        socket.on(
            "readyForGame",
            () => {

                const roomCode =
                    socket.roomCode;

                if (!roomCode) return;

                const room =
                    rooms[
                        roomCode
                    ];

                if (!room) return;

                const player =
                    room.players[
                        socket.id
                    ];

                if (!player) return;

                player.ready =
                    true;

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
                    )
                    .filter(
                        id =>
                            room.ready[id]
                    )
                    .length;

                io.to(
                    roomCode
                ).emit(
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

                    room.started =
                        true;

                    const groundY =
                        500;

                    Object.values(
                        room.players
                    )
                    .forEach(
                        (p,index) => {

                            p.x =
                                250 +
                                index * 100;

                            p.y =
                                groundY;

                            p.health =
                                100;

                            p.maxHealth =
                                100;

                            p.level =
                                1;

                        }
                    );

                    io.to(
                        roomCode
                    ).emit(
                        "playersUpdate",
                        Object.values(
                            room.players
                        )
                    );

                    io.to(
                        roomCode
                    ).emit(
                        "startGame"
                    );

                    console.log(
                        `Game started in room ${roomCode}`
                    );

                }

            }
        );

        /* =============================================
           PLAYER MOVEMENT
        ============================================= */

        socket.on(
            "playerMovement",
            (data) => {

                const roomCode =
                    socket.roomCode;

                if (!roomCode) return;

                const room =
                    rooms[
                        roomCode
                    ];

                if (!room) return;

                const player =
                    room.players[
                        socket.id
                    ];

                if (!player) return;

                if (
                    !data ||
                    typeof data.x !==
                        "number" ||
                    typeof data.y !==
                        "number"
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

                socket.to(
                    roomCode
                ).emit(
                    "playerMoved",
                    player
                );

            }
        );

        /* =============================================
           NORMAL PLAYER CODE
        ============================================= */

        socket.on(
            "runPlayerCode",
            (data) => {

                const player =
                    socket.player;

                if (!player) {

                    socket.emit(
                        "abilityError",
                        {
                            message:
                                "بازیکن پیدا نشد."
                        }
                    );

                    return;

                }

                const result =
                    applyCodeToPlayer(
                        player,
                        data &&
                        data.code
                    );

                if (!result.ok) {

                    socket.emit(
                        "abilityError",
                        {
                            message:
                                result.message
                        }
                    );

                    return;

                }

                socket.emit(
                    "abilityResult",
                    {
                        message:
                            result.message,

                        player
                    }
                );

                if (socket.roomCode) {

                    socket.to(
                        socket.roomCode
                    ).emit(
                        "playerMoved",
                        player
                    );

                }

            }
        );

        /* =============================================
           ADMIN CODE
        ============================================= */

        socket.on(
            "runAdminCode",
            (data) => {

                if (!isAdmin(socket)) {

                    socket.emit(
                        "abilityError",
                        {
                            message:
                                "دسترسی Admin نداری."
                        }
                    );

                    return;

                }

                const room =
                    rooms[
                        socket.roomCode
                    ];

                if (!room) {

                    socket.emit(
                        "abilityError",
                        {
                            message:
                                "اتاق پیدا نشد."
                        }
                    );

                    return;

                }

                const targetId =
                    data &&
                    data.targetId
                        ? String(
                            data.targetId
                        )
                        : socket.id;

                const target =
                    room.players[
                        targetId
                    ];

                if (!target) {

                    socket.emit(
                        "abilityError",
                        {
                            message:
                                "بازیکن هدف پیدا نشد."
                        }
                    );

                    return;

                }

                const code =
                    data &&
                    data.code
                        ? String(
                            data.code
                        )
                        : "";

                /*
                   spawnMob دستوری است که
                   مخصوص Admin است.
                */

                const mobMatches =
                    [
                        ...code.matchAll(
                            /spawnMob\(\s*["'](monster|zombie)["']\s*\)\s*;?/gi
                        )
                    ];

                let cleanedCode =
                    code;

                mobMatches.forEach(
                    match => {

                        const type =
                            match[1]
                                .toLowerCase();

                        const mobId =
                            "mob_" +
                            Date.now() +
                            "_" +
                            Math.random()
                                .toString(36)
                                .substring(
                                    2,
                                    7
                                );

                        room.mobs[
                            mobId
                        ] = {

                            id:
                                mobId,

                            type,

                            x:
                                target.x + 180,

                            y:
                                target.y,

                            health:
                                100,

                            speed:
                                type ===
                                "zombie"
                                    ? 1.2
                                    : 1.6

                        };

                    }
                );

                cleanedCode =
                    cleanedCode.replace(
                        /spawnMob\(\s*["'](monster|zombie)["']\s*\)\s*;?/gi,
                        ""
                    );

                const result =
                    applyCodeToPlayer(
                        target,
                        cleanedCode
                    );

                if (!result.ok) {

                    socket.emit(
                        "abilityError",
                        {
                            message:
                                result.message
                        }
                    );

                    return;

                }

                io.to(
                    socket.roomCode
                ).emit(
                    "playersUpdate",
                    Object.values(
                        room.players
                    )
                );

                io.to(
                    socket.roomCode
                ).emit(
                    "mobsUpdate",
                    Object.values(
                        room.mobs
                    )
                );

                socket.emit(
                    "abilityResult",
                    {
                        message:
                            "👑 " +
                            result.message,

                        player:
                            target
                    }
                );

            }
        );

        /* =============================================
           DISCONNECT
        ============================================= */

        socket.on(
            "disconnect",
            () => {

                console.log(
                    "Player disconnected:",
                    socket.id
                );

                const roomCode =
                    socket.roomCode;

                if (!roomCode) return;

                const room =
                    rooms[
                        roomCode
                    ];

                if (!room) return;

                delete room.players[
                    socket.id
                ];

                delete room.ready[
                    socket.id
                ];

                io.to(
                    roomCode
                ).emit(
                    "playerLeft",
                    socket.id
                );

                const remaining =
                    Object.keys(
                        room.players
                    ).length;

                if (
                    remaining > 0
                ) {

                    io.to(
                        roomCode
                    ).emit(
                        "playersUpdate",
                        Object.values(
                            room.players
                        )
                    );

                    io.to(
                        roomCode
                    ).emit(
                        "mobsUpdate",
                        Object.values(
                            room.mobs
                        )
                    );

                }

                if (
                    remaining === 0
                ) {

                    delete rooms[
                        roomCode
                    ];

                    console.log(
                        `Room ${roomCode} deleted`
                    );

                }

            }
        );

    }
);

/* =====================================================
   SERVER
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
