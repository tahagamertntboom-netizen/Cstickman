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
            speed: 
