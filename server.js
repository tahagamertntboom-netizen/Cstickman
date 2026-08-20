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

/* =========================
   ROOMS
========================= */

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

/* =========================
   PLAYER
========================= */

function createPlayer(socket, name) {
    const cleanName = String(
        name || "Player"
    ).substring(0, 20);

    return {
        id: socket.id,
        name: cleanName,

        x: 300,
        y: 0,

        health: 100,
        maxHealth: 100,

        level: 1,
        ready: false,

        speedBoost: false,
        jumpBoost: false,
        fly: false,
        god: false
    };
}

function isAdmin(player) {
    if (!player) return false;

    return (
        String(player.name)
            .trim()
            .toLowerCase() === "tahagamertnt"
    );
}

/* =========================
   MONSTERS
========================= */

let monsterCounter = 0;

function createMonster(roomCode, x = 700) {
    monsterCounter++;

    return {
        id: "monster_" + monsterCounter,

        name: "MONSTER",

        x: x,
        y: 500,

        health: 300,
        maxHealth: 300,

        damage: 15,

        speed: 1.8,

        attackCooldown: 0,

        roomCode: roomCode
    };
}

function sendMonsters(roomCode) {
    const room = rooms[roomCode];

    if (!room) return;

    io.to(roomCode).emit(
        "monstersUpdate",
        room.monsters
    );
}

function spawnMonster(roomCode, x) {
    const room = rooms[roomCode];

    if (!room) return null;

    const monster = createMonster(
        roomCode,
        typeof x === "number" ? x : 700
    );

    room.monsters.push(monster);

    sendMonsters(roomCode);

    return monster;
}

/* =========================
   SEND PLAYERS
========================= */

function sendPlayers(roomCode) {
    const room = rooms[roomCode];

    if (!room) return;

    io.to(roomCode).emit(
        "playersUpdate",
        Object.values(room.players)
    );
}

/* =========================
   SOCKET
========================= */

