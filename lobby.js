const socket = io();


let myName = "";

let currentRoom = "";


const nameInput =
    document.getElementById("name");

const roomInput =
    document.getElementById("roomInput");

const createButton =
    document.getElementById("createButton");

const joinButton =
    document.getElementById("joinButton");

const startButton =
    document.getElementById("startButton");

const menu =
    document.getElementById("menu");

const room =
    document.getElementById("room");

const roomCode =
    document.getElementById("roomCode");

const playersList =
    document.getElementById("playersList");

const errorBox =
    document.getElementById("error");


// =========================
// اسم
// =========================

function getName(){

    const name =
        nameInput.value.trim();


    if(!name){

        errorBox.textContent =
            "اول اسمت را وارد کن!";

        return null;
    }


    myName = name;


    localStorage.setItem(
        "player",
        myName
    );


    return myName;
}


// =========================
// ساخت اتاق
// =========================

createButton.onclick = function(){

    const name =
        getName();


    if(!name){
        return;
    }


    errorBox.textContent = "";


    socket.emit(
        "createRoom",
        name
    );

};


// =========================
// ورود به اتاق
// =========================

joinButton.onclick = function(){

    const name =
        getName();


    if(!name){
        return;
    }


    const code =
        roomInput.value.trim();


    if(!/^\d{6}$/.test(code)){

        errorBox.textContent =
            "کد باید دقیقاً ۶ رقمی باشد!";

        return;
    }


    errorBox.textContent = "";


    socket.emit(
        "joinRoom",
        {

            roomCode: code,

            playerName: name

        }
    );

};


// =========================
// اتاق ساخته شد
// =========================

socket.on(
    "roomCreated",
    function(code){

        currentRoom =
            String(code);


        localStorage.setItem(
            "room",
            currentRoom
        );


        openRoom();

    }
);


// =========================
// وارد اتاق شد
// =========================

socket.on(
    "joinedRoom",
    function(code){

        currentRoom =
            String(code);


        localStorage.setItem(
            "room",
            currentRoom
        );


        openRoom();

    }
);


// =========================
// بازیکنان
// =========================

socket.on(
    "roomPlayers",
    function(players){

        playersList.innerHTML =
            "";


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


// =========================
// خطا
// =========================

socket.on(
    "roomError",
    function(message){

        errorBox.textContent =
            message;

    }
);


// =========================
// نمایش اتاق
// =========================

function openRoom(){

    menu.style.display =
        "none";


    room.style.display =
        "block";


    roomCode.textContent =
        currentRoom;

}


// =========================
// ورود به بازی
// =========================

startButton.onclick = function(){

    localStorage.setItem(
        "player",
        myName
    );


    localStorage.setItem(
        "room",
        currentRoom
    );


    window.location.href =
        "/game.html";

};
