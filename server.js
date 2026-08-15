const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

const rooms = {};

function createRoomCode() {
    let code;

    do {
        code = Math.floor(
            100000 + Math.random() * 900000
        ).toString();
    } while (rooms[code]);

    return code;
}

io.on("connection", (socket) => {

    console.log("Player connected:", socket.id);


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

        console.log(
            "Room created:",
            code,
            name
        );

        socket.emit(
            "roomCreated",
            code
        );

        io.to(code).emit(
            "roomPlayers",
            Object.values(
                rooms[code].players
            )
        );
    });


    // =========================
    // ورود به اتاق
    // =========================

    socket.on("joinRoom", (data) => {

        const code =
            String(data?.roomCode || "").trim();

        const name =
            String(data?.playerName || "").trim();

        if (!name) {

            socket.emit(
                "roomError",
                "اول اسم خودت را تأیید کن!"
            );

            return;
        }

        if (!/^\d{6}$/.test(code)) {

            socket.emit(
                "roomError",
                "کد باید ۶ رقمی باشد!"
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

        rooms[code].players[socket.id] = {

            id: socket.id,

            name: name

        };

        socket.join(code);

        socket.roomCode = code;
        socket.playerName = name;

        console.log(
            name,
            "joined room",
            code
        );

        socket.emit(
            "joinedRoom",
            code
        );

        io.to(code).emit(
            "roomPlayers",
            Object.values(
                rooms[code].players
            )
        );
    });


    // =========================
    // قطع بازیکن
    // =========================

    socket.on("disconnect", () => {

        const code =
            socket.roomCode;

        if (!code || !rooms[code]) {
            return;
        }

        delete rooms[code].players[socket.id];

        io.to(code).emit(
            "roomPlayers",
            Object.values(
                rooms[code].players
            )
        );

        if (
            Object.keys(
                rooms[code].players
            ).length === 0
        ) {

            delete rooms[code];

            console.log(
                "Room deleted:",
                code
            );
        }
    });

});


app.get("/", (req, res) => {

    res.sendFile(
        __dirname + "/index.html"
    );

});


server.listen(PORT, () => {

    console.log(
        "Server running on port",
        PORT
    );

});
