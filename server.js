const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));


// =========================
// اتاق‌ها
// =========================

const rooms = {};


// =========================
// ساخت کد ۶ رقمی
// =========================

function createRoomCode() {

    let code;

    do {

        code = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

    } while (rooms[code]);

    return code;
}


// =========================
// اتصال بازیکن
// =========================

io.on("connection", (socket) => {

    console.log("بازیکن وصل شد:", socket.id);


    // =========================
    // ساخت اتاق
    // =========================

    socket.on("createRoom", (name) => {

        name = String(name || "").trim();

        if (!name) {

            socket.emit(
                "roomError",
                "اسم وارد نشده!"
            );

            return;
        }


        const code = createRoomCode();


        rooms[code] = {

            players: {}

        };


        rooms[code].players[socket.id] = {

            id: socket.id,

            name: name

        };


        socket.join(code);


        socket.roomCode = code;

        socket.playerName = name;


        // فرستادن کد اتاق به سازنده

        socket.emit(
            "roomCreated",
            code
        );


        // فرستادن لیست بازیکنان

        io.to(code).emit(
            "roomPlayers",
            Object.values(
                rooms[code].players
            )
        );


        console.log(
            "اتاق ساخته شد:",
            code
        );

    });


    // =========================
    // ورود به اتاق
    // =========================

    socket.on("joinRoom", (data) => {

        const code =
            String(
                data?.roomCode || ""
            ).trim();

        const name =
            String(
                data?.playerName || ""
            ).trim();


        if (!name) {

            socket.emit(
                "roomError",
                "اسم وارد نشده!"
            );

            return;
        }


        if (!/^[0-9]{6}$/.test(code)) {

            socket.emit(
                "roomError",
                "کد باید دقیقاً ۶ رقمی باشد!"
            );

            return;
        }


        if (!rooms[code]) {

            socket.emit(
                "roomError",
                "این اتاق وجود ندارد!"
            );

            return;
        }


        // اضافه کردن بازیکن

        rooms[code].players[socket.id] = {

            id: socket.id,

            name: name

        };


        socket.join(code);


        socket.roomCode = code;

        socket.playerName = name;


        // اعلام ورود موفق

        socket.emit(
            "joinedRoom",
            code
        );


        // بروزرسانی همه بازیکنان

        io.to(code).emit(
            "roomPlayers",
            Object.values(
                rooms[code].players
            )
        );


        console.log(
            name +
            " وارد اتاق " +
            code +
            " شد"
        );

    });


    // =========================
    // قطع اتصال
    // =========================

    socket.on("disconnect", () => {

        const code =
            socket.roomCode;


        if (
            !code ||
            !rooms[code]
        ) {

            return;
        }


        delete rooms[code]
            .players[socket.id];


        // اطلاع به بقیه بازیکنان

        io.to(code).emit(
            "roomPlayers",
            Object.values(
                rooms[code].players
            )
        );


        // اگر اتاق خالی شد حذف شود

        if (
            Object.keys(
                rooms[code].players
            ).length === 0
        ) {

            delete rooms[code];

            console.log(
                "اتاق حذف شد:",
                code
            );

        }

    });

});


// =========================
// صفحه اصلی
// =========================

app.get("/", (req, res) => {

    res.sendFile(
        __dirname + "/index.html"
    );

});


// =========================
// اجرای سرور
// =========================

server.listen(
    PORT,
    () => {

        console.log(
            "Server running on port " +
            PORT
        );

    }
);
