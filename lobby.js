const socket = io();

let playerName = "";
let roomCode = null;
let myPlayer = null;

const nameSection =
    document.getElementById(
        "nameSection"
    );

const lobbySection =
    document.getElementById(
        "lobbySection"
    );

const nameInput =
    document.getElementById(
        "nameInput"
    );

const confirmButton =
    document.getElementById(
        "confirm"
    );

const createRoomButton =
    document.getElementById(
        "createRoom"
    );

const joinRoomButton =
    document.getElementById(
        "joinRoom"
    );

const roomCodeInput =
    document.getElementById(
        "roomCode"
    );

const roomCodeDisplay =
    document.getElementById(
        "roomCodeDisplay"
    );

const welcomeText =
    document.getElementById(
        "welcomeText"
    );

const errorBox =
    document.getElementById(
        "error"
    );

const backButton =
    document.getElementById(
        "backButton"
    );


// ======================================
// تأیید اسم
// ======================================

confirmButton.addEventListener(
    "click",
    () => {

        const name =
            nameInput.value.trim();

        if (!name) {

            showError(
                "لطفاً اسمت را وارد کن."
            );

            return;
        }

        playerName =
            name.substring(
                0,
                20
            );

        welcomeText.textContent =
            "سلام " +
            playerName +
            " 👋";

        nameSection.style.display =
            "none";

        lobbySection.style.display =
            "block";

        clearError();
    }
);


// ======================================
// ساخت اتاق
// ======================================

createRoomButton.addEventListener(
    "click",
    () => {

        clearError();

        createRoomButton.disabled =
            true;

        createRoomButton.textContent =
            "⏳ در حال ساخت اتاق...";

        socket.emit(
            "createRoom",
            {
                name: playerName,
                color: "#ffffff"
            }
        );
    }
);


// ======================================
// اتاق ساخته شد
// ======================================

socket.on(
    "roomCreated",
    (data) => {

        console.log(
            "SERVER ROOM DATA:",
            data
        );

        /*
        فقط خود roomCode را می‌گیریم.
        */

        if (
            !data ||
            typeof data.roomCode ===
                "undefined"
        ) {

            showError(
                "سرور کد اتاق ارسال نکرد."
            );

            resetCreateButton();

            return;
        }

        /*
        تبدیل به رشته و حذف
        هر چیزی غیر از عدد
        */

        const code =
            String(
                data.roomCode
            ).replace(
                /\D/g,
                ""
            );

        if (
            code.length !== 6
        ) {

            showError(
                "کد دریافتی معتبر نیست."
            );

            resetCreateButton();

            return;
        }

        roomCode = code;

        myPlayer =
            data.player || null;

        /*
        اینجا فقط خود عدد
        نمایش داده می‌شود.
        */

        roomCodeDisplay.textContent =
            code;

        roomCodeInput.value =
            code;

        createRoomButton.textContent =
            "✅ اتاق ساخته شد";

        createRoomButton.disabled =
            false;

        clearError();

        console.log(
            "ROOM CODE:",
            code
        );
    }
);


// ======================================
// ورود به اتاق
// ======================================

joinRoomButton.addEventListener(
    "click",
    () => {

        clearError();

        let code =
            roomCodeInput.value;

        /*
        فقط عدد
        */

        code = String(
            code
        ).replace(
            /\D/g,
            ""
        );

        roomCodeInput.value =
            code;

        if (
            code.length !== 6
        ) {

            showError(
                "کد اتاق باید دقیقاً ۶ رقم باشد."
            );

            return;
        }

        joinRoomButton.disabled =
            true;

        joinRoomButton.textContent =
            "⏳ در حال ورود...";

        socket.emit(
            "joinRoom",
            {
                roomCode: code,
                name: playerName,
                color: "#ffffff"
            }
        );
    }
);


// ======================================
// ورود موفق
// ======================================

socket.on(
    "roomJoined",
    (data) => {

        console.log(
            "JOIN RESULT:",
            data
        );

        if (
            !data ||
            typeof data.roomCode ===
                "undefined"
        ) {

            showError(
                "سرور کد اتاق ارسال نکرد."
            );

            resetJoinButton();

            return;
        }

        const code =
            String(
                data.roomCode
            ).replace(
                /\D/g,
                ""
            );

        roomCode =
            code;

        myPlayer =
            data.player || null;

        roomCodeDisplay.textContent =
            code;

        roomCodeInput.value =
            code;

        joinRoomButton.textContent =
            "✅ وارد اتاق شدی";

        joinRoomButton.disabled =
            false;

        clearError();

        console.log(
            "JOINED ROOM:",
            code
        );
    }
);


// ======================================
// خطای اتاق
// ======================================

socket.on(
    "roomError",
    (message) => {

        console.log(
            "ROOM ERROR:",
            message
        );

        let text =
            message;

        /*
        اگر سرور اشتباهی آبجکت
        فرستاد، [object Object]
        نمایش نده.
        */

        if (
            typeof message ===
            "object"
        ) {

            text =
                message.message ||
                "خطا در اتاق";
        }

        showError(
            String(text)
        );

        resetCreateButton();
        resetJoinButton();
    }
);


// ======================================
// خطای اتصال
// ======================================

socket.on(
    "connect_error",
    () => {

        showError(
            "اتصال به سرور برقرار نشد."
        );

        resetCreateButton();
        resetJoinButton();
    }
);


// ======================================
// تغییر اسم
// ======================================

backButton.addEventListener(
    "click",
    () => {

        lobbySection.style.display =
            "none";

        nameSection.style.display =
            "block";

        nameInput.focus();
    }
);


// ======================================
// فقط عدد برای کد اتاق
// ======================================

roomCodeInput.addEventListener(
    "input",
    () => {

        roomCodeInput.value =
            roomCodeInput.value
                .replace(
                    /\D/g,
                    ""
                )
                .substring(
                    0,
                    6
                );
    }
);


// ======================================
// توابع
// ======================================

function showError(message) {

    errorBox.textContent =
        message;
}

function clearError() {

    errorBox.textContent =
        "";
}

function resetCreateButton() {

    createRoomButton.disabled =
        false;

    createRoomButton.textContent =
        "🏠 ساخت اتاق";
}

function resetJoinButton() {

    joinRoomButton.disabled =
        false;

    joinRoomButton.textContent =
        "🚪 ورود به اتاق";
}
