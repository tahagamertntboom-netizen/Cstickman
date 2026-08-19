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
    res.sendFile(
        path.join(__dirname, "index.html")
    );
});


// =======================================
// ROOMS
// =======================================

const rooms = {};


// =======================================
// WORLD SETTINGS
// =======================================

// بازی مختصات ثابت دارد.
// اندازه صفحه PC و موبایل روی مختصات بازی
// تأثیر نمی‌گذارد.

const WORLD_WIDTH = 1200;
const WORLD_GROUND = 600;


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
// CREATE PLAYER
// =======================================

function createPlayer(
    socket,
    name,
    x,
    color,
    isHost
) {

    return {

        id: socket.id,

        name: name,

        // مختصات ثابت دنیای بازی
        x: x,

        // 0 یعنی روی زمین
        y: 0,

        // سرعت عمودی
        velocityY: 0,

        color: color,

        isHost: isHost,

        ready: false

    };
}


// =======================================
// SEND PLAYERS
// =======================================

function sendPlayers(code) {

    const room =
        rooms[code];

    if (!room) return;

    io.to(code).emit(
        "playersUpdate",
        Object.values(
            room.players
        ).map(player => {

            return {

                id: player.id,

                name: player.name,

                x: player.x,

                y: player.y,

                velocityY:
                    player.velocityY,

                color: player.color,

                isHost:
                    player.isHost,

                ready:
                    player.ready

            };

        })
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

        socket.roomCode =
            null;

        return;
    }


    delete room.players[
        socket.id
    ];

    delete room.readyPlayers[
        socket.id
    ];


    socket.leave(code);

    socket.roomCode =
        null;


    io.to(code).emit(
        "playerLeft",
        socket.id
    );


    const ids =
        Object.keys(
            room.players
        );


    // ===================================
    // NEW HOST
    // ===================================

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


    // ===================================
    // DELETE EMPTY ROOM
    // ===================================

    if (ids.length === 0) {

        delete rooms[code];

        console.log(
            "ROOM DELETED:",
            code
        );

    }

}


// =======================================
// SOCKET CONNECTION
// =======================================

io.on(
    "connection",
    (socket) => {

        console.log(
            "CONNECTED:",
            socket.id
        );


        // =================================
        // CREATE ROOM
        // =================================

        socket.on(
            "createRoom",
            (data) => {

                const code =
                    makeRoomCode();


                let name =
                    "Player";


                if (
                    data &&
                    typeof data.name ===
                    "string"
                ) {

                    name =
                        data.name
                            .trim()
                            .substring(
                                0,
                                20
                            );


                    if (!name) {

                        name =
                            "Player";

                    }

                }


                const player =
                    createPlayer(
                        socket,
                        name,
                        300,
                        "#22c55e",
                        true
                    );


                rooms[code] = {

                    code: code,

                    host:
                        socket.id,

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

                        roomCode:
                            code,

                        player:
                            player

                    }
                );


                sendPlayers(code);

            }
        );


        // =================================
        // JOIN ROOM
        // =================================

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


                let name =
                    "Player";


                if (
                    data &&
                    typeof data.name ===
                    "string"
                ) {

                    name =
                        data.name
                            .trim()
                            .substring(
                                0,
                                20
                            );


                    if (!name) {

                        name =
                            "Player";

                    }

                }


                /*
                 * اسپاون ثابت
                 *
                 * بازیکن دوم همیشه در یک
                 * مختصات ثابت دنیای بازی
                 * قرار می‌گیرد.
                 *
                 * اندازه صفحه موبایل و PC
                 * هیچ تأثیری ندارد.
                 */

                const spawnX =
                    500;


                const player =
                    createPlayer(
                        socket,
                        name,
                        spawnX,
                        "#3b82f6",
                        false
                    );


                room.players[
                    socket.id
                ] =
                    player;


                socket.join(code);

                socket.roomCode =
                    code;


                console.log(
                    "PLAYER JOINED:",
                    socket.id,
                    code
                );


                socket.emit(
                    "roomJoined",
                    {

                        roomCode:
                            code,

                        player:
                            player

                    }
                );


                sendPlayers(code);

            }
        );


        // =================================
        // READY
        // =================================

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
                ] =
                    true;


                if (
                    room.players[
                        socket.id
                    ]
                ) {

                    room.players[
                        socket.id
                    ].ready =
                        true;

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

                        ready:
                            ready,

                        total:
                            total

                    }
                );


                sendPlayers(code);


                // حداقل دو بازیکن
                // آماده باشند

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


        // =================================
        // PLAYER MOVEMENT
        // =================================

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


                // =========================
                // X
                // =========================

                if (
                    data &&
                    typeof data.x ===
                    "number" &&
                    Number.isFinite(
                        data.x
                    )
                ) {

                    player.x =
                        Math.max(
                            35,
                            Math.min(
                                WORLD_WIDTH - 35,
                                data.x
                            )
                        );

                }


                /*
                 * =========================
                 * Y
                 * =========================
                 *
                 * Y قبلی مشکل اصلی بود.
                 *
                 * دستگاه‌ها ارتفاع متفاوت
                 * دارند، بنابراین y خام
                 * صفحه را مستقیماً ذخیره
                 * نمی‌کنیم.
                 *
                 * برای سازگاری با کد فعلی،
                 * مقدار y معتبر دریافت می‌شود،
                 * اما مختصات بازی به صورت
                 * نسبی نگهداری می‌شود.
                 */


                if (
                    data &&
                    typeof data.y ===
                    "number" &&
                    Number.isFinite(
                        data.y
                    )
                ) {

                    /*
                     * اگر بازیکن روی زمین است،
                     * مقدار استاندارد 0 ذخیره شود.
                     */

                    if (
                        data.y <= 0
                    ) {

                        player.y =
                            0;

                    } else {

                        /*
                         * برای پرش مقدار مثبت
                         * را به یک محدوده ثابت
                         * تبدیل می‌کنیم.
                         */

                        player.y =
                            Math.max(
                                0,
                                Math.min(
                                    600,
                                    data.y
                                )
                            );

                    }

                }


                // =========================
                // BROADCAST
                // =========================

                socket.to(code).emit(
                    "playerMoved",
                    {

                        id:
                            player.id,

                        x:
                            player.x,

                        y:
                            player.y

                    }
                );

            }
        );


        // =================================
        // LEAVE ROOM
        // =================================

        socket.on(
            "leaveRoom",
            () => {

                leaveRoom(socket);

            }
        );


        // =================================
        // DISCONNECT
        // =================================

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
// SERVER STATUS
// =======================================

app.get(
    "/status",
    (req, res) => {

        let players =
            0;


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

            online:
                true,

            rooms:
                Object.keys(
                    rooms
                ).length,

            players:
                players

        });

    }
);


// =======================================
// START SERVER
// =======================================

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
