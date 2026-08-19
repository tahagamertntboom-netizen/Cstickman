const socket = io();

// =====================================================
// STATE
// =====================================================

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

// =====================================================
// HEALTH / COMBAT
// =====================================================

const MAX_HEALTH = 100;

let playerHealth = MAX_HEALTH;

let attackCooldown = 0;
let attackTimer = 0;

const ATTACK_COOLDOWN = 25;
const ATTACK_DURATION = 10;
const ATTACK_RANGE = 105;
const ATTACK_DAMAGE = 25;

let damageFlash = 0;
let deathTimer = 0;

// =====================================================
// AI
// =====================================================

let ai = null;
let aiVelocityY = 0;
let aiOnGround = false;
let aiDirectionTimer = 0;

// =====================================================
// MONSTERS
// =====================================================

let monsters = [];

let monsterIdCounter = 0;

const MONSTER_TYPES = {
    normal: {
        name: "👾 هیولا",
        health: 60,
        damage: 8,
        speed: 1.4,
        range: 60,
        color: "#7c3aed",
        size: 1
    },

    fast: {
        name: "👹 سریع",
        health: 45,
        damage: 6,
        speed: 2.3,
        range: 55,
        color: "#dc2626",
        size: 0.85
    },

    tank: {
        name: "🧟 قوی",
        health: 140,
        damage: 13,
        speed: 0.8,
        range: 70,
        color: "#166534",
        size: 1.25
    },

    boss: {
        name: "👑 BOSS",
        health: 500,
        damage: 25,
        speed: 0.65,
        range: 100,
        color: "#991b1b",
        size: 1.8
    }
};

// =====================================================
// ELEMENTS
// =====================================================

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

// =====================================================
// FULLSCREEN
// =====================================================

async function enterGameFullscreen() {

    try {

        if (document.fullscreenElement) {
            return;
        }

        if (
            document.documentElement.requestFullscreen
        ) {

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

// =====================================================
// NAME
// =====================================================

if (confirmName) {

    confirmName.onclick = function () {

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

// =====================================================
// MODE
// =====================================================

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

// =====================================================
// OFFLINE
// =====================================================

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

// =====================================================
// START OFFLINE
// =====================================================

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

    playerHealth = MAX_HEALTH;

    setupOfflinePlayers(withAI);

    resizeCanvas();

    spawnMonsters();

    requestAnimationFrame(gameLoop);

}

// =====================================================
// OFFLINE PLAYERS
// =====================================================

function setupOfflinePlayers(withAI) {

    players = {};

    const ground = getGroundY();

    myPlayer = {

        id: "player",

        name:
            playerName || "Player",

        x: Math.max(
            120,
            canvas
                ? canvas.width / 2
                : 400
        ),

        y: ground,

        health: MAX_HEALTH

    };

    players.player = myPlayer;

    onGround = true;
    velocityY = 0;

    if (withAI) {

        ai = {

            id: "ai",

            name: "AI",

            x:
                myPlayer.x + 300,

            y: ground,

            health: 100

        };

        aiOnGround = true;

    } else {

        ai = null;

    }

    const modeText =
        document.getElementById("gameMode");

    if (modeText) {

        modeText.textContent =
            withAI
                ? "🤖 بازی با AI"
                : "👤 بازی تنهایی";

    }

}

// =====================================================
// MONSTER SPAWN
// =====================================================

function spawnMonsters() {

    monsters = [];

    const ground = getGroundY();

    const width =
        canvas
            ? canvas.width
            : window.innerWidth;

    const positions = [

        width * 0.25,
        width * 0.45,
        width * 0.68,
        width * 0.85

    ];

    positions.forEach(
        function (x, index) {

            const type =
                index === 2
                    ? "fast"
                    : "normal";

            createMonster(
                type,
                x,
                ground
            );

        }
    );

    // BOSS
    createMonster(
        "boss",
        Math.max(
            width - 180,
            500
        ),
        ground
    );

}

// =====================================================
// CREATE MONSTER
// =====================================================

function createMonster(
    type,
    x,
    y
) {

    const data =
        MONSTER_TYPES[type] ||
        MONSTER_TYPES.normal;

    monsters.push({

        id:
            "monster_" +
            (++monsterIdCounter),

        type: type,

        name: data.name,

        x: x,

        y: y,

        health: data.health,

        maxHealth: data.health,

        damage: data.damage,

        speed: data.speed,

        range: data.range,

        color: data.color,

        size: data.size,

        attackCooldown: 0,

        attackTimer: 0,

        dead: false

    });

}

// =====================================================
// ONLINE
// =====================================================

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

// =====================================================
// ROOM CREATED
// =====================================================

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

            createRoom.disabled = false;

            createRoom.textContent =
                "🏠 ساخت اتاق";

        }

    }
);

// =====================================================
// JOIN ROOM
// =====================================================

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

// =====================================================
// ROOM JOINED
// =====================================================

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

            joinRoom.disabled = false;

            joinRoom.textContent =
                "🚪 ورود";

        }

    }
);

