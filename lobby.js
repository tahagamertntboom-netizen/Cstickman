const socket = io();

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

let mobs = {};

let attackCooldown = false;
let attacking = false;

let selectedAdminTarget = null;

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

const attackButton = document.getElementById("attackButton");

const codeButton = document.getElementById("codeButton");
const codePanel = document.getElementById("codePanel");
const closeCode = document.getElementById("closeCode");
const codeInput = document.getElementById("codeInput");
const runCode = document.getElementById("runCode");
const codeResult = document.getElementById("codeResult");

const adminPanel = document.getElementById("adminPanel");
const closeAdmin = document.getElementById("closeAdmin");
const adminCodeInput = document.getElementById("adminCodeInput");
const runAdminCode = document.getElementById("runAdminCode");
const adminResult = document.getElementById("adminResult");
const adminPlayers = document.getElementById("adminPlayers");
const adminTargetText = document.getElementById("adminTargetText");

function showScreen(screen) {

    [
        nameScreen,
        modeScreen,
        offlineScreen,
        onlineScreen,
        roomScreen
    ].forEach(s => {
        if (s) s.classList.add("hidden");
    });

    if (screen) {
        screen.classList.remove("hidden");
    }

    updateAttackButtonVisibility();
}

function updateAttackButtonVisibility() {

    if (!attackButton) return;

    const inGame =
        gameRunning &&
        gameScreen &&
        gameScreen.style.display === "block";

    attackButton.style.display =
        inGame ? "block" : "none";
}

async function enterGameFullscreen() {

    try {

        if (document.fullscreenElement) return;

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

        showScreen(modeScreen);
    };
}

if (nameInput) {

    nameInput.addEventListener(
        "keydown",
        function(e) {

            if (e.key === "Enter") {
                confirmName.click();
            }

        }
    );
}

if (onlineCard) {

    onlineCard.onclick = function() {
        showScreen(onlineScreen);
    };

}

if (offlineCard) {

    offlineCard.onclick = function() {
        showScreen(offlineScreen);
    };

}

if (backToModes) {

    backToModes.onclick = function() {
        showScreen(modeScreen);
    };

}

if (backFromOnline) {

    backFromOnline.onclick = function() {
        showScreen(modeScreen);
    };

}

if (aiCard) {

    aiCard.onclick = async function() {

        await enterGameFullscreen();

        startOfflineGame(true);

    };

}

if (soloCard) {

    soloCard.onclick = async function() {

        await enterGameFullscreen();

        startOfflineGame(false);

    };

}

function startOfflineGame(withAI) {

    gameMode =
        withAI ? "AI" : "SOLO";

    nameScreen.classList.add("hidden");
    modeScreen.classList.add("hidden");
    offlineScreen.classList.add("hidden");
    onlineScreen.classList.add("hidden");
    roomScreen.classList.add("hidden");

    gameScreen.style.display =
        "block";

    gameRunning = true;

    setupOfflinePlayers(withAI);

    resizeCanvas();

    updateAttackButtonVisibility();

    requestAnimationFrame(gameLoop);
}

