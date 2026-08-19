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

let ai = null;
let aiVelocityY = 0;
let aiOnGround = false;
let aiDirectionTimer = 0;

let enemies = {};

let attackCooldown = 0;
let attackAnimation = 0;


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
const roomCodeElement = document.getElementById("roomCode");
const roomStatus = document.getElementById("roomStatus");

const backFromOnline =
    document.getElementById("backFromOnline");


// =======================================
// CANVAS
// =======================================

const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas
        ? canvas.getContext("2d")
        : null;


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

        console.log(
            "Fullscreen unavailable:",
            error
        );

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
    enemies = {};

    myPlayer = {

        id: "player",

        name:
            playerName || "Player",

        x: 250,

        y: 0,

        health: 100,
        maxHealth: 100,

        level: 1,
        xp: 0

    };

    players.player =
        myPlayer;


    if (withAI) {

        ai = {

            id: "ai",

            name: "AI",

            x: 700,

            y: 0,

            health: 100,

            maxHealth: 100,

            level: 1,

            xp: 0

        };

    } else {

        ai = null;

    }


    // اولین دشمن آفلاین

    createOfflineEnemy();


    const modeText =
        document.getElementById("gameMode");

    if (modeText) {

        modeText.textContent =
            withAI
                ? "🤖 بازی با AI"
                : "👤 بازی تنهایی";

    }

}


// =======================================
// OFFLINE ENEMY
// =======================================

function createOfflineEnemy() {

    const level =
        myPlayer
            ? myPlayer.level
            : 1;

    const enemy =
        createEnemyObject(level);

    enemies[enemy.id] =
        enemy;

}


// =======================================
// ENEMY OBJECT
// =======================================

function createEnemyObject(level) {

    const types = {

        1: {
            name: "موجود سبز",
            emoji: "👹",
            color: "#ef4444",
            health: 50,
            damage: 5,
            speed: 1.2
        },

        2: {
            name: "گرگ",
            emoji: "🐺",
            color: "#64748b",
            health: 80,
            damage: 8,
            speed: 1.6
        },

        3: {
            name: "خفاش",
            emoji: "🦇",
            color: "#7c3aed",
            health: 110,
            damage: 10,
            speed: 2
        },

        4: {
            name: "هیولای آتش",
            emoji: "🔥",
            color: "#f97316",
            health: 160,
            damage: 14,
            speed: 2.2
        },

        5: {
            name: "باس نهایی",
            emoji: "👿",
            color: "#991b1b",
            health: 400,
            damage: 20,
            speed: 2.5
        }

    };


    const type =
        types[
            Math.min(level, 5)
        ] ||
        types[1];


    return {

        id:
            "offline_enemy_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .substring(2, 8),

        name: type.name,

        emoji: type.emoji,

        color: type.color,

        x:
            500 +
            Math.random() * 1000,

        y: 0,

        health: type.health,

        maxHealth: type.health,

        damage: type.damage,

        speed: type.speed,

        level: level

    };

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

            players[
                myPlayer.id
            ] = myPlayer;

        }

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
                document.getElementById("onlineError");

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

            players[
                myPlayer.id
            ] = myPlayer;

        }

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


// =======================================
// READY
// =======================================

if (readyButton) {

    readyButton.onclick =
        async function () {

            await enterGameFullscreen();

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
// START ONLINE GAME
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

        gameRunning = true;

        resizeCanvas();

        requestAnimationFrame(gameLoop);

    }
);


// =======================================
// RESIZE
// =======================================

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
// SPAWN FIX
// =======================================

function fixPlayerSpawn(player) {

    if (!player) return;

    const ground =
        getGroundY();

    if (
        player.y === undefined ||
        player.y === null ||
        !Number.isFinite(
            Number(player.y)
        ) ||
        Number(player.y) <= 0
    ) {

        player.y =
            ground;

    }

}


// =======================================
// PLAYERS UPDATE
// =======================================