// =====================================================
// READY
// =====================================================

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

// =====================================================
// READY UPDATE
// =====================================================

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

// =====================================================
// START ONLINE
// =====================================================

socket.on(
    "startGame",
    async function () {

        await enterGameFullscreen();

        gameMode = "ONLINE";

        roomScreen.classList.add("hidden");

        gameScreen.style.display =
            "block";

        gameRunning = true;

        playerHealth = MAX_HEALTH;

        resizeCanvas();

        spawnMonsters();

        requestAnimationFrame(gameLoop);

    }
);

// =====================================================
// CANVAS
// =====================================================

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

    if (myPlayer && onGround) {

        myPlayer.y = ground;

    }

    if (ai && aiOnGround) {

        ai.y = ground;

    }

    monsters.forEach(
        function (monster) {

            if (monster) {
                monster.y = ground;
            }

        }
    );

}

window.addEventListener(
    "resize",
    resizeCanvas
);

// =====================================================
// GROUND
// =====================================================

function getGroundY() {

    if (!canvas) {
        return 500;
    }

    return canvas.height - 120;

}

// =====================================================
// SPAWN FIX
// =====================================================

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

        player.y = ground;

    }

}

// =====================================================
// ONLINE PLAYERS
// =====================================================

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
                    player.id ===
                    socket.id
                ) {

                    myPlayer =
                        player;

                    if (
                        player.health !==
                        undefined
                    ) {

                        playerHealth =
                            Number(
                                player.health
                            ) ||
                            MAX_HEALTH;

                    }

                    onGround = true;
                    velocityY = 0;

                }

            }
        );

    }
);

// =====================================================
// PLAYER MOVED
// =====================================================

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

// =====================================================
// PLAYER LEFT
// =====================================================

socket.on(
    "playerLeft",
    function (id) {

        delete players[id];

    }
);

// =====================================================
// ROOM ERROR
// =====================================================

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

            joinRoom.disabled = false;

            joinRoom.textContent =
                "🚪 ورود";

        }

        if (createRoom) {

            createRoom.disabled = false;

            createRoom.textContent =
                "🏠 ساخت اتاق";

        }

    }
);

// =====================================================
// CONTROLS
// =====================================================

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

        if (
            e.key.toLowerCase() ===
            "f"
        ) {

            keys.attack = true;

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

        if (
            e.key.toLowerCase() ===
            "f"
        ) {

            keys.attack = false;

        }

    }
);

// =====================================================
// MOBILE ATTACK BUTTON
// =====================================================

function createAttackButton() {

    if (
        document.getElementById(
            "attackButton"
        )
    ) {

        return;

    }

    const button =
        document.createElement("button");

    button.id =
        "attackButton";

    button.textContent =
        "⚔️";

    button.style.position =
        "fixed";

    button.style.right =
        "25px";

    button.style.bottom =
        "25px";

    button.style.width =
        "78px";

    button.style.height =
        "78px";

    button.style.padding =
        "0";

    button.style.margin =
        "0";

    button.style.borderRadius =
        "22px";

    button.style.border =
        "2px solid #ffffff55";

    button.style.background =
        "#dc2626dd";

    button.style.color =
        "white";

    button.style.fontSize =
        "32px";

    button.style.zIndex =
        "50";

    button.style.display =
        "none";

    button.style.touchAction =
        "none";

    document.body.appendChild(button);

    function attackDown(e) {

        e.preventDefault();

        keys.attack = true;

    }

    function attackUp(e) {

        e.preventDefault();

        keys.attack = false;

    }

    button.addEventListener(
        "touchstart",
        attackDown,
        { passive: false }
    );

    button.addEventListener(
        "touchend",
        attackUp,
        { passive: false }
    );

    button.addEventListener(
        "touchcancel",
        attackUp,
        { passive: false }
    );

    button.addEventListener(
        "mousedown",
        attackDown
    );

    button.addEventListener(
        "mouseup",
        attackUp
    );

}

