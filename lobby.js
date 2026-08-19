const socket = io();

// ======================================================
// STATE
// ======================================================

let playerName = "";
let roomCode = "";
let myPlayer = null;
let players = {};

let gameMode = "";
let gameRunning = false;

let velocityY = 0;
let onGround = false;

const SPEED = 5;
const GRAVITY = 0.7;
const JUMP = 13;

// AI
let ai = null;
let aiVelocityY = 0;
let aiOnGround = false;
let aiDirectionTimer = 0;

// ======================================================
// ELEMENTS
// ======================================================

const nameScreen = document.getElementById("nameScreen");
const modeScreen = document.getElementById("modeScreen");
const offlineScreen = document.getElementById("offlineScreen");
const onlineScreen = document.getElementById("onlineScreen");
const roomScreen = document.getElementById("roomScreen");
const gameScreen = document.getElementById("gameScreen");

const nameInput = document.getElementById("nameInput");
const confirmName = document.getElementById("confirmName");

const onlineCard = document.getElementById("onlineCard");
const offlineCard = document.getElementById("offlineCard");

const aiCard = document.getElementById("aiCard");
const soloCard = document.getElementById("soloCard");

const backToModes = document.getElementById("backToModes");

const createRoom = document.getElementById("createRoom");
const showJoin = document.getElementById("showJoin");
const joinBox = document.getElementById("joinBox");
const roomInput = document.getElementById("roomInput");
const joinRoom = document.getElementById("joinRoom");

const readyButton = document.getElementById("readyButton");
const roomCodeElement = document.getElementById("roomCode");
const roomStatus = document.getElementById("roomStatus");

const backFromOnline =
    document.getElementById("backFromOnline");

// ======================================================
// FULLSCREEN
// ======================================================

async function enterGameFullscreen() {

    try {

        if (document.fullscreenElement) {
            return;
        }

        if (document.documentElement.requestFullscreen) {

            await document.documentElement.requestFullscreen({
                navigationUI: "hide"
            });

        }

    } catch (error) {

        console.log(
            "Fullscreen unavailable:",
            error
        );

    }

}

// ======================================================
// NAME
// ======================================================

if (confirmName) {

    confirmName.onclick = function () {

        const name =
            nameInput.value.trim();

        const error =
            document.getElementById(
                "nameError"
            );

        if (!name) {

            if (error) {
                error.textContent =
                    "اول اسمت رو وارد کن.";
            }

            return;
        }

        if (error) {
            error.textContent = "";
        }

        playerName =
            name.substring(0, 20);

        nameScreen.classList.add("hidden");
        modeScreen.classList.remove("hidden");

    };

}

if (nameInput) {

    nameInput.addEventListener(
        "keydown",
        function (e) {

            if (e.key === "Enter") {
                confirmName.click();
            }

        }
    );

}

// ======================================================
// MODE
// ======================================================

if (onlineCard) {

    onlineCard.onclick = function () {

        modeScreen.classList.add("hidden");
        onlineScreen.classList.remove("hidden");

    };

}

if (offlineCard) {

    offlineCard.onclick = function () {

        modeScreen.classList.add("hidden");
        offlineScreen.classList.remove("hidden");

    };

}

if (backToModes) {

    backToModes.onclick = function () {

        offlineScreen.classList.add("hidden");
        modeScreen.classList.remove("hidden");

    };

}

if (backFromOnline) {

    backFromOnline.onclick = function () {

        onlineScreen.classList.add("hidden");
        modeScreen.classList.remove("hidden");

    };

}

// ======================================================
// OFFLINE AI
// ======================================================

if (aiCard) {

    aiCard.onclick = async function () {

        await enterGameFullscreen();

        startOfflineGame(true);

    };

}

// ======================================================
// OFFLINE SOLO
// ======================================================

if (soloCard) {

    soloCard.onclick = async function () {

        await enterGameFullscreen();

        startOfflineGame(false);

    };

}

// ======================================================
// START OFFLINE
// ======================================================

