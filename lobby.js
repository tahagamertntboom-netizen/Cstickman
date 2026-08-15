const socket = io();

let playerName = "";
let roomCode = "";

const box = document.querySelector(".box");

const nameInput =
    document.getElementById("nameInput");

const confirmButton =
    document.getElementById("confirm");

const error =
    document.getElementById("error");


// ==========================
// تأیید اسم
// ==========================

confirmButton.onclick = function () {

    const name =
        nameInput.value.trim();

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

    showLobby();
};


// ==========================
// ساخت صفحه اتاق
// ==========================

function showLobby() {

    box.innerHTML = `

        <h1>🏠 لابی</h1>

        <h2>
            سلام ${escapeHtml(playerName)} 👋
        </h2>

        <button
            id="createRoom"
            type="button"
            style="
                background:#22c55e;
                color:white;
            "
        >
            🏠 ساخت اتاق
        </button>

        <hr style="
            margin:25px 0;
            border-color:#334155;
        ">

        <input
            id="roomInput"
            maxlength="6"
            inputmode="numeric"
            placeholder="کد ۶ رقمی اتاق"
            style="
                width:100%;
                padding:16px;
                border:0;
                border-radius:12px;
                font-size:18px;
            "
        >

        <button
            id="joinRoom"
            type="button"
            style="
                background:#6366f1;
                color:white;
            "
        >
            🚪 ورود به اتاق
        </button>

        <div id="lobbyError"
             style="
                color:#f87171;
                margin-top:15px;
             ">
        </div>

        <div
            id="roomPanel"
            style="
                display:none;
                margin-top:25px;
                padding:20px;
                background:#020617;
                border-radius:15px;
            "
        >

            <div>
                کد اتاق شما:
            </div>

            <div
                id="roomCode"
                style="
                    font-size:40px;
                    color:#4ade80;
                    font-weight:bold;
                    letter-spacing:6px;
                    margin:15px 0;
                "
            ></div>

            <button
                id="copyCode"
                type="button"
                style="
                    background:#0ea5e9;
                    color:white;
                "
            >
                📋 کپی کد
            </button>

            <div
                id="players"
                style="margin-top:20px;"
            ></div>

            <button
                id="playButton"
                type="button"
                style="
                    background:#f59e0b;
                    color:white;
                "
            >
                🎮 ورود به بازی
            </button>

        </div>
    `;


    document.getElementById(
        "createRoom"
    ).onclick = function () {

        socket.emit(
            "createRoom",
            playerName
        );

    };


    document.getElementById(
        "joinRoom"
    ).onclick = function () {

        const code =
            document.getElementById(
                "roomInput"
            ).value.trim();

        if (!/^\d{6}$/.test(code)) {

            document.getElementById(
                "lobbyError"
            ).textContent =
                "❌ کد باید ۶ رقمی باشد!";

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


    document.getElementById(
        "copyCode"
    ).onclick = async function () {

        try {

            await navigator.clipboard.writeText(
                roomCode
            );

            this.textContent =
                "✅ کپی شد!";

            setTimeout(() => {

                this.textContent =
                    "📋 کپی کد";

            }, 1500);

        } catch {

            alert(
                "کد را دستی کپی کن: " +
                roomCode
            );

        }

    };


    document.getElementById(
        "playButton"
    ).onclick = function () {

        if (!roomCode) return;

        localStorage.setItem(
            "room",
            roomCode
        );

        localStorage.setItem(
            "player",
            playerName
        );

        window.location.href =
            "/game.html";

    };

}


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

    const panel =
        document.getElementById(
            "roomPanel"
        );

    const codeElement =
        document.getElementById(
            "roomCode"
        );

    if (panel) {

        panel.style.display =
            "block";

    }

    if (codeElement) {

        codeElement.textContent =
            roomCode;

    }

}


// ==========================
// بازیکنان
// ==========================

socket.on(
    "players",
    function (players) {

        const element =
            document.getElementById(
                "players"
            );

        if (!element) return;

        element.innerHTML =
            "<h3>👥 بازیکنان</h3>";

        players.forEach(
            player => {

                const div =
                    document.createElement(
                        "div"
                    );

                div.style.cssText = `
                    background:#1e293b;
                    padding:10px;
                    margin:6px 0;
                    border-radius:10px;
                `;

                div.textContent =
                    "👤 " +
                    player.name;

                if (player.admin) {

                    div.textContent +=
                        " 👑 ادمین";

                }

                element.appendChild(div);

            }
        );

    }
);


// ==========================
// خطا
// ==========================

socket.on(
    "errorMessage",
    function (message) {

        const element =
            document.getElementById(
                "lobbyError"
            );

        if (element) {

            element.textContent =
                "❌ " + message;

        } else {

            error.textContent =
                message;

        }

    }
);


// ==========================
// جلوگیری از HTML در اسم
// ==========================

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;
}
