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


// =======================================
// WORLD SETTINGS
// =======================================

const WORLD_WIDTH = 3000;
const GROUND_Y = 600;

const SPAWN_X = 500;
const SPAWN_DISTANCE = 120;


// =======================================
// ROOMS
// =======================================

const rooms = {};


// =======================================
// ROOM CODE
// =======================================

function makeRoomCode() {

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


// =======================================
// SAFE NAME
// =======================================

function getPlayerName(data) {

    let name = "Player";

    if (
        data &&
        typeof data.name === "string"
    ) {

        name = data.name
            .trim()
            .substring(0, 20);

    }

    if (!name) {
        name = "Player";
    }

    return name;
}


// =======================================
// SPAWN POSITION
// =======================================

function getSpawnX(room) {

    const used = Object.values(room.players);

    if (used.length === 0) {
        return SPAWN_X;
    }

    // کنار آخرین بازیکن
    const lastPlayer =
        used[used.length - 1];

    let x =
        Number(lastPlayer.x) +
        SPAWN_DISTANCE;

    // اگر به آخر دنیا رسید
    if (x > WORLD_WIDTH - 100) {

        x =
            Number(lastPlayer.x) -
            SPAWN_DISTANCE;

    }

    // محدوده امن
    x = Math.max(
        100,
        Math.min(
            WORLD_WIDTH - 100,
            x
        )
    );

    return x;
}


// =======================================
// SEND PLAYERS
// =======================================

function sendPlayers(code) {

    const room = rooms[code];

    if (!room) return;

    io.to(code).emit(
        "playersUpdate",
        Object.values(room.players)
    );
}


// =======================================
// LEAVE ROOM
// =======================================

function leaveRoom(socket) {

    const code =
        socket.roomCode;

    if (!code) return;

    const room =
        rooms[code];

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


    // انتقال هاست
    if (
        ids.length > 0 &&
        room.host === socket.id
    ) {

        room.host =
            ids[0];

        room.players[
            room.host
        ].isHost = true;

        io.to(code).emit(
            "newHost",
            room.host
        );

    }


    sendPlayers(code);


    // حذف اتاق
    if (ids.length === 0) {

        delete rooms[code];

        console.log(
            "ROOM DELETED:",
            code
        );

    }

}


// =======================================
// CONNECTION
// =======================================

io.on(
    "connection",
    (socket) => {

        console.log(
            "CONNECTED:",
            socket.id
        );


        // ===================================
        // CREATE ROOM
        // ===================================

        socket.on(
            "createRoom",
            (data) => {

                const code =
                    makeRoomCode();

                const name =
                    getPlayerName(data);


                const player = {

                    id: socket.id,

                    name: name,

                    // مختصات دنیای بازی
                    x: SPAWN_X,
                    y: GROUND_Y,

                    color: "#22c55e",

                    isHost: true,

                    ready: false

                };


                rooms[code] = {

                    code: code,

                    host: socket.id,

                    players: {

                        [socket.id]:
                            player

                    },

                    readyPlayers: {}

                };


                socket.join(code);

                socket.roomCode =
                    code;


                console.log(
                    "ROOM CREATED:",
                    code
                );


                socket.emit(
                    "roomCreated",
                    {
                        roomCode: code,
                        player: player,
                        world: {
                            width:
                                WORLD_WIDTH,
                            groundY:
                                GROUND_Y
                        }
                    }
                );


                sendPlayers(code);

            }
        );


        // ===================================
        // JOIN ROOM
        // ===================================

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
                    .replace(
                        /\D/g,
                        ""
                    );


                if (
                    code.length !== 6
                ) {

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


                const name =
                    getPlayerName(data);


                // ===============================
                // SPAWN کنار بازیکن موجود
                // ===============================

                const spawnX =
                    getSpawnX(room);


                const player = {

                    id: socket.id,

                    name: name,

                    // مختصات مشترک دنیا
                    x: spawnX,
                    y: GROUND_Y,

                    color: "#3b82f6",

                    isHost: false,

                    ready: false

                };


                room.players[
                    socket.id
                ] = player;


                socket.join(code);

                socket.roomCode =
                    code;


                console.log(
                    "PLAYER JOINED:",
                    socket.id,
                    code,
                    "SPAWN:",
                    spawnX
                );


                socket.emit(
                    "roomJoined",
                    {
                        roomCode: code,
                        player: player,
                        world: {
                            width:
                                WORLD_WIDTH,
                            groundY:
                                GROUND_Y
                        }
                    }
                );


                // کل وضعیت اتاق
                sendPlayers(code);

            }
        );


        // ===================================
        // READY
        // ===================================

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

            }
        );


        // ===================================
        // MOVEMENT
        // ===================================

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
                        Math.max(
                            50,
                            Math.min(
                                WORLD_WIDTH - 50,
                                Number(data.x)
                            )
                        );

                }


                if (
                    data &&
                    Number.isFinite(
                        Number(data.y)
                    )
                ) {

                    player.y =
                        Math.max(
                            -2000,
                            Math.min(
                                GROUND_Y,
                                Number(data.y)
                            )
                        );

                }


                // ارسال مختصات واقعی
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


        // ===================================
        // LEAVE
        // ===================================

        socket.on(
            "leaveRoom",
            () => {

                leaveRoom(socket);

            }
        );


        // ===================================
        // DISCONNECT
        // ===================================

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

    }
);


// =======================================
// STATUS
// =======================================

app.get(
    "/status",
    (req, res) => {

        let players = 0;

        Object.values(rooms)
            .forEach(
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

            players: players

        });

    }
);


// =======================================
// SERVER
// =======================================

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "SERVER RUNNING ON PORT " +
            PORT
        );

        console.log(
            "WORLD WIDTH:",
            WORLD_WIDTH
        );

        console.log(
            "GROUND Y:",
            GROUND_Y
        );

    }
);