function startOfflineGame(withAI) {

    gameMode =
        withAI
            ? "AI"
            : "SOLO";

    nameScreen.classList.add("hidden");
    modeScreen.classList.add("hidden");
    offlineScreen.classList.add("hidden");
    onlineScreen.classList.add("hidden");
    roomScreen.classList.add("hidden");

    gameScreen.style.display = "block";

    gameRunning = true;

    velocityY = 0;
    onGround = false;

    setupOfflinePlayers(withAI);

    resizeCanvas();

    requestAnimationFrame(gameLoop);

}

// ======================================================
// OFFLINE PLAYERS
// ======================================================

function setupOfflinePlayers(withAI) {

    players = {};

    myPlayer = {

        id: "player",

        name:
            playerName || "Player",

        x: 250,

        y: getGroundY(),

        health: 100,

        level: 1

    };

    players.player = myPlayer;

    onGround = true;

    velocityY = 0;

    if (withAI) {

        ai = {

            id: "ai",

            name: "AI",

            x: 700,

            y: getGroundY(),

            health: 100,

            level: 1

        };

        aiOnGround = true;
        aiVelocityY = 0;

    } else {

        ai = null;

    }

    const modeText =
        document.getElementById(
            "gameMode"
        );

    if (modeText) {

        modeText.textContent =
            withAI
                ? "🤖 بازی با AI"
                : "👤 بازی تنهایی";

    }

}

// ======================================================
// ONLINE
// ======================================================

if (showJoin) {

    showJoin.onclick = function () {

        if (joinBox) {

            joinBox.classList.toggle("hidden");

        }

    };

}

if (roomInput) {

    roomInput.addEventListener(
        "input",
        function () {

            roomInput.value =
                roomInput.value
                    .replace(/\D/g, "")
                    .substring(0, 6);

        }
    );

}

if (createRoom) {

    createRoom.onclick = function () {

        createRoom.disabled = true;

        createRoom.textContent =
            "⏳ در حال ساخت...";

        socket.emit(
            "createRoom",
            {
                name: playerName
            }
        );

    };

}

// ======================================================
// ROOM CREATED
// ======================================================

socket.on(
    "roomCreated",
    function (data) {

        roomCode =
            String(data.roomCode)
                .replace(/\D/g, "");

        myPlayer =
            data.player;

        players = {};

        if (myPlayer) {

            myPlayer.x = Number(myPlayer.x) || 250;

            // مهم:
            // Y واقعی دستگاه خودمان را استفاده می‌کنیم
            myPlayer.y = getGroundY();

            players[myPlayer.id] =
                myPlayer;

        }

        onGround = true;
        velocityY = 0;

        onlineScreen.classList.add("hidden");
        roomScreen.classList.remove("hidden");

        if (roomCodeElement) {
            roomCodeElement.textContent =
                roomCode;
        }

        if (createRoom) {

            createRoom.disabled = false;

            createRoom.textContent =
                "🏠 ساخت اتاق";

        }

    }
);

// ======================================================
// JOIN ROOM
// ======================================================

if (joinRoom) {

    joinRoom.onclick = function () {

        const code =
            roomInput
                ? roomInput.value
                    .replace(/\D/g, "")
                    .substring(0, 6)
                : "";

        if (code.length !== 6) {

            const error =
                document.getElementById(
                    "onlineError"
                );

            if (error) {

                error.textContent =
                    "کد باید ۶ رقمی باشد.";

            }

            return;
        }

        joinRoom.disabled = true;

        joinRoom.textContent =
            "⏳ در حال ورود...";

        socket.emit(
            "joinRoom",
            {
                roomCode: code,
                name: playerName
            }
        );

    };

}

// ======================================================
// ROOM JOINED
// ======================================================

socket.on(
    "roomJoined",
    function (data) {

        roomCode =
            String(data.roomCode)
                .replace(/\D/g, "");

        myPlayer =
            data.player;

        players = {};

        if (myPlayer) {

            myPlayer.x =
                Number(myPlayer.x) || 400;

            myPlayer.y =
                getGroundY();

            players[myPlayer.id] =
                myPlayer;

        }

        onGround = true;
        velocityY = 0;

        onlineScreen.classList.add("hidden");
        roomScreen.classList.remove("hidden");

        if (roomCodeElement) {

            roomCodeElement.textContent =
                roomCode;

        }

        if (joinRoom) {

            joinRoom.disabled = false;

            joinRoom.textContent =
                "🚪 ورود";

        }

    }
);

