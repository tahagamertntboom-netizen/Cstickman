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

function getPlayers(roomCode) {
    if (!rooms[roomCode]) return [];

    return Object.values(rooms[roomCode]).map(p => ({
        id: p.id,
        name: p.name,
        admin: p.admin,
        x: p.x,
        y: p.y,
        direction: p.direction,
        walking: p.walking,
        running: p.running,
        jumping: p.jumping
    }));
}

function updateRoom(roomCode) {
    if (rooms[roomCode]) {
        io.to(roomCode).emit(
            "players",
            getPlayers(roomCode)
        );
    }
}

io.on("connection", socket => {

    console.log("Player connected:", socket.id);

    // ساخت اتاق
    socket.on("createRoom", name => {

        name = String(name || "").trim();

        if (!name) {
            socket.emit(
                "errorMessage",
                "اسم وارد نشده!"
            );
            return;
        }

        const code = makeRoomCode();

        rooms[code] = {};

        rooms[code][socket.id] = {
            id: socket.id,
            name: name,
            admin:
                name.toLowerCase() ===
                "tahagamertnt",

            x: 500,
            y: 0,

            direction: 1,

            walking: false,
            running: false,
            jumping: false
        };

        socket.roomCode = code;

        socket.join(code);

        socket.emit(
            "roomCreated",
            code
        );

        updateRoom(code);

        console.log(
            "Room created:",
            code,
            name
        );
    });


    // ورود به اتاق
    socket.on("joinRoom", data => {

        const name =
            String(data?.name || "").trim();

        const code =
            String(data?.code || "").trim();

        if (!name) {
            socket.emit(
                "errorMessage",
                "اسم وارد نشده!"
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

        rooms[code][socket.id] = {
            id: socket.id,
            name: name,
            admin:
                name.toLowerCase() ===
                "tahagamertnt",

            x: 500,
            y: 0,

            direction: 1,

            walking: false,
            running: false,
            jumping: false
        };

        socket.roomCode = code;

        socket.join(code);

        socket.emit(
            "roomJoined",
            code
        );

        updateRoom(code);

        console.log(
            "Player joined:",
            name,
            code
        );
    });


    // حرکت
    socket.on("move", data => {

        const code = socket.roomCode;

        if (!code || !rooms[code]) return;

        const player =
            rooms[code][socket.id];

        if (!player) return;

        if (typeof data.x === "number")
            player.x = data.x;

        if (typeof data.y === "number")
            player.y = data.y;

        player.direction =
            data.direction === -1 ? -1 : 1;

        player.walking =
            Boolean(data.walking);

        player.running =
            Boolean(data.running);

        player.jumping =
            Boolean(data.jumping);

        socket.to(code).emit(
            "playerMove",
            {
                id: player.id,
                name: player.name,
                admin: player.admin,
                x: player.x,
                y: player.y,
                direction: player.direction,
                walking: player.walking,
                running: player.running,
                jumping: player.jumping
            }
        );
    });


    // خروج
    socket.on("disconnect", () => {

        const code = socket.roomCode;

        if (!code || !rooms[code]) return;

        delete rooms[code][socket.id];

        io.to(code).emit(
            "playerLeft",
            socket.id
        );

        updateRoom(code);

        if (
            Object.keys(rooms[code]).length === 0
        ) {
            delete rooms[code];
        }

        console.log(
            "Player disconnected:",
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
    console.log("================================");
    console.log(" STICKMAN SERVER IS RUNNING");
    console.log(" http://localhost:" + PORT);
    console.log("================================");
    console.log("");
});
