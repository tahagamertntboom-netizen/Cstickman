const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

const rooms = {};

function makeRoomCode() {
    let code;

    do {
        code = String(
            Math.floor(100000 + Math.random() * 900000)
        );
    } while (rooms[code]);

    return code;
}

function isAdmin(name) {
    return String(name).trim().toLowerCase() === "tahagamertnt";
}

function sendPlayers(roomCode) {
    if (!rooms[roomCode]) return;

    io.to(roomCode).emit(
        "players",
        Object.values(rooms[roomCode].players)
    );
}

io.on("connection", (socket) => {

    console.log("Connected:", socket.id);

    socket.on("createRoom", (name) => {

        name = String(name || "").trim();

        if (!name) {
            socket.emit(
                "errorMessage",
                "اول اسم خودت را وارد کن!"
            );
            return;
        }

        const code = makeRoomCode();

        rooms[code] = {
            players: {}
        };

        rooms[code].players[socket.id] = {
            id: socket.id,
            name: name,
            admin: isAdmin(name),
            x: 200,
            y: 400,
            vx: 0,
            vy: 0
        };

        socket.roomCode = code;

        socket.join(code);

        socket.emit("roomCreated", code);

        sendPlayers(code);

        console.log(
            "Room created:",
            code,
            "by",
            name
        );
    });

    socket.on("joinRoom", ({ roomCode, playerName }) => {

        const code = String(roomCode || "").trim();
        const name = String(playerName || "").trim();

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

        rooms[code].players[socket.id] = {
            id: socket.id,
            name: name,
            admin: isAdmin(name),
            x: 300 + Math.random() * 300,
            y: 400,
            vx: 0,
            vy: 0
        };

        socket.roomCode = code;

        socket.join(code);

        socket.emit("joinedRoom", code);

        sendPlayers(code);

        console.log(
            name,
            "joined room",
            code
        );
    });

    socket.on("move", (data) => {

        const code = socket.roomCode;

        if (!code || !rooms[code]) return;

        const player =
            rooms[code].players[socket.id];

        if (!player) return;

        if (typeof data.x === "number") {
            player.x = data.x;
        }

        if (typeof data.y === "number") {
            player.y = data.y;
        }

        if (typeof data.vx === "number") {
            player.vx = data.vx;
        }

        if (typeof data.vy === "number") {
            player.vy = data.vy;
        }

        socket.to(code).emit(
            "playerMoved",
            {
                id: socket.id,
                x: player.x,
                y: player.y,
                vx: player.vx,
                vy: player.vy
            }
        );
    });

    socket.on("disconnect", () => {

        const code = socket.roomCode;

        if (!code || !rooms[code]) {
            return;
        }

        delete rooms[code].players[socket.id];

        if (
            Object.keys(
                rooms[code].players
            ).length === 0
        ) {

            delete rooms[code];

        } else {

            sendPlayers(code);

        }

        console.log(
            "Disconnected:",
            socket.id
        );
    });

});

app.get("/", (req, res) => {
    res.sendFile(
        __dirname + "/index.html"
    );
});

server.listen(PORT, () => {

    console.log("");
    console.log("==============================");
    console.log("STICKMAN SERVER");
    console.log(
        "http://localhost:" + PORT
    );
    console.log("==============================");
    console.log("");

});
