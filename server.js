const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

const rooms = {};

const ADMIN = "tahagamertnt";

function roomCode() {
    let code;

    do {
        code = Math.floor(
            100000 + Math.random() * 900000
        ).toString();
    } while (rooms[code]);

    return code;
}

function playerData(p) {
    return {
        id: p.id,
        name: p.name,
        admin: p.admin,
        x: p.x,
        y: p.y,
        direction: p.direction,
        walking: p.walking,
        running: p.running,
        jumping: p.jumping
    };
}

function sendPlayers(code) {
    if (!rooms[code]) return;

    io.to(code).emit(
        "gamePlayers",
        Object.values(rooms[code].players)
            .map(playerData)
    );
}

io.on("connection", socket => {

    console.log("CONNECTED:", socket.id);

    // =========================
    // ساخت اتاق
    // =========================

    socket.on("createRoom", name => {

        name = String(name || "").trim();

        if (!name) {
            socket.emit(
                "roomError",
                "اسم را وارد کن!"
            );
            return;
        }

        const code = roomCode();

        rooms[code] = {
            players: {}
        };

        const player = {
            id: socket.id,
            name,
            admin:
                name.toLowerCase() ===
                ADMIN.toLowerCase(),

            x: 500,
            y: 0,
            direction: 1,
            walking: false,
            running: false,
            jumping: false
        };

        rooms[code].players[socket.id] =
            player;

        socket.join(code);

        socket.roomCode = code;

        socket.emit(
            "roomCreated",
            code
        );

        sendPlayers(code);

        console.log(
            "ROOM CREATED:",
            code
        );
    });


    // =========================
    // ورود به اتاق
    // =========================

    socket.on("joinRoom", data => {

        const code =
            String(data?.roomCode || "")
            .trim();

        const name =
            String(data?.playerName || "")
            .trim();

        if (!name) {
            socket.emit(
                "roomError",
                "اسم را وارد کن!"
            );
            return;
        }

        if (!/^\d{6}$/.test(code)) {
            socket.emit(
                "roomError",
                "کد اتاق باید ۶ رقمی باشد!"
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

        const player = {
            id: socket.id,
            name,
            admin:
                name.toLowerCase() ===
                ADMIN.toLowerCase(),

            x: 500,
            y: 0,
            direction: 1,
            walking: false,
            running: false,
            jumping: false
        };

        rooms[code].players[socket.id] =
            player;

        socket.join(code);

        socket.roomCode = code;

        socket.emit(
            "joinedRoom",
            code
        );

        sendPlayers(code);

        console.log(
            name,
            "JOINED",
            code
        );
    });


    // =========================
    // درخواست بازیکنان بازی
    // =========================

    socket.on("gameJoin", () => {

        const code =
            socket.roomCode;

        if (!code || !rooms[code])
            return;

        sendPlayers(code);
    });


    // =========================
    // حرکت بازیکن
    // =========================

    socket.on("playerMove", data => {

        const code =
            socket.roomCode;

        if (!code)
            return;

        if (!rooms[code])
            return;

        const player =
            rooms[code]
                .players[socket.id];

        if (!player)
            return;

        player.x =
            Number(data.x) || 0;

        player.y =
            Number(data.y) || 0;

        player.direction =
            Number(data.direction) || 1;

        player.walking =
            !!data.walking;

        player.running =
            !!data.running;

        player.jumping =
            !!data.jumping;

        socket.to(code).emit(
            "playerMove",
            playerData(player)
        );
    });


    // =========================
    // خروج
    // =========================

    socket.on("disconnect", () => {

        const code =
            socket.roomCode;

        if (!code)
            return;

        if (!rooms[code])
            return;

        delete rooms[code]
            .players[socket.id];

        socket.to(code).emit(
            "playerLeave",
            socket.id
        );

        sendPlayers(code);

        if (
            Object.keys(
                rooms[code].players
            ).length === 0
        ) {
            delete rooms[code];
        }

        console.log(
            "DISCONNECTED:",
            socket.id
        );
    });

});


app.get("/", (req, res) => {

    res.sendFile(
        __dirname + "/index.html"
    );

});


server.listen(
    PORT,
    () => {

        console.log(
            "SERVER RUNNING:"
        );

        console.log(
            "PORT:",
            PORT
        );

    }
);
