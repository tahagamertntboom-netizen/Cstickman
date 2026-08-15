const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));


// ==========================
// اتاق‌ها
// ==========================

const rooms = {};


// ساخت کد اتاق
function makeRoomCode(){

    let code;

    do{

        code = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

    }while(rooms[code]);

    return code;
}


// ==========================
// Socket
// ==========================

io.on("connection",(socket)=>{

    console.log("Player connected:",socket.id);


    // --------------------------
    // ساخت اتاق
    // --------------------------

    socket.on("createRoom",(playerName)=>{

        const roomCode = makeRoomCode();

        rooms[roomCode] = {

            players: {

                [socket.id]: {

                    id: socket.id,
                    name: playerName

                }

            }

        };


        socket.join(roomCode);

        socket.roomCode = roomCode;
        socket.playerName = playerName;


        socket.emit(
            "roomCreated",
            roomCode
        );


        io.to(roomCode).emit(
            "roomPlayers",
            Object.values(
                rooms[roomCode].players
            )
        );

    });


    // --------------------------
    // ورود به اتاق
    // --------------------------

    socket.on(
        "joinRoom",
        ({roomCode,playerName})=>{

            roomCode =
                String(roomCode).trim();


            if(!rooms[roomCode]){

                socket.emit(
                    "roomError",
                    "این اتاق وجود ندارد!"
                );

                return;

            }


            rooms[roomCode].players[
                socket.id
            ] = {

                id: socket.id,
                name: playerName

            };


            socket.join(roomCode);

            socket.roomCode =
                roomCode;

            socket.playerName =
                playerName;


            socket.emit(
                "joinedRoom",
                roomCode
            );


            io.to(roomCode).emit(
                "roomPlayers",
                Object.values(
                    rooms[roomCode].players
                )
            );

        }
    );


    // --------------------------
    // خروج بازیکن
    // --------------------------

    socket.on("disconnect",()=>{

        const roomCode =
            socket.roomCode;


        if(
            roomCode &&
            rooms[roomCode]
        ){

            delete rooms[
                roomCode
            ].players[
                socket.id
            ];


            io.to(roomCode).emit(
                "roomPlayers",
                Object.values(
                    rooms[roomCode].players
                )
            );


            // اگر اتاق خالی شد
            if(
                Object.keys(
                    rooms[roomCode].players
                ).length === 0
            ){

                delete rooms[roomCode];

            }

        }


        console.log(
            "Player disconnected:",
            socket.id
        );

    });

});


app.get("/",(req,res)=>{

    res.sendFile(
        path.join(
            __dirname,
            "lobby.html"
        )
    );

});


server.listen(
    PORT,
    ()=>{
        console.log(
            `Server running on port ${PORT}`
        );
    }
);
