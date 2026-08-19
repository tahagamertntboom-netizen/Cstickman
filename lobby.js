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

// =======================================
// AI
// =======================================

let ai = null;
let aiVelocityY = 0;
let aiOnGround = false;
let aiDirectionTimer = 0;

// =======================================
// MOBS
// =======================================

let mobs = [];
let mobIdCounter = 1;

const MOB_TYPES = [
    {
        name: "گابلین",
        emoji: "👹",
        color: "#dc2626",
        health: 50,
        speed: 1.2,
        damage: 5
    },
    {
        name: "اسلایم",
        emoji: "🟢",
        color: "#22c55e",
        health: 80,
        speed: 0.8,
        damage: 8
    },
    {
        name: "اسکلت",
        emoji: "💀",
        color: "#e5e7eb",
        health: 100,
        speed: 1,
        damage: 10
    }
];

// =======================================
// ELEMENTS
// =======================================

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
            return;
        }

        if (document.documentElement.requestFullscreen) {

            await document.documentElement.requestFullscreen({
                navigationUI: "hide"
            });

        }

    } catch (error) {

        console.log("Fullscreen unavailable:", error);

    }

}

// =======================================
// NAME
// =======================================

if (confirmName) {

    confirmName.onclick = function () {

        const name =
            nameInput.value.trim();

        if (!name) {

            const error =
                document.getElementById("nameError");

            if (error) {
                error.textContent =
                    "اول اسمت رو وارد کن.";
            }

            return;
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

// =======================================
// MODE
// =======================================

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

// =======================================
// OFFLINE AI
// =======================================

if (aiCard) {

    aiCard.onclick = async function () {

        await enterGameFullscreen();

        startOfflineGame(true);

    };

}

// =======================================
// OFFLINE SOLO
// =======================================

if (soloCard) {

    soloCard.onclick = async function () {

        await enterGameFullscreen();

        startOfflineGame(false);

    };

}

// =======================================
// START OFFLINE
// =======================================

function startOfflineGame(withAI) {

    gameMode =
        withAI ? "AI" : "SOLO";

    nameScreen.classList.add("hidden");
    modeScreen.classList.add("hidden");
    offlineScreen.classList.add("hidden");
    onlineScreen.classList.add("hidden");
    roomScreen.classList.add("hidden");

    gameScreen.style.display = "block";

    gameRunning = true;

    setupOfflinePlayers(withAI);

    resizeCanvas();

    // حتماً بعد از مشخص شدن زمین
    fixAllSpawns();

    requestAnimationFrame(gameLoop);

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

        y: 0,

        health: 100

    };

    players.player =
        myPlayer;

    ai = null;

    if (withAI) {

        ai = {

            id: "ai",

            name: "AI",

            x: 700,

            y: 0,

            health: 100

        };

    }

    // ===================================
    // MOBS
    // ===================================

    mobs = [];

    // چند ماب در نقاط مختلف مپ
    spawnMob(500, 0, 0);
    spawnMob(900, 0, 1);
    spawnMob(1300, 0, 2);
    spawnMob(1700, 0, 0);
    spawnMob(2200, 0, 1);
    spawnMob(2700, 0, 2);

    const modeText =
        document.getElementById("gameMode");

    if (modeText) {

        modeText.textContent =
            withAI
                ? "🤖 بازی با AI 👾"
                : "👤 بازی تنهایی 👾";

    }

}

// =======================================
// MOB SPAWN
// =======================================

function spawnMob(x, y, typeIndex = 0) {

    const type =
        MOB_TYPES[
            typeIndex % MOB_TYPES.length
        ];

    const mob = {

        id:
            "mob_" +
            mobIdCounter++,

        name:
            type.name,

        emoji:
            type.emoji,

        color:
            type.color,

        x: x,

        y: y,

        health:
            type.health,

        maxHealth:
            type.health,

        speed:
            type.speed,

        damage:
            type.damage,

        velocityY: 0,

        onGround: false,

        attackCooldown: 0

    };

    mobs.push(mob);

    return mob;

}

// =======================================
// FIX ALL SPAWNS
// =======================================

function fixAllSpawns() {

    const ground =
        getGroundY();

    if (myPlayer) {

        myPlayer.y =
            ground;

        onGround =
            true;

        velocityY =
            0;

    }

    if (ai) {

        ai.y =
            ground;

        aiOnGround =
            true;

        aiVelocityY =
            0;

    }

    mobs.forEach(function (mob) {

        mob.y =
            ground;

        mob.onGround =
            true;

        mob.velocityY =
            0;

    });

}

// =======================================
// ONLINE
// =======================================

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

// =======================================
// ROOM CREATED
// =======================================

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

            players[myPlayer.id] =
                myPlayer;

        }

        onlineScreen.classList.add("hidden");
        roomScreen.classList.remove("hidden");

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

// =======================================
// ROOM JOINED
// =======================================

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

            players[myPlayer.id] =
                myPlayer;

        }

        onlineScreen.classList.add("hidden");
        roomScreen.classList.remove("hidden");

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
// READY
// =======================================

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

