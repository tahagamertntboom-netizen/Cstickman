const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

const rooms = {};


// =====================================
// ساخت کد اتاق
// =====================================

function makeRoomCode() {

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


// =====================================
// تشخیص ادمین
// =====================================

function isAdmin(name) {

    return String(name || "")
        .trim()
        .toLowerCase() === "tahagamertnt";

}


// =====================================
// فرستادن لیست بازیکنان
// =====================================

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


// =====================================
// اتصال
// =====================================

io.on("connection", (socket) => {

    console.log(
        "Connected:",
        socket.id
    );


    // =================================
    // ساخت اتاق
    // =================================

    socket.on(
        "createRoom",
        (name) => {

            name =
                String(name || "")
                    .trim();


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
                    false

            };


            socket.roomCode =
                code;


            socket.join(code);


            socket.emit(
                "roomCreated",
                code
            );


            sendPlayers(code);


            console.log(
                "Room created:",
                code,
                "by",
                name
            );

        }
    );


    // =================================
    // ورود به اتاق
    // =================================

    socket.on(
        "joinRoom",
        ({ roomCode, playerName }) => {

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


            if (!rooms[code]) {

                socket.emit(
                    "errorMessage",
                    "این اتاق وجود ندارد!"
                );

                return;

            }


            // اگر سوکت قبلاً داخل اتاق دیگری بوده
            if (socket.roomCode) {

                const oldRoom =
                    rooms[socket.roomCode];

                if (oldRoom) {

                    delete oldRoom.players[
                        socket.id
                    ];

                    sendPlayers(
                        socket.roomCode
                    );

                }

                socket.leave(
                    socket.roomCode
                );

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
                    false

            };


            socket.roomCode =
                code;


            socket.join(code);


            socket.emit(
                "joinedRoom",
                code
            );


            sendPlayers(code);


            console.log(
                name,
                "joined room",
                code
            );

        }
    );


    // =================================
    // حرکت
    // =================================

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
                rooms[code]
                    .players[socket.id];


            if (!player) {
                return;
            }


            if (
                typeof data.x ===
                "number"
            ) {

                player.x =
                    data.x;

            }


            if (
                typeof data.y ===
                "number"
            ) {

                player.y =
                    data.y;

            }


            if (
                typeof data.vx ===
                "number"
            ) {

                player.vx =
                    data.vx;

            }


            if (
                typeof data.vy ===
                "number"
            ) {

                player.vy =
                    data.vy;

            }


            socket.to(code).emit(
                "playerMoved",
                {

                    id:
                        socket.id,

                    x:
                        player.x,

                    y:
                        player.y,

                    vx:
                        player.vx,

                    vy:
                        player.vy

                }
            );

        }
    );


    // =================================
    // دستور ادمین
    // =================================

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


            const admin =
                room.players[
                    socket.id
                ];


            // فقط tahagamertnt
            if (
                !admin ||
                !isAdmin(admin.name)
            ) {

                socket.emit(
                    "adminError",
                    "شما ادمین نیستید!"
                );

                return;

            }


            if (!data) {
                return;
            }


            const action =
                String(
                    data.action || ""
                );


            // -----------------------------
            // رنگی کردن همه
            // -----------------------------

            if (
                action ===
                "allColor"
            ) {

                Object.values(
                    room.players
                ).forEach(
                    (player) => {

                        player.rainbow =
                            true;

                    }
                );


                io.to(code).emit(
                    "adminEffect",
                    {

                        action:
                            "allColor",

                        targetId:
                            "all"

                    }
                );


                sendPlayers(code);

                return;

            }


            // -----------------------------
            // هدف
            // -----------------------------

            let targetId =
                data.targetId;


            // اگر هدف مشخص نشده
            // خود ادمین هدف باشد

            if (!targetId) {

                targetId =
                    socket.id;

            }


            const target =
                room.players[
                    targetId
                ];


            if (!target) {

                socket.emit(
                    "adminError",
                    "بازیکن پیدا نشد!"
                );

                return;

            }


            // -----------------------------
            // پرواز
            // -----------------------------

            if (
                action === "fly"
            ) {

                target.flying =
                    !target.flying;


                io.to(code).emit(
                    "adminEffect",
                    {

                        action:
                            "fly",

                        targetId:
                            target.id,

                        value:
                            target.flying

                    }
                );

            }


            // -----------------------------
            // رنگی شدن
            // -----------------------------

            else if (
                action === "color"
            ) {

                target.rainbow =
                    !target.rainbow;


                io.to(code).emit(
                    "adminEffect",
                    {

                        action:
                            "color",

                        targetId:
                            target.id,

                        value:
                            target.rainbow

                    }
                );

            }


            // -----------------------------
            // کشتن
            // -----------------------------

            else if (
                action === "kill"
            ) {

                target.health =
                    0;


                io.to(code).emit(
                    "adminEffect",
                    {

                        action:
                            "kill",

                        targetId:
                            target.id,

                        health:
                            0

                    }
                );

            }


            // -----------------------------
            // بیرون انداختن
            // -----------------------------

            else if (
                action === "kick"
            ) {

                io.to(target.id).emit(
                    "kicked",
                    {

                        reason:
                            "توسط ادمین از بازی خارج شدید."

                    }
                );


                const targetSocket =
                    io.sockets.sockets.get(
                        target.id
                    );


                if (targetSocket) {

                    targetSocket.leave(
                        code
                    );

                    targetSocket.roomCode =
                        null;

                }


                delete room.players[
                    target.id
                ];


                sendPlayers(code);

            }


            // دستور ناشناخته

            else {

                socket.emit(
                    "adminError",
                    "دستور ادمین ناشناخته است!"
                );

                return;

            }


            sendPlayers(code);

        }
    );


    // =================================
    // قطع اتصال
    // =================================

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


            delete rooms[code]
                .players[
                    socket.id
                ];


            if (
                Object.keys(
                    rooms[code].players
                ).length === 0
            ) {

                delete rooms[code];

            }

            else {

                sendPlayers(code);

            }


            console.log(
                "Disconnected:",
                socket.id
            );

        }
    );

});


// =====================================
// صفحه اصلی
// =====================================

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            __dirname +
            "/index.html"
        );

    }
);


// =====================================
// شروع سرور
// =====================================

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
