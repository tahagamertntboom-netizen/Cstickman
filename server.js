const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

const rooms = {};

const ADMIN_NAME = "tahagamertnt";

function makeCode() {
    let code;

    do {
        code = String(
            Math.floor(100000 + Math.random() * 900000)
        );
    } while (rooms[code]);

    return code;
}

function cleanPlayer(p) {
    return {
        id: p.id,
        name: p.name,
        admin: p.admin,

        x: p.x,
        y: p.y,

        direction: p.direction,

        walking: p.walking,
        running: p.running,
        jumping: p.jumping,

        health: p.health,
        score: p.score
    };
}

function broadcastPlayers(roomCode) {

    const room = rooms[roomCode];

    if (!room) return;

    io.to(roomCode).emit(
        "players",
        Object.values(room.players).map(cleanPlayer)
    );
}

io.on("connection", socket => {

    console.log("CONNECTED:", socket.id);


    // =========================
    // CREATE ROOM
    // =========================

    socket.on("createRoom", name => {

        name = String(name || "").trim();

        if (!name) {
            socket.emit(
                "errorMessage",
                "اول اسمت را وارد کن!"
            );
            return;
        }

        const code = makeCode();

        rooms[code] = {
            players: {}
        };

        const player = {

            id: socket.id,

            name: name,

            admin:
                name.toLowerCase() ===
                ADMIN_NAME.toLowerCase(),

            x: 500,
            y: 0,

            direction: 1,

            walking: false,
            running: false,
            jumping: false,

            health: 100,
            score: 0
        };

        rooms[code].players[socket.id] =
            player;

        socket.join(code);

        socket.roomCode = code;

        socket.emit(
            "roomCreated",
            code
        );

        broadcastPlayers(code);

        console.log(
            "ROOM CREATED:",
            code,
            name
        );
    });


    // =========================
    // JOIN ROOM
    // =========================

    socket.on("joinRoom", data => {

        const code =
            String(data?.code || "").trim();

        const name =
            String(data?.name || "").trim();

        if (!name) {

            socket.emit(
                "errorMessage",
                "اول اسمت را وارد کن!"
            );

            return;
        }

        if (!/^\d{6}$/.test(code)) {

            socket.emit(
                "errorMessage",
                "کد باید ۶ رقمی باشد!"
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

        const player = {

            id: socket.id,

            name: name,

            admin:
                name.toLowerCase() ===
                ADMIN_NAME.toLowerCase(),

            x: 500,
            y: 0,

            direction: 1,

            walking: false,
            running: false,
            jumping: false,

            health: 100,
            score: 0
        };

        rooms[code].players[socket.id] =
            player;

        socket.join(code);

        socket.roomCode = code;

        socket.emit(
            "roomJoined",
            code
        );

        broadcastPlayers(code);

        console.log(
            "JOINED:",
            name,
            code
        );
    });


    // =========================
    // GAME READY
    // =========================

    socket.on("gameReady", () => {

        const code =
            socket.roomCode;

        if (!code || !rooms[code])
            return;

        broadcastPlayers(code);
    });


    // =========================
    // PLAYER MOVE
    // =========================

    socket.on("move", data => {

        const code =
            socket.roomCode;

        if (!code || !rooms[code])
            return;

        const player =
            rooms[code].players[socket.id];

        if (!player)
            return;


        if (
            typeof data.x === "number"
        ) {
            player.x = data.x;
        }


        if (
            typeof data.y === "number"
        ) {
            player.y = data.y;
        }


        player.direction =
            data.direction === -1
                ? -1
                : 1;

        player.walking =
            !!data.walking;

        player.running =
            !!data.running;

        player.jumping =
            !!data.jumping;


        socket.to(code).emit(
            "move",
            cleanPlayer(player)
        );

    });


    // =========================
    // DISCONNECT
    // =========================

    socket.on("disconnect", () => {

        const code =
            socket.roomCode;

        if (!code || !rooms[code])
            return;

        delete rooms[code]
            .players[socket.id];

        io.to(code).emit(
            "playerLeft",
            socket.id
        );

        broadcastPlayers(code);


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
            "================================"
        );

        console.log(
            "STICKMAN SERVER RUNNING"
        );

        console.log(
            "PORT:",
            PORT
        );

        console.log(
            "================================"
        );
    }
);
