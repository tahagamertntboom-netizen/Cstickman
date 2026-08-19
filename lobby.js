const socket = io();

// =======================================
// STATE
// =======================================

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


// =======================================
// ELEMENTS
// =======================================

const nameScreen =
    document.getElementById("nameScreen");

const modeScreen =
    document.getElementById("modeScreen");

const offlineScreen =
    document.getElementById("offlineScreen");

const onlineScreen =
    document.getElementById("onlineScreen");

const roomScreen =
    document.getElementById("roomScreen");

const gameScreen =
    document.getElementById("gameScreen");

const nameInput =
    document.getElementById("nameInput");

const confirmName =
    document.getElementById("confirmName");

const onlineCard =
    document.getElementById("onlineCard");

const offlineCard =
    document.getElementById("offlineCard");

const aiCard =
    document.getElementById("aiCard");

const soloCard =
    document.getElementById("soloCard");

const backToModes =
    document.getElementById("backToModes");

const createRoom =
    document.getElementById("createRoom");

const showJoin =
    document.getElementById("showJoin");

const joinBox =
    document.getElementById("joinBox");

const roomInput =
    document.getElementById("roomInput");

const joinRoom =
    document.getElementById("joinRoom");

const readyButton =
    document.getElementById("readyButton");

const roomCodeElement =
    document.getElementById("roomCode");

const roomStatus =
    document.getElementById("roomStatus");

const backFromOnline =
    document.getElementById("backFromOnline");


// =======================================
// FULLSCREEN
// =======================================

async function enterGameFullscreen() {

    try {

        if (document.fullscreenElement) {
            return true;
        }

        if (
            document.documentElement.requestFullscreen
        ) {

            await document.documentElement.requestFullscreen({
                navigationUI: "hide"
            });

            return true;
        }

    } catch (error) {

        console.log(
            "Fullscreen unavailable:",
            error
        );
    }

    return false;
}


// =======================================
// LOCK PORTRAIT WHEN POSSIBLE
// =======================================

async function lockPortrait() {

    try {

        if (
            screen.orientation &&
            screen.orientation.lock
        ) {

            await screen.orientation.lock(
                "portrait"
            );
        }

    } catch (error) {

        // بعضی مرورگرها اجازه نمی‌دهند
        console.log(
            "Orientation lock unavailable"
        );
    }
}


// =======================================
// EXIT FULLSCREEN
// =======================================

async function exitGameFullscreen() {

    try {

        if (
            document.fullscreenElement &&
            document.exitFullscreen
        ) {

            await document.exitFullscreen();
        }

    } catch (error) {

        console.log(
            "Exit fullscreen failed"
        );
    }
}


// =======================================
// NAME
// =======================================

if (confirmName) {

    confirmName.onclick = () => {

        const name =
            nameInput.value.trim();

        if (!name) {

            const error =
                document.getElementById(
                    "nameError"
                );

            if (error) {
                error.textContent =
                    "اول اسمت رو وارد کن.";
            }

            return;
        }

        playerName =
            name.substring(0, 20);

        nameScreen.classList.add(
            "hidden"
        );

        modeScreen.classList.remove(
            "hidden"
        );
    };
}


if (nameInput) {

    nameInput.addEventListener(
        "keydown",
        (e) => {

            if (e.key === "Enter") {

                if (confirmName) {
                    confirmName.click();
                }
            }
        }
    );
}


// =======================================
// MODE
// =======================================

if (onlineCard) {

    onlineCard.onclick = () => {

        modeScreen.classList.add(
            "hidden"
        );

        onlineScreen.classList.remove(
            "hidden"
        );
    };
}


if (offlineCard) {

    offlineCard.onclick = () => {

        modeScreen.classList.add(
            "hidden"
        );

        offlineScreen.classList.remove(
            "hidden"
        );
    };
}


if (backToModes) {

    backToModes.onclick = () => {

        offlineScreen.classList.add(
            "hidden"
        );

        modeScreen.classList.remove(
            "hidden"
        );
    };
}


if (backFromOnline) {

    backFromOnline.onclick = () => {

        onlineScreen.classList.add(
            "hidden"
        );

        modeScreen.classList.remove(
            "hidden"
        );
    };
}


// =======================================
// OFFLINE AI
// =======================================

if (aiCard) {

    aiCard.onclick = async () => {

        await enterGameFullscreen();

        await lockPortrait();

        startOfflineGame(true);
    };
}


// =======================================
// OFFLINE SOLO
// =======================================

if (soloCard) {

    soloCard.onclick = async () => {

        await enterGameFullscreen();

        await lockPortrait();

        startOfflineGame(false);
    };
}


// =======================================
// START OFFLINE GAME
// =======================================

function startOfflineGame(withAI) {

    gameMode =
        withAI
            ? "AI"
            : "SOLO";

    nameScreen.classList.add(
        "hidden"
    );

    modeScreen.classList.add(
        "hidden"
    );

    offlineScreen.classList.add(
        "hidden"
    );

    onlineScreen.classList.add(
        "hidden"
    );

    roomScreen.classList.add(
        "hidden"
    );

    gameScreen.style.display =
        "block";

    gameRunning = true;

    setupOfflinePlayers(
        withAI
    );

    resizeCanvas();

    requestAnimationFrame(
        gameLoop
    );
}


