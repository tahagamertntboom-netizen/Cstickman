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
// NAME
// =======================================

confirmName.onclick = () => {

    const name =
        nameInput.value.trim();

    if (!name) {

        document.getElementById(
            "nameError"
        ).textContent =
            "اول اسمت رو وارد کن.";

        return;
    }

    playerName =
        name.substring(0, 20);

    nameScreen.classList.add("hidden");

    modeScreen.classList.remove("hidden");
};

nameInput.addEventListener(
    "keydown",
    (e) => {

        if (e.key === "Enter") {
            confirmName.click();
        }
    }
);


// =======================================
// MODE
// =======================================

onlineCard.onclick = () => {

    modeScreen.classList.add("hidden");

    onlineScreen.classList.remove("hidden");
};

offlineCard.onclick = () => {

    modeScreen.classList.add("hidden");

    offlineScreen.classList.remove("hidden");
};

backToModes.onclick = () => {

    offlineScreen.classList.add("hidden");

    modeScreen.classList.remove("hidden");
};

backFromOnline.onclick = () => {

    onlineScreen.classList.add("hidden");

    modeScreen.classList.remove("hidden");
};


// =======================================
// OFFLINE AI
// =======================================

aiCard.onclick = () => {

    startOfflineGame(true);
};


// =======================================
// OFFLINE SOLO
// =======================================

soloCard.onclick = () => {

    startOfflineGame(false);
};


// =======================================
// START OFFLINE
// =======================================

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

    setupOfflinePlayers(withAI);

    resizeCanvas();

    requestAnimationFrame(gameLoop);
}


// =======================================
// OFFLINE PLAYERS
// =======================================

function setupOfflinePlayers(withAI) {

    players = {};

    myPlayer = {

        id: "player",

        name: playerName,

        x: 250,

        y: 0
    };

    players.player = myPlayer;

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

    const gameModeText =
        document.getElementById("gameMode");

    if (gameModeText) {

        gameModeText.textContent =
            withAI
                ? "🤖 بازی با AI"
                : "👤 بازی تنهایی";
    }
}


// =======================================
// ONLINE
// =======================================

showJoin.onclick = () => {

    joinBox.classList.toggle("hidden");
};

roomInput.addEventListener(
    "input",
    () => {

        roomInput.value =
            roomInput.value
                .replace(/\D/g, "")
                .substring(0, 6);
    }
);

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

socket.on(
    "roomCreated",
    (data) => {

        roomCode =
            String(data.roomCode)
                .replace(/\D/g, "");

        myPlayer =
            data.player;

        players = {};

        players[
            myPlayer.id
        ] = myPlayer;

        onlineScreen.classList.add("hidden");

        roomScreen.classList.remove("hidden");

        roomCodeElement.textContent =
            roomCode;
    }
);