createAttackButton();

// =====================================================
// MOBILE CONTROLS
// =====================================================

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

// =====================================================
// PLAYER PHYSICS
// =====================================================

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

        myPlayer.y = ground;

        velocityY = 0;

        onGround = true;

    }

    /*
     * کل عرض مپ قابل حرکت است.
     * دیگر محدود به نصف صفحه نیست.
     */

    if (myPlayer.x < 35) {

        myPlayer.x = 35;

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

// =====================================================
// AI
// =====================================================

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

// =====================================================
// MONSTER UPDATE
// =====================================================

function updateMonsters() {

    if (!myPlayer) return;

    const ground =
        getGroundY();

    monsters.forEach(
        function (monster) {

            if (
                !monster ||
                monster.dead
            ) {

                return;

            }

            // دوباره روی زمین
            monster.y = ground;

            const distance =
                myPlayer.x -
                monster.x;

            const absDistance =
                Math.abs(distance);

            // دنبال پلیر
            if (
                absDistance >
                monster.range
            ) {

                if (distance > 0) {

                    monster.x +=
                        monster.speed;

                } else {

                    monster.x -=
                        monster.speed;

                }

            }

            // مرزهای مپ
            if (monster.x < 35) {
                monster.x = 35;
            }

            if (
                canvas &&
                monster.x >
                canvas.width - 35
            ) {

                monster.x =
                    canvas.width - 35;

            }

            // کاهش کول‌داون
            if (
                monster.attackCooldown > 0
            ) {

                monster.attackCooldown--;

            }

            if (
                monster.attackTimer > 0
            ) {

                monster.attackTimer--;

            }

            // حمله
            if (
                absDistance <=
                    monster.range &&
                monster.attackCooldown <= 0
            ) {

                monster.attackCooldown =
                    monster.type === "boss"
                        ? 70
                        : 55;

                monster.attackTimer =
                    12;

                damagePlayer(
                    monster.damage
                );

            }

        }
    );

}

// =====================================================
// PLAYER ATTACK
// =====================================================

function updateAttack() {

    if (attackCooldown > 0) {

        attackCooldown--;

    }

    if (attackTimer > 0) {

        attackTimer--;

    }

    if (
        keys.attack &&
        attackCooldown <= 0 &&
        gameRunning
    ) {

        attack();

        attackCooldown =
            ATTACK_COOLDOWN;

    }

}

// =====================================================
// ATTACK
// =====================================================

function attack() {

    if (!myPlayer) return;

    attackTimer =
        ATTACK_DURATION;

    let hitSomething = false;

    monsters.forEach(
        function (monster) {

            if (
                !monster ||
                monster.dead
            ) {

                return;

            }

            const distance =
                Math.abs(
                    myPlayer.x -
                    monster.x
                );

            if (
                distance <=
                ATTACK_RANGE
            ) {

                monster.health -=
                    ATTACK_DAMAGE;

                hitSomething = true;

                monster.hitFlash =
                    8;

                if (
                    monster.health <= 0
                ) {

                    killMonster(
                        monster
                    );

                }

            }

        }
    );

    // AI هم قابل ضربه است
    if (
        ai &&
        Math.abs(
            myPlayer.x - ai.x
        ) <= ATTACK_RANGE
    ) {

        ai.health =
            Math.max(
                0,
                (ai.health || 100) -
                ATTACK_DAMAGE
            );

        hitSomething = true;

        if (ai.health <= 0) {

            ai.health = 100;

            ai.x =
                Math.min(
                    canvas.width - 150,
                    myPlayer.x + 250
                );

            ai.y =
                getGroundY();

        }

    }

    if (
        gameMode === "ONLINE"
    ) {

        socket.emit(
            "playerAttack",
            {
                x: myPlayer.x,
                damage: ATTACK_DAMAGE,
                range: ATTACK_RANGE
            }
        );

    }

}

// =====================================================
// KILL MONSTER
// =====================================================

function killMonster(monster) {

    if (!monster || monster.dead) {
        return;
    }

    monster.dead = true;
    monster.health = 0;

    /*
     * بعد از کمی زمان دوباره اسپان می‌شود.
     */

    setTimeout(
        function () {

            const index =
                monsters.indexOf(monster);

            if (index === -1) {
                return;
            }

            const type =
                monster.type;

            const newX =
                Math.random() *
                    (
                        canvas.width - 150
                    ) +
                    75;

            monsters[index] = null;

            setTimeout(
                function () {

                    monsters[index] =
                        createMonsterAtIndex(
                            type,
                            newX,
                            getGroundY()
                        );

                },
                type === "boss"
                    ? 8000
                    : 3000
            );

        },
        100
    );

}

// =====================================================
// CREATE MONSTER AT INDEX
// =====================================================

function createMonsterAtIndex(
    type,
    x,
    y
) {

    const data =
        MONSTER_TYPES[type] ||
        MONSTER_TYPES.normal;

    return {

        id:
            "monster_" +
            (++monsterIdCounter),

        type: type,

        name: data.name,

        x: x,

        y: y,

        health: data.health,

        maxHealth: data.health,

        damage: data.damage,

        speed: data.speed,

        range: data.range,

        color: data.color,

        size: data.size,

        attackCooldown: 40,

        attackTimer: 0,

        dead: false,

        hitFlash: 0

    };

}

// =====================================================
// PLAYER DAMAGE
// =====================================================

function damagePlayer(amount) {

    if (
        !myPlayer ||
        deathTimer > 0
    ) {

        return;

    }

    playerHealth =
        Math.max(
            0,
            playerHealth - amount
        );

    damageFlash = 8;

    myPlayer.health =
        playerHealth;

    if (
        gameMode === "ONLINE"
    ) {

        socket.emit(
            "playerHealth",
            {
                health: playerHealth
            }
        );

    }

    if (
        playerHealth <= 0
    ) {

        playerDeath();

    }

}

// =====================================================
// PLAYER DEATH
// =====================================================

function playerDeath() {

    if (deathTimer > 0) {
        return;
    }

    deathTimer = 90;

    gameRunning = false;

    setTimeout(
        function () {

            respawnPlayer();

        },
        1200
    );

}

// =====================================================
// RESPAWN
// =====================================================

function respawnPlayer() {

    const ground =
        getGroundY();

    playerHealth =
        MAX_HEALTH;

    velocityY = 0;

    onGround = true;

    if (myPlayer) {

        myPlayer.health =
            MAX_HEALTH;

        /*
         * اسپان همیشه روی زمین
         */

        myPlayer.x =
            canvas
                ? canvas.width / 2
                : 400;

        myPlayer.y =
            ground;

    }

    deathTimer = 0;

    gameRunning = true;

}

// =====================================================
// GAME UI
// =====================================================

function updateGameUI() {

    const score =
        document.getElementById(
            "gameScore"
        );

    if (!score) return;

    if (deathTimer > 0) {

        score.textContent =
            "💀 مردی! دوباره اسپان میشی...";

        return;

    }

    let bossAlive =
        monsters.find(
            function (m) {

                return (
                    m &&
                    !m.dead &&
                    m.type === "boss"
                );

            }
        );

    if (bossAlive) {

        score.textContent =
            "❤️ " +
            playerHealth +
            "   👑 BOSS: " +
            bossAlive.health +
            "/" +
            bossAlive.maxHealth;

        return;

    }

    score.textContent =
        "❤️ " +
        playerHealth;

}

// =====================================================
// SKY
// =====================================================

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

// =====================================================
// GROUND
// =====================================================

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

// =====================================================
// MONSTER DRAW
// =====================================================

function drawMonster(monster) {

    if (
        !ctx ||
        !monster ||
        monster.dead
    ) {

        return;

    }

    const x =
        monster.x;

    const y =
        monster.y;

    const s =
        monster.size;

    // SHADOW

    ctx.fillStyle =
        "rgba(0,0,0,.25)";

    ctx.beginPath();

    ctx.ellipse(
        x,
        y + 10 * s,
        35 * s,
        9 * s,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // BODY

    ctx.fillStyle =
        monster.hitFlash > 0
            ? "#ffffff"
            : monster.color;

    ctx.beginPath();

    ctx.arc(
        x,
        y - 35 * s,
        32 * s,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // EARS / HORNS

    ctx.beginPath();

    ctx.moveTo(
        x - 22 * s,
        y - 55 * s
    );

    ctx.lineTo(
        x - 38 * s,
        y - 82 * s
    );

    ctx.lineTo(
        x - 8 * s,
        y - 65 * s
    );

    ctx.fill();

    ctx.beginPath();

    ctx.moveTo(
        x + 22 * s,
        y - 55 * s
    );

    ctx.lineTo(
        x + 38 * s,
        y - 82 * s
    );

    ctx.lineTo(
        x + 8 * s,
        y - 65 * s
    );

    ctx.fill();

    // EYES

    ctx.fillStyle =
        "#facc15";

    ctx.beginPath();

    ctx.arc(
        x - 11 * s,
        y - 40 * s,
        6 * s,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
        x + 11 * s,
        y - 40 * s,
        6 * s,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // MOUTH

    ctx.strokeStyle =
        "#111827";

    ctx.lineWidth =
        5 * s;

    ctx.beginPath();

    ctx.moveTo(
        x - 12 * s,
        y - 22 * s
    );

    ctx.lineTo(
        x + 12 * s,
        y - 22 * s
    );

    ctx.stroke();

    // LEGS

    ctx.strokeStyle =
        monster.color;

    ctx.lineWidth =
        10 * s;

    ctx.beginPath();

    ctx.moveTo(
        x - 15 * s,
        y - 5 * s
    );

    ctx.lineTo(
        x - 25 * s,
        y + 35 * s
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        x + 15 * s,
        y - 5 * s
    );

    ctx.lineTo(
        x + 25 * s,
        y + 35 * s
    );

    ctx.stroke();

    // HEALTH BAR

    const barWidth =
        70 * s;

    const barHeight =
        8 * s;

    const healthPercent =
        Math.max(
            0,
            monster.health /
                monster.maxHealth
        );

    ctx.fillStyle =
        "#111827";

    ctx.fillRect(
        x - barWidth / 2,
        y - 105 * s,
        barWidth,
        barHeight
    );

    ctx.fillStyle =
        "#22c55e";

    ctx.fillRect(
        x - barWidth / 2,
        y - 105 * s,
        barWidth * healthPercent,
        barHeight
    );

    // NAME

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        `bold ${12 * s}px Arial`;

    ctx.textAlign =
        "center";

    ctx.fillText(
        monster.name,
        x,
        y - 115 * s
    );

    if (
        monster.type === "boss"
    ) {

        ctx.fillStyle =
            "#facc15";

        ctx.font =
            `bold ${18 * s}px Arial`;

        ctx.fillText(
            "👑",
            x,
            y - 130 * s
        );

    }

    if (
        monster.hitFlash > 0
    ) {

        monster.hitFlash--;

    }

}

// =====================================================
// STICKMAN
// =====================================================

function drawStickman(
    player,
    isAI = false
) {

    if (!ctx || !player) {
        return;
    }

    const x = player.x;
    const y = player.y;

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

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

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

    // ATTACK EFFECT

    if (
        player === myPlayer &&
        attackTimer > 0
    ) {

        ctx.strokeStyle =
            "#facc15";

        ctx.lineWidth =
            7;

        ctx.beginPath();

        ctx.arc(
            x + 50,
            y - 15,
            45,
            -0.8,
            0.8
        );

        ctx.stroke();

    }

    ctx.restore();

}

// =====================================================
// ROUND RECT
// =====================================================

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

// =====================================================
// DRAW GAME
// =====================================================

function drawGame() {

    if (!ctx || !canvas) {
        return;
    }

    drawSky();

    drawGround();

    // MONSTERS

    monsters.forEach(
        function (monster) {

            drawMonster(monster);

        }
    );

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

    // DAMAGE FLASH

    if (damageFlash > 0) {

        ctx.fillStyle =
            "rgba(255,0,0,.18)";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        damageFlash--;

    }

}

// =====================================================
// MOBILE ATTACK VISIBILITY
// =====================================================

function updateMobileAttackVisibility() {

    const button =
        document.getElementById(
            "attackButton"
        );

    if (!button) return;

    const isMobile =
        window.innerWidth <= 900;

    button.style.display =
        isMobile &&
        gameRunning
            ? "block"
            : "none";

}

// =====================================================
// GAME LOOP
// =====================================================

function gameLoop() {

    if (!gameRunning) {

        drawGame();

        requestAnimationFrame(
            gameLoop
        );

        return;

    }

    updatePlayer();

    if (
        gameMode === "AI"
    ) {

        updateAI();

    }

    updateMonsters();

    updateAttack();

    updateGameUI();

    updateMobileAttackVisibility();

    drawGame();

    requestAnimationFrame(
        gameLoop
    );

}

// =====================================================
// RESPAWN MONSTERS IF EMPTY
// =====================================================

setInterval(
    function () {

        if (!gameRunning) {
            return;
        }

        monsters =
            monsters.filter(
                function (m) {
                    return m !== null;
                }
            );

        if (
            monsters.length === 0
        ) {

            spawnMonsters();

        }

    },
    5000
);

// =====================================================
// END
// =====================================================