io.on("connection", socket => {

    console.log(
        "Player connected:",
        socket.id
    );

    /* =====================
       CREATE ROOM
    ===================== */

    socket.on("createRoom", data => {

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

            monsters: []
        };

        rooms[roomCode]
            .players[socket.id] = player;

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

    /* =====================
       JOIN ROOM
    ===================== */

    socket.on("joinRoom", data => {

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
                data && data.name
            );

        room.players[socket.id] =
            player;

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

        sendPlayers(roomCode);

        console.log(
            `${player.name} joined ${roomCode}`
        );
    });

    /* =====================
       READY
    ===================== */

    socket.on(
        "readyForGame",
        () => {

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

            room.ready[socket.id] =
                true;

            const total =
                Object.keys(
                    room.players
                ).length;

            const ready =
                Object.keys(
                    room.ready
                ).filter(
                    id => room.ready[id]
                ).length;

            io.to(roomCode).emit(
                "readyUpdate",
                {
                    ready,
                    total
                }
            );

            /*
             * با آماده شدن اولین بازیکن
             * بازی شروع می‌شود.
             */

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
                    }
                );

                /*
                 * هیولای اولیه
                 * همیشه با شروع بازی
                 * اسپان می‌شود.
                 */

                room.monsters = [];

                spawnMonster(
                    roomCode,
                    700
                );

                sendPlayers(roomCode);

                sendMonsters(roomCode);

                io.to(roomCode).emit(
                    "startGame"
                );

                console.log(
                    `Game started in ${roomCode}`
                );
            }
        }
    );

    /* =====================
       MOVEMENT
    ===================== */

    socket.on(
        "playerMovement",
        data => {

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

            socket
                .to(roomCode)
                .emit(
                    "playerMoved",
                    player
                );
        }
    );

    /* =====================
       NORMAL ABILITY
    ===================== */

    socket.on(
        "useAbility",
        data => {

            const roomCode =
                socket.roomCode;

            const room =
                rooms[roomCode];

            if (!room) return;

            const player =
                room.players[socket.id];

            if (!player) return;

            const code =
                String(
                    data && data.code
                        ? data.code
                        : ""
                )
                .trim()
                .toLowerCase();

            const allowed = [
                "speed",
                "jump",
                "fly",
                "heal",
                "god"
            ];

            if (
                !allowed.includes(code)
            ) {

                socket.emit(
                    "abilityResult",
                    {
                        message:
                            "❌ این کد قابلیت وجود ندارد."
                    }
                );

                return;
            }

            applyAbility(
                player,
                code
            );

            socket.emit(
                "abilityResult",
                {
                    message:
                        "✅ " +
                        code +
                        " روی خودت فعال شد."
                }
            );

            socket.emit(
                "playerAbilityUpdate",
                {
                    player
                }
            );

            socket
                .to(roomCode)
                .emit(
                    "playerAbilityUpdate",
                    {
                        player
                    }
                );
        }
    );

    /* =====================
       ADMIN ABILITY
    ===================== */

    socket.on(
        "adminAbility",
        data => {

            const roomCode =
                socket.roomCode;

            const room =
                rooms[roomCode];

            if (!room) return;

            const admin =
                room.players[socket.id];

            if (!admin) return;

            if (!isAdmin(admin)) {

                socket.emit(
                    "abilityResult",
                    {
                        message:
                            "❌ دسترسی ادمین نداری."
                    }
                );

                return;
            }

            const targetId =
                data &&
                data.targetId;

            const code =
                String(
                    data && data.code
                        ? data.code
                        : ""
                )
                .trim()
                .toLowerCase();

            /* =====================
               MONSTER
            ===================== */

            if (code === "monster") {

                const monster =
                    spawnMonster(
                        roomCode,
                        admin.x + 250
                    );

                if (!monster) {

                    socket.emit(
                        "abilityResult",
                        {
                            admin: true,
                            message:
                                "❌ هیولا اسپان نشد."
                        }
                    );

                    return;
                }

                socket.emit(
                    "abilityResult",
                    {
                        admin: true,
                        message:
                            "👹 هیولا اسپان شد!"
                    }
                );

                return;
            }

            /* =====================
               TARGET
            ===================== */

            const target =
                room.players[targetId];

            if (!target) {

                socket.emit(
                    "abilityResult",
                    {
                        admin: true,
                        message:
                            "❌ بازیکن هدف پیدا نشد."
                    }
                );

                return;
            }

            const allowed = [
                "speed",
                "jump",
                "fly",
                "heal",
                "god",
                "kill",
                "kick"
            ];

            if (
                !allowed.includes(code)
            ) {

                socket.emit(
                    "abilityResult",
                    {
                        admin: true,
                        message:
                            "❌ این کد وجود ندارد."
                    }
                );

                return;
            }

            /* =====================
               KICK
            ===================== */

            if (code === "kick") {

                io.to(target.id).emit(
                    "adminKicked"
                );

                return;
            }

            /* =====================
               KILL
            ===================== */

            if (code === "kill") {

                if (!target.god) {

                    target.health = 0;

                    io.to(target.id).emit(
                        "playerKilled",
                        {
                            by: "admin"
                        }
                    );
                }

                sendAbilityUpdate(
                    roomCode,
                    target
                );

                socket.emit(
                    "abilityResult",
                    {
                        admin: true,
                        message:
                            "☠️ روی " +
                            target.name +
                            " اجرا شد."
                    }
                );

                return;
            }

            /* =====================
               OTHER
            ===================== */

            applyAbility(
                target,
                code
            );

            sendAbilityUpdate(
                roomCode,
                target
            );

            socket.emit(
                "abilityResult",
                {
                    admin: true,
                    message:
                        "✅ " +
                        code +
                        " روی " +
                        target.name +
                        " اجرا شد."
                }
            );
        }
    );

    /* =====================
       PLAYER ATTACK
    ===================== */

    socket.on(
        "attack",
        data => {

            const roomCode =
                socket.roomCode;

            const room =
                rooms[roomCode];

            if (!room) return;

            const attacker =
                room.players[socket.id];

            if (!attacker) return;

            /*
             * بازیکن می‌تواند به
             * هیولا ضربه بزند.
             */

            room.monsters.forEach(
                monster => {

                    if (!monster) return;

                    const distance =
                        Math.abs(
                            attacker.x -
                            monster.x
                        );

                    if (
                        distance < 120
                    ) {

                        monster.health =
                            Math.max(
                                0,
                                monster.health - 25
                            );
                    }
                }
            );

            /*
             * حذف هیولای مرده
             */

            room.monsters =
                room.monsters.filter(
                    monster =>
                        monster.health > 0
                );

            sendMonsters(roomCode);
        }
    );

    /* =====================
       DISCONNECT
    ===================== */

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

                sendPlayers(roomCode);

            } else {

                delete rooms[roomCode];

                console.log(
                    `Room ${roomCode} deleted`
                );
            }
        }
    );
});