// ======================================================
// READY ONLINE
// ======================================================

if (readyButton) {

    readyButton.onclick = async function () {

        await enterGameFullscreen();

        readyButton.disabled = true;

        readyButton.textContent =
            "✅ آماده شدی";

        if (roomStatus) {

            roomStatus.textContent =
                "⏳ منتظر بازیکن دیگر...";

        }

        socket.emit("readyForGame");

    };

}

// ======================================================
// READY UPDATE
// ======================================================

socket.on(
    "readyUpdate",
    function (data) {

        if (!roomStatus) return;

        roomStatus.textContent =
            "بازیکنان آماده: " +
            data.ready +
            " / " +
            data.total;

    }
);

// ======================================================
// START ONLINE GAME
// ======================================================

socket.on(
    "startGame",
    async function () {

        await enterGameFullscreen();

        gameMode = "ONLINE";

        if (roomScreen) {
            roomScreen.classList.add("hidden");
        }

        gameScreen.style.display = "block";

        gameRunning = true;

        velocityY = 0;
        onGround = true;

        resizeCanvas();

        // بازیکن خودمان همیشه روی زمین دستگاه خودمان
        if (myPlayer) {
            myPlayer.y = getGroundY();
        }

        requestAnimationFrame(gameLoop);

    }
);

// ======================================================
// CANVAS
// ======================================================

const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas
        ? canvas.getContext("2d")
        : null;

function resizeCanvas() {

    if (!canvas) return;

    canvas.width =
        window.innerWidth;

    canvas.height =
        window.innerHeight;

    // بازیکن خودمان
    if (myPlayer && onGround) {

        myPlayer.y =
            getGroundY();

    }

    // AI
    if (ai && aiOnGround) {

        ai.y =
            getGroundY();

    }

    // بازیکن‌های دیگر:
    // اگر روی زمین بودند، نسبت به زمین دستگاه فعلی
    Object.values(players).forEach(
        function (player) {

            if (
                player &&
                player.id !==
                socket.id &&
                player._grounded !== false
            ) {

                player.y =
                    getGroundY();

            }

        }
    );

}

window.addEventListener(
    "resize",
    resizeCanvas
);

// ======================================================
// GROUND
// ======================================================

function getGroundY() {

    if (!canvas) {
        return 500;
    }

    return canvas.height - 120;

}

// ======================================================
// REMOTE PLAYER Y
// ======================================================
//
// نکته مهم:
// سرور دیگر نباید ارتفاع صفحه موبایل را به PC تحمیل کند.
//
// ما Y را به صورت offset نسبت به زمین می‌فرستیم:
//
// offset = player.y - getGroundY()
//
// بنابراین:
// 0 = روی زمین
// -100 = صد پیکسل بالاتر از زمین
//
// هر دستگاه offset را با زمین خودش جمع می‌کند.
//

function applyRemoteY(player, value) {

    if (!player) return;

    const numeric =
        Number(value);

    if (!Number.isFinite(numeric)) {

        player.y =
            getGroundY();

        player._grounded = true;

        return;

    }

    player.y =
        getGroundY() +
        numeric;

    player._grounded =
        numeric >= -2;

}

// ======================================================
// PLAYER SPAWN
// ======================================================

function fixPlayerSpawn(player) {

    if (!player) return;

    if (
        player.id === socket.id
    ) {

        player.y =
            getGroundY();

        return;

    }

    // بازیکن‌های جدید همیشه
    // روی زمین دستگاه فعلی ظاهر شوند
    player.y =
        getGroundY();

    player._grounded = true;

}

// ======================================================
// ONLINE PLAYERS
// ======================================================

