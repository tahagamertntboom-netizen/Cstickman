const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

const rooms = {};

function makeCode() {
    let code;

    do {
        code = Math.floor(
            100000 + Math.random() * 900000
        ).toString();
    } while (rooms[code]);

    return code;
}

io.on("connection", (socket) => {

    console.log("وصل شد:", socket.id);

    // ساخت اتاق
    socket.on("createRoom", (name) => {

        name = String(name || "").trim();

        if (!name) {
            socket.emit("roomError", "اسم را وارد کن!");
            return;
        }

        const code = makeCode();

        rooms[code] = {
            players: {}
        };

        rooms[code].players[socket.id] = {
            id: socket.id,
            name: name,
            x: 300,
            y: 0
        };

        socket.join(code);

        socket.roomCode = code;
        socket.playerName = name;

        socket.emit("roomCreated", code);

        io.to(code).emit(
            "roomPlayers",
            Object.values(rooms[code].players)
        );

        console.log(
            "اتاق ساخته شد:",
            code
        );
    });


    // ورود به اتاق
    socket.on("joinRoom", (data) => {

        const code =
            String(data?.roomCode || "").trim();

        const name =
            String(data?.playerName || "").trim();

        if (!name) {
            socket.emit(
                "roomError",
                "اول اسمت را تأیید کن!"
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
                "این اتاق پیدا نشد!"
            );
            return;
        }

        rooms[code].players[socket.id] = {
            id: socket.id,
            name: name,
            x: 300,
            y: 0
        };

        socket.join(code);

        socket.roomCode = code;
        socket.playerName = name;

        socket.emit(
            "joinedRoom",
            code
        );

        io.to(code).emit(
            "roomPlayers",
            Object.values(rooms[code].players)
        );

    });


    // ورود به بازی
    socket.on("gameJoin", () => {

        const code =
            socket.roomCode;

        if (
            !code ||
            !rooms[code]
        ) {
            return;
        }

        socket.emit(
            "gamePlayers",
            Object.values(
                rooms[code].players
            )
        );

    });


    // حرکت
    socket.on("playerMove", (data) => {

        const code =
            socket.roomCode;

        if (
            !code ||
            !rooms[code] ||
            !rooms[code].players[socket.id]
        ) {
            return;
        }

        const player =
            rooms[code].players[socket.id];

        player.x =
            Number(data.x) || 0;

        player.y =
            Number(data.y) || 0;

        player.direction =
            Number(data.direction) || 1;

        player.walking =
            Boolean(data.walking);

        socket.to(code).emit(
            "playerMove",
            player
        );

    });


    // خروج
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

        io.to(code).emit(
            "roomPlayers",
            Object.values(
                rooms[code].players
            )
        );

        io.to(code).emit(
            "playerLeave",
            socket.id
        );

        if (
            Object.keys(
                rooms[code].players
            ).length === 0
        ) {
            delete rooms[code];
        }

    });

});


server.listen(
    PORT,
    () => {

        console.log(
            "SERVER ON PORT " + PORT
        );

    }
);