// =======================================
// OFFLINE PLAYERS
// =======================================

function setupOfflinePlayers(withAI) {

    players = {};

    myPlayer = {

        id: "player",

        name:
            playerName || "Player",

        x: 250,

        y: 0
    };

    players.player =
        myPlayer;

    if (withAI) {

        ai = {

            id: "ai",

            name: "AI",

            x: 700,

            y: 0,

            health: 100
        };

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


// =======================================
// ONLINE
// =======================================

if (showJoin) {

    showJoin.onclick = () => {

        if (joinBox) {

            joinBox.classList.toggle(
                "hidden"
            );
        }
    };
}


if (roomInput) {

    roomInput.addEventListener(
        "input",
        () => {

            roomInput.value =
                roomInput.value
                    .replace(/\D/g, "")
                    .substring(0, 6);
        }
    );
}


if (createRoom) {

    createRoom.onclick = () => {

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


// =======================================
// ROOM CREATED
// =======================================

socket.on(
    "roomCreated",
    (data) => {

        roomCode =
            String(
                data.roomCode
            ).replace(
                /\D/g,
                ""
            );

        myPlayer =
            data.player;

        players = {};

        if (myPlayer) {

            players[
                myPlayer.id
            ] = myPlayer;
        }

        onlineScreen.classList.add(
            "hidden"
        );

        roomScreen.classList.remove(
            "hidden"
        );

        if (roomCodeElement) {

            roomCodeElement.textContent =
                roomCode;
        }

        if (createRoom) {

            createRoom.disabled =
                false;

            createRoom.textContent =
                "🏠 ساخت اتاق";
        }
    }
);


// =======================================
// JOIN ROOM
// =======================================

if (joinRoom) {

    joinRoom.onclick = () => {

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

        joinRoom.disabled =
            true;

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


// =======================================
// ROOM JOINED
// =======================================

socket.on(
    "roomJoined",
    (data) => {

        roomCode =
            String(
                data.roomCode
            ).replace(
                /\D/g,
                ""
            );

        myPlayer =
            data.player;

        players = {};

        if (myPlayer) {

            players[
                myPlayer.id
            ] = myPlayer;
        }

        onlineScreen.classList.add(
            "hidden"
        );

        roomScreen.classList.remove(
            "hidden"
        );

        if (roomCodeElement) {

            roomCodeElement.textContent =
                roomCode;
        }

        if (joinRoom) {

            joinRoom.disabled =
                false;

            joinRoom.textContent =
                "🚪 ورود";
        }
    }
);


// =======================================
// READY ONLINE
// =======================================

if (readyButton) {

    readyButton.onclick = async () => {

        // Fullscreen حتماً از کلیک کاربر
        // درخواست می‌شود.

        await enterGameFullscreen();

        await lockPortrait();

        readyButton.disabled =
            true;

        readyButton.textContent =
            "✅ آماده شدی";

        if (roomStatus) {

            roomStatus.textContent =
                "⏳ منتظر بازیکن دیگر...";
        }

        socket.emit(
            "readyForGame"
        );
    };
}


// =======================================
// READY UPDATE
// =======================================

socket.on(
    "readyUpdate",
    (data) => {

        if (!roomStatus) return;

        roomStatus.textContent =
            "بازیکنان آماده: " +
            data.ready +
            " / " +
            data.total;
    }
);


// =======================================
// START ONLINE GAME
// =======================================

socket.on(
    "startGame",
    async () => {

        // Fullscreen را دوباره تلاش می‌کنیم
        // ولی اگر قبلاً فعال شده باشد کاری نمی‌کند.

        await enterGameFullscreen();

        gameMode =
            "ONLINE";

        if (roomScreen) {

            roomScreen.classList.add(
                "hidden"
            );
        }

        gameScreen.style.display =
            "block";

        gameRunning = true;

        resizeCanvas();

        requestAnimationFrame(
            gameLoop
        );
    }
);


// =======================================
// ONLINE PLAYERS
// =======================================

socket.on(
    "playersUpdate",
    (list) => {

        players = {};

        if (!Array.isArray(list)) {
            return;
        }

        list.forEach(
            (player) => {

                if (!player) return;

                players[
                    player.id
                ] = player;

                if (
                    player.id ===
                    socket.id
                ) {

                    myPlayer =
                        player;
                }
            }
        );
    }
);


// =======================================
// PLAYER MOVED
// =======================================

socket.on(
    "playerMoved",
    (player) => {

        if (!player) return;

        if (
            !players[player.id]
        ) {

            players[
                player.id
            ] = player;

        } else {

            players[
                player.id
            ].x =
                player.x;

            players[
                player.id
            ].y =
                player.y;
        }
    }
);


// =======================================
// PLAYER LEFT
// =======================================

socket.on(
    "playerLeft",
    (id) => {

        delete players[id];
    }
);


// =======================================
// ROOM ERROR
// =======================================

socket.on(
    "roomError",
    (message) => {

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


// =======================================
// CANVAS
// =======================================

const canvas =
    document.getElementById(
        "gameCanvas"
    );

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

    const ground =
        getGroundY();

    if (
        myPlayer &&
        onGround
    ) {

        myPlayer.y =
            ground;
    }

    if (
        ai &&
        aiOnGround
    ) {

        ai.y =
            ground;
    }
}


window.addEventListener(
    "resize",
    resizeCanvas
);


// =======================================
// GROUND
// =======================================

function getGroundY() {

    if (!canvas) {
        return 500;
    }

    return canvas.height - 120;
}


// =======================================
// CONTROLS
// =======================================

const keys = {};

document.addEventListener(
    "keydown",
    (e) => {

        keys[
            e.key.toLowerCase()
        ] = true;

        if (
            e.code === "Space"
        ) {

            keys.space = true;
        }
    }
);

document.addEventListener(
    "keyup",
    (e) => {

        keys[
            e.key.toLowerCase()
        ] = false;

        if (
            e.code === "Space"
        ) {

            keys.space = false;
        }
    }
);


// =======================================
// MOBILE BUTTONS
// =======================================

function setupMobileButton(
    id,
    key
) {

    const button =
        document.getElementById(id);

    if (!button) return;

    button.addEventListener(
        "touchstart",
        (e) => {

            e.preventDefault();

            keys[key] = true;
        },
        {
            passive: false
        }
    );

    button.addEventListener(
        "touchend",
        (e) => {

            e.preventDefault();

            keys[key] = false;
        },
        {
            passive: false
        }
    );

    button.addEventListener(
        "touchcancel",
        () => {

            keys[key] = false;
        }
    );

    button.addEventListener(
        "mousedown",
        () => {

            keys[key] = true;
        }
    );

    button.addEventListener(
        "mouseup",
        () => {

            keys[key] = false;
        }
    );

    button.addEventListener(
        "mouseleave",
        () => {

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


// =======================================
// PLAYER PHYSICS
// =======================================

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

    velocityY +=
        GRAVITY;

    myPlayer.y +=
        velocityY;

    const ground =
        getGroundY();

    // GROUND

    if (
        myPlayer.y >=
        ground
    ) {

        myPlayer.y =
            ground;

        velocityY =
            0;

        onGround =
            true;
    }

    // BORDERS

    if (
        myPlayer.x < 35
    ) {

        myPlayer.x =
            35;
    }

    if (
        canvas &&
        myPlayer.x >
        canvas.width - 35
    ) {

        myPlayer.x =
            canvas.width - 35;
    }

    // ONLINE SYNC

    if (
        gameMode === "ONLINE" &&
        (
            moving ||
            !onGround
        )
    ) {

        socket.emit(
            "playerMovement",
            {
                x: myPlayer.x,
                y: myPlayer.y
            }
        );
    }
}


// =======================================
// AI
// =======================================

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

    // حرکت AI به سمت بازیکن

    if (
        Math.abs(distance) >
        25
    ) {

        if (
            distance > 0
        ) {

            ai.x +=
                2.3;

        } else {

            ai.x -=
                2.3;
        }
    }

    // GRAVITY

    aiVelocityY +=
        GRAVITY;

    ai.y +=
        aiVelocityY;

    // GROUND

    if (
        ai.y >=
        ground
    ) {

        ai.y =
            ground;

        aiVelocityY =
            0;

        aiOnGround =
            true;
    }

    // AI JUMP

    aiDirectionTimer--;

    if (
        aiDirectionTimer <=
        0
    ) {

        aiDirectionTimer =
            100 +
            Math.floor(
                Math.random() *
                150
            );

        if (
            Math.abs(distance) <
            300 &&
            aiOnGround
        ) {

            aiVelocityY =
                -JUMP * 0.85;

            aiOnGround =
                false;
        }
    }
}


// =======================================
// GAME UI
// =======================================

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
            distance <
            75
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


// =======================================
// SKY
// =======================================

function drawSky() {

    if (!ctx || !canvas) return;

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


// =======================================
// GROUND
// =======================================

function drawGround() {

    if (!ctx || !canvas) return;

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

    // GRASS EDGE

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

    // SMALL STONES

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


// =======================================
// BEAUTIFUL PLAYER
// =======================================

function drawStickman(
    player,
    isAI = false
) {

    if (!ctx || !player) return;

    const x =
        player.x;

    const y =
        player.y;

    // SCALE FOR PC AND MOBILE

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

    const s =
        scale;

    // COLORS

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


    // BODY LIGHT

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
        (isAI ? "AI" : "Player");

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
        x - textWidth / 2 - 8,
        y - 105 * s,
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


// =======================================
// ROUND RECT
// =======================================

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


// =======================================
// DRAW GAME
// =======================================

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
                (player) => {

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


// =======================================
// GAME LOOP
// =======================================

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


// =======================================
// FULLSCREEN CHANGE
// =======================================

document.addEventListener(
    "fullscreenchange",
    () => {

        if (!document.fullscreenElement) {

            console.log(
                "Fullscreen exited"
            );
        }
    }
);
