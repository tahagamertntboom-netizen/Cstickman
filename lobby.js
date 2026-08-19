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
let onGround = true;

const SPEED = 5;
const GRAVITY = 0.7;
const JUMP = 13;

let ai = null;
let aiVelocityY = 0;
let aiOnGround = true;
let aiDirectionTimer = 0;

let mobs = [];
let boss = null;

let attackCooldown = 0;
let attackFlash = 0;


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

const backFromOnline = document.getElementById("backFromOnline");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;


// ======================================================
// FULLSCREEN
// ======================================================

async function enterGameFullscreen() {

    try {

        if (document.fullscreenElement) return;

        if (document.documentElement.requestFullscreen) {

            await document.documentElement.requestFullscreen({
                navigationUI: "hide"
            });

        }

    } catch (e) {

        console.log("Fullscreen unavailable:", e);

    }

}


// ======================================================
// NAME
// ======================================================

if (confirmName) {

    confirmName.onclick = function () {

        const name = nameInput.value.trim();

        if (!name) {

            const error = document.getElementById("nameError");

            if (error) {
                error.textContent = "اول اسمت رو وارد کن.";
            }

            return;
        }

        playerName = name.substring(0, 20);

        nameScreen.classList.add("hidden");
        modeScreen.classList.remove("hidden");

    };

}


if (nameInput) {

    nameInput.addEventListener("keydown", function (e) {

        if (e.key === "Enter") {
            confirmName.click();
        }

    });

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
// OFFLINE
// ======================================================

if (aiCard) {

    aiCard.onclick = async function () {

        await enterGameFullscreen();

        startOfflineGame(true);

    };

}


if (soloCard) {

    soloCard.onclick = async function () {

        await enterGameFullscreen();

        startOfflineGame(false);

    };

}


// ======================================================
// CANVAS
// ======================================================

function resizeCanvas() {

    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

}


window.addEventListener("resize", resizeCanvas);


// ======================================================
// GROUND
// ======================================================

function getGroundY() {

    if (!canvas) return 500;

    return canvas.height - 120;

}


// ======================================================
// IMPORTANT:
// Y IS NOW WORLD HEIGHT.
// 0 = ON GROUND
// 100 = 100 PIXELS ABOVE GROUND
// ======================================================

function getScreenY(player) {

    if (!player) {
        return getGroundY();
    }

    let height = Number(player.y);

    if (!Number.isFinite(height)) {
        height = 0;
    }

    return getGroundY() - height;

}


// ======================================================
// NORMALIZE PLAYER
// ======================================================

function normalizePlayer(player) {

    if (!player) return;

    if (!Number.isFinite(Number(player.x))) {
        player.x = canvas ? canvas.width / 2 : 400;
    }

    if (!Number.isFinite(Number(player.y))) {
        player.y = 0;
    }

    // y is NEVER a screen coordinate anymore.
    // y = 0 means ground.
    player.y = Math.max(0, Number(player.y));

}


// ======================================================
// START OFFLINE
// ======================================================

function startOfflineGame(withAI) {

    gameMode = withAI ? "AI" : "SOLO";

    nameScreen.classList.add("hidden");
    modeScreen.classList.add("hidden");
    offlineScreen.classList.add("hidden");
    onlineScreen.classList.add("hidden");
    roomScreen.classList.add("hidden");

    gameScreen.style.display = "block";

    gameRunning = true;

    resizeCanvas();

    setupOfflinePlayers(withAI);

    requestAnimationFrame(gameLoop);

}


// ======================================================
// OFFLINE PLAYERS
// ======================================================

function setupOfflinePlayers(withAI) {

    players = {};

    myPlayer = {

        id: "player",

        name: playerName || "Player",

        x: canvas
            ? canvas.width / 2
            : 400,

        // 0 = ground
        y: 0,

        health: 100

    };

    players.player = myPlayer;

    velocityY = 0;
    onGround = true;

    if (withAI) {

        ai = {

            id: "ai",

            name: "AI",

            x: canvas
                ? canvas.width / 2 + 250
                : 650,

            y: 0,

            health: 100,

            maxHealth: 100

        };

        aiVelocityY = 0;
        aiOnGround = true;

    } else {

        ai = null;

    }

    spawnMobs();

    spawnBoss();

    const modeText = document.getElementById("gameMode");

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

    roomInput.addEventListener("input", function () {

        roomInput.value =
            roomInput.value
                .replace(/\D/g, "")
                .substring(0, 6);

    });

}


if (createRoom) {

    createRoom.onclick = function () {

        createRoom.disabled = true;

        createRoom.textContent = "⏳ در حال ساخت...";

        socket.emit("createRoom", {
            name: playerName
        });

    };

}


// ======================================================
// ROOM CREATED
// ======================================================

socket.on("roomCreated", function (data) {

    roomCode =
        String(data.roomCode)
            .replace(/\D/g, "");

    myPlayer = data.player;

    normalizePlayer(myPlayer);

    players = {};

    if (myPlayer) {

        players[myPlayer.id] = myPlayer;

    }

    onlineScreen.classList.add("hidden");
    roomScreen.classList.remove("hidden");

    if (roomCodeElement) {

        roomCodeElement.textContent = roomCode;

    }

    if (createRoom) {

        createRoom.disabled = false;
        createRoom.textContent = "🏠 ساخت اتاق";

    }

});


// ======================================================
// JOIN
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
                document.getElementById("onlineError");

            if (error) {
                error.textContent =
                    "کد باید ۶ رقمی باشد.";
            }

            return;

        }

        joinRoom.disabled = true;
        joinRoom.textContent = "⏳ در حال ورود...";

        socket.emit("joinRoom", {

            roomCode: code,

            name: playerName

        });

    };

}


