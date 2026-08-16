```javascript
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));


// =====================================================
// ROOMS
// =====================================================

const rooms = {};


// =====================================================
// ساخت کد اتاق
// =====================================================

function makeRoomCode() {

    let code;

    do {

        code = String(
            Math.floor(
                100000 +
                Math.random() * 900000
            )
        );

    }
    while (rooms[code]);

    return code;
}


// =====================================================
// تشخیص ADMIN
// =====================================================

function isAdmin(name) {

    return String(name || "")
        .trim()
        .toLowerCase() ===
        "tahagamertnt";

}


// =====================================================
// ارسال لیست بازیکنان
// =====================================================

function sendPlayers(roomCode) {

    if (!rooms[roomCode]) {
        return;
    }


    io.to(roomCode).emit(
        "players",
        Object.values(
            rooms[roomCode].players
        )
    );

}


// =====================================================
// CONNECTION
// =====================================================

io.on(
    "connection",
    (socket) => {

        console.log(
            "Connected:",
            socket.id
        );


        // =================================================
        // ساخت اتاق
        // =================================================

        socket.on(
            "createRoom",
            (name) => {

                name =
                    String(
                        name || ""
                    ).trim();


                if (!name) {

                    socket.emit(
                        "errorMessage",
                        "اول اسم خودت را وارد کن!"
                    );

                    return;
                }


                const code =
                    makeRoomCode();


                rooms[code] = {

                    players: {}

                };


                rooms[code].players[
                    socket.id
                ] = {

                    id:
                        socket.id,

                    name:
                        name,

                    admin:
                        isAdmin(name),

                    x:
                        200,

                    y:
                        400,

                    vx:
                        0,

                    vy:
                        0,

                    health:
                        100,

                    flying:
                        false,

                    rainbow:
                        isAdmin(name)

                };


                socket.roomCode =
                    code;


                socket.join(
                    code
                );


                socket.emit(
                    "roomCreated",
                    code
                );


                sendPlayers(
                    code
                );


                console.log(
                    "Room created:",
                    code,
                    "by",
                    name
                );

            }
        );


        // =================================================
        // ورود به اتاق
        // =================================================

        socket.on(
            "joinRoom",
            ({
                roomCode,
                playerName
            }) => {

                const code =
                    String(
                        roomCode || ""
                    ).trim();


                const name =
                    String(
                        playerName || ""
                    ).trim();


                if (!name) {

                    socket.emit(
                        "errorMessage",
                        "اول اسم خودت را وارد کن!"
                    );

                    return;
                }


                if (
                    !/^\d{6}$/.test(code)
                ) {

                    socket.emit(
                        "errorMessage",
                        "کد اتاق باید ۶ رقمی باشد!"
                    );

                    return;
                }


                if (
                    !rooms[code]
                ) {

                    socket.emit(
                        "errorMessage",
                        "این اتاق وجود ندارد!"
                    );

                    return;
                }


                rooms[code].players[
                    socket.id
                ] = {

                    id:
                        socket.id,

                    name:
                        name,

                    admin:
                        isAdmin(name),

                    x:
                        300 +
                        Math.random() * 300,

                    y:
                        400,

                    vx:
                        0,

                    vy:
                        0,

                    health:
                        100,

                    flying:
                        false,

                    rainbow:
                        isAdmin(name)

                };


                socket.roomCode =
                    code;


                socket.join(
                    code
                );


                socket.emit(
                    "joinedRoom",
                    code
                );


                sendPlayers(
                    code
                );


                console.log(
                    name,
                    "joined room",
                    code
                );

            }
        );


        // =================================================
        // حرکت بازیکن
        // =================================================

        socket.on(
            "move",
            (data) => {

                const code =
                    socket.roomCode;


                if (
                    !code ||
                    !rooms[code]
                ) {

                    return;
                }


                const player =
                    rooms[code].players[
                        socket.id
                    ];


                if (!player) {

                    return;
                }


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


                if (
                    typeof data?.vx ===
                    "number"
                ) {

                    player.vx =
                        data.vx;

                }


                if (
                    typeof data?.vy ===
                    "number"
                ) {

                    player.vy =
                        data.vy;

                }


                socket
                    .to(code)
                    .emit(
                        "playerMoved",
                        {

                            id:
                                socket.id,

                            name:
                                player.name,

                            admin:
                                player.admin,

                            x:
                                player.x,

                            y:
                                player.y,

                            vx:
                                player.vx,

                            vy:
                                player.vy,

                            health:
                                player.health,

                            flying:
                                player.flying,

                            rainbow:
                                player.rainbow

                        }
                    );

            }
        );


        // =================================================
        // ADMIN ACTION
        // =================================================

        socket.on(
            "adminAction",
            (data) => {

                const code =
                    socket.roomCode;


                if (
                    !code ||
                    !rooms[code]
                ) {

                    return;
                }


                const room =
                    rooms[code];


                const adminPlayer =
                    room.players[
                        socket.id
                    ];


                // -----------------------------------------
                // فقط tahagamertnt ادمین است
                // -----------------------------------------

                if (
                    !adminPlayer ||
                    !isAdmin(
                        adminPlayer.name
                    )
                ) {

                    socket.emit(
                        "adminError",
                        "شما ادمین نیستید!"
                    );

                    return;
                }


                const action =
                    String(
                        data?.action || ""
                    ).trim();


                // =========================================
                // رنگی کردن همه
                // =========================================

                if (
                    action ===
                    "allColor"
                ) {

                    Object.values(
                        room.players
                    ).forEach(
                        player => {

                            player.rainbow =
                                true;

                        }
                    );


                    io.to(code).emit(
                        "adminEffect",
                        {

                            action:
                                "allColor"

                        }
                    );


                    sendPlayers(
                        code
                    );


                    return;
                }


                // =========================================
                // بازیکن هدف
                // =========================================

                const targetId =
                    data?.targetId;


                if (!targetId) {

                    socket.emit(
                        "adminError",
                        "اول یک بازیکن را انتخاب کن!"
                    );

                    return;
                }


                const target =
                    room.players[
                        targetId
                    ];


                if (!target) {

                    socket.emit(
                        "adminError",
                        "این بازیکن دیگر داخل اتاق نیست!"
                    );

                    return;
                }


                // =========================================
                // پرواز
                // =========================================

                if (
                    action ===
                    "fly"
                ) {

                    target.flying =
                        !Boolean(
                            target.flying
                        );


                    io.to(code).emit(
                        "adminEffect",
                        {

                            action:
                                "fly",

                            targetId:
                                targetId,

                            value:
                                target.flying

                        }
                    );


                    sendPlayers(
                        code
                    );


                    return;
                }


                // =========================================
                // رنگی شدن
                // =========================================

                if (
                    action ===
                    "color"
                ) {

                    target.rainbow =
                        !Boolean(
                            target.rainbow
                        );


                    io.to(code).emit(
                        "adminEffect",
                        {

                            action:
                                "color",

                            targetId:
                                targetId,

                            value:
                                target.rainbow

                        }
                    );


                    sendPlayers(
                        code
                    );


                    return;
                }


                // =========================================
                // کشتن
                // =========================================

                if (
                    action ===
                    "kill"
                ) {

                    target.health =
                        0;


                    io.to(code).emit(
                        "adminEffect",
                        {

                            action:
                                "kill",

                            targetId:
                                targetId

                        }
                    );


                    sendPlayers(
                        code
                    );


                    return;
                }


                // =========================================
                // KICK
                // =========================================

                if (
                    action ===
                    "kick"
                ) {

                    const targetSocket =
                        io.sockets.sockets.get(
                            targetId
                        );


                    if (
                        !targetSocket
                    ) {

                        socket.emit(
                            "adminError",
                            "بازیکن پیدا نشد!"
                        );

                        return;
                    }


                    targetSocket.emit(
                        "kicked",
                        {

                            reason:
                                "توسط ادمین از بازی بیرون انداخته شدید."

                        }
                    );


                    delete room.players[
                        targetId
                    ];


                    targetSocket.leave(
                        code
                    );


                    targetSocket.roomCode =
                        null;


                    sendPlayers(
                        code
                    );


                    setTimeout(
                        () => {

                            try {

                                targetSocket.disconnect(
                                    true
                                );

                            }
                            catch (error) {

                                console.log(
                                    "Kick error:",
                                    error.message
                                );

                            }

                        },
                        100
                    );


                    return;
                }


                // =========================================
                // دستور ناشناخته
                // =========================================

                socket.emit(
                    "adminError",
                    "دستور ADMIN ناشناخته است."
                );

            }
        );


        // =================================================
        // قطع اتصال
        // =================================================

        socket.on(
            "disconnect",
            () => {

                const code =
                    socket.roomCode;


                if (
                    !code ||
                    !rooms[code]
                ) {

                    return;
                }


                delete rooms[
                    code
                ].players[
                    socket.id
                ];


                if (
                    Object.keys(
                        rooms[code].players
                    ).length === 0
                ) {

                    delete rooms[
                        code
                    ];

                }
                else {

                    sendPlayers(
                        code
                    );

                }


                console.log(
                    "Disconnected:",
                    socket.id
                );

            }
        );

    }
);


// =====================================================
// صفحه اصلی
// =====================================================

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            __dirname +
            "/index.html"
        );

    }
);


// =====================================================
// START SERVER
// =====================================================

server.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "=============================="
        );

        console.log(
            "STICKMAN SERVER"
        );

        console.log(
            "http://localhost:" +
            PORT
        );

        console.log(
            "=============================="
        );

        console.log("");

    }
);
```