joinRoom.onclick = () => {

    const code =
        roomInput.value
            .replace(/\D/g, "")
            .substring(0, 6);

    if (code.length !== 6) {

        document.getElementById(
            "onlineError"
        ).textContent =
            "کد باید ۶ رقمی باشد.";

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

socket.on(
    "roomJoined",
    (data) => {

        roomCode =
            String(data.roomCode)
                .replace(/\D/g, "");

        myPlayer =
            data.player;

        players = {};

        players[
            myPlayer.id
        ] = myPlayer;

        onlineScreen.classList.add("hidden");

        roomScreen.classList.remove("hidden");

        roomCodeElement.textContent =
            roomCode;
    }
);


// =======================================
// READY ONLINE
// =======================================

readyButton.onclick = () => {

    readyButton.disabled = true;

    readyButton.textContent =
        "✅ آماده شدی";

    roomStatus.textContent =
        "⏳ منتظر بازیکن دیگر...";

    socket.emit("readyForGame");
};

socket.on(
    "startGame",
    () => {

        gameMode = "ONLINE";

        roomScreen.classList.add("hidden");

        gameScreen.style.display = "block";

        gameRunning = true;

        resizeCanvas();

        requestAnimationFrame(gameLoop);
    }
);


// =======================================
// ONLINE PLAYERS
// =======================================

socket.on(
    "playersUpdate",
    (list) => {

        players = {};

        list.forEach(
            (player) => {

                players[
                    player.id
                ] = player;

                if (
                    player.id === socket.id
                ) {

                    myPlayer = player;
                }
            }
        );
    }
);

socket.on(
    "playerMoved",
    (player) => {

        if (!players[player.id]) {

            players[player.id] = player;

        } else {

            players[player.id].x =
                player.x;

            players[player.id].y =
                player.y;
        }
    }
);

socket.on(
    "playerLeft",
    (id) => {

        delete players[id];
    }
);

socket.on(
    "roomError",
    (message) => {

        const errorBox =
            document.getElementById(
                "onlineError"
            );

        if (errorBox) {
            errorBox.textContent =
                String(message);
        }

        joinRoom.disabled = false;

        joinRoom.textContent =
            "🚪 ورود";

        createRoom.disabled = false;

        createRoom.textContent =
            "🏠 ساخت اتاق";
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
    canvas.getContext("2d");

function resizeCanvas() {

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

resizeCanvas();


// =======================================
// GROUND
// =======================================

function getGroundY() {

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

        if (e.code === "Space") {
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

        if (e.code === "Space") {
            keys.space = false;
        }
    }
);


// =======================================
// MOBILE CONTROLS
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

    if (
        keys.a ||
        keys.arrowleft ||
        keys.mobileLeft
    ) {

        myPlayer.x -= SPEED;

        moving = true;
    }

    if (
        keys.d ||
        keys.arrowright ||
        keys.mobileRight
    ) {

        myPlayer.x += SPEED;

        moving = true;
    }

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

        onGround = false;
    }

    velocityY += GRAVITY;

    myPlayer.y += velocityY;

    const ground =
        getGroundY();

    if (
        myPlayer.y >= ground
    ) {

        myPlayer.y =
            ground;

        velocityY = 0;

        onGround = true;
    }

    if (
        myPlayer.x < 35
    ) {

        myPlayer.x = 35;
    }

    if (
        myPlayer.x >
        canvas.width - 35
    ) {

        myPlayer.x =
            canvas.width - 35;
    }

    if (
        gameMode === "ONLINE" &&
        (moving || !onGround)
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
        myPlayer.x - ai.x;

    if (
        Math.abs(distance) > 25
    ) {

        if (distance > 0) {

            ai.x += 2.3;

        } else {

            ai.x -= 2.3;
        }
    }

    aiVelocityY += GRAVITY;

    ai.y += aiVelocityY;

    if (
        ai.y >= ground
    ) {

        ai.y = ground;

        aiVelocityY = 0;

        aiOnGround = true;
    }

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
        ai
    ) {

        const distance =
            Math.abs(
                myPlayer.x -
                ai.x
            );

        if (distance < 75) {

            score.textContent =
                "🤖 حریف نزدیکه!";

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

    // خورشید

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

    // ابرها

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
}


// =======================================
// GROUND
// =======================================

function drawGround() {

    const ground =
        getGroundY();

    // چمن

    ctx.fillStyle =
        "#22c55e";

    ctx.fillRect(
        0,
        ground,
        canvas.width,
        120
    );

    // لبه چمن

    ctx.fillStyle =
        "#166534";

    ctx.fillRect(
        0,
        ground,
        canvas.width,
        9
    );

    // خاک

    ctx.fillStyle =
        "#92400e";

    ctx.fillRect(
        0,
        ground + 9,
        canvas.width,
        111
    );

    // سنگ‌های کوچک

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

    const x =
        player.x;

    const y =
        player.y;

    // اندازه مناسب برای موبایل و PC
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

    // ===============================
    // COLORS
    // ===============================

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

    ctx.lineCap = "round";
    ctx.lineJoin = "round";


    // ===============================
    // SHADOW
    // ===============================

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


    // ===============================
    // LEGS
    // ===============================

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


    // ===============================
    // SHOES
    // ===============================

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


    // ===============================
    // BODY SHIRT
    // ===============================

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


    // ===============================
    // BODY LIGHT
    // ===============================

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


    // ===============================
    // ARMS
    // ===============================

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


    // ===============================
    // HANDS
    // ===============================

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


    // ===============================
    // NECK
    // ===============================

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


    // ===============================
    // HEAD
    // ===============================

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


    // ===============================
    // HAIR
    // ===============================

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


    // ===============================
    // EYES
    // ===============================

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


    // ===============================
    // NAME
    // ===============================

    const name =
        player.name ||
        (isAI ? "AI" : "Player");

    ctx.font =
        `bold ${Math.max(
            12,
            15 * s
        )}px Arial`;

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


    // ===============================
    // AI INDICATOR
    // ===============================

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
// ROUNDED RECT
// =======================================

function roundRect(
    x,
    y,
    width,
    height,
    radius
) {

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

    drawSky();

    drawGround();


    // خود بازیکن

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


    // بازیکن‌های آنلاین

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