socket.on(
    "playersUpdate",
    function (list) {

        if (!Array.isArray(list)) {
            return;
        }

        const oldPlayers =
            players;

        players = {};

        list.forEach(
            function (player) {

                if (!player) return;

                // ------------------------------
                // خودمان
                // ------------------------------

                if (
                    player.id ===
                    socket.id
                ) {

                    if (!myPlayer) {

                        myPlayer = {
                            ...player
                        };

                    } else {

                        myPlayer.x =
                            Number(player.x) ||
                            myPlayer.x ||
                            250;

                    }

                    // Y خودمان را سرور تعیین نکند
                    myPlayer.y =
                        getGroundY();

                    players[
                        player.id
                    ] =
                        myPlayer;

                    onGround = true;

                    velocityY = 0;

                    return;

                }

                // ------------------------------
                // بازیکن دیگر
                // ------------------------------

                const existing =
                    oldPlayers[
                        player.id
                    ];

                const remote = {

                    ...player,

                    x:
                        Number(player.x) ||
                        250,

                    y:
                        getGroundY(),

                    _grounded: true

                };

                // اگر بازیکن قبلاً وجود داشت
                // مختصات X قبلی حفظ شود
                if (existing) {

                    remote.x =
                        Number(player.x);

                }

                players[
                    player.id
                ] =
                    remote;

            }
        );

    }
);

// ======================================================
// PLAYER MOVED
// ======================================================

socket.on(
    "playerMoved",
    function (player) {

        if (!player) return;

        // اگر پیام مربوط به خودمان است
        if (
            player.id === socket.id
        ) {

            return;

        }

        if (
            !players[player.id]
        ) {

            players[player.id] = {

                ...player,

                x:
                    Number(player.x) ||
                    250,

                y:
                    getGroundY(),

                _grounded: true

            };

        } else {

            players[player.id].x =
                Number(player.x) ||
                players[player.id].x;

        }

        // Y دریافتی offset نسبت به زمین است
        applyRemoteY(
            players[player.id],
            player.y
        );

    }
);

// ======================================================
// PLAYER LEFT
// ======================================================

socket.on(
    "playerLeft",
    function (id) {

        delete players[id];

    }
);

// ======================================================
// ROOM ERROR
// ======================================================

socket.on(
    "roomError",
    function (message) {

        const error =
            document.getElementById(
                "onlineError"
            );

        if (error) {

            if (
                typeof message ===
                "object" &&
                message !== null
            ) {

                error.textContent =
                    message.message ||
                    "خطا";

            } else {

                error.textContent =
                    String(message);

            }

        }

        if (joinRoom) {

            joinRoom.disabled =
                false;

            joinRoom.textContent =
                "🚪 ورود";

        }

        if (createRoom) {

            createRoom.disabled =
                false;

            createRoom.textContent =
                "🏠 ساخت اتاق";

        }

    }
);

// ======================================================
// CONTROLS
// ======================================================

const keys = {};

document.addEventListener(
    "keydown",
    function (e) {

        keys[
            e.key.toLowerCase()
        ] = true;

        if (e.code === "Space") {
            keys.space = true;
        }

    }
);

document.addEventListener(
    "keyup",
    function (e) {

        keys[
            e.key.toLowerCase()
        ] = false;

        if (e.code === "Space") {
            keys.space = false;
        }

    }
);

// ======================================================
// MOBILE BUTTONS
// ======================================================

function setupMobileButton(
    id,
    key
) {

    const button =
        document.getElementById(id);

    if (!button) return;

    button.addEventListener(
        "touchstart",
        function (e) {

            e.preventDefault();

            keys[key] = true;

        },
        {
            passive: false
        }
    );

    button.addEventListener(
        "touchend",
        function (e) {

            e.preventDefault();

            keys[key] = false;

        },
        {
            passive: false
        }
    );

    button.addEventListener(
        "touchcancel",
        function () {

            keys[key] = false;

        }
    );

    button.addEventListener(
        "mousedown",
        function () {

            keys[key] = true;

        }
    );

    button.addEventListener(
        "mouseup",
        function () {

            keys[key] = false;

        }
    );

    button.addEventListener(
        "mouseleave",
        function () {

            keys[key] = false;

        }
    );

}

setupMobileButton(
    "leftButton",
    "mobileLeft"
);

setupMobileButton(
    "rightButton",
    "mobileRight"
);

setupMobileButton(
    "jumpButton",
    "mobileJump"
);

