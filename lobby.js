const socket = io();

const namePage = document.getElementById("namePage");
const lobbyPage = document.getElementById("lobbyPage");
const roomPage = document.getElementById("roomPage");

const playerName = document.getElementById("playerName");
const showName = document.getElementById("showName");

const confirmName = document.getElementById("confirmName");
const createRoom = document.getElementById("createRoom");
const joinRoom = document.getElementById("joinRoom");
const startGame = document.getElementById("startGame");

const roomInput = document.getElementById("roomInput");
const roomCode = document.getElementById("roomCode");
const players = document.getElementById("players");
const error = document.getElementById("error");


let myName = "";
let currentRoom = "";


/* =========================
   تأیید اسم
========================= */

confirmName.onclick = function(){

    const name =
        playerName.value.trim();

    if(!name){

        error.textContent =
            "اول اسمت را بنویس!";

        return;
    }

    myName = name;

    localStorage.setItem(
        "player",
        myName
    );

    showName.textContent =
        myName;

    error.textContent = "";

    namePage.style.display =
        "none";

    lobbyPage.style.display =
        "block";
};


/* =========================
   ساخت اتاق
========================= */

createRoom.onclick = function(){

    if(!myName){

        error.textContent =
            "اول اسم را تأیید کن!";

        return;
    }

    socket.emit(
        "createRoom",
        myName
    );
};


/* =========================
   اتاق ساخته شد
========================= */

socket.on(
    "roomCreated",
    function(code){

        currentRoom =
            String(code);

        roomCode.textContent =
            currentRoom;

        localStorage.setItem(
            "room",
            currentRoom
        );

        lobbyPage.style.display =
            "none";

        roomPage.style.display =
            "block";
    }
);


/* =========================
   ورود به اتاق
========================= */

joinRoom.onclick = function(){

    const code =
        roomInput.value.trim();

    if(!/^\d{6}$/.test(code)){

        error.textContent =
            "کد اتاق باید ۶ رقمی باشد!";

        return;
    }

    socket.emit(
        "joinRoom",
        {
            roomCode: code,
            playerName: myName
        }
    );
};


/* =========================
   وارد اتاق شد
========================= */

socket.on(
    "joinedRoom",
    function(code){

        currentRoom =
            String(code);

        roomCode.textContent =
            currentRoom;

        localStorage.setItem(
            "room",
            currentRoom
        );

        lobbyPage.style.display =
            "none";

        roomPage.style.display =
            "block";
    }
);


/* =========================
   بازیکنان
========================= */

socket.on(
    "roomPlayers",
    function(list){

        players.innerHTML = "";

        list.forEach(
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

                players.appendChild(
                    div
                );
            }
        );
    }
);


/* =========================
   خطا
========================= */

socket.on(
    "roomError",
    function(message){

        error.textContent =
            message;
    }
);


/* =========================
   اتصال
========================= */

socket.on(
    "connect_error",
    function(){

        error.textContent =
            "سرور وصل نیست!";

    }
);


/* =========================
   ورود به بازی
========================= */

startGame.onclick = function(){

    localStorage.setItem(
        "player",
        myName
    );

    localStorage.setItem(
        "room",
        currentRoom
    );

    window.location.href =
        "./game.html";
};
