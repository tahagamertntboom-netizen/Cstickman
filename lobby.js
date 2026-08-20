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

let monsters = {};

let attackCooldown = false;
let attacking = false;

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

const abilityButton = document.getElementById("abilityButton");
const abilityPanel = document.getElementById("abilityPanel");
const abilityCode = document.getElementById("abilityCode");
const useAbility = document.getElementById("useAbility");
const abilityMessage = document.getElementById("abilityMessage");

const adminButton = document.getElementById("adminButton");
const adminPanel = document.getElementById("adminPanel");
const adminPlayers = document.getElementById("adminPlayers");
const adminCode = document.getElementById("adminCode");
const useAdminCode = document.getElementById("useAdminCode");
const adminMessage = document.getElementById("adminMessage");


/* =========================
   SCREEN
========================= */

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


/* =========================
   FULLSCREEN
========================= */

async function enterGameFullscreen() {
    try {
        if (document.fullscreenElement) return;

        if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen({
                navigationUI: "hide"
            });
        }
    } catch (error) {
        console.log("Fullscreen unavailable:", error);
    }
}


/* =========================
   ADMIN
========================= */

function isAdmin() {
    return String(playerName)
        .trim()
        .toLowerCase() === "tahagamertnt";
}


/* =========================
   NAME
========================= */

if (confirmName) {
    confirmName.onclick = function () {

        const name = nameInput.value.trim();

        if (!name) {
            const error =
                document.getElementById("nameError");

            if (error) {
                error.textContent =
                    "اول اسمت رو وارد کن.";
            }

            return;
        }

        playerName = name.substring(0, 20);

        showScreen(modeScreen);
    };
}

if (nameInput) {
    nameInput.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            confirmName.click();
        }
    });
}


/* =========================
   MODES
========================= */

if (onlineCard) {
    onlineCard.onclick = () => {
        showScreen(onlineScreen);
    };
}

if (offlineCard) {
    offlineCard.onclick = () => {
        showScreen(offlineScreen);
    };
}

if (backToModes) {
    backToModes.onclick = () => {
        showScreen(modeScreen);
    };
}

if (backFromOnline) {
    backFromOnline.onclick = () => {
        showScreen(modeScreen);
    };
}


/* =========================
   OFFLINE
========================= */

if (aiCard) {
    aiCard.onclick = async () => {
        await enterGameFullscreen();
        startOfflineGame(true);
    };
}

if (soloCard) {
    soloCard.onclick = async () => {
        await enterGameFullscreen();
        startOfflineGame(false);
    };
}

function startOfflineGame(withAI) {

    gameMode = withAI ? "AI" : "SOLO";

    nameScreen.classList.add("hidden");
    modeScreen.classList.add("hidden");
    offlineScreen.classList.add("hidden");
    onlineScreen.classList.add("hidden");
    roomScreen.classList.add("hidden");

    gameScreen.style.display = "block";

    gameRunning = true;

    setupOfflinePlayers(withAI);

    resizeCanvas();

    setupAbilityUI();

    updateAttackButtonVisibility();

    requestAnimationFrame(gameLoop);
}

function setupOfflinePlayers(withAI) {

    players = {};
    monsters = {};

    myPlayer = {
        id: "player",
        name: playerName || "Player",
        x: 250,
        y: getGroundY(),
        health: 100,
        maxHealth: 100,
        speedBoost: false,
        jumpBoost: false,
        fly: false,
        god: false
    };

    players.player = myPlayer;

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

    setupAbilityUI();
}


/* =========================
   ONLINE ROOM
========================= */

if (showJoin) {
    showJoin.onclick = () => {
        if (joinBox) {
            joinBox.classList.toggle("hidden");
        }
    };
}

if (roomInput) {
    roomInput.addEventListener("input", () => {
        roomInput.value =
            roomInput.value
                .replace(/\D/g, "")
                .substring(0, 6);
    });
}

if (createRoom) {
    createRoom.onclick = () => {

        createRoom.disabled = true;
        createRoom.textContent =
            "⏳ در حال ساخت...";

        socket.emit("createRoom", {
            name: playerName
        });
    };
}

socket.on("roomCreated", data => {

    roomCode =
        String(data.roomCode)
            .replace(/\D/g, "");

    myPlayer = data.player;

    players = {};

    if (myPlayer) {
        players[myPlayer.id] = myPlayer;
    }

    showScreen(roomScreen);

    if (roomCodeElement) {
        roomCodeElement.textContent =
            roomCode;
    }

    createRoom.disabled = false;
    createRoom.textContent =
        "🏠 ساخت اتاق";
});


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

        joinRoom.disabled = true;

        joinRoom.textContent =
            "⏳ در حال ورود...";

        socket.emit("joinRoom", {
            roomCode: code,
            name: playerName
        });
    };
}