// ======================================================
// PLAYER PHYSICS
// ======================================================

function updatePlayer() {

    if (!myPlayer) return;

    let moving = false;

    // LEFT

    if (
        keys.a ||
        keys.arrowleft ||
        keys.mobileLeft
    ) {

        myPlayer.x -= SPEED;

        moving = true;

    }

    // RIGHT

    if (
        keys.d ||
        keys.arrowright ||
        keys.mobileRight
    ) {

        myPlayer.x += SPEED;

        moving = true;

    }

    // JUMP

    if (
        (
            keys.w ||
            keys.arrowup ||
            keys.space ||
            keys.mobileJump
        ) &&
        onGround
    ) {

        velocityY =
            -JUMP;

        onGround =
            false;

    }

    // GRAVITY

    velocityY += GRAVITY;

    myPlayer.y += velocityY;

    const ground =
        getGroundY();

    // GROUND

    if (
        myPlayer.y >= ground
    ) {

        myPlayer.y =
            ground;

        velocityY = 0;

        onGround = true;

    }

    // TOP LIMIT
    if (
        myPlayer.y <
        -500
    ) {

        myPlayer.y =
            -500;

        velocityY = 0;

    }

    // ==================================================
    // کل مپ قابل حرکت است
    // ==================================================

    if (
        myPlayer.x < 35
    ) {

        myPlayer.x = 35;

    }

    // عمداً اینجا سقف canvas.width نداریم
    // تا بازیکن بتواند در کل مپ حرکت کند.

    // ==================================================
    // ONLINE SYNC
    // ==================================================

    if (
        gameMode === "ONLINE" &&
        (
            moving ||
            !onGround
        )
    ) {

        // Y به صورت offset نسبت به زمین ارسال می‌شود
        const yOffset =
            myPlayer.y -
            getGroundY();

        socket.emit(
            "playerMovement",
            {
                x: myPlayer.x,
                y: yOffset
            }
        );

    }

}

// ======================================================
// AI
// ======================================================

function updateAI() {

    if (
        !ai ||
        !myPlayer
    ) {

        return;

    }

    const ground =
        getGroundY();

    const distance =
        myPlayer.x -
        ai.x;

    // FOLLOW PLAYER

    if (
        Math.abs(distance) > 25
    ) {

        if (distance > 0) {

            ai.x += 2.3;

        } else {

            ai.x -= 2.3;

        }

    }

    // AI GRAVITY

    aiVelocityY += GRAVITY;

    ai.y += aiVelocityY;

    // AI GROUND

    if (
        ai.y >= ground
    ) {

        ai.y =
            ground;

        aiVelocityY = 0;

        aiOnGround = true;

    }

    // AI JUMP

    aiDirectionTimer--;

    if (
        aiDirectionTimer <= 0
    ) {

        aiDirectionTimer =
            100 +
            Math.floor(
                Math.random() * 150
            );

        if (
            Math.abs(distance) < 300 &&
            aiOnGround
        ) {

            aiVelocityY =
                -JUMP * 0.85;

            aiOnGround = false;

        }

    }

    // جلوگیری از گیر کردن AI
    if (
        ai.x < 35
    ) {

        ai.x = 35;

    }

}

// ======================================================
// GAME UI
// ======================================================

function updateGameUI() {

    const score =
        document.getElementById(
            "gameScore"
        );

    if (!score) return;

    if (
        gameMode === "AI" &&
        ai &&
        myPlayer
    ) {

        const distance =
            Math.abs(
                myPlayer.x -
                ai.x
            );

        if (
            distance < 75
        ) {

            score.textContent =
                "🤖 حریف نزدیکته!";

        } else {

            score.textContent =
                "❤️ 100";

        }

    } else {

        score.textContent =
            "❤️ 100";

    }

}

// ======================================================
// SKY
// ======================================================

function drawSky() {

    if (!ctx || !canvas) {
        return;
    }

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            canvas.height
        );

    gradient.addColorStop(
        0,
        "#38bdf8"
    );

    gradient.addColorStop(
        1,
        "#bae6fd"
    );

    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // SUN

    ctx.fillStyle =
        "#fde047";

    ctx.beginPath();

    ctx.arc(
        canvas.width - 100,
        90,
        45,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // CLOUDS

    drawCloud(
        130,
        110,
        1
    );

    drawCloud(
        420,
        160,
        0.8
    );

}

