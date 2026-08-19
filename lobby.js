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
// OFFLINE GAME
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

    gameMode === "AI"
        ? document.getElementById(
            "gameMode"
          ).textContent =
            "🤖 بازی با AI"
        : document.getElementById(
            "gameMode"
          ).textContent =
            "👤 بازی تنهایی";
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

        onlineScreen.classList.add(
            "hidden"
        );

        roomScreen.classList.remove(
            "hidden"
        );

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

        onlineScreen.classList.add(
            "hidden"
        );

        roomScreen.classList.remove(
            "hidden"
        );

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

    socket.emit(
        "readyForGame"
    );
};


socket.on(
    "startGame",
    () => {

        gameMode = "ONLINE";

        roomScreen.classList.add(
            "hidden"
        );

        gameScreen.style.display =
            "block";

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

                players[player.id] =
                    player;

                if (
                    player.id === socket.id
                ) {

                    myPlayer =
                        player;
                }
            }
        );
    }
);


socket.on(
    "playerMoved",
    (player) => {

        if (
            players[player.id]
        ) {

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
        canvas.height - 120;

    if (
        myPlayer &&
        !velocityY
    ) {

        myPlayer.y =
            ground;
    }

    if (
        ai &&
        !aiVelocityY
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
        { passive:false }
    );

    button.addEventListener(
        "touchend",
        (e) => {

            e.preventDefault();

            keys[key] = false;
        },
        { passive:false }
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

    myPlayer.y +=
        velocityY;


    const ground =
        canvas.height - 120;


    if (
        myPlayer.y >= ground
    ) {

        myPlayer.y =
            ground;

        velocityY = 0;

        onGround = true;
    }


    if (
        myPlayer.x < 30
    ) {

        myPlayer.x = 30;
    }


    if (
        myPlayer.x >
        canvas.width - 30
    ) {

        myPlayer.x =
            canvas.width - 30;
    }


    // ONLINE POSITION
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

    if (!ai || !myPlayer) {
        return;
    }

    const ground =
        canvas.height - 120;


    // دنبال کردن بازیکن
    if (
        myPlayer.x >
        ai.x + 15
    ) {

        ai.x += 2.4;
    }

    else if (
        myPlayer.x <
        ai.x - 15
    ) {

        ai.x -= 2.4;
    }


    // گرانش AI
    aiVelocityY +=
        GRAVITY;

    ai.y +=
        aiVelocityY;


    if (
        ai.y >= ground
    ) {

        ai.y =
            ground;

        aiVelocityY = 0;

        aiOnGround = true;
    }


    // گاهی AI پرش می‌کند
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
            Math.abs(
                myPlayer.x - ai.x
            ) < 280 &&
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
// COLLISION / DAMAGE
// =======================================

function checkAIHit() {

    if (
        !ai ||
        !myPlayer
    ) {

        return;
    }

    const distance =
        Math.abs(
            myPlayer.x -
            ai.x
        );

    const vertical =
        Math.abs(
            myPlayer.y -
            ai.y
        );

    if (
        distance < 65 &&
        vertical < 80
    ) {

        const score =
            document.getElementById(
                "gameScore"
            );

        score.textContent =
            "🤖 AI نزدیکته!";
    } else {

        document.getElementById(
            "gameScore"
        ).textContent =
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
}


// =======================================
// GROUND
// =======================================

function drawGround() {

    const ground =
        canvas.height - 120;


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
        10
    );


    ctx.fillStyle =
        "#92400e";

    ctx.fillRect(
        0,
        ground + 10,
        canvas.width,
        110
    );
}


// =======================================
// STICKMAN
// =======================================

function drawStickman(
    player,
    isAI = false
) {

    const x =
        player.x;

    const y =
        player.y;


    ctx.strokeStyle =
        isAI
            ? "#dc2626"
            : "#16a34a";

    ctx.lineWidth = 5;

    ctx.lineCap = "round";


    // HEAD
    ctx.beginPath();

    ctx.arc(
        x,
        y - 55,
        18,
        0,
        Math.PI * 2
    );

    ctx.stroke();


    // BODY
    ctx.beginPath();

    ctx.moveTo(
        x,
        y - 37
    );

    ctx.lineTo(
        x,
        y + 15
    );

    ctx.stroke();


    // LEFT ARM
    ctx.beginPath();

    ctx.moveTo(
        x,
        y - 20
    );

    ctx.lineTo(
        x - 30,
        y + 5
    );

    ctx.stroke();


    // RIGHT ARM
    ctx.beginPath();

    ctx.moveTo(
        x,
        y - 20
    );

    ctx.lineTo(
        x + 30,
        y + 5
    );

    ctx.stroke();


    // LEFT LEG
    ctx.beginPath();

    ctx.moveTo(
        x,
        y + 15
    );

    ctx.lineTo(
        x - 25,
        y + 55
    );

    ctx.stroke();


    // RIGHT LEG
    ctx.beginPath();

    ctx.moveTo(
        x,
        y + 15
    );

    ctx.lineTo(
        x + 25,
        y + 55
    );

    ctx.stroke();


    // NAME
    ctx.fillStyle =
        "#111827";

    ctx.font =
        "bold 16px Arial";

    ctx.textAlign =
        "center";

    ctx.fillText(
        player.name,
        x,
        y - 82
    );
}


// =======================================
// DRAW
// =======================================

function drawGame() {

    drawSky();

    drawGround();


    if (myPlayer) {

        drawStickman(
            myPlayer
        );
    }


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

        Object.values(
            players
        ).forEach(
            (player) => {

                if (
                    player.id ===
                    socket.id
                ) {
                    return;
                }

                drawStickman(
                    player,
                    true
                );
            }
        );
    }
}


// =======================================
// LOOP
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

        checkAIHit();
    }

    drawGame();

    requestAnimationFrame(
        gameLoop
    );
}