function setupOfflinePlayers(withAI) {

    players = {};
    mobs = {};

    myPlayer = {

        id: "player",

        name:
            playerName || "Player",

        x: 250,

        y: getGroundY(),

        health: 100,

        maxHealth: 100,

        speed: SPEED,

        jump: JUMP,

        fly: false,

        doubleJump: false,

        color: "#22c55e"

    };

    players.player =
        myPlayer;

    velocityY = 0;
    onGround = true;

    if (withAI) {

        ai = {

            id: "ai",

            name: "AI",

            x: Math.min(
                700,
                Math.max(
                    450,
                    canvas.width - 250
                )
            ),

            y: getGroundY(),

            health: 100,
            maxHealth: 100

        };

        aiVelocityY = 0;
        aiOnGround = true;
        aiDirectionTimer = 0;

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

if (showJoin) {

    showJoin.onclick = function() {

        if (joinBox) {
            joinBox.classList.toggle("hidden");
        }

    };

}

if (roomInput) {

    roomInput.addEventListener(
        "input",
        function() {

            roomInput.value =
                roomInput.value
                    .replace(/\D/g, "")
                    .substring(0, 6);

        }
    );

}

if (createRoom) {

    createRoom.onclick = function() {

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

socket.on(
    "roomCreated",
    function(data) {

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

        showScreen(roomScreen);

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

if (joinRoom) {

    joinRoom.onclick = function() {

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

socket.on(
    "roomJoined",
    function(data) {

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

        showScreen(roomScreen);

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

if (readyButton) {

    readyButton.onclick = async function() {

        await enterGameFullscreen();

        readyButton.disabled = true;

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

socket.on(
    "readyUpdate",
    function(data) {

        if (!roomStatus) return;

        roomStatus.textContent =
            "بازیکنان آماده: " +
            data.ready +
            " / " +
            data.total;

    }
);

socket.on(
    "startGame",
    async function() {

        await enterGameFullscreen();

        gameMode = "ONLINE";

        roomScreen.classList.add("hidden");

        gameScreen.style.display =
            "block";

        gameRunning = true;

        resizeCanvas();

        updateAttackButtonVisibility();

        requestAnimationFrame(gameLoop);

    }
);

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

}

window.addEventListener(
    "resize",
    resizeCanvas
);

function getGroundY() {

    if (!canvas) return 500;

    return canvas.height - 120;

}

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

socket.on(
    "playersUpdate",
    function(list) {

        players = {};

        if (!Array.isArray(list)) return;

        list.forEach(function(player) {

            if (!player) return;

            fixPlayerSpawn(player);

            players[player.id] =
                player;

            if (player.id === socket.id) {

                myPlayer =
                    player;

                const ground =
                    getGroundY();

                if (
                    !Number.isFinite(
                        Number(myPlayer.y)
                    ) ||
                    myPlayer.y <= 0
                ) {

                    myPlayer.y =
                        ground;

                }

                onGround =
                    Math.abs(
                        myPlayer.y - ground
                    ) < 5;

                if (onGround) {
                    velocityY = 0;
                }

            }

        });

        updateAdminPlayers();

    }
);

socket.on(
    "playerMoved",
    function(player) {

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

            players[player.id].health =
                player.health;

            players[player.id].speed =
                player.speed;

            players[player.id].jump =
                player.jump;

            players[player.id].fly =
                player.fly;

            players[player.id].doubleJump =
                player.doubleJump;

            players[player.id].color =
                player.color;

        }

    }
);

socket.on(
    "playerLeft",
    function(id) {

        delete players[id];

        updateAdminPlayers();

    }
);

socket.on(
    "roomError",
    function(message) {

        const error =
            document.getElementById(
                "onlineError"
            );

        if (error) {

            error.textContent =
                typeof message === "object" &&
                message !== null
                    ? message.message || "خطا"
                    : String(message);

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

socket.on(
    "abilityResult",
    function(data) {

        if (!data) return;

        if (data.player) {

            players[data.player.id] =
                data.player;

            if (
                data.player.id ===
                socket.id
            ) {

                myPlayer =
                    data.player;

            }

        }

        if (codeResult) {

            codeResult.style.color =
                "#4ade80";

            codeResult.textContent =
                data.message ||
                "قابلیت اعمال شد.";

        }

        if (adminResult) {

            adminResult.style.color =
                "#4ade80";

            adminResult.textContent =
                data.message ||
                "قابلیت اعمال شد.";

        }

    }
);

socket.on(
    "abilityError",
    function(data) {

        const message =
            data && data.message
                ? data.message
                : "کد قابل اجرا نیست.";

        if (codeResult) {
            codeResult.textContent =
                message;
        }

        if (adminResult) {
            adminResult.textContent =
                message;
        }

    }
);

socket.on(
    "mobsUpdate",
    function(list) {

        mobs = {};

        if (!Array.isArray(list)) {
            return;
        }

        list.forEach(mob => {

            if (mob && mob.id) {
                mobs[mob.id] = mob;
            }

        });

    }
);

socket.on(
    "adminStatus",
    function(data) {

        if (
            data &&
            data.admin &&
            playerName === "tahagamertnt"
        ) {

            console.log(
                "Admin verified by server."
            );

        }

    }
);

const keys = {};

document.addEventListener(
    "keydown",
    function(e) {

        keys[e.key.toLowerCase()] =
            true;

        if (e.code === "Space") {
            keys.space = true;
        }

        if (
            e.key.toLowerCase() === "f" &&
            gameRunning
        ) {

            attack();

        }

    }
);

document.addEventListener(
    "keyup",
    function(e) {

        keys[e.key.toLowerCase()] =
            false;

        if (e.code === "Space") {
            keys.space = false;
        }

    }
);

function setupMobileButton(id, key) {

    const button =
        document.getElementById(id);

    if (!button) return;

    button.addEventListener(
        "touchstart",
        function(e) {

            e.preventDefault();

            keys[key] = true;

        },
        {passive:false}
    );

    button.addEventListener(
        "touchend",
        function(e) {

            e.preventDefault();

            keys[key] = false;

        },
        {passive:false}
    );

    button.addEventListener(
        "touchcancel",
        function() {

            keys[key] = false;

        }
    );

    button.addEventListener(
        "mousedown",
        function() {

            keys[key] = true;

        }
    );

    button.addEventListener(
        "mouseup",
        function() {

            keys[key] = false;

        }
    );

    button.addEventListener(
        "mouseleave",
        function() {

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

function attack() {

    if (!gameRunning) return;
    if (!myPlayer) return;
    if (attackCooldown) return;

    attackCooldown = true;
    attacking = true;

    setTimeout(
        () => attacking = false,
        180
    );

    setTimeout(
        () => attackCooldown = false,
        400
    );

    if (
        gameMode === "AI" &&
        ai
    ) {

        const distance =
            Math.abs(
                myPlayer.x - ai.x
            );

        if (distance < 100) {

            ai.health =
                Math.max(
                    0,
                    ai.health - 25
                );

            if (ai.health <= 0) {

                ai.x =
                    Math.min(
                        canvas.width - 100,
                        Math.max(
                            100,
                            myPlayer.x + 250
                        )
                    );

                ai.y =
                    getGroundY();

                ai.health = 100;

                aiVelocityY = 0;
                aiOnGround = true;

            }

        }

    }

    if (gameMode === "ONLINE") {

        socket.emit(
            "attack",
            {
                x: myPlayer.x,
                y: myPlayer.y
            }
        );

    }

}

if (attackButton) {

    attackButton.style.display =
        "none";

    attackButton.addEventListener(
        "touchstart",
        function(e) {

            e.preventDefault();

            if (
                gameRunning &&
                gameScreen.style.display ===
                    "block"
            ) {

                attack();

            }

        },
        {passive:false}
    );

    attackButton.addEventListener(
        "click",
        function(e) {

            e.preventDefault();

            if (
                gameRunning &&
                gameScreen.style.display ===
                    "block"
            ) {

                attack();

            }

        }
    );

}

function updatePlayer() {

    if (!myPlayer) return;

    const speed =
        Number(myPlayer.speed) ||
        SPEED;

    const jump =
        Number(myPlayer.jump) ||
        JUMP;

    let moving = false;

    if (
        keys.a ||
        keys.arrowleft ||
        keys.mobileLeft
    ) {

        myPlayer.x -= speed;
        moving = true;

    }

    if (
        keys.d ||
        keys.arrowright ||
        keys.mobileRight
    ) {

        myPlayer.x += speed;
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
            -jump;

        onGround = false;

    }

    if (myPlayer.fly) {

        if (keys.w || keys.arrowup) {
            myPlayer.y -= speed;
        }

        if (keys.s || keys.arrowdown) {
            myPlayer.y += speed;
        }

    } else {

        velocityY += GRAVITY;

        myPlayer.y += velocityY;

        const ground =
            getGroundY();

        if (myPlayer.y >= ground) {

            myPlayer.y = ground;

            velocityY = 0;

            onGround = true;

        }

    }

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

function updateAI() {

    if (!ai || !myPlayer) return;

    const ground =
        getGroundY();

    const distance =
        myPlayer.x - ai.x;

    if (Math.abs(distance) > 30) {

        if (distance > 0) {
            ai.x += 2.3;
        } else {
            ai.x -= 2.3;
        }

    }

    ai.x =
        Math.max(
            50,
            Math.min(
                canvas.width - 50,
                ai.x
            )
        );

    aiVelocityY += GRAVITY;
    ai.y += aiVelocityY;

    if (ai.y >= ground) {

        ai.y = ground;

        aiVelocityY = 0;

        aiOnGround = true;

    }

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

            aiVelocityY =
                -JUMP * 0.85;

            aiOnGround = false;

        }

    }

}

function updateMobs() {

    Object.values(mobs)
        .forEach(mob => {

            if (!mob) return;

            const distance =
                myPlayer
                    ? myPlayer.x - mob.x
                    : 0;

            if (
                Math.abs(distance) > 40
            ) {

                mob.x +=
                    distance > 0
                        ? mob.speed || 1
                        : -(mob.speed || 1);

            }

            mob.y =
                getGroundY();

        });

}

function updateGameUI() {

    const score =
        document.getElementById(
            "gameScore"
        );

    if (!score) return;

    score.textContent =
        "❤️ " +
        Math.max(
            0,
            Math.round(
                Number(
                    myPlayer?.health || 100
                )
            )
        );

}

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

    drawCloud(130,110,1);
    drawCloud(420,160,.8);

}

function drawCloud(x,y,scale) {

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

function drawStickman(
    player,
    isAI = false
) {

    if (!ctx || !player) return;

    const x = player.x;
    const y = player.y;

    const minScreen =
        Math.min(
            canvas.width,
            canvas.height
        );

    const scale =
        Math.max(
            .8,
            Math.min(
                1.15,
                minScreen / 850
            )
        );

    const s = scale;

    const color =
        player.color ||
        (
            isAI
                ? "#ef4444"
                : "#2563eb"
        );

    const bodyDark =
        isAI
            ? "#b91c1c"
            : "#1d4ed8";

    const skin =
        "#f4c7a1";

    const shoe =
        "#111827";

    ctx.save();

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.fillStyle =
        "rgba(0,0,0,.20)";

    ctx.beginPath();

    ctx.ellipse(
        x,
        y + 62*s,
        32*s,
        8*s,
        0,
        0,
        Math.PI*2
    );

    ctx.fill();

    ctx.strokeStyle =
        "#1f2937";

    ctx.lineWidth =
        8*s;

    ctx.beginPath();

    ctx.moveTo(
        x,
        y+20*s
    );

    ctx.lineTo(
        x-18*s,
        y+53*s
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        x,
        y+20*s
    );

    ctx.lineTo(
        x+18*s,
        y+53*s
    );

    ctx.stroke();

    ctx.fillStyle =
        shoe;

    roundRect(
        x-32*s,
        y+49*s,
        25*s,
        10*s,
        5*s
    );

    ctx.fill();

    roundRect(
        x+7*s,
        y+49*s,
        25*s,
        10*s,
        5*s
    );

    ctx.fill();

    ctx.fillStyle =
        color;

    roundRect(
        x-19*s,
        y-28*s,
        38*s,
        50*s,
        12*s
    );

    ctx.fill();

    ctx.strokeStyle =
        bodyDark;

    ctx.lineWidth =
        8*s;

    ctx.beginPath();

    ctx.moveTo(
        x-16*s,
        y-15*s
    );

    ctx.lineTo(
        x-38*s,
        y+8*s
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        x+16*s,
        y-15*s
    );

    ctx.lineTo(
        x+38*s,
        y+8*s
    );

    ctx.stroke();

    ctx.fillStyle =
        skin;

    ctx.beginPath();

    ctx.arc(
        x-40*s,
        y+10*s,
        6*s,
        0,
        Math.PI*2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
        x+40*s,
        y+10*s,
        6*s,
        0,
        Math.PI*2
    );

    ctx.fill();

    roundRect(
        x-8*s,
        y-40*s,
        16*s,
        14*s,
        5*s
    );

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
        x,
        y-58*s,
        22*s,
        0,
        Math.PI*2
    );

    ctx.fill();

    ctx.fillStyle =
        "#111827";

    ctx.beginPath();

    ctx.arc(
        x,
        y-66*s,
        22*s,
        Math.PI,
        Math.PI*2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
        x-8*s,
        y-59*s,
        2.5*s,
        0,
        Math.PI*2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
        x+8*s,
        y-59*s,
        2.5*s,
        0,
        Math.PI*2
    );

    ctx.fill();

    const name =
        player.name ||
        (isAI ? "AI" : "Player");

    ctx.font =
        `bold ${Math.max(
            12,
            15*s
        )}px Arial`;

    const textWidth =
        ctx.measureText(name).width;

    ctx.fillStyle =
        "rgba(17,24,39,.82)";

    roundRect(
        x-textWidth/2-8,
        y-105*s,
        textWidth+16,
        24*s,
        8
    );

    ctx.fill();

    ctx.fillStyle =
        "#fff";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        name,
        x,
        y-93*s
    );

    if (isAI) {

        ctx.fillStyle =
            "#facc15";

        ctx.font =
            `bold ${12*s}px Arial`;

        ctx.fillText(
            "🤖",
            x,
            y-118*s
        );

    }

    if (
        attacking &&
        player === myPlayer
    ) {

        ctx.strokeStyle =
            "#facc15";

        ctx.lineWidth =
            6*s;

        ctx.beginPath();

        ctx.arc(
            x,
            y-5*s,
            65*s,
            -.8,
            .8
        );

        ctx.stroke();

    }

    if (player.fly) {

        ctx.fillStyle =
            "#38bdf8";

        ctx.font =
            `${18*s}px Arial`;

        ctx.fillText(
            "🪽",
            x,
            y-130*s
        );

    }

    ctx.restore();

}

function drawMob(mob) {

    if (!ctx || !mob) return;

    const x = mob.x;
    const y = mob.y;

    ctx.save();

    ctx.fillStyle =
        mob.type === "zombie"
            ? "#16a34a"
            : "#7c3aed";

    ctx.beginPath();

    ctx.arc(
        x,
        y-35,
        28,
        0,
        Math.PI*2
    );

    ctx.fill();

    ctx.fillStyle =
        "#111827";

    ctx.fillRect(
        x-20,
        y-10,
        40,
        45
    );

    ctx.fillStyle =
        "#ef4444";

    ctx.beginPath();

    ctx.arc(
        x-10,
        y-40,
        4,
        0,
        Math.PI*2
    );

    ctx.arc(
        x+10,
        y-40,
        4,
        0,
        Math.PI*2
    );

    ctx.fill();

    ctx.fillStyle =
        "#fff";

    ctx.font =
        "bold 13px Arial";

    ctx.textAlign =
        "center";

    ctx.fillText(
        mob.type === "zombie"
            ? "Zombie"
            : "Monster",
        x,
        y-70
    );

    ctx.restore();

}

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
            width/2,
            height/2
        );

    ctx.beginPath();

    ctx.moveTo(
        x+r,
        y
    );

    ctx.arcTo(
        x+width,
        y,
        x+width,
        y+height,
        r
    );

    ctx.arcTo(
        x+width,
        y+height,
        x,
        y+height,
        r
    );

    ctx.arcTo(
        x,
        y+height,
        x,
        y,
        r
    );

    ctx.arcTo(
        x,
        y,
        x+width,
        y,
        r
    );

    ctx.closePath();

}

function drawGame() {

    if (!ctx || !canvas) return;

    drawSky();
    drawGround();

    if (myPlayer) {
        drawStickman(
            myPlayer,
            false
        );
    }

    if (ai) {
        drawStickman(
            ai,
            true
        );
    }

    Object.values(players)
        .forEach(player => {

            if (
                player.id === socket.id
            ) {
                return;
            }

            drawStickman(
                player,
                false
            );

        });

    Object.values(mobs)
        .forEach(drawMob);

}

function gameLoop() {

    if (!gameRunning) return;

    updatePlayer();

    if (gameMode === "AI") {
        updateAI();
    }

    updateMobs();

    updateGameUI();

    drawGame();

    updateAttackButtonVisibility();

    requestAnimationFrame(
        gameLoop
    );

}

/* =====================================================
   CODE SYSTEM
===================================================== */

if (codeButton) {

    codeButton.onclick =
        function() {

            if (!gameRunning) return;

            if (playerName === "tahagamertnt") {

                adminPanel.classList.remove(
                    "hidden"
                );

                updateAdminPlayers();

            } else {

                codePanel.classList.remove(
                    "hidden"
                );

            }

        };

}

if (closeCode) {

    closeCode.onclick =
        function() {

            codePanel.classList.add(
                "hidden"
            );

        };

}

if (closeAdmin) {

    closeAdmin.onclick =
        function() {

            adminPanel.classList.add(
                "hidden"
            );

        };

}

if (runCode) {

    runCode.onclick =
        function() {

            if (!codeInput) return;

            codeResult.textContent =
                "⏳ در حال اجرا...";

            socket.emit(
                "runPlayerCode",
                {
                    code:
                        codeInput.value
                }
            );

        };

}

function updateAdminPlayers() {

    if (!adminPlayers) return;

    adminPlayers.innerHTML = "";

    if (
        playerName !==
        "tahagamertnt"
    ) {

        return;

    }

    Object.values(players)
        .forEach(player => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "adminPlayer";

            if (
                selectedAdminTarget ===
                player.id
            ) {

                div.classList.add(
                    "selected"
                );

            }

            div.textContent =
                "👤 " +
                player.name;

            div.onclick =
                function() {

                    selectedAdminTarget =
                        player.id;

                    if (adminTargetText) {

                        adminTargetText.textContent =
                            "هدف: " +
                            player.name;

                    }

                    updateAdminPlayers();

                };

            adminPlayers.appendChild(
                div
            );

        });

}

if (runAdminCode) {

    runAdminCode.onclick =
        function() {

            if (
                playerName !==
                "tahagamertnt"
            ) {

                return;

            }

            adminResult.textContent =
                "⏳ در حال اجرا...";

            socket.emit(
                "runAdminCode",
                {
                    targetId:
                        selectedAdminTarget ||
                        socket.id,

                    code:
                        adminCodeInput.value
                }
            );

        };

}

updateAttackButtonVisibility();