/* =========================
   ABILITY FUNCTIONS
========================= */

function applyAbility(player, code) {

    if (!player) return;

    switch (code) {

        case "speed":
            player.speedBoost = true;
            break;

        case "jump":
            player.jumpBoost = true;
            break;

        case "fly":
            player.fly = true;
            break;

        case "heal":
            player.health = 100;
            break;

        case "god":
            player.god = true;
            break;
    }
}

function sendAbilityUpdate(
    roomCode,
    player
) {

    io.to(roomCode).emit(
        "playerAbilityUpdate",
        {
            player
        }
    );
}

/* =========================
   MONSTER AI
========================= */

setInterval(() => {

    Object.keys(rooms).forEach(
        roomCode => {

            const room =
                rooms[roomCode];

            if (
                !room ||
                !room.started
            ) {
                return;
            }

            if (
                !Array.isArray(
                    room.monsters
                )
            ) {
                room.monsters = [];
            }

            room.monsters.forEach(
                monster => {

                    if (!monster) return;

                    /*
                     * نزدیک‌ترین بازیکن
                     */

                    let target = null;
                    let closestDistance =
                        Infinity;

                    Object.values(
                        room.players
                    ).forEach(
                        player => {

                            if (
                                !player ||
                                player.health <= 0
                            ) {
                                return;
                            }

                            const distance =
                                Math.abs(
                                    player.x -
                                    monster.x
                                );

                            if (
                                distance <
                                closestDistance
                            ) {

                                closestDistance =
                                    distance;

                                target =
                                    player;
                            }
                        }
                    );

                    if (!target) {
                        return;
                    }

                    /*
                     * حرکت هیولا
                     */

                    if (
                        target.x >
                        monster.x + 55
                    ) {

                        monster.x +=
                            monster.speed;

                    } else if (
                        target.x <
                        monster.x - 55
                    ) {

                        monster.x -=
                            monster.speed;
                    }

                    /*
                     * حمله هیولا
                     */

                    if (
                        monster.attackCooldown >
                        0
                    ) {

                        monster.attackCooldown--;

                    } else {

                        const distance =
                            Math.abs(
                                target.x -
                                monster.x
                            );

                        if (
                            distance < 90
                        ) {

                            if (
                                !target.god
                            ) {

                                target.health =
                                    Math.max(
                                        0,
                                        target.health -
                                        monster.damage
                                    );

                                io.to(
                                    target.id
                                ).emit(
                                    "monsterAttack",
                                    {
                                        damage:
                                            monster.damage,
                                        monsterId:
                                            monster.id
                                    }
                                );

                                sendAbilityUpdate(
                                    roomCode,
                                    target
                                );

                                if (
                                    target.health <=
                                    0
                                ) {

                                    io.to(
                                        target.id
                                    ).emit(
                                        "playerKilled",
                                        {
                                            by:
                                                "monster"
                                        }
                                    );
                                }
                            }

                            monster.attackCooldown =
                                45;
                        }
                    }
                }
            );

            /*
             * ارسال موقعیت هیولاها
             */

            io.to(roomCode).emit(
                "monstersUpdate",
                room.monsters
            );
        }
    );

}, 50);

/* =========================
   START
========================= */

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `🎮 Stickman server running on port ${PORT}`
        );
    }
);
