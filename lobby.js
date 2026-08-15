const socket = io();

const nameInput =
    document.getElementById("name");

const createButton =
    document.getElementById("createButton");

const startButton =
    document.getElementById("startButton");

const menu =
    document.getElementById("menu");

const room =
    document.getElementById("room");

const roomCode =
    document.getElementById("roomCode");

const errorBox =
    document.getElementById("error");


/* ساخت اتاق */

createButton.onclick = function(){

    const name =
        nameInput.value.trim();


    if(!name){

        errorBox.textContent =
            "اول اسمت را بنویس!";

        return;
    }


    errorBox.textContent = "";


    socket.emit(
        "createRoom",
        name
    );

};


/* اتاق ساخته شد */

socket.on(
    "roomCreated",
    function(code){

        const name =
            nameInput.value.trim();


        localStorage.setItem(
            "player",
            name
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


/* خطا */

socket.on(
    "roomError",
    function(message){

        errorBox.textContent =
            message;

    }
);


/* ورود به بازی */

startButton.onclick = function(){

    const name =
        nameInput.value.trim();


    localStorage.setItem(
        "player",
        name
    );


    window.location.href =
        "/game.html";

};