// ======================================================
// ROOM JOINED
// ======================================================

socket.on("roomJoined", function (data) {

    roomCode =
        String(data.roomCode)
            .replace(/\D/g, "");

    myPlayer = data.player;

    normalizePlayer(myPlayer);

    players = {};

    if (myPlayer) {

        players[myPlayer.id] = myPlayer;

    }

    onlineScreen.classList.add("hidden");
    roomScreen.classList.remove("hidden");

    if (roomCodeElement) {

        roomCodeElement.textContent = roomCode;

    }

    if (joinRoom) {

        joinRoom.disabled = false;
        joinRoom.textContent = "🚪 ورود";

    }

});


// ======================================================
// READY
// ======================================================

if (readyButton) {

    readyButton.onclick = async function () {

        await enterGameFullscreen();

        readyButton.disabled = true;
        readyButton.textContent = "✅ آماده شدی";

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

socket.on("readyUpdate", function (data) {

    if (!roomStatus) return;

    roomStatus.textContent =
        "بازیکنان آماده: " +
        data.ready +
        " / " +
        data.total;

});


// ======================================================
// START ONLINE
// ======================================================

socket.on("startGame", async function () {

    await enterGameFullscreen();

    gameMode = "ONLINE";

    roomScreen.classList.add("hidden");

    gameScreen.style.display = "block";

    gameRunning = true;

    resizeCanvas();

    // Make absolutely sure our own player starts on ground.
    if (myPlayer) {

        myPlayer.y = 0;

        velocityY = 0;

        onGround = true;

    }

    requestAnimationFrame(gameLoop);

});


// ======================================================
// ONLINE PLAYERS
// ======================================================

socket.on("playersUpdate", function (list) {

    if (!Array.isArray(list)) return;

    const newPlayers = {};

    list.forEach(function (player) {

        if (!player) return;

        normalizePlayer(player);

        newPlayers[player.id] = player;

        if (player.id === socket.id) {

            /*
             * IMPORTANT:
             * Do not use the received screen Y.
             * y is world height above ground.
             */

            if (myPlayer) {

                myPlayer.x = player.x;

                /*
                 * Don't overwrite local jumping with
                 * stale network data.
                 */
                if (onGround) {
                    myPlayer.y = 0;
                }

            } else {

                myPlayer = player;

            }

        }

    });

    players = newPlayers;

});


socket.on("playerMoved", function (player) {

    if (!player) return;

    normalizePlayer(player);

    if (!players[player.id]) {

        players[player.id] = player;

    } else {

        players[player.id].x = player.x;

        /*
         * This is now height above ground.
         * It is independent from the sender's screen size.
         */
        players[player.id].y = player.y;

    }

    if (player.id === socket.id) {

        if (!myPlayer) {
            myPlayer = players[player.id];
        }

    }

});


socket.on("playerLeft", function (id) {

    delete players[id];

});


// ======================================================
// ROOM ERROR
// ======================================================

socket.on("roomError", function (message) {

    const error =
        document.getElementById("onlineError");

    if (error) {

        if (
            typeof message === "object" &&
            message !== null
        ) {

            error.textContent =
                message.message || "خطا";

        } else {

            error.textContent =
                String(message);

        }

    }

    if (joinRoom) {

        joinRoom.disabled = false;
        joinRoom.textContent = "🚪 ورود";

    }

    if (createRoom) {

        createRoom.disabled = false;
        createRoom.textContent = "🏠 ساخت اتاق";

    }

});


// ======================================================
// CONTROLS
// ======================================================

const keys = {};

document.addEventListener("keydown", function (e) {

    keys[e.key.toLowerCase()] = true;

    if (e.code === "Space") {
        keys.space = true;
    }

    if (e.key.toLowerCase() === "f") {
        attack();
    }

});


document.addEventListener("keyup", function (e) {

    keys[e.key.toLowerCase()] = false;

    if (e.code === "Space") {
        keys.space = false;
    }

});


// ======================================================
// MOBILE BUTTON
// ======================================================

function setupMobileButton(id, key) {

    const button = document.getElementById(id);

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


setupMobileButton("leftButton", "mobileLeft");
setupMobileButton("rightButton", "mobileRight");
setupMobileButton("jumpButton", "mobileJump");


// ======================================================
// MOBILE ATTACK BUTTON
// ======================================================

function createAttackButton() {

    if (document.getElementById("attackButton")) {
        return;
    }

    const button = document.createElement("button");

    button.id = "attackButton";

    button.textContent = "⚔️";

    button.style.position = "fixed";
    button.style.right = "20px";
    button.style.bottom = "25px";
    button.style.width = "72px";
    button.style.height = "72px";
    button.style.padding = "0";
    button.style.margin = "0";
    button.style.borderRadius = "20px";
    button.style.border = "2px solid #ffffff55";
    button.style.background = "#dc2626dd";
    button.style.color = "white";
    button.style.fontSize = "30px";
    button.style.zIndex = "40";
    button.style.touchAction = "none";

    document.body.appendChild(button);

    button.addEventListener(
        "touchstart",
        function (e) {

            e.preventDefault();

            attack();

        },
        {
            passive: false
        }
    );

    button.addEventListener(
        "click",
        function () {

            attack();

        }
    );

}

createAttackButton();


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

        velocityY = JUMP;

        onGround = false;

    }


    // GRAVITY

    if (!onGround) {

        velocityY -= GRAVITY;

        myPlayer.y += velocityY;

    }


    // LAND

    if (myPlayer.y <= 0) {

        myPlayer.y = 0;

        velocityY = 0;

        onGround = true;

    }


    // X BORDERS

    if (myPlayer.x < 35) {

        myPlayer.x = 35;

    }

    if (
        canvas &&
        myPlayer.x > canvas.width - 35
    ) {

        myPlayer.x = canvas.width - 35;

    }


    // ONLINE SYNC
    //
    // y is height above ground.
    // This is the important fix.

    if (
        gameMode === "ONLINE" &&
        (
            moving ||
            !onGround
        )
    ) {

        socket.emit("playerMovement", {

            x: myPlayer.x,

            y: Math.max(
                0,
                myPlayer.y
            )

        });

    }

}


// ======================================================
// AI
// ======================================================

function updateAI() {

    if (!ai || !myPlayer) return;

    const distance =
        myPlayer.x - ai.x;


    // FOLLOW

    if (Math.abs(distance) > 25) {

        if (distance > 0) {

            ai.x += 2.3;

        } else {

            ai.x -= 2.3;

        }

    }


    // GRAVITY

    if (!aiOnGround) {

        aiVelocityY -= GRAVITY;

        ai.y += aiVelocityY;

    }


    // GROUND

    if (ai.y <= 0) {

        ai.y = 0;

        aiVelocityY = 0;

        aiOnGround = true;

    }


    // AI JUMP

    aiDirectionTimer--;

    if (aiDirectionTimer <= 0) {

        aiDirectionTimer =
            100 +
            Math.floor(
                Math.random() * 150
            );

        if (
            Math.abs(distance) < 300 &&
            aiOnGround
        ) {

            aiVelocityY = JUMP * 0.85;

            aiOnGround = false;

        }

    }

}


// ======================================================
// MOBS
// ======================================================

function spawnMobs() {

    mobs = [];

    const count = 5;

    for (let i = 0; i < count; i++) {

        mobs.push({

            id: "mob_" + i,

            x:
                150 +
                Math.random() *
                Math.max(
                    300,
                    (canvas ? canvas.width : 1000) - 300
                ),

            y: 0,

            health: 50,

            maxHealth: 50,

            speed: 1 +
                Math.random() * 0.7,

            dead: false

        });

    }

}


// ======================================================
// BOSS
// ======================================================

function spawnBoss() {

    boss = {

        id: "boss",

        x:
            Math.max(
                500,
                (canvas ? canvas.width : 1000) - 200
            ),

        y: 0,

        health: 500,

        maxHealth: 500,

        speed: 1.1,

        dead: false

    };

}


// ======================================================
// UPDATE MOBS
// ======================================================

function updateMobs() {

    if (!myPlayer) return;

    mobs.forEach(function (mob) {

        if (!mob || mob.dead) return;

        const distance =
            myPlayer.x - mob.x;

        if (Math.abs(distance) > 45) {

            if (distance > 0) {

                mob.x += mob.speed;

            } else {

                mob.x -= mob.speed;

            }

        }

        if (
            Math.abs(distance) < 45 &&
            Math.random() < 0.01
        ) {

            myPlayer.health =
                Math.max(
                    0,
                    (myPlayer.health || 100) - 5
                );

        }

    });

}


// ======================================================
// UPDATE BOSS
// ======================================================

function updateBoss() {

    if (
        !boss ||
        boss.dead ||
        !myPlayer
    ) {

        return;

    }

    const distance =
        myPlayer.x - boss.x;

    if (Math.abs(distance) > 100) {

        if (distance > 0) {

            boss.x += boss.speed;

        } else {

            boss.x -= boss.speed;

        }

    }

    if (
        Math.abs(distance) < 100 &&
        Math.random() < 0.02
    ) {

        myPlayer.health =
            Math.max(
                0,
                (myPlayer.health || 100) - 10
            );

    }

}


// ======================================================
// ATTACK
// ======================================================

function attack() {

    if (
        !gameRunning ||
        !myPlayer
    ) {

        return;

    }

    if (attackCooldown > 0) {
        return;
    }

    attackCooldown = 20;

    attackFlash = 8;

    const attackRange = 115;


    // AI

    if (
        gameMode === "AI" &&
        ai &&
        !ai.dead
    ) {

        if (
            Math.abs(
                myPlayer.x - ai.x
            ) <= attackRange
        ) {

            ai.health =
                Math.max(
                    0,
                    (ai.health || 100) - 25
                );

            if (ai.health <= 0) {

                ai.dead = true;

            }

        }

    }


    // MOBS

    mobs.forEach(function (mob) {

        if (!mob || mob.dead) return;

        if (
            Math.abs(
                myPlayer.x - mob.x
            ) <= attackRange
        ) {

            mob.health -= 25;

            if (mob.health <= 0) {

                mob.health = 0;
                mob.dead = true;

            }

        }

    });


    // BOSS

    if (
        boss &&
        !boss.dead &&
        Math.abs(
            myPlayer.x - boss.x
        ) <= attackRange
    ) {

        boss.health -= 15;

        if (boss.health <= 0) {

            boss.health = 0;
            boss.dead = true;

        }

    }


    // ONLINE ATTACK

    if (gameMode === "ONLINE") {

        socket.emit("playerAttack", {

            x: myPlayer.x,

            y: myPlayer.y,

            range: attackRange

        });

    }

}


// ======================================================
// ATTACK RESULT FROM SERVER
// ======================================================

socket.on("attackResult", function (data) {

    if (!data) return;

    if (data.targetId) {

        if (players[data.targetId]) {

            players[data.targetId].health =
                data.health;

        }

    }

});


// ======================================================
// GAME UI
// ======================================================

function updateGameUI() {

    const score =
        document.getElementById("gameScore");

    if (!score) return;

    const hp =
        myPlayer &&
        Number.isFinite(
            Number(myPlayer.health)
        )
            ? myPlayer.health
            : 100;


    if (
        gameMode === "AI" &&
        ai &&
        !ai.dead
    ) {

        score.textContent =
            "❤️ " +
            hp +
            " | 🤖 " +
            ai.health;

        return;

    }


    if (boss && !boss.dead) {

        score.textContent =
            "❤️ " +
            hp +
            " | 👹 باس: " +
            boss.health;

        return;

    }


    score.textContent =
        "❤️ " + hp;

}


// ======================================================
// SKY
// ======================================================

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

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // SUN

    ctx.fillStyle = "#fde047";

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


function drawCloud(x, y, scale) {

    if (!ctx) return;

    ctx.fillStyle = "#ffffffcc";

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

    if (!ctx || !canvas) return;

    const ground = getGroundY();

    ctx.fillStyle = "#22c55e";

    ctx.fillRect(
        0,
        ground,
        canvas.width,
        120
    );

    ctx.fillStyle = "#166534";

    ctx.fillRect(
        0,
        ground,
        canvas.width,
        9
    );

    ctx.fillStyle = "#92400e";

    ctx.fillRect(
        0,
        ground + 9,
        canvas.width,
        111
    );

    ctx.fillStyle = "#6b3f1f";

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
// STICKMAN
// ======================================================

function drawStickman(
    player,
    isAI = false
) {

    if (!ctx || !player) return;

    const x = player.x;

    /*
     * THIS IS THE IMPORTANT PART.
     *
     * player.y is height above ground,
     * not a screen Y.
     */

    const y = getScreenY(player);

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

    const skin = "#f4c7a1";
    const shoe = "#111827";

    const shirt =
        isAI
            ? "#dc2626"
            : "#22c55e";


    ctx.save();

    ctx.lineCap = "round";
    ctx.lineJoin = "round";


    // SHADOW

    ctx.fillStyle =
        "rgba(0,0,0,0.20)";

    ctx.beginPath();

    ctx.ellipse(
        x,
        getGroundY() + 62 * s,
        32 * s,
        8 * s,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // LEGS

    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 8 * s;

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

    ctx.fillStyle = shoe;

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

    ctx.fillStyle = shirt;

    roundRect(
        x - 19 * s,
        y - 28 * s,
        38 * s,
        50 * s,
        12 * s
    );

    ctx.fill();


    // BODY

    ctx.fillStyle = bodyColor;

    roundRect(
        x - 13 * s,
        y - 22 * s,
        26 * s,
        35 * s,
        8 * s
    );

    ctx.fill();


    // ARMS

    ctx.strokeStyle = bodyDark;
    ctx.lineWidth = 8 * s;

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

    ctx.fillStyle = skin;

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

    roundRect(
        x - 8 * s,
        y - 40 * s,
        16 * s,
        14 * s,
        5 * s
    );

    ctx.fill();


    // HEAD

    ctx.fillStyle = skin;

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

    ctx.fillStyle = "#111827";

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

    ctx.fillStyle = "#111827";

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

    ctx.fillStyle = "#ffffff";

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        name,
        x,
        y - 93 * s
    );


    if (isAI) {

        ctx.fillStyle = "#facc15";

        ctx.font =
            `bold ${12 * s}px Arial`;

        ctx.fillText(
            "🤖",
            x,
            y - 118 * s
        );

    }


    // HP BAR

    if (
        player.health !== undefined &&
        !player.dead
    ) {

        const hp =
            Math.max(
                0,
                Math.min(
                    100,
                    Number(player.health)
                )
            );

        const barWidth = 70 * s;

        ctx.fillStyle = "#111827";

        ctx.fillRect(
            x - barWidth / 2,
            y - 130 * s,
            barWidth,
            7 * s
        );

        ctx.fillStyle = "#22c55e";

        ctx.fillRect(
            x - barWidth / 2,
            y - 130 * s,
            barWidth * hp / 100,
            7 * s
        );

    }


    ctx.restore();

}


// ======================================================
// MOB DRAW
// ======================================================

function drawMob(mob) {

    if (
        !ctx ||
        !mob ||
        mob.dead
    ) {
        return;
    }

    const x = mob.x;
    const y = getScreenY(mob);

    ctx.save();

    ctx.fillStyle = "#7c3aed";

    ctx.beginPath();

    ctx.arc(
        x,
        y - 30,
        25,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#ef4444";

    ctx.beginPath();

    ctx.arc(
        x - 8,
        y - 34,
        4,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + 8,
        y - 34,
        4,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#111827";

    ctx.fillRect(
        x - 30,
        y - 70,
        60,
        6
    );

    ctx.fillStyle = "#22c55e";

    ctx.fillRect(
        x - 30,
        y - 70,
        60 * mob.health / mob.maxHealth,
        6
    );

    ctx.restore();

}


// ======================================================
// BOSS DRAW
// ======================================================

function drawBoss() {

    if (
        !ctx ||
        !boss ||
        boss.dead
    ) {
        return;
    }

    const x = boss.x;
    const y = getScreenY(boss);

    ctx.save();

    ctx.fillStyle = "#991b1b";

    ctx.beginPath();

    ctx.arc(
        x,
        y - 55,
        45,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // HORNS

    ctx.fillStyle = "#facc15";

    ctx.beginPath();

    ctx.moveTo(
        x - 35,
        y - 85
    );

    ctx.lineTo(
        x - 55,
        y - 125
    );

    ctx.lineTo(
        x - 15,
        y - 100
    );

    ctx.fill();

    ctx.beginPath();

    ctx.moveTo(
        x + 35,
        y - 85
    );

    ctx.lineTo(
        x + 55,
        y - 125
    );

    ctx.lineTo(
        x + 15,
        y - 100
    );

    ctx.fill();


    // EYES

    ctx.fillStyle = "#fef08a";

    ctx.beginPath();

    ctx.arc(
        x - 15,
        y - 60,
        6,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + 15,
        y - 60,
        6,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // HP

    ctx.fillStyle = "#111827";

    ctx.fillRect(
        x - 60,
        y - 140,
        120,
        10
    );

    ctx.fillStyle = "#ef4444";

    ctx.fillRect(
        x - 60,
        y - 140,
        120 *
            boss.health /
            boss.maxHealth,
        10
    );


    ctx.fillStyle = "#ffffff";

    ctx.font = "bold 18px Arial";

    ctx.textAlign = "center";

    ctx.fillText(
        "👹 BOSS",
        x,
        y - 150
    );

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

    if (!ctx || !canvas) return;

    drawSky();

    drawGround();


    // ONLINE PLAYERS

    if (gameMode === "ONLINE") {

        Object.values(players).forEach(
            function (player) {

                if (!player) return;

                if (
                    player.id === socket.id
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


    // MY PLAYER

    if (myPlayer) {

        drawStickman(
            myPlayer,
            false
        );

    }


    // AI

    if (
        ai &&
        !ai.dead
    ) {

        drawStickman(
            ai,
            true
        );

    }


    // MOBS

    mobs.forEach(function (mob) {

        drawMob(mob);

    });


    // BOSS

    drawBoss();


    // ATTACK EFFECT

    if (attackFlash > 0 && myPlayer) {

        const x = myPlayer.x;
        const y = getScreenY(myPlayer);

        ctx.save();

        ctx.strokeStyle = "#facc15";

        ctx.lineWidth = 8;

        ctx.beginPath();

        ctx.arc(
            x,
            y - 10,
            70,
            -0.8,
            0.8
        );

        ctx.stroke();

        ctx.restore();

    }

}


// ======================================================
// GAME LOOP
// ======================================================

function gameLoop() {

    if (!gameRunning) return;


    if (attackCooldown > 0) {
        attackCooldown--;
    }

    if (attackFlash > 0) {
        attackFlash--;
    }


    updatePlayer();


    if (gameMode === "AI") {

        updateAI();

    }


    updateMobs();

    updateBoss();

    updateGameUI();

    drawGame();


    requestAnimationFrame(gameLoop);

}


// ======================================================
// START
// ======================================================

resizeCanvas();