socket.on("roomJoined", data => {

    roomCode =
        String(data.roomCode)
            .replace(/\D/g, "");

    myPlayer = data.player;

    players = {};

    if (myPlayer) {
        players[myPlayer.id] = myPlayer;
    }

    showScreen(roomScreen);

    if (roomCodeElement) {
        roomCodeElement.textContent =
            roomCode;
    }

    joinRoom.disabled = false;
    joinRoom.textContent =
        "🚪 ورود";
});


/* =========================
   READY
========================= */

if (readyButton) {

    readyButton.onclick = async () => {

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


socket.on("readyUpdate", data => {

    if (!roomStatus) return;

    roomStatus.textContent =
        "بازیکنان آماده: " +
        data.ready +
        " / " +
        data.total;
});


socket.on("startGame", async () => {

    await enterGameFullscreen();

    gameMode = "ONLINE";

    roomScreen.classList.add("hidden");

    gameScreen.style.display = "block";

    gameRunning = true;

    resizeCanvas();

    setupAbilityUI();

    updateAttackButtonVisibility();

    requestAnimationFrame(gameLoop);
});


/* =========================
   RESIZE
========================= */

function resizeCanvas() {

    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ground = getGroundY();

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

    const ground = getGroundY();

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

    if (typeof player.health !== "number") {
        player.health = 100;
    }
}


/* =========================
   ONLINE PLAYERS
========================= */

socket.on("playersUpdate", list => {

    players = {};

    if (!Array.isArray(list)) return;

    list.forEach(player => {

        if (!player) return;

        fixPlayerSpawn(player);

        players[player.id] = player;

        if (player.id === socket.id) {

            myPlayer = player;

            const ground = getGroundY();

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
});


socket.on("playerMoved", player => {

    if (!player) return;

    fixPlayerSpawn(player);

    if (!players[player.id]) {
        players[player.id] = player;
    } else {

        players[player.id].x =
            player.x;

        players[player.id].y =
            player.y;

        players[player.id].health =
            player.health;

        players[player.id].god =
            player.god;
    }

    updateAdminPlayers();
});


socket.on("playerLeft", id => {

    delete players[id];

    updateAdminPlayers();
});


/* =========================
   MONSTERS
========================= */

socket.on("monstersUpdate", list => {

    monsters = {};

    if (!Array.isArray(list)) return;

    list.forEach(monster => {

        if (!monster) return;

        monsters[monster.id] =
            monster;
    });
});


socket.on("monsterUpdate", monster => {

    if (!monster) return;

    monsters[monster.id] =
        monster;
});


socket.on("monsterSpawned", monster => {

    if (!monster) return;

    monsters[monster.id] =
        monster;
});


socket.on("monsterRemoved", id => {

    delete monsters[id];
});


/* =========================
   DAMAGE
========================= */

socket.on("playerDamaged", data => {

    if (!data) return;

    if (
        data.player &&
        data.player.id
    ) {
        players[data.player.id] =
            data.player;

        if (data.player.id === socket.id) {
            myPlayer =
                data.player;
        }
    }
});


socket.on("playerDied", data => {

    if (!data) return;

    if (
        data.player &&
        data.player.id
    ) {
        players[data.player.id] =
            data.player;

        if (data.player.id === socket.id) {
            myPlayer =
                data.player;
        }
    }
});


/* =========================
   ABILITY EVENTS
========================= */

socket.on("abilityResult", data => {

    if (!data) return;

    if (abilityMessage) {
        abilityMessage.textContent =
            data.message ||
            "قابلیت اجرا شد.";
    }

    if (
        adminMessage &&
        data.admin
    ) {
        adminMessage.textContent =
            data.message ||
            "انجام شد.";
    }
});


socket.on(
    "playerAbilityUpdate",
    data => {

        if (!data || !data.player)
            return;

        const p = data.player;

        players[p.id] = p;

        if (p.id === socket.id) {
            myPlayer = p;
        }

        updateAdminPlayers();
    }
);


/* =========================
   ADMIN KICK
========================= */

socket.on("adminKicked", () => {

    gameRunning = false;

    alert(
        "👑 ادمین شما را از بازی خارج کرد."
    );

    location.reload();
});


/* =========================
   ROOM ERROR
========================= */

socket.on("roomError", message => {

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
        joinRoom.disabled = false;
        joinRoom.textContent =
            "🚪 ورود";
    }

    if (createRoom) {
        createRoom.disabled = false;
        createRoom.textContent =
            "🏠 ساخت اتاق";
    }
});


/* =========================
   ABILITIES UI
========================= */

function setupAbilityUI() {

    if (
        !abilityButton ||
        !abilityPanel
    ) return;

    abilityButton.classList.remove(
        "hidden"
    );

    abilityButton.onclick = () => {

        abilityPanel.classList.toggle(
            "hidden"
        );
    };


    if (isAdmin()) {

        adminButton.classList.remove(
            "hidden"
        );

        adminButton.onclick = () => {

            adminPanel.classList.toggle(
                "hidden"
            );

            updateAdminPlayers();
        };

    } else {

        adminButton.classList.add(
            "hidden"
        );

        adminPanel.classList.add(
            "hidden"
        );
    }
}


/* =========================
   NORMAL ABILITY
========================= */

function executeAbility(code) {

    code =
        String(code || "")
            .trim()
            .toLowerCase();

    if (!code) {

        if (abilityMessage) {
            abilityMessage.textContent =
                "کد قابلیت را بنویس.";
        }

        return;
    }

    if (gameMode === "ONLINE") {

        socket.emit(
            "useAbility",
            {
                code: code
            }
        );

    } else {

        applyOfflineAbility(code);
    }
}


function applyOfflineAbility(code) {

    if (!myPlayer) return;

    switch (code) {

        case "speed":
            myPlayer.speedBoost = true;
            break;

        case "jump":
            myPlayer.jumpBoost = true;
            break;

        case "heal":
            myPlayer.health = 100;
            break;

        case "god":
            myPlayer.god = true;
            break;

        case "fly":
            myPlayer.fly = true;
            break;

        default:

            if (abilityMessage) {
                abilityMessage.textContent =
                    "❌ این کد وجود ندارد.";
            }

            return;
    }

    if (abilityMessage) {
        abilityMessage.textContent =
            "✅ قابلیت " +
            code +
            " فعال شد.";
    }
}


if (useAbility) {

    useAbility.onclick = () => {

        executeAbility(
            abilityCode
                ? abilityCode.value
                : ""
        );
    };
}


document
    .querySelectorAll(
        "[data-ability]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                executeAbility(
                    button.dataset.ability
                );
            }
        );
    });