// =======================================
// READY UPDATE
// =======================================

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

// =======================================
// START ONLINE
// =======================================

socket.on(
    "startGame",
    async function () {

        await enterGameFullscreen();

        gameMode =
            "ONLINE";

        roomScreen.classList.add("hidden");

        gameScreen.style.display =
            "block";

        gameRunning =
            true;

        mobs = [];

        resizeCanvas();

        fixAllSpawns();

        requestAnimationFrame(gameLoop);

    }
);

// =======================================
// CANVAS
// =======================================

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

    if (gameRunning) {
        fixAllSpawns();
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
// ONLINE PLAYER SPAWN
// =======================================

function fixPlayerSpawn(player) {

    if (!player) return;

    const ground =
        getGroundY();

    if (
        player.y === undefined ||
        player.y === null ||
        !Number.isFinite(Number(player.y)) ||
        Number(player.y) <= 0
    ) {

        player.y =
            ground;

    }

}

// =======================================
// ONLINE PLAYERS
// =======================================

socket.on(
    "playersUpdate",
    function (list) {

        players = {};

        if (!Array.isArray(list)) {
            return;
        }

        list.forEach(
            function (player) {

                if (!player) return;

                fixPlayerSpawn(player);

                players[player.id] =
                    player;

                if (
                    player.id === socket.id
                ) {

                    myPlayer =
                        player;

                    onGround =
                        true;

                    velocityY =
                        0;

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
    function (player) {

        if (!player) return;

        fixPlayerSpawn(player);

        if (!players[player.id]) {

            players[player.id] =
                player;

        } else {

            players[player.id].x =
                player.x;

            players[player.id].y =
                player.y;

        }

    }
);

// =======================================
// PLAYER LEFT
// =======================================

socket.on(
    "playerLeft",
    function (id) {

        delete players[id];

    }
);

// =======================================
// ROOM ERROR
// =======================================

socket.on(
    "roomError",
    function (message) {

        const error =
            document.getElementById(
                "onlineError"
            );

        if (error) {

            if (
                typeof message === "object" &&
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
// CONTROLS
// =======================================

const keys = {};

document.addEventListener(
    "keydown",
    function (e) {

        keys[e.key.toLowerCase()] =
            true;

        if (e.code === "Space") {
            keys.space = true;
        }

    }
);

document.addEventListener(
    "keyup",
    function (e) {

        keys[e.key.toLowerCase()] =
            false;

        if (e.code === "Space") {
            keys.space = false;
        }

    }
);

// =======================================
// MOBILE BUTTONS
// =======================================

function setupMobileButton(id, key) {

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

        onGround =
            false;

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

        velocityY =
            0;

        onGround =
            true;

    }

    // مپ کامل قابل حرکت
    if (myPlayer.x < 35) {
        myPlayer.x = 35;
    }

    // عمداً سقف سمت راست محدود نمی‌کنیم
    // تا کل مپ قابل حرکت باشد

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

    if (!ai || !myPlayer) {
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

    if (ai.y >= ground) {

        ai.y =
            ground;

        aiVelocityY =
            0;

        aiOnGround =
            true;

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

            aiOnGround =
                false;

        }

    }

}

// =======================================
// MOBS AI
// =======================================

function updateMobs() {

    if (!myPlayer) return;

    const ground =
        getGroundY();

    mobs.forEach(function (mob) {

        if (mob.health <= 0) {
            return;
        }

        const distance =
            myPlayer.x - mob.x;

        // دنبال بازیکن حرکت کن
        if (
            Math.abs(distance) > 55
        ) {

            if (distance > 0) {

                mob.x +=
                    mob.speed;

            } else {

                mob.x -=
                    mob.speed;

            }

        }

        // Gravity
        mob.velocityY +=
            GRAVITY;

        mob.y +=
            mob.velocityY;

        // زمین
        if (
            mob.y >= ground
        ) {

            mob.y =
                ground;

            mob.velocityY =
                0;

            mob.onGround =
                true;

        }

        // حمله نزدیک
        if (
            Math.abs(distance) < 70
        ) {

            if (
                mob.attackCooldown <= 0
            ) {

                mob.attackCooldown =
                    60;

                // فعلاً فقط پیام
                console.log(
                    mob.name +
                    " attacked player"
                );

            }

        }

        if (
            mob.attackCooldown > 0
        ) {

            mob.attackCooldown--;

        }

    });

    // ماب‌های مرده را پاک کن
    mobs =
        mobs.filter(function (mob) {

            return mob.health > 0;

        });

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

        if (distance < 75) {

            score.textContent =
                "🤖 حریف نزدیکته!";

        } else {

            score.textContent =
                "❤️ 100 👾 " +
                mobs.length;

        }

    } else {

        score.textContent =
            "❤️ 100 👾 " +
            mobs.length;

    }

}

// =======================================
// SKY
// =======================================

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

    drawCloud(130, 110, 1);
    drawCloud(420, 160, 0.8);

}

// =======================================
// CLOUD
// =======================================

function drawCloud(x, y, scale) {

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

    if (!ctx || !canvas) {
        return;
    }

    const ground =
        getGroundY();

    ctx.fillStyle =
        "#22c55e";

    ctx.fillRect(
        0,
        ground,
        canvas.width,
        120
    );

    ctx.fillStyle =
        "#166534";

    ctx.fillRect(
        0,
        ground,
        canvas.width,
        9
    );

    ctx.fillStyle =
        "#92400e";

    ctx.fillRect(
        0,
        ground + 9,
        canvas.width,
        111
    );

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
// STICKMAN
// =======================================

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

    // Shadow
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

    // Legs
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

    // Shoes
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

    // Shirt
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

    // Body
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

    // Arms
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

    // Hands
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

    // Neck
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

    // Head
    ctx.beginPath();

    ctx.arc(
        x,
        y - 58 * s,
        22 * s,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Hair
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

    // Eyes
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

    // Name
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
// DRAW MOB
// =======================================

function drawMob(mob) {

    if (
        !ctx ||
        !mob
    ) {
        return;
    }

    const x =
        mob.x;

    const y =
        mob.y;

    // Shadow
    ctx.fillStyle =
        "rgba(0,0,0,0.25)";

    ctx.beginPath();

    ctx.ellipse(
        x,
        y + 20,
        30,
        7,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Body
    ctx.fillStyle =
        mob.color;

    ctx.beginPath();

    ctx.arc(
        x,
        y - 15,
        28,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Emoji
    ctx.font =
        "30px Arial";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        mob.emoji,
        x,
        y - 15
    );

    // Health background
    ctx.fillStyle =
        "#111827";

    ctx.fillRect(
        x - 30,
        y - 55,
        60,
        7
    );

    // Health
    ctx.fillStyle =
        "#22c55e";

    ctx.fillRect(
        x - 30,
        y - 55,
        60 *
        Math.max(
            0,
            mob.health /
            mob.maxHealth
        ),
        7
    );

    // Name
    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "bold 12px Arial";

    ctx.fillText(
        mob.name,
        x,
        y - 68
    );

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

    // MOBS
    mobs.forEach(function (mob) {

        drawMob(mob);

    });

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

    // حرکت ماب‌ها
    if (
        gameMode === "AI" ||
        gameMode === "SOLO"
    ) {

        updateMobs();

    }

    updateGameUI();

    drawGame();

    requestAnimationFrame(
        gameLoop
    );

}