// ======================================================
// CLOUD
// ======================================================

function drawCloud(
    x,
    y,
    scale
) {

    if (!ctx) return;

    ctx.fillStyle =
        "#ffffffcc";

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        22 * scale,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + 25 * scale,
        y - 8 * scale,
        28 * scale,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + 55 * scale,
        y,
        22 * scale,
        0,
        Math.PI * 2
    );

    ctx.fillRect(
        x - 5 * scale,
        y,
        65 * scale,
        20 * scale
    );

    ctx.fill();

}

// ======================================================
// GROUND
// ======================================================

function drawGround() {

    if (!ctx || !canvas) {
        return;
    }

    const ground =
        getGroundY();

    // GRASS

    ctx.fillStyle =
        "#22c55e";

    ctx.fillRect(
        0,
        ground,
        canvas.width,
        120
    );

    // EDGE

    ctx.fillStyle =
        "#166534";

    ctx.fillRect(
        0,
        ground,
        canvas.width,
        9
    );

    // DIRT

    ctx.fillStyle =
        "#92400e";

    ctx.fillRect(
        0,
        ground + 9,
        canvas.width,
        111
    );

    // ROCKS

    ctx.fillStyle =
        "#6b3f1f";

    for (
        let x = 20;
        x < canvas.width;
        x += 85
    ) {

        ctx.beginPath();

        ctx.arc(
            x,
            ground + 42,
            5,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }

}

// ======================================================
// PLAYER
// ======================================================

function drawStickman(
    player,
    isAI = false
) {

    if (!ctx || !player) {
        return;
    }

    const x =
        player.x;

    const y =
        player.y;

    const minScreen =
        Math.min(
            canvas.width,
            canvas.height
        );

    const scale =
        Math.max(
            0.8,
            Math.min(
                1.15,
                minScreen / 850
            )
        );

    const s = scale;

    const bodyColor =
        isAI
            ? "#ef4444"
            : "#2563eb";

    const bodyDark =
        isAI
            ? "#b91c1c"
            : "#1d4ed8";

    const skin =
        "#f4c7a1";

    const shoe =
        "#111827";

    const shirt =
        isAI
            ? "#dc2626"
            : "#22c55e";

    ctx.save();

    ctx.lineCap =
        "round";

    ctx.lineJoin =
        "round";

    // SHADOW

    ctx.fillStyle =
        "rgba(0,0,0,0.20)";

    ctx.beginPath();

    ctx.ellipse(
        x,
        y + 62 * s,
        32 * s,
        8 * s,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // LEGS

    ctx.strokeStyle =
        "#1f2937";

    ctx.lineWidth =
        8 * s;

    ctx.beginPath();

    ctx.moveTo(
        x,
        y + 20 * s
    );

    ctx.lineTo(
        x - 18 * s,
        y + 53 * s
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        x,
        y + 20 * s
    );

    ctx.lineTo(
        x + 18 * s,
        y + 53 * s
    );

    ctx.stroke();

    // SHOES

    ctx.fillStyle =
        shoe;

    roundRect(
        x - 32 * s,
        y + 49 * s,
        25 * s,
        10 * s,
        5 * s
    );

    ctx.fill();

    roundRect(
        x + 7 * s,
        y + 49 * s,
        25 * s,
        10 * s,
        5 * s
    );

    ctx.fill();

    // SHIRT

    ctx.fillStyle =
        shirt;

    roundRect(
        x - 19 * s,
        y - 28 * s,
        38 * s,
        50 * s,
        12 * s
    );

    ctx.fill();

    // BODY

    ctx.fillStyle =
        bodyColor;

    roundRect(
        x - 13 * s,
        y - 22 * s,
        26 * s,
        35 * s,
        8 * s
    );

    ctx.fill();

    // ARMS

    ctx.strokeStyle =
        bodyDark;

    ctx.lineWidth =
        8 * s;

    ctx.beginPath();

    ctx.moveTo(
        x - 16 * s,
        y - 15 * s
    );

    ctx.lineTo(
        x - 38 * s,
        y + 8 * s
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        x + 16 * s,
        y - 15 * s
    );

    ctx.lineTo(
        x + 38 * s,
        y + 8 * s
    );

    ctx.stroke();

    // HANDS

    ctx.fillStyle =
        skin;

    ctx.beginPath();

    ctx.arc(
        x - 40 * s,
        y + 10 * s,
        6 * s,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
        x + 40 * s,
        y + 10 * s,
        6 * s,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // NECK

    ctx.fillStyle =
        skin;

    roundRect(
        x - 8 * s,
        y - 40 * s,
        16 * s,
        14 * s,
        5 * s
    );

    ctx.fill();

    // HEAD

    ctx.fillStyle =
        skin;

    ctx.beginPath();

    ctx.arc(
        x,
        y - 58 * s,
        22 * s,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // HAIR

    ctx.fillStyle =
        "#111827";

    ctx.beginPath();

    ctx.arc(
        x,
        y - 66 * s,
        22 * s,
        Math.PI,
        Math.PI * 2
    );

    ctx.fill();

    // EYES

    ctx.fillStyle =
        "#111827";

    ctx.beginPath();

    ctx.arc(
        x - 8 * s,
        y - 59 * s,
        2.5 * s,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
        x + 8 * s,
        y - 59 * s,
        2.5 * s,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // NAME

    const name =
        player.name ||
        (
            isAI
                ? "AI"
                : "Player"
        );

    const fontSize =
        Math.max(
            12,
            15 * s
        );

    ctx.font =
        `bold ${fontSize}px Arial`;

    const textWidth =
        ctx.measureText(name).width;

    ctx.fillStyle =
        "rgba(17,24,39,0.82)";

    roundRect(
        x -
            textWidth / 2 -
            8,
        y -
            105 * s,
        textWidth + 16,
        24 * s,
        8
    );

    ctx.fill();

    ctx.fillStyle =
        "#ffffff";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        name,
        x,
        y - 93 * s
    );

    // AI ICON

    if (isAI) {

        ctx.fillStyle =
            "#facc15";

        ctx.font =
            `bold ${12 * s}px Arial`;

        ctx.fillText(
            "🤖",
            x,
            y - 118 * s
        );

    }

    ctx.restore();

}

// ======================================================
// ROUND RECT
// ======================================================

function roundRect(
    x,
    y,
    width,
    height,
    radius
) {

    if (!ctx) return;

    const r =
        Math.min(
            radius,
            width / 2,
            height / 2
        );

    ctx.beginPath();

    ctx.moveTo(
        x + r,
        y
    );

    ctx.arcTo(
        x + width,
        y,
        x + width,
        y + height,
        r
    );

    ctx.arcTo(
        x + width,
        y + height,
        x,
        y + height,
        r
    );

    ctx.arcTo(
        x,
        y + height,
        x,
        y,
        r
    );

    ctx.arcTo(
        x,
        y,
        x + width,
        y,
        r
    );

    ctx.closePath();

}

// ======================================================
// DRAW GAME
// ======================================================

function drawGame() {

    if (!ctx || !canvas) {
        return;
    }

    drawSky();

    drawGround();

    // PLAYER

    if (myPlayer) {

        drawStickman(
            myPlayer,
            false
        );

    }

    // AI

    if (ai) {

        drawStickman(
            ai,
            true
        );

    }

    // ONLINE PLAYERS

    if (
        gameMode === "ONLINE"
    ) {

        Object.values(players)
            .forEach(
                function (player) {

                    if (
                        player.id ===
                        socket.id
                    ) {

                        return;

                    }

                    drawStickman(
                        player,
                        false
                    );

                }
            );

    }

}

// ======================================================
// GAME LOOP
// ======================================================

function gameLoop() {

    if (!gameRunning) {
        return;
    }

    updatePlayer();

    if (
        gameMode === "AI"
    ) {

        updateAI();

    }

    updateGameUI();

    drawGame();

    requestAnimationFrame(
        gameLoop
    );

}