/* =========================
   ADMIN
========================= */

function updateAdminPlayers() {

    if (!adminPlayers) return;

    if (!isAdmin()) return;

    const old =
        adminPlayers.value;

    adminPlayers.innerHTML =
        '<option value="">انتخاب بازیکن</option>';

    Object.values(players)
        .forEach(player => {

            if (!player) return;

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                player.id;

            option.textContent =
                (player.name || "Player") +
                (
                    player.id === socket.id
                        ? " (من)"
                        : ""
                );

            adminPlayers.appendChild(
                option
            );
        });

    if (
        old &&
        [...adminPlayers.options]
            .some(
                o => o.value === old
            )
    ) {
        adminPlayers.value = old;
    }
}


function executeAdminAbility(code) {

    if (!isAdmin()) return;

    code =
        String(code || "")
            .trim()
            .toLowerCase();

    if (!code) {

        adminMessage.textContent =
            "کد ادمین را وارد کن.";

        return;
    }

    const target =
        adminPlayers
            ? adminPlayers.value
            : "";

    /*
       MONSTER:
       برای اسپان هیولا نیازی
       به انتخاب بازیکن ندارد.
    */

    if (code === "monster" ||
        code === "spawnmonster") {

        socket.emit(
            "adminAbility",
            {
                code: "monster"
            }
        );

        return;
    }

    if (!target) {

        adminMessage.textContent =
            "اول بازیکن هدف را انتخاب کن.";

        return;
    }

    socket.emit(
        "adminAbility",
        {
            code: code,
            targetId: target
        }
    );
}


if (useAdminCode) {

    useAdminCode.onclick = () => {

        executeAdminAbility(
            adminCode
                ? adminCode.value
                : ""
        );
    };
}


document
    .querySelectorAll(
        "[data-admin]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                executeAdminAbility(
                    button.dataset.admin
                );
            }
        );
    });


/* =========================
   KEYBOARD
========================= */

const keys = {};

