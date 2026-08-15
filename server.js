const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

const rooms = {};

function newCode() {
    let code;

    do {
        code = Math.floor(
            100000 + Math.random() * 900000
        ).toString();
    } while (rooms[code]);

    return code;
}

function sendPlayers(code) {
    if (!rooms[code]) return;

    const list = Object.values(rooms[code]);

    io.to(code).emit("players", list);
}

io.on("connection", socket => {

    console.log("CONNECTED", socket.id);

    // ساخت اتاق
    socket.on("createRoom", name => {

        name = String(name || "").trim();

        if (!name) {
            socket.emit("errorMessage", "اسم را وارد کن!");
            return;
        }

        const code = newCode();

        rooms[code] = {};

        rooms[code][socket.id] = {
            id: socket.id,
            name: name,
            admin:
                name.toLowerCase() === "tahagamertnt",

            x: 500,
            y: 0,
            direction: 1,
            walking: false,
            running: false,
            jumping: false,
            health: 100
        };

        socket.room = code;

        socket.join(code);

        socket.emit("roomCreated", code);

        sendPlayers(code);

        console.log("ROOM", code);
    });


    // ورود
    socket.on("joinRoom", data => {

        const name =
            String(data?.name || "").trim();

        const code =
            String(data?.code || "").trim();

        if (!name) {
            socket.emit("errorMessage", "اسم را وارد کن!");
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
                name.toLowerCase() === "tahagamertnt",

            x: 500,
            y: 0,
            direction: 1,
            walking: false,
            running: false,
            jumping: false,
            health: 100
        };

        socket.room = code;

        socket.join(code);

        socket.emit("roomJoined", code);

        sendPlayers(code);

        console.log(
            name,
            "JOIN",
            code
        );
    });


    // حرکت بازیکن
    socket.on("move", data => {

        const code = socket.room;

        if (!code || !rooms[code]) return;

        const p =
            rooms[code][socket.id];

        if (!p) return;

        if (typeof data.x === "number")
            p.x = data.x;

        if (typeof data.y === "number")
            p.y = data.y;

        p.direction =
            data.direction === -1
                ? -1
                : 1;

        p.walking = !!data.walking;
        p.running = !!data.running;
        p.jumping = !!data.jumping;

        socket.to(code).emit(
            "move",
            p
        );
    });


    // قطع شدن
    socket.on("disconnect", () => {

        const code = socket.room;

        if (!code || !rooms[code])
            return;

        delete rooms[code][socket.id];

        io.to(code).emit(
            "playerLeft",
            socket.id
        );

        sendPlayers(code);

        if (
            Object.keys(
                rooms[code]
            ).length === 0
        ) {
            delete rooms[code];
        }

        console.log(
            "LEFT",
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
    console.log("PORT:", PORT);
    console.log("==============================");
    console.log("");

});
