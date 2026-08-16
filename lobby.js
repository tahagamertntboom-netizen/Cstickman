const socket = io();

let playerName = "";


// =====================================
// عناصر صفحه
// =====================================

const nameInput =
    document.getElementById("nameInput");

const confirmButton =
    document.getElementById("confirm");

const errorBox =
    document.getElementById("error");


// =====================================
// نمایش خطا
// =====================================

function showError(message) {

    errorBox.textContent =
        message || "";

}


// =====================================
// تأیید اسم
// =====================================

confirmButton.addEventListener(
    "click",
    () => {

        const name =
            String(
                nameInput.value || ""
            ).trim();


        if (!name) {

            showError(
                "⚠️ اول اسمت را وارد کن!"
            );

            return;
        }


        if (name.length < 2) {

            showError(
                "⚠️ اسم باید حداقل ۲ حرف باشد."
            );

            return;
        }


        playerName =
            name;


        // ذخیره اسم
        localStorage.setItem(
            "player",
            playerName
        );


        // رفتن به صفحه انتخاب اتاق
        showLobby();

    }
);


// =====================================
// Enter
// =====================================

nameInput.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Enter"
        ) {

            confirmButton.click();

        }

    }
);


// =====================================
// ساخت صفحه لابی
// =====================================

function showLobby() {

    document.body.innerHTML = `

        <div class="box">

            <h1>🎮 STICKMAN</h1>

            <p>
                سلام ${escapeHtml(playerName)} 👋
            </p>

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

            <div
                style="
                    margin:20px 0;
                    color:#94a3b8;
                "
            >
                یا
            </div>

            <input
                id="roomCode"
                maxlength="6"
                inputmode="numeric"
                placeholder="کد ۶ رقمی اتاق"
                autocomplete="off"
            >

            <button
                id="joinRoom"
                type="button"
                style="
                    background:#3b82f6;
                    color:white;
                "
            >
                🚪 رفتن به اتاق
            </button>

            <div
                id="lobbyError"
                style="
                    color:#f87171;
                    min-height:25px;
                    margin-top:12px;
                "
            ></div>

        </div>
    `;


    document.body.style.cssText = `
        margin:0;
        min-height:100vh;
        display:flex;
        justify-content:center;
        align-items:center;
        font-family:Arial;
        color:white;
        background:
        linear-gradient(
            135deg,
            #020617,
            #172554,
            #312e81
        );
    `;


    const box =
        document.querySelector(".box");


    if (box) {

        box.style.cssText = `
            width:92%;
            max-width:430px;
            padding:30px;
            background:#111827;
            border-radius:25px;
            text-align:center;
            box-shadow:0 20px 70px #000b;
        `;

    }


    document
        .querySelectorAll("button")
        .forEach(
            button => {

                button.style.cssText += `
                    width:100%;
                    padding:16px;
                    border:none;
                    border-radius:12px;
                    margin-top:12px;
                    font-size:18px;
                    font-weight:bold;
                    cursor:pointer;
                `;

            }
        );


    const codeInput =
        document.getElementById(
            "roomCode"
        );


    const createButton =
        document.getElementById(
            "createRoom"
        );


    const joinButton =
        document.getElementById(
            "joinRoom"
        );


    const lobbyError =
        document.getElementById(
            "lobbyError"
        );


    // =================================
    // ساخت اتاق
    // =================================

    createButton.addEventListener(
        "click",
        () => {

            lobbyError.textContent =
                "⏳ در حال ساخت اتاق...";


            socket.emit(
                "createRoom",
                playerName
            );

        }
    );


    // =================================
    // ورود به اتاق
    // =================================

    joinButton.addEventListener(
        "click",
        () => {

            const roomCode =
                String(
                    codeInput.value || ""
                ).trim();


            if (
                !/^\d{6}$/.test(
                    roomCode
                )
            ) {

                lobbyError.textContent =
                    "⚠️ کد اتاق باید ۶ رقمی باشد.";

                return;
            }


            lobbyError.textContent =
                "⏳ در حال ورود به اتاق...";


            socket.emit(
                "joinRoom",
                {
                    roomCode:
                        roomCode,

                    playerName:
                        playerName
                }
            );

        }
    );


    // =================================
    // Enter داخل کد
    // =================================

    codeInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter"
            ) {

                joinButton.click();

            }

        }
    );

}


