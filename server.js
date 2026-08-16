const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();

const server =
    http.createServer(app);

const io =
    new Server(server, {
        cors: {
            origin: "*",
            methods: [
                "GET",
                "POST"
            ]
        }
    });

const PORT =
    process.env.PORT || 3000;


// ======================================
// فایل‌های سایت
// ======================================

app.use(
    express.static(
        path.join(
            __dirname
        )
    )
);


app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "index.html"
            )
        );
    }
);


// ======================================
// اتاق‌ها
// ======================================

const rooms = {};


// ======================================
// ساخت کد عددی ۶ رقمی
// ======================================

function createRoomCode() {

    let code;

    do {

        code =
            Math.floor(
                100000 +
                Math.random() *
                900000
            ).toString();

    } while (
        rooms[code]
    );

    return code;
}


// ======================================
// اتصال بازیکن
// ======================================

io.on(
    "connection",
    (socket) => {

        console.log(
            "Connected:",
            socket.id
        );


        // ==================================
        // ساخت اتاق
        // ==================================

        socket.on(
            "createRoom",
            (data) => {

                const code =
                    createRoomCode();

                const player = {

                    id:
                        socket.id,

                    name:
                        typeof data?.name ===
                        "string"
                            ? data.name.substring(
                                0,
                                20
                            )
                            : "Player",

                    x: 400,

                    y: 300,

                    color:
                        typeof data?.color ===
                        "string"
                            ? data.color
                            : "#ffffff",

                    isHost: true
                };


                rooms[code] = {

                    code: code,

                    host:
                        socket.id,

                    players: {}

                };


                rooms[code]
                    .players[
                        socket.id
                    ] = player;


                socket.join(
                    code
                );


                socket.roomCode =
                    code;


                console.log(
                    "ROOM CREATED:",
                    code
                );


                /*
                خیلی مهم:

                roomCode فقط خود
                رشته عددی است.
                */

                socket.emit(
                    "roomCreated",
                    {
                        roomCode:
                            code,

                        player:
                            player,

                        players:
                            Object.values(
                                rooms[
                                    code
                                ].players
                            )
                    }
                );
            }
        );


        // ==================================
        // ورود به اتاق
        // ==================================

        socket.on(
            "joinRoom",
            (data) => {

                let code =
                    String(
                        data?.roomCode ||
                        ""
                    ).replace(
                        /\D/g,
                        ""
                    );


                if (
                    code.length !==
                    6
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


                const player = {

                    id:
                        socket.id,

                    name:
                        typeof data?.name ===
                        "string"
                            ? data.name.substring(
                                0,
                                20
                            )
                            : "Player",

                    x:
                        300 +
                        Math.floor(
                            Math.random() *
                            300
                        ),

                    y: 300,

                    color:
                        typeof data?.color ===
                        "string"
                            ? data.color
                            : "#ffffff",

                    isHost: false
                };


                room.players[
                    socket.id
                ] = player;


                socket.join(
                    code
                );


                socket.roomCode =
                    code;


                console.log(
                    "PLAYER JOINED:",
                    socket.id,
                    "ROOM:",
                    code
                );


                socket.emit(
                    "roomJoined",
                    {
                        roomCode:
                            code,

                        player:
                            player,

                        players:
                            Object.values(
                                room.players
                            )
                    }
                );


                socket
                    .to(code)
                    .emit(
                        "playerJoined",
                        player
                    );


                io.to(code).emit(
                    "roomPlayers",
                    Object.values(
                        room.players
                    )
                );
            }
        );


        // ==================================
        // حرکت
        // ==================================

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
                    typeof data?.x ===
                    "number"
                ) {

                    player.x =
                        data.x;
                }


                if (
                    typeof data?.y ===
                    "number"
                ) {

                    player.y =
                        data.y;
                }


                socket
                    .to(code)
                    .emit(
                        "playerMoved",
                        player
                    );
            }
        );


        // ==================================
        // تغییر بازیکن
        // ==================================

        socket.on(
            "updatePlayer",
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
                    typeof data?.name ===
                    "string"
                ) {

                    player.name =
                        data.name.substring(
                            0,
                            20
                        );
                }


                if (
                    typeof data?.color ===
                    "string"
                ) {

                    player.color =
                        data.color;
                }


                io.to(code).emit(
                    "playerUpdated",
                    player
                );
            }
        );


        // ==================================
        // خروج
        // ==================================

        socket.on(
            "disconnect",
            () => {

                const code =
                    socket.roomCode;

                if (!code) return;

                const room =
                    rooms[code];

                if (!room) return;


                const wasHost =
                    room.host ===
                    socket.id;


                delete room.players[
                    socket.id
                ];


                socket
                    .to(code)
                    .emit(
                        "playerLeft",
                        socket.id
                    );


                if (
                    wasHost &&
                    Object.keys(
                        room.players
                    ).length > 0
                ) {

                    const newHost =
                        Object.keys(
                            room.players
                        )[0];


                    room.host =
                        newHost;


                    room.players[
                        newHost
                    ].isHost =
                        true;


                    io.to(code).emit(
                        "newHost",
                        newHost
                    );
                }


                io.to(code).emit(
                    "roomPlayers",
                    Object.values(
                        room.players
                    )
                );


                if (
                    Object.keys(
                        room.players
                    ).length === 0
                ) {

                    delete rooms[
                        code
                    ];

                    console.log(
                        "ROOM DELETED:",
                        code
                    );
                }
            }
        );
    }
);


// ======================================
// وضعیت سرور
// ======================================

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

            players:
                players,

            uptime:
                process.uptime()
        });
    }
);


// ======================================
// شروع
// ======================================

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "Server running on port " +
            PORT
        );
    }
);