document.addEventListener(
    "keydown",
    e => {

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
    e => {

        keys[e.key.toLowerCase()] =
            false;

        if (e.code === "Space") {
            keys.space = false;
        }
    }
);


/* =========================
   MOBILE
========================= */

function setupMobileButton(
    id,
    key
) {

    const button =
        document.getElementById(id);

    if (!button) return;

    button.addEventListener(
        "touchstart",
        e => {

            e.preventDefault();

            keys[key] = true;

        },
        {
            passive:false
        }
    );

    button.addEventListener(
        "touchend",
        e => {

            e.preventDefault();

            keys[key] = false;

        },
        {
            passive:false
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


/* =========================
   ATTACK
========================= */

function attack() {

    if (!gameRunning) return;

    if (!myPlayer) return;

    if (attackCooldown) return;

    attackCooldown = true;
    attacking = true;

    setTimeout(() => {
        attacking = false;
    }, 180);

    setTimeout(() => {
        attackCooldown = false;
    }, 400);


    /* OFFLINE AI */

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


    /* ONLINE */

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

    attackButton.addEventListener(
        "touchstart",
        e => {

            e.preventDefault();

            if (gameRunning) {
                attack();
            }

        },
        {
            passive:false
        }
    );

    attackButton.addEventListener(
        "click",
        e => {

            e.preventDefault();

            if (gameRunning) {
                attack();
            }
        }
    );
}


/* =========================
   PLAYER UPDATE
========================= */

function updatePlayer() {

    if (!myPlayer) return;

    let moving = false;

    const speed =
        myPlayer.speedBoost
            ? SPEED * 2
            : SPEED;


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


    const jumpPower =
        myPlayer.jumpBoost
            ? JUMP * 1.7
            : JUMP;


    if (
        (
            keys.w ||
            keys.arrowup ||
            keys.space ||
            keys.mobileJump
        ) &&
        (
            onGround ||
            myPlayer.fly
        )
    ) {

        velocityY =
            -jumpPower;

        onGround = false;
    }


    if (myPlayer.fly) {

        if (
            keys.w ||
            keys.arrowup ||
            keys.mobileJump
        ) {
            myPlayer.y -= 5;
        }

        if (
            keys.s ||
            keys.arrowdown
        ) {
            myPlayer.y += 5;
        }

    } else {

        velocityY += GRAVITY;

        myPlayer.y += velocityY;
    }


    const ground =
        getGroundY();


    if (
        !myPlayer.fly &&
        myPlayer.y >= ground
    ) {

        myPlayer.y = ground;

        velocityY = 0;

        onGround = true;
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


/* =========================
   AI
========================= */

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


/* =========================
   MONSTER UPDATE
========================= */

function updateMonsters() {

    Object.values(monsters)
        .forEach(monster => {

            if (!monster) return;

            /*
             * حرکت هیولا توسط سرور
             * انجام می‌شود.
             * اینجا فقط اطلاعات
             * نمایش داده می‌شود.
             */
        });
}


/* =========================
   UI
========================= */

function updateGameUI() {

    const score =
        document.getElementById(
            "gameScore"
        );

    if (!score) return;

    const hp =
        myPlayer &&
        typeof myPlayer.health === "number"
            ? myPlayer.health
            : 100;

    score.textContent =
        "❤️ " + hp;
}


/* =========================
   SKY
========================= */

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
        .8
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


/* =========================
   GROUND
========================= */

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


/* =========================
   STICKMAN
========================= */

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
        shirt;


    roundRect(
        x-19*s,
        y-28*s,
        38*s,
        50*s,
        12*s
    );

    ctx.fill();


    ctx.fillStyle =
        bodyColor;


    roundRect(
        x-13*s,
        y-22*s,
        26*s,
        35*s,
        8*s
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
        (isAI
            ? "AI"
            : "Player");


    const fontSize =
        Math.max(
            12,
            15*s
        );


    ctx.font =
        `bold ${fontSize}px Arial`;


    const textWidth =
        ctx.measureText(name)
            .width;


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


        if (
            typeof ai.health ===
            "number"
        ) {

            const barWidth =
                60*s;

            const barHeight =
                7*s;


            ctx.fillStyle =
                "#111827";

            ctx.fillRect(
                x-barWidth/2,
                y-132*s,
                barWidth,
                barHeight
            );


            ctx.fillStyle =
                "#22c55e";

            ctx.fillRect(
                x-barWidth/2,
                y-132*s,
                barWidth *
                Math.max(
                    0,
                    ai.health/100
                ),
                barHeight
            );
        }
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


    if (player.god) {

        ctx.strokeStyle =
            "#facc15";

        ctx.lineWidth = 4;

        ctx.beginPath();

        ctx.arc(
            x,
            y-20*s,
            55*s,
            0,
            Math.PI*2
        );

        ctx.stroke();
    }


    ctx.restore();
}


/* =========================
   MONSTER DRAW
========================= */

function drawMonster(monster) {

    if (!ctx || !monster) return;

    const x =
        Number(monster.x) || 0;

    const y =
        Number(monster.y) ||
        getGroundY();


    const hp =
        typeof monster.health ===
        "number"
            ? monster.health
            : 300;

    const maxHp =
        typeof monster.maxHealth ===
        "number"
            ? monster.maxHealth
            : 300;


    const scale = 1.35;


    /* SHADOW */

    ctx.fillStyle =
        "rgba(0,0,0,.35)";

    ctx.beginPath();

    ctx.ellipse(
        x,
        y + 65,
        55,
        12,
        0,
        0,
        Math.PI*2
    );

    ctx.fill();


    /* BODY */

    ctx.fillStyle =
        "#111827";

    roundRect(
        x-48,
        y-75,
        96,
        125,
        25
    );

    ctx.fill();


    /* ARM LEFT */

    ctx.strokeStyle =
        "#0f172a";

    ctx.lineWidth =
        18;

    ctx.beginPath();

    ctx.moveTo(
        x-38,
        y-40
    );

    ctx.lineTo(
        x-78,
        y+20
    );

    ctx.stroke();


    /* ARM RIGHT */

    ctx.beginPath();

    ctx.moveTo(
        x+38,
        y-40
    );

    ctx.lineTo(
        x+78,
        y+20
    );

    ctx.stroke();


    /* HEAD */

    ctx.fillStyle =
        "#1f2937";

    ctx.beginPath();

    ctx.arc(
        x,
        y-105,
        48,
        0,
        Math.PI*2
    );

    ctx.fill();


    /* EYES */

    ctx.fillStyle =
        "#ef4444";

    ctx.beginPath();

    ctx.arc(
        x-17,
        y-112,
        8,
        0,
        Math.PI*2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        x+17,
        y-112,
        8,
        0,
        Math.PI*2
    );

    ctx.fill();


    /* HORNS */

    ctx.fillStyle =
        "#7f1d1d";

    ctx.beginPath();

    ctx.moveTo(
        x-35,
        y-138
    );

    ctx.lineTo(
        x-55,
        y-178
    );

    ctx.lineTo(
        x-10,
        y-150
    );

    ctx.fill();


    ctx.beginPath();

    ctx.moveTo(
        x+35,
        y-138
    );

    ctx.lineTo(
        x+55,
        y-178
    );

    ctx.lineTo(
        x+10,
        y-150
    );

    ctx.fill();


    /* MOUTH */

    ctx.strokeStyle =
        "#ef4444";

    ctx.lineWidth = 5;

    ctx.beginPath();

    ctx.arc(
        x,
        y-94,
        22,
        0,
        Math.PI
    );

    ctx.stroke();


    /* NAME */

    ctx.fillStyle =
        "#111827dd";

    roundRect(
        x-55,
        y-195,
        110,
        28,
        8
    );

    ctx.fill();


    ctx.fillStyle =
        "#fff";

    ctx.font =
        "bold 15px Arial";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        monster.name ||
        "👹 MONSTER",
        x,
        y-181
    );


    /* HP BAR */

    const barWidth = 110;
    const barHeight = 9;

    ctx.fillStyle =
        "#111827";

    ctx.fillRect(
        x-barWidth/2,
        y-165,
        barWidth,
        barHeight
    );


    ctx.fillStyle =
        "#ef4444";

    ctx.fillRect(
        x-barWidth/2,
        y-165,
        barWidth *
        Math.max(
            0,
            Math.min(
                1,
                hp / maxHp
            )
        ),
        barHeight
    );


    /* DANGER CIRCLE */

    if (
        monster.attacking
    ) {

        ctx.strokeStyle =
            "#ef4444";

        ctx.lineWidth =
            6;

        ctx.beginPath();

        ctx.arc(
            x,
            y-25,
            90,
            0,
            Math.PI*2
        );

        ctx.stroke();
    }
}


/* =========================
   ROUND RECT
========================= */

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


/* =========================
   DRAW GAME
========================= */

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


    if (
        gameMode === "ONLINE"
    ) {

        Object.values(players)
            .forEach(player => {

                if (
                    player.id ===
                    socket.id
                ) return;

                drawStickman(
                    player,
                    false
                );
            });
    }


    Object.values(monsters)
        .forEach(monster => {

            drawMonster(
                monster
            );
        });
}


/* =========================
   GAME LOOP
========================= */

function gameLoop() {

    if (!gameRunning) return;

    updatePlayer();

    if (gameMode === "AI") {
        updateAI();
    }

    updateMonsters();

    updateGameUI();

    drawGame();

    updateAttackButtonVisibility();

    requestAnimationFrame(
        gameLoop
    );
}


/* =========================
   START UI
========================= */

setupAbilityUI();

updateAttackButtonVisibility();
