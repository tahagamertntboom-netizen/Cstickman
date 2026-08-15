const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

const rooms = {};

function createCode() {

    let code;

    do {
        code = String(
            Math.floor(
                100000 +
                Math.random() * 900000
            )
        );
    }

    while (rooms[code]);

    return code;
}


function playersInRoom(code) {

    if (!rooms[code]) {
        return [];
    }

    return Object.values(
        rooms[code]
    );

}


io.on("connection", socket => {

    console.log(
        "Connected:",
        socket.id
    );


    // =========================
    // ساخت اتاق
    // =========================

    socket.on(
        "createRoom",
        name => {

            name =
                String(name || "").trim();

            if (!name) {

                socket.emit(
                    "roomError",
                    "اسم وارد نشده!"
                );

                return;
            }


            const code =
                createCode();


            rooms[code] = {};


            rooms[code][socket.id] = {

                id: socket.id,

                name: name,

                admin:
                    name.toLowerCase()
                    === "tahagamertnt"

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


            io.to(code).emit(
                "roomPlayers",
                playersInRoom(code)
            );


            console.log(
                "ROOM:",
                code
            );

        }
    );


    // =========================
    // ورود به اتاق
    // =========================

    socket.on(
        "joinRoom",
        data => {

            const name =
                String(
                    data?.playerName || ""
                ).trim();

            const code =
                String(
                    data?.roomCode || ""
                ).trim();


            if (!name) {

                socket.emit(
                    "roomError",
                    "اسم وارد نشده!"
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


            rooms[code][socket.id] = {

                id: socket.id,

                name: name,

                admin:
                    name.toLowerCase()
                    === "tahagamertnt"

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


            io.to(code).emit(
                "roomPlayers",
                playersInRoom(code)
            );

        }
    );


    // =========================
    // خروج
    // =========================

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


            delete rooms[code][
                socket.id
            ];


            io.to(code).emit(
                "roomPlayers",
                playersInRoom(code)
            );


            if (
                Object.keys(
                    rooms[code]
                ).length === 0
            ) {

                delete rooms[code];

            }

        }
    );

});


app.get(
    "/",
    (req, res) => {

        res.sendFile(
            __dirname +
            "/index.html"
        );

    }
);


server.listen(
    PORT,
    () => {

        console.log(
            "================================"
        );

        console.log(
            "STICKMAN SERVER READY"
        );

        console.log(
            "http://localhost:" +
            PORT
        );

        console.log(
            "================================"
        );

    }
);
