```javascript
const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resize();
window.addEventListener("resize", resize);


// ==================================================
// اسم بازیکن
// ==================================================

const storedName = localStorage.getItem("player");

const myName =
    storedName &&
    storedName !== "undefined" &&
    storedName !== "null"
        ? String(storedName).trim()
        : "Player";

const isAdmin =
    myName.toLowerCase() === "tahagamertnt";


// ==================================================
// بازیکن خودمان
// ==================================================

const me = {
    id: "",
    name: myName,
    x: 250,
    y: 300,
    vx: 0,
    vy: 0,
    health: 100,
    flying: false,
    rainbow: false,
    onGround: false
};


// ادمین همیشه رنگی است
if (isAdmin) {
    me.rainbow = true;
}


// ==================================================
// بازیکنان دیگر
// ==================================================

const players = {};


// ==================================================
// کنترل
// ==================================================

const keys = {
    left: false,
    right: false
};


// ==================================================
// اتاق
// ==================================================

const roomCode =
    localStorage.getItem("room") || "";


// ==================================================
// اتصال
// ==================================================

socket.on("connect", () => {

    me.id = socket.id;

    if (roomCode) {

        socket.emit("joinRoom", {
            roomCode: roomCode,
            playerName: myName
        });

    }

});


// ==================================================
// دریافت لیست بازیکنان
// ==================================================

socket.on("players", (list) => {

    if (!Array.isArray(list)) return;

    const currentIds = [];

    list.forEach(player => {

        if (!player || !player.id) return;

        currentIds.push(player.id);

        // بازیکن خودمان
        if (player.id === socket.id) {

            if (typeof player.health === "number") {
                me.health = player.health;
            }

            if (typeof player.flying === "boolean") {
                me.flying = player.flying;
            }

            if (typeof player.rainbow === "boolean") {
                me.rainbow = player.rainbow;
            }

            return;
        }


        // بازیکن جدید
        if (!players[player.id]) {

            players[player.id] = {
                id: player.id,
                name: player.name || "Player",
                admin: player.admin === true,
                x: typeof player.x === "number"
                    ? player.x
                    : 300,
                y: typeof player.y === "number"
                    ? player.y
                    : 400,
                vx: 0,
                vy: 0,
                health: typeof player.health === "number"
                    ? player.health
                    : 100,
                flying: player.flying === true,
                rainbow: player.rainbow === true
            };

        }


        const p = players[player.id];

        p.name = player.name || "Player";
        p.admin = player.admin === true;

        if (typeof player.x === "number") {
            p.x = player.x;
        }

        if (typeof player.y === "number") {
            p.y = player.y;
        }

        if (typeof player.health === "number") {
            p.health = player.health;
        }

        if (typeof player.flying === "boolean") {
            p.flying = player.flying;
        }

        if (typeof player.rainbow === "boolean") {
            p.rainbow = player.rainbow;
        }

    });


    // حذف کسانی که از اتاق خارج شده‌اند

    Object.keys(players).forEach(id => {

        if (!currentIds.includes(id)) {
            delete players[id];
        }

    });


    // به‌روزرسانی لیست ادمین
    refreshAdminPlayerList();

});


// ==================================================
// حرکت بازیکنان دیگر
// ==================================================

socket.on("playerMoved", data => {

    if (!data || !data.id) return;

    if (!players[data.id]) {

        players[data.id] = {
            id: data.id,
            name: "Player",
            admin: false,
            x: 300,
            y: 400,
            vx: 0,
            vy: 0,
            health: 100,
            flying: false,
            rainbow: false
        };

    }

    const p = players[data.id];

    if (typeof data.x === "number") {
        p.x = data.x;
    }

    if (typeof data.y === "number") {
        p.y = data.y;
    }

    if (typeof data.vx === "number") {
        p.vx = data.vx;
    }

    if (typeof data.vy === "number") {
        p.vy = data.vy;
    }

});


// ==================================================
// قابلیت ادمین
// ==================================================

socket.on("adminEffect", data => {

    if (!data) return;


    // رنگی کردن همه
    if (data.action === "allColor") {

        me.rainbow = true;

        Object.values(players).forEach(player => {
            player.rainbow = true;
        });

        refreshAdminPlayerList();

        return;
    }


    const targetId = data.targetId;

    if (!targetId) return;


    // خودمان
    if (targetId === socket.id) {

        if (data.action === "fly") {
            me.flying = data.value === true;
        }

        if (data.action === "color") {
            me.rainbow = data.value === true;
        }

        if (data.action === "kill") {
            me.health = 0;
        }

        return;
    }


    // بازیکن دیگر
    if (!players[targetId]) return;

    if (data.action === "fly") {
        players[targetId].flying =
            data.value === true;
    }

    if (data.action === "color") {
        players[targetId].rainbow =
            data.value === true;
    }

    if (data.action === "kill") {
        players[targetId].health = 0;
    }

});


// ==================================================
// KICK
// ==================================================

socket.on("kicked", data => {

    alert(
        data && data.reason
            ? data.reason
            : "توسط ادمین از بازی خارج شدید."
    );

    window.location.href = "/";

});


// ==================================================
// خطای ادمین
// ==================================================

socket.on("adminError", message => {

    alert(
        message || "خطای ادمین"
    );

});


// ==================================================
// کیبورد
// ==================================================

window.addEventListener("keydown", e => {

    const key = e.key.toLowerCase();


    if (
        e.key === "ArrowLeft" ||
        key === "a"
    ) {
        keys.left = true;
    }


    if (
        e.key === "ArrowRight" ||
        key === "d"
    ) {
        keys.right = true;
    }


    if (
        e.key === "ArrowUp" ||
        key === "w" ||
        e.key === " "
    ) {

        e.preventDefault();

        jump();

    }

});


window.addEventListener("keyup", e => {

    const key = e.key.toLowerCase();


    if (
        e.key === "ArrowLeft" ||
        key === "a"
    ) {
        keys.left = false;
    }


    if (
        e.key === "ArrowRight" ||
        key === "d"
    ) {
        keys.right = false;
    }

});


// ==================================================
// دکمه‌های بازی
// ==================================================

const leftButton =
    document.getElementById("left");

const rightButton =
    document.getElementById("right");

const jumpButton =
    document.getElementById("jump");


if (leftButton) {

    leftButton.addEventListener(
        "pointerdown",
        e => {
            e.preventDefault();
            keys.left = true;
        }
    );

    leftButton.addEventListener(
        "pointerup",
        () => {
            keys.left = false;
        }
    );

    leftButton.addEventListener(
        "pointercancel",
        () => {
            keys.left = false;
        }
    );

}


if (rightButton) {

    rightButton.addEventListener(
        "pointerdown",
        e => {
            e.preventDefault();
            keys.right = true;
        }
    );

    rightButton.addEventListener(
        "pointerup",
        () => {
            keys.right = false;
        }
    );

    rightButton.addEventListener(
        "pointercancel",
        () => {
            keys.right = false;
        }
    );

}


if (jumpButton) {

    jumpButton.addEventListener(
        "pointerdown",
        e => {

            e.preventDefault();

            jump();

        }
    );

}


// ==================================================
// پرش
// ==================================================

function jump() {

    if (
        me.onGround ||
        me.flying
    ) {

        me.vy = -13;
        me.onGround = false;

    }

}


// ==================================================
// حرکت
// ==================================================

function update() {

    if (me.health <= 0) {
        me.vx = 0;
        return;
    }


    // حرکت چپ
    if (keys.left) {
        me.vx = -5;
    }

    // حرکت راست
    else if (keys.right) {
        me.vx = 5;
    }

    // توقف
    else {
        me.vx *= 0.82;
    }


    me.x += me.vx;


    // پرواز
    if (me.flying) {

        me.vy *= 0.92;

    }

    // جاذبه
    else {

        me.vy += 0.6;

    }


    me.y += me.vy;


    const ground =
        canvas.height * 0.65;


    // زمین
    if (
        !me.flying &&
        me.y + 55 >= ground
    ) {

        me.y = ground - 55;

        me.vy = 0;

        me.onGround = true;

    }

    else {

        me.onGround = false;

    }


    // مرز چپ
    if (me.x < 35) {
        me.x = 35;
    }


    // مرز راست
    if (me.x > canvas.width - 35) {
        me.x = canvas.width - 35;
    }


    // مرز بالا
    if (me.y < 40) {

        me.y = 40;
        me.vy = 0;

    }


    // اگر افتاد
    if (me.y > canvas.height + 300) {

        me.y = ground - 55;
        me.vy = 0;

    }


    // ارسال حرکت
    socket.emit("move", {

        x: me.x,
        y: me.y,
        vx: me.vx,
        vy: me.vy

    });

}


// ==================================================
// رنگ رنگین‌کمانی
// ==================================================

function rainbowColor() {

    return (
        "hsl(" +
        ((Date.now() / 5) % 360) +
        ",100%,60%)"
    );

}


// ==================================================
// رسم نوار سلامتی
// ==================================================

function drawHealthBar(health) {

    if (
        typeof health !== "number" ||
        health <= 0
    ) {
        return;
    }


    const barWidth = 60;
    const barHeight = 7;

    const hp =
        Math.max(
            0,
            Math.min(100, health)
        );


    // پس‌زمینه
    ctx.fillStyle =
        "#111827";

    ctx.fillRect(
        -barWidth / 2,
        -122,
        barWidth,
        barHeight
    );


    // سبز
    ctx.fillStyle =
        "#22c55e";

    ctx.fillRect(
        -barWidth / 2,
        -122,
        barWidth * (hp / 100),
        barHeight
    );

}


// ==================================================
// رسم استیک‌من
// ==================================================

function drawStickman(
    x,
    y,
    name,
    admin,
    rainbow,
    health,
    mine
) {

    const safeName =
        (
            typeof name === "string" &&
            name.trim() !== "" &&
            name !== "undefined" &&
            name !== "null"
        )
            ? name
            : "Player";


    ctx.save();

    ctx.translate(x, y);


    // ------------------------------
    // سایه
    // ------------------------------

    ctx.beginPath();

    ctx.ellipse(
        0,
        60,
        27,
        8,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(0,0,0,.25)";

    ctx.fill();


    // ------------------------------
    // نوار سلامتی
    // ------------------------------

    drawHealthBar(health);


    // ------------------------------
    // ADMIN
    // ------------------------------

    if (admin) {

        ctx.textAlign =
            "center";

        ctx.font =
            "bold 16px Arial";

        ctx.lineWidth = 4;

        ctx.strokeStyle =
            "#000000";

        ctx.strokeText(
            "👑 ADMIN",
            0,
            -92
        );


        ctx.fillStyle =
            "#facc15";

        ctx.fillText(
            "👑 ADMIN",
            0,
            -92
        );

    }


    // ------------------------------
    // اسم
    // ------------------------------

    ctx.textAlign =
        "center";

    ctx.font =
        "bold 18px Arial";

    ctx.lineWidth = 4;

    ctx.strokeStyle =
        "#000000";

    ctx.strokeText(
        safeName,
        0,
        -70
    );


    if (rainbow) {

        ctx.fillStyle =
            rainbowColor();

    }

    else {

        ctx.fillStyle =
            "#ffffff";

    }


    ctx.fillText(
        safeName,
        0,
        -70
    );


    // ------------------------------
    // سر
    // ------------------------------

    ctx.beginPath();

    ctx.arc(
        0,
        -35,
        19,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#ffffff";

    ctx.fill();

    ctx.strokeStyle =
        "#111827";

    ctx.lineWidth = 4;

    ctx.stroke();


    // ------------------------------
    // چشم چپ
    // ------------------------------

    ctx.beginPath();

    ctx.arc(
        -6,
        -37,
        3,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#111827";

    ctx.fill();


    // ------------------------------
    // چشم راست
    // ------------------------------

    ctx.beginPath();

    ctx.arc(
        6,
        -37,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // ------------------------------
    // بدن
    // ------------------------------

    ctx.beginPath();

    ctx.moveTo(
        0,
        -16
    );

    ctx.lineTo(
        0,
        25
    );


    if (rainbow) {

        ctx.strokeStyle =
            rainbowColor();

    }

    else if (mine) {

        ctx.strokeStyle =
            "#ef4444";

    }

    else {

        ctx.strokeStyle =
            "#2563eb";

    }


    ctx.lineWidth = 8;

    ctx.lineCap =
        "round";

    ctx.stroke();


    // ------------------------------
    // دست چپ
    // ------------------------------

    ctx.beginPath();

    ctx.moveTo(
        0,
        -8
    );

    ctx.lineTo(
        -29,
        13
    );

    ctx.strokeStyle =
        "#111827";

    ctx.lineWidth = 7;

    ctx.stroke();


    // ------------------------------
    // دست راست
    // ------------------------------

    ctx.beginPath();

    ctx.moveTo(
        0,
        -8
    );

    ctx.lineTo(
        29,
        13
    );

    ctx.stroke();


    // ------------------------------
    // پای چپ
    // ------------------------------

    ctx.beginPath();

    ctx.moveTo(
        0,
        25
    );

    ctx.lineTo(
        -21,
        56
    );

    ctx.stroke();


    // ------------------------------
    // پای راست
    // ------------------------------

    ctx.beginPath();

    ctx.moveTo(
        0,
        25
    );

    ctx.lineTo(
        21,
        56
    );

    ctx.stroke();


    ctx.restore();

}


// ==================================================
// رسم دنیا
// ==================================================

function drawWorld() {

    const ground =
        canvas.height * 0.65;


    // آسمان
    const sky =
        ctx.createLinearGradient(
            0,
            0,
            0,
            ground
        );

    sky.addColorStop(
        0,
        "#38bdf8"
    );

    sky.addColorStop(
        1,
        "#bae6fd"
    );


    ctx.fillStyle =
        sky;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        ground
    );


    // خورشید
    ctx.beginPath();

    ctx.arc(
        canvas.width - 120,
        80,
        50,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#fde047";

    ctx.fill();


    // زمین
    ctx.fillStyle =
        "#365314";

    ctx.fillRect(
        0,
        ground,
        canvas.width,
        canvas.height - ground
    );


    // چمن
    ctx.fillStyle =
        "#84cc16";

    ctx.fillRect(
        0,
        ground,
        canvas.width,
        8
    );

}


// ==================================================
// پنل ADMIN
// ==================================================

let selectedPlayer = null;


function setupAdmin() {

    if (!isAdmin) return;


    const adminButton =
        document.getElementById(
            "adminButton"
        );

    const overlay =
        document.getElementById(
            "adminOverlay"
        );

    const closeAdmin =
        document.getElementById(
            "closeAdmin"
        );


    if (!adminButton || !overlay) {
        return;
    }


    // دکمه ادمین
    adminButton.style.display =
        "block";


    adminButton.onclick = () => {

        overlay.style.display =
            "flex";

        refreshAdminPlayerList();

    };


    // بستن
    if (closeAdmin) {

        closeAdmin.onclick = () => {

            overlay.style.display =
                "none";

        };

    }


    // کلیک بیرون
    overlay.onclick = e => {

        if (e.target === overlay) {

            overlay.style.display =
                "none";

        }

    };


    // انتخاب خودمان به صورت پیش‌فرض
    selectedPlayer =
        socket.id;


    // ------------------------------
    // پرواز
    // ------------------------------

    const fly =
        document.getElementById(
            "flyButton"
        );

    if (fly) {

        fly.onclick = () => {

            sendAdminAction(
                "fly"
            );

        };

    }


    // ------------------------------
    // رنگی
    // ------------------------------

    const color =
        document.getElementById(
            "colorButton"
        );

    if (color) {

        color.onclick = () => {

            sendAdminAction(
                "color"
            );

        };

    }


    // ------------------------------
    // کشتن
    // ------------------------------

    const kill =
        document.getElementById(
            "killButton"
        );

    if (kill) {

        kill.onclick = () => {

            sendAdminAction(
                "kill"
            );

        };

    }


    // ------------------------------
    // کیک
    // ------------------------------

    const kick =
        document.getElementById(
            "kickButton"
        );

    if (kick) {

        kick.onclick = () => {

            sendAdminAction(
                "kick"
            );

        };

    }


    // ------------------------------
    // رنگی کردن همه
    // ------------------------------

    const allColor =
        document.getElementById(
            "allColorButton"
        );

    if (allColor) {

        allColor.onclick = () => {

            socket.emit(
                "adminAction",
                {
                    action:
                        "allColor"
                }
            );

            updateAdminStatus(
                "🌈 همه رنگی شدند"
            );

        };

    }

}


// ==================================================
// لیست همه بازیکنان
// ==================================================

function refreshAdminPlayerList() {

    if (!isAdmin) return;


    const list =
        document.getElementById(
            "playerList"
        );


    if (!list) return;


    list.innerHTML = "";


    // ------------------------------
    // خود ادمین
    // ------------------------------

    addAdminPlayerButton(
        list,
        socket.id,
        myName + " 👑 (خودم)"
    );


    // ------------------------------
    // بقیه
    // ------------------------------

    Object.values(players)
        .forEach(player => {

            addAdminPlayerButton(
                list,
                player.id,
                player.name
            );

        });

}


// ==================================================
// ساخت دکمه بازیکن
// ==================================================

function addAdminPlayerButton(
    list,
    id,
    name
) {

    const button =
        document.createElement(
            "button"
        );


    button.className =
        "playerButton";


    button.dataset.playerId =
        id;


    button.textContent =
        "👤 " + name;


    if (
        selectedPlayer === id
    ) {

        button.classList.add(
            "selected"
        );

    }


    button.onclick = () => {

        selectedPlayer =
            id;


        document
            .querySelectorAll(
                ".playerButton"
            )
            .forEach(button => {

                button.classList.remove(
                    "selected"
                );

            });


        button.classList.add(
            "selected"
        );


        updateAdminStatus(
            "🎯 انتخاب شد: " + name
        );

    };


    list.appendChild(
        button
    );

}


// ==================================================
// ارسال دستور
// ==================================================

function sendAdminAction(action) {

    if (!isAdmin) return;


    if (!selectedPlayer) {

        updateAdminStatus(
            "⚠️ اول یک بازیکن را انتخاب کن"
        );

        return;

    }


    socket.emit(
        "adminAction",
        {
            action: action,
            targetId: selectedPlayer
        }
    );


    updateAdminStatus(
        "✅ دستور ارسال شد"
    );

}


// ==================================================
// وضعیت پنل
// ==================================================

function updateAdminStatus(text) {

    const status =
        document.getElementById(
            "adminStatus"
        );


    if (status) {

        status.textContent =
            text;

    }

}


// ==================================================
// شروع ادمین
// ==================================================

setupAdmin();


// ==================================================
// رسم بازی
// ==================================================

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    drawWorld();


    // بازیکنان دیگر
    Object.values(players)
        .forEach(player => {

            drawStickman(
                player.x,
                player.y,
                player.name,
                player.admin,
                player.rainbow,
                player.health,
                false
            );

        });


    // خودمان
    drawStickman(
        me.x,
        me.y,
        myName,
        isAdmin,
        me.rainbow,
        me.health,
        true
    );

}


// ==================================================
// حلقه بازی
// ==================================================

function gameLoop() {

    update();

    draw();

    requestAnimationFrame(
        gameLoop
    );

}


gameLoop();
```
