const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));


// =====================================
// اتاق‌ها
// =====================================

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

    return (
        String(name || "")
            .trim()
            .toLowerCase()
        === "tahagamertnt"
    );

}


// =====================================
// فرستادن لیست بازیکنان
// به تمام افراد اتاق
// =====================================

function sendPlayers(roomCode) {

    if (!rooms[roomCode]) {
        return;
    }

    const players =
        Object.values(
            rooms[roomCode].players
        );

    io.to(roomCode).emit(
        "players",
        players
    );

}


// =====================================
// اتصال
// =====================================

io.on("connection", (socket) => {

    console.log(
        "CONNECTED:",
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
                    250,

                y:
                    300,

                vx:
                    0,

                vy:
                    0,

                color:
                    null,

                flying:
                    false

            };


            socket.roomCode =
                code;


            socket.playerName =
                name;


            socket.join(code);


            socket.emit(
                "roomCreated",
                code
            );


            // حتماً لیست را برای خودمان
            // و تمام اتاق بفرست

            sendPlayers(code);


            console.log(
                "ROOM CREATED:",
                code,
                "BY:",
                name
            );

        }
    );


    // =================================
    // ورود به اتاق
    // =================================

    socket.on(
        "joinRoom",
        (data) => {

            data =
                data || {};


            const code =
                String(
                    data.roomCode || ""
                ).trim();


            const name =
                String(
                    data.playerName || ""
                ).trim();


            if (!name) {

                socket.emit(
                    "errorMessage",
                    "اول اسم خودت را وارد کن!"
                );

                return;
            }


            if (!/^\d{6}$/.test(code)) {

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


            // اگر قبلاً داخل اتاق دیگری بوده
            if (socket.roomCode) {

                socket.leave(
                    socket.roomCode
                );

            }


            // موقعیت شروع متفاوت
            // تا بازیکن‌ها روی هم نیفتند

            const startX =
                250 +
                Math.random() * 300;


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
                    startX,

                y:
                    300,

                vx:
                    0,

                vy:
                    0,

                color:
                    null,

                flying:
                    false

            };


            socket.roomCode =
                code;


            socket.playerName =
                name;


            socket.join(code);


            socket.emit(
                "joinedRoom",
                code
            );


            // مهم:
            // اطلاعات تمام بازیکنان
            // به همه ارسال می‌شود

            sendPlayers(code);


            console.log(
                name,
                "JOINED ROOM",
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
                rooms[code].players[
                    socket.id
                ];


            if (!player) {
                return;
            }


            data =
                data || {};


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


            // ارسال حرکت به تمام افراد دیگر
            // داخل همان اتاق

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

                        color:
                            player.color,

                        flying:
                            player.flying
                    }
                );

        }
    );


    // =================================
    // قابلیت‌های ادمین
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


            const admin =
                rooms[code].players[
                    socket.id
                ];


            // فقط ادمین واقعی

            if (
                !admin ||
                admin.admin !== true
            ) {

                return;
            }


            data =
                data || {};


            const action =
                data.action;


            // -------------------------
            // رنگی کردن همه
            // -------------------------

            if (
                action ===
                "allColor"
            ) {

                Object.values(
                    rooms[code].players
                ).forEach(
                    (player) => {

                        player.color =
                            "rainbow";

                    }
                );


                sendPlayers(code);


                return;
            }


            // -------------------------
            // پیدا کردن هدف
            // -------------------------

            const targetId =
                data.targetId;


            const target =
                rooms[code].players[
                    targetId
                ];


            if (!target) {
                return;
            }


            // -------------------------
            // پرواز
            // -------------------------

            if (
                action === "fly"
            ) {

                target.flying =
                    !target.flying;


                io.to(target.id)
                    .emit(
                        "adminEffect",
                        {
                            effect:
                                "fly",

                            enabled:
                                target.flying
                        }
                    );

            }


            // -------------------------
            // رنگی شدن
            // -------------------------

            if (
                action === "color"
            ) {

                target.color =
                    "rainbow";


                io.to(target.id)
                    .emit(
                        "adminEffect",
                        {
                            effect:
                                "color"
                        }
                    );

            }


            // -------------------------
            // کشتن
            // -------------------------

            if (
                action === "kill"
            ) {

                target.x =
                    250;

                target.y =
                    100;


                target.vx =
                    0;

                target.vy =
                    0;


                io.to(target.id)
                    .emit(
                        "adminEffect",
                        {
                            effect:
                                "kill"
                        }
                    );

            }


            // -------------------------
            // بیرون انداختن
            // -------------------------

            if (
                action === "kick"
            ) {

                io.to(target.id)
                    .emit(
                        "kicked"
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


                delete rooms[code]
                    .players[target.id];


                sendPlayers(code);

            }


            // تغییرات بازیکن
            // به همه اعلام شود

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

                console.log(
                    "DISCONNECTED:",
                    socket.id
                );

                return;
            }


            delete rooms[code]
                .players[socket.id];


            // اگر اتاق خالی شد
            if (
                Object.keys(
                    rooms[code].players
                ).length === 0
            ) {

                delete rooms[code];

            }
            else {

                // بازیکن‌های باقی‌مانده
                // باید بفهمند طرف خارج شده

                sendPlayers(code);

            }


            console.log(
                "DISCONNECTED:",
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
            "PORT:",
            PORT
        );

        console.log(
            "=============================="
        );

        console.log("");

    }
);