// =====================================
// اتاق ساخته شد
// =====================================

socket.on(
    "roomCreated",
    (roomCode) => {

        console.log(
            "ROOM CREATED:",
            roomCode
        );


        showRoomCreated(
            roomCode
        );

    }
);


// =====================================
// وارد اتاق شدیم
// =====================================

socket.on(
    "joinedRoom",
    (roomCode) => {

        console.log(
            "JOINED ROOM:",
            roomCode
        );


        localStorage.setItem(
            "roomCode",
            roomCode
        );


        localStorage.setItem(
            "player",
            playerName
        );


        // ورود به بازی
        window.location.href =
            "/game.html";

    }
);


// =====================================
// خطای سرور
// =====================================

socket.on(
    "errorMessage",
    (message) => {

        const box =
            document.getElementById(
                "lobbyError"
            ) ||
            document.getElementById(
                "error"
            );


        if (box) {

            box.textContent =
                "❌ " + message;

        }

    }
);


// =====================================
// نمایش کد اتاق ساخته شده
// =====================================

function showRoomCreated(
    roomCode
) {

    document.body.innerHTML = `

        <div class="box">

            <h1>🏠 اتاق ساخته شد</h1>

            <p>
                این کد را به دوستت بده:
            </p>

            <div
                style="
                    font-size:42px;
                    font-weight:bold;
                    letter-spacing:8px;
                    padding:20px;
                    margin:20px 0;
                    background:#020617;
                    border-radius:18px;
                    direction:ltr;
                "
            >
                ${roomCode}
            </div>

            <p
                style="
                    color:#94a3b8;
                "
            >
                دوستت باید همین کد را در
                «رفتن به اتاق» وارد کند.
            </p>

            <button
                id="copyCode"
                type="button"
                style="
                    background:#8b5cf6;
                    color:white;
                    width:100%;
                    padding:16px;
                    border:0;
                    border-radius:12px;
                    margin-top:12px;
                    font-size:18px;
                    font-weight:bold;
                    cursor:pointer;
                "
            >
                📋 کپی کد
            </button>

            <button
                id="enterGame"
                type="button"
                style="
                    background:#22c55e;
                    color:white;
                    width:100%;
                    padding:16px;
                    border:0;
                    border-radius:12px;
                    margin-top:12px;
                    font-size:18px;
                    font-weight:bold;
                    cursor:pointer;
                "
            >
                🎮 ورود به بازی
            </button>

            <div
                id="roomStatus"
                style="
                    margin-top:15px;
                    color:#94a3b8;
                "
            >
                منتظر بازیکن‌ها...
            </div>

        </div>
    `;


    document.body.style.cssText = `
        margin:0;
        min-height:100vh;
        display:flex;
        justify-content:center;
        align-items:center;
        font-family:Arial;
        color:white;
        background:
        linear-gradient(
            135deg,
            #020617,
            #172554,
            #312e81
        );
    `;


    const box =
        document.querySelector(".box");


    if (box) {

        box.style.cssText = `
            width:92%;
            max-width:430px;
            padding:30px;
            background:#111827;
            border-radius:25px;
            text-align:center;
            box-shadow:0 20px 70px #000b;
        `;

    }


    // -----------------------------
    // کپی
    // -----------------------------

    document
        .getElementById("copyCode")
        .addEventListener(
            "click",
            async () => {

                try {

                    await navigator
                        .clipboard
                        .writeText(
                            roomCode
                        );


                    document
                        .getElementById(
                            "roomStatus"
                        )
                        .textContent =
                        "✅ کد کپی شد!";

                }
                catch {

                    document
                        .getElementById(
                            "roomStatus"
                        )
                        .textContent =
                        "کد: " + roomCode;

                }

            }
        );


    // -----------------------------
    // ورود به بازی
    // -----------------------------

    document
        .getElementById("enterGame")
        .addEventListener(
            "click",
            () => {

                localStorage.setItem(
                    "roomCode",
                    roomCode
                );

                localStorage.setItem(
                    "player",
                    playerName
                );


                window.location.href =
                    "/game.html";

            }
        );

}


// =====================================
// HTML امن
// =====================================

function escapeHtml(text) {

    return String(text)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}
