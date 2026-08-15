const socket = io();

let playerName = "";
let roomCode = "";

const namePage = document.getElementById("namePage");
const lobbyPage = document.getElementById("lobbyPage");

const nameInput = document.getElementById("nameInput");
const showName = document.getElementById("showName");

const error = document.getElementById("error");

const room = document.getElementById("room");
const roomCodeText = document.getElementById("roomCode");

const playerList = document.getElementById("playerList");

const enterButton = document.getElementById("enter");


// ==========================
// تأیید اسم
// ==========================

document.getElementById("confirm").onclick = function () {

    const name = nameInput.value.trim();

    if (!name) {

        error.textContent =
            "❌ اول اسمت را وارد کن!";

        return;
    }

    playerName = name;

    localStorage.setItem(
        "player",
        playerName
    );

    showName.textContent =
        playerName;

    namePage.style.display =
        "none";

    lobbyPage.style.display =
        "block";

    error.textContent = "";
};


// ==========================
// ساخت اتاق
// ==========================

document.getElementById("create").onclick = function () {

    if (!playerName) {
        alert("اول اسمت را تأیید کن!");
        return;
    }

    socket.emit(
        "createRoom",
        playerName
    );
};


// ==========================
// ورود به اتاق
// ==========================

document.getElementById("join").onclick = function () {

    const code =
        document.getElementById("codeInput")
        .value
        .trim();

    if (!/^\d{6}$/.test(code)) {

        alert(
            "❌ کد باید دقیقاً ۶ رقمی باشد!"
        );

        return;
    }

    socket.emit(
        "joinRoom",
        {
            roomCode: code,
            playerName: playerName
        }
    );
};


// ==========================
// اتاق ساخته شد
// ==========================

socket.on(
    "roomCreated",
    function (code) {

        openRoom(code);

    }
);


// ==========================
// وارد اتاق شد
// ==========================

socket.on(
    "joinedRoom",
    function (code) {

        openRoom(code);

    }
);


// ==========================
// نمایش اتاق
// ==========================

function openRoom(code) {

    roomCode =
        String(code);

    localStorage.setItem(
        "room",
        roomCode
    );

    localStorage.setItem(
        "player",
        playerName
    );

    room.style.display =
        "block";

    roomCodeText.textContent =
        roomCode;

}


// ==========================
// بازیکنان اتاق
// ==========================

socket.on(
    "roomPlayers",
    function (players) {

        playerList.innerHTML = "";

        players.forEach(
            function (player) {

                const div =
                    document.createElement(
                        "div"
                    );

                div.className =
                    "player";

                div.textContent =
                    "👤 " +
                    player.name;

                if (player.admin) {

                    div.textContent +=
                        " 👑";

                }

                playerList.appendChild(
                    div
                );

            }
        );

        enterButton.style.display =
            "block";

    }
);


// ==========================
// خطای سرور
// ==========================

socket.on(
    "roomError",
    function (message) {

        alert(message);

    }
);


// ==========================
// ورود به بازی
// ==========================

enterButton.onclick = function () {

    if (!roomCode) {

        alert(
            "❌ هنوز وارد اتاق نشده‌ای!"
        );

        return;
    }

    localStorage.setItem(
        "player",
        playerName
    );

    localStorage.setItem(
        "room",
        roomCode
    );

    window.location.href =
        "/game.html";

};
