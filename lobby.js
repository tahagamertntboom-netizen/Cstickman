const socket = io();


/* =========================
   متغیرها
========================= */

let myName = "";

let currentRoom = "";


/* =========================
   عناصر صفحه
========================= */

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


/* =========================
   گرفتن اسم
========================= */

function getPlayerName(){

    const name =
        nameInput.value.trim();


    if(!name){

        showError(
            "اول اسم خودت را بنویس!"
        );

        return null;

    }


    myName = name;


    /*
       اسم واقعی بازیکن
       ذخیره می‌شود
    */

    localStorage.setItem(
        "player",
        myName
    );


    return myName;

}


/* =========================
   ساخت اتاق
========================= */

createButton.onclick =
function(){

    const name =
        getPlayerName();


    if(!name){
        return;
    }


    socket.emit(
        "createRoom",
        name
    );

};


/* =========================
   ورود به اتاق
========================= */

joinButton.onclick =
function(){

    const name =
        getPlayerName();


    if(!name){
        return;
    }


    const code =
        roomInput.value.trim();


    if(code.length !== 6){

        showError(
            "کد اتاق باید ۶ رقمی باشد!"
        );

        return;

    }


    socket.emit(
        "joinRoom",
        {

            roomCode: code,

            playerName: name

        }
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


        openRoom();

    }
);


/* =========================
   وارد اتاق شد
========================= */

socket.on(
    "joinedRoom",
    function(code){

        currentRoom =
            String(code);


        openRoom();

    }
);


/* =========================
   نمایش لابی
========================= */

function openRoom(){

    menu.style.display =
        "none";


    room.style.display =
        "block";


    roomCode.textContent =
        currentRoom;


    /*
       اسم را دوباره ذخیره می‌کنیم
       تا game.js همان اسم را بگیرد
    */

    localStorage.setItem(
        "player",
        myName
    );

}


/* =========================
   بازیکنان اتاق
========================= */

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


/* =========================
   خطای اتاق
========================= */

socket.on(
    "roomError",
    function(message){

        showError(
            message
        );

    }
);


/* =========================
   نمایش خطا
========================= */

function showError(message){

    errorBox.textContent =
        message;

}


/* =========================
   ورود به بازی
========================= */

startButton.onclick =
function(){

    /*
       خیلی مهم:
       قبل از ورود اسم فعلی
       را دوباره ذخیره می‌کنیم.
    */

    localStorage.setItem(
        "player",
        myName
    );


    /*
       اتاق هم ذخیره می‌شود
    */

    localStorage.setItem(
        "room",
        currentRoom
    );


    /*
       حالا وارد بازی می‌شویم
    */

    window.location.href =
        "/game.html";

};


/* =========================
   Enter برای اسم
========================= */

nameInput.addEventListener(
    "keydown",
    function(e){

        if(e.key === "Enter"){

            createButton.click();

        }

    }
);


/* =========================
   Enter برای کد اتاق
========================= */

roomInput.addEventListener(
    "keydown",
    function(e){

        if(e.key === "Enter"){

            joinButton.click();

        }

    }
);