socket.on(
    "playersUpdate",
    function (list) {

        if (!Array.isArray(list)) {
            return;
        }

        players = {};

        list.forEach(
            function (player) {

                if (!player) return;

                fixPlayerSpawn(player);

                players[
                    player.id
                ] = player;

                if (
                    player.id ===
                    socket.id
                ) {

                    myPlayer =
                        player;

                    if (
                        velocityY === 0
                    ) {

                        onGround =
                            true;

                    }

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
    function (id) {

        delete players[id];

    }
);


// =======================================
// ENEMIES UPDATE
// =======================================

socket.on(
    "enemiesUpdate",
    function (list) {

        enemies = {};

        if (!Array.isArray(list)) {
            return;
        }

        list.forEach(
            function (enemy) {

                if (!enemy) return;

                fixEnemySpawn(enemy);

                enemies[
                    enemy.id
                ] = enemy;

            }
        );

    }
);


// =======================================
// ENEMY SPAWN FIX
// =======================================

function fixEnemySpawn(enemy) {

    if (!enemy) return;

    const ground =
        getGroundY();

    if (
        enemy.y === undefined ||
        enemy.y === null ||
        !Number.isFinite(
            Number(enemy.y)
        ) ||
        Number(enemy.y) <= 0
    ) {

        enemy.y =
            ground;

    }

}


// =======================================
// ENEMY HIT
// =======================================

socket.on(
    "enemyHit",
    function (data) {

        if (!data) return;

        const enemy =
            enemies[data.id];

        if (!enemy) return;

        enemy.health =
            data.health;

        attackAnimation =
            8;

    }
);


// =======================================
// PLAYER STATS
// =======================================

socket.on(
    "playerStats",
    function (stats) {

        if (!myPlayer || !stats) {
            return;
        }

        if (
            typeof stats.health ===
            "number"
        ) {

            myPlayer.health =
                stats.health;

        }

        if (
            typeof stats.level ===
            "number"
        ) {

            myPlayer.level =
                stats.level;

        }

        if (
            typeof stats.xp ===
            "number"
        ) {

            myPlayer.xp =
                stats.xp;

        }

    }
);


// =======================================
// LEVEL UP
// =======================================

socket.on(
    "playerLevelUp",
    function (data) {

        if (!data) return;

        if (
            myPlayer &&
            data.id === socket.id
        ) {

            myPlayer.level =
                data.level;

            myPlayer.xp =
                0;

            showLevelUp();

        }

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
// CONTROLS
// =======================================

const keys = {};

document.addEventListener(
    "keydown",
    function (e) {

        keys[
            e.key.toLowerCase()
        ] = true;

        if (
            e.code === "Space"
        ) {

            keys.space = true;

        }

        if (
            e.key.toLowerCase() === "f"
        ) {

            attack();

        }

    }
);


document.addEventListener(
    "keyup",
    function (e) {

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
// MOBILE BUTTON
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
        function (e) {

            e.preventDefault();

            keys[key] = true;

            if (
                key === "mobileAttack"
            ) {

                attack();

            }

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

            if (
                key === "mobileAttack"
            ) {

                attack();

            }

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

setupMobileButton(
    "attackButton",
    "mobileAttack"
);


// =======================================
// ATTACK
// =======================================

function attack() {

    if (!gameRunning) return;

    if (attackCooldown > 0) {
        return;
    }

    attackCooldown =
        20;

    attackAnimation =
        10;


    // OFFLINE

    if (
        gameMode === "AI" ||
        gameMode === "SOLO"
    ) {

        offlineAttack();

        return;

    }


    // ONLINE

    if (
        gameMode === "ONLINE"
    ) {

        socket.emit(
            "playerAttack"
        );

    }

}


// =======================================
// OFFLINE ATTACK
// =======================================

function offlineAttack() {

    if (!myPlayer) return;

    const RANGE =
        100;

    const DAMAGE =
        25;


    Object.keys(
        enemies
    ).forEach(
        function (id) {

            const enemy =
                enemies[id];

            if (!enemy) return;

            const distance =
                Math.abs(
                    myPlayer.x -
                    enemy.x
                );

            if (
                distance <=
                RANGE
            ) {

                enemy.health -=
                    DAMAGE;

                attackAnimation =
                    10;

                if (
                    enemy.health <=
                    0
                ) {

                    delete enemies[id];

                    addXP(25);

                    setTimeout(
                        function () {

                            if (gameRunning) {

                                createOfflineEnemy();

                            }

                        },
                        1000
                    );

                }

            }

        }
    );

}


// =======================================
// XP
// =======================================

function addXP(amount) {

    if (!myPlayer) return;

    myPlayer.xp += amount;

    const needed =
        myPlayer.level *
        100;


    if (
        myPlayer.xp >=
        needed
    ) {

        myPlayer.xp -=
            needed;

        myPlayer.level++;

        showLevelUp();

    }

}


// =======================================
// LEVEL UP MESSAGE
// =======================================

function showLevelUp() {

    let element =
        document.getElementById(
            "levelUpMessage"
        );

    if (!element) {

        element =
            document.createElement("div");

        element.id =
            "levelUpMessage";

        element.style.position =
            "fixed";

        element.style.left =
            "50%";

        element.style.top =
            "25%";

        element.style.transform =
            "translate(-50%,-50%)";

        element.style.zIndex =
            "999";

        element.style.padding =
            "20px 35px";

        element.style.borderRadius =
            "20px";

        element.style.background =
            "#111827ee";

        element.style.color =
            "#facc15";

        element.style.font =
            "bold 32px Arial";

        element.style.pointerEvents =
            "none";

        document.body.appendChild(
            element
        );

    }


    element.textContent =
        "🎉 LEVEL " +
        myPlayer.level +
        " 🎉";

    element.style.display =
        "block";


    setTimeout(
        function () {

            element.style.display =
                "none";

        },
        1500
    );

}


// =======================================
// PLAYER PHYSICS
// =======================================

function updatePlayer() {

    if (!myPlayer) return;

    let moving =
        false;


    if (
        keys.a ||
        keys.arrowleft ||
        keys.mobileLeft
    ) {

        myPlayer.x -=
            SPEED;

        moving = true;

    }


    if (
        keys.d ||
        keys.arrowright ||
        keys.mobileRight
    ) {

        myPlayer.x +=
            SPEED;

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


    velocityY +=
        GRAVITY;

    myPlayer.y +=
        velocityY;


    const ground =
        getGroundY();


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


    // کل عرض مپ

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


    if (
        Math.abs(distance) >
        35
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


    aiVelocityY +=
        GRAVITY;

    ai.y +=
        aiVelocityY;


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
// ENEMIES UPDATE OFFLINE
// =======================================

function updateOfflineEnemies() {

    if (
        gameMode !== "AI" &&
        gameMode !== "SOLO"
    ) {

        return;

    }

    if (!myPlayer) return;


    Object.values(
        enemies
    ).forEach(
        function (enemy) {

            if (!enemy) return;


            const distance =
                myPlayer.x -
                enemy.x;


            // دنبال بازیکن

            if (
                Math.abs(distance) >
                45
            ) {

                if (
                    distance > 0
                ) {

                    enemy.x +=
                        enemy.speed;

                } else {

                    enemy.x -=
                        enemy.speed;

                }

            }


            // حمله دشمن

            if (
                Math.abs(distance) <
                60
            ) {

                if (
                    Math.random() <
                    0.015
                ) {

                    myPlayer.health -=
                        enemy.damage;

                    if (
                        myPlayer.health <=
                        0
                    ) {

                        myPlayer.health =
                            0;

                        respawnPlayer();

                    }

                }

            }

        }
    );

}


// =======================================
// RESPAWN
// =======================================

function respawnPlayer() {

    if (!myPlayer) return;

    myPlayer.x =
        250;

    myPlayer.y =
        getGroundY();

    myPlayer.health =
        myPlayer.maxHealth ||
        100;

    velocityY =
        0;

    onGround =
        true;

}


// =======================================
// UI
// =======================================

function updateGameUI() {

    const score =
        document.getElementById(
            "gameScore"
        );

    if (!score) return;


    if (!myPlayer) {

        score.textContent =
            "❤️ 100";

        return;

    }


    const level =
        myPlayer.level ||
        1;

    const xp =
        myPlayer.xp ||
        0;

    const health =
        myPlayer.health ??
        100;

    const needed =
        level * 100;


    score.textContent =
        "❤️ " +
        health +
        "  ⭐ LV." +
        level +
        "  XP " +
        xp +
        "/" +
        needed;

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
// ENEMY DRAW
// =======================================

function drawEnemy(enemy) {

    if (
        !ctx ||
        !enemy
    ) return;


    const x =
        enemy.x;

    const y =
        enemy.y;


    // shadow

    ctx.fillStyle =
        "rgba(0,0,0,.25)";

    ctx.beginPath();

    ctx.ellipse(
        x,
        y + 35,
        30,
        8,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // body

    ctx.fillStyle =
        enemy.color ||
        "#ef4444";

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        30,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // eyes

    ctx.fillStyle =
        "#ffffff";

    ctx.beginPath();

    ctx.arc(
        x - 10,
        y - 5,
        7,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + 10,
        y - 5,
        7,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle =
        "#111827";

    ctx.beginPath();

    ctx.arc(
        x - 10,
        y - 5,
        3,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + 10,
        y - 5,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // emoji

    ctx.font =
        "24px Arial";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        enemy.emoji ||
        "👹",
        x,
        y + 4
    );


    // health background

    ctx.fillStyle =
        "#111827";

    ctx.fillRect(
        x - 35,
        y - 48,
        70,
        7
    );


    // health

    const healthPercent =
        Math.max(
            0,
            enemy.health /
            enemy.maxHealth
        );


    ctx.fillStyle =
        "#22c55e";

    ctx.fillRect(
        x - 35,
        y - 48,
        70 *
        healthPercent,
        7
    );


    // name

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "bold 12px Arial";

    ctx.fillText(
        enemy.name ||
        "Enemy",
        x,
        y - 60
    );

}


// =======================================
// STICKMAN
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


    ctx.save();


    ctx.lineCap =
        "round";

    ctx.lineJoin =
        "round";


    // shadow

    ctx.fillStyle =
        "rgba(0,0,0,.20)";

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


    // legs

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


    // shirt

    ctx.fillStyle =
        isAI
            ? "#dc2626"
            : "#22c55e";

    roundRect(
        x - 19 * s,
        y - 28 * s,
        38 * s,
        50 * s,
        12 * s
    );

    ctx.fill();


    // body

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


    // arms

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


    // hands

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


    // neck

    roundRect(
        x - 8 * s,
        y - 40 * s,
        16 * s,
        14 * s,
        5 * s
    );

    ctx.fill();


    // head

    ctx.beginPath();

    ctx.arc(
        x,
        y - 58 * s,
        22 * s,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // hair

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


    // eyes

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


    // attack effect

    if (
        player.id === "player" &&
        attackAnimation > 0
    ) {

        ctx.strokeStyle =
            "#facc15";

        ctx.lineWidth =
            7 * s;

        ctx.beginPath();

        ctx.arc(
            x + 45 * s,
            y - 5 * s,
            35 * s,
            -0.9,
            0.9
        );

        ctx.stroke();

    }


    // name

    const name =
        player.name ||
        (
            isAI
                ? "AI"
                : "Player"
        );


    ctx.font =
        `bold ${Math.max(
            12,
            15 * s
        )}px Arial`;


    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";


    ctx.fillStyle =
        "rgba(17,24,39,.82)";


    const textWidth =
        ctx.measureText(
            name
        ).width;


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


    ctx.fillText(
        name,
        x,
        y - 93 * s
    );


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

    if (!ctx || !canvas) return;


    drawSky();

    drawGround();


    // enemies

    Object.values(
        enemies
    ).forEach(
        function (enemy) {

            drawEnemy(enemy);

        }
    );


    // my player

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


    // online players

    if (
        gameMode === "ONLINE"
    ) {

        Object.values(
            players
        ).forEach(
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


    updateOfflineEnemies();


    if (
        attackCooldown > 0
    ) {

        attackCooldown--;

    }


    if (
        attackAnimation > 0
    ) {

        attackAnimation--;

    }


    updateGameUI();

    drawGame();


    requestAnimationFrame(
        gameLoop
    );

}
