console.log("LOBBY JS LOADED");

const socket = io();

console.log("SOCKET CREATED");


const nameInput = document.getElementById("name");
const roomInput = document.getElementById("roomInput");

const createButton = document.getElementById("createButton");
const joinButton = document.getElementById("joinButton");
const startButton = document.getElementById("startButton");

const menu = document.getElementById("menu");
const room = document.getElementById("room");

const roomCode = document.getElementById("roomCode");
const playersList = document.getElementById("playersList");
const errorBox = document.getElementById("error");


function getName(){

    const name = nameInput.value.trim();

    if(!name){

        errorBox.textContent =
            "اول اسم را بنویس!";

        return null;
    }

    localStorage.setItem(
        "player",
        name
    );

    return name;
}


createButton.addEventListener(
    "click",
    function(){

        console.log(
            "CREATE CLICKED"
        );

        const name = getName();

        if(!name) return;

        socket.emit(
            "createRoom",
            name
        );

    }
);


joinButton.addEventListener(
    "click",
    function(){

        console.log(
            "JOIN CLICKED"
        );

        const name = getName();

        if(!name) return;

        const code =
            roomInput.value.trim();

        if(!/^\d{6}$/.test(code)){

            errorBox.textContent =
                "کد باید ۶ رقمی باشد!";

            return;
        }

        socket.emit(
            "joinRoom",
            {
                roomCode: code,
                playerName: name
            }
        );

    }
);


socket.on(
    "connect",
    function(){

        console.log(
            "SOCKET CONNECTED:",
            socket.id
        );

    }
);


socket.on(
    "connect_error",
    function(error){

        console.error(
            "SOCKET ERROR:",
            error
        );

        errorBox.textContent =
            "اتصال به سرور برقرار نشد!";

    }
);


socket.on(
    "roomCreated",
    function(code){

        console.log(
            "ROOM CREATED:",
            code
        );

        localStorage.setItem(
            "player",
            nameInput.value.trim()
        );

        localStorage.setItem(
            "room",
            code
        );

        menu.style.display =
            "none";

        room.style.display =
            "block";

        roomCode.textContent =
            code;

    }
);


socket.on(
    "joinedRoom",
    function(code){

        console.log(
            "JOINED ROOM:",
            code
        );

        localStorage.setItem(
            "player",
            nameInput.value.trim()
        );

        localStorage.setItem(
            "room",
            code
        );

        menu.style.display =
            "none";

        room.style.display =
            "block";

        roomCode.textContent =
            code;

    }
);


socket.on(
    "roomPlayers",
    function(players){

        console.log(
            "PLAYERS:",
            players
        );

        playersList.innerHTML = "";

        players.forEach(
            function(player){

                const div =
                    document.createElement(
                        "div"
                    );

                div.className =
                    "player";

                div.textContent =
                    "👤 " +
                    player.name;

                playersList.appendChild(
                    div
                );

            }
        );

    }
);


socket.on(
    "roomError",
    function(message){

        console.log(
            "ROOM ERROR:",
            message
        );

        errorBox.textContent =
            message;

    }
);


startButton.addEventListener(
    "click",
    function(){

        const name =
            nameInput.value.trim();

        localStorage.setItem(
            "player",
            name
        );

        window.location.href =
            "/game.html";

    }
);
