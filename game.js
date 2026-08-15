const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


// =====================================
// اطلاعات
// =====================================

const savedName =
    localStorage.getItem("player");

const myName =
    savedName &&
    savedName !== "undefined" &&
    savedName !== "null"
        ? String(savedName).trim()
        : "Player";

const roomCode =
    localStorage.getItem("room") || "";

const isAdmin =
    myName.toLowerCase() === "tahagamertnt";


// =====================================
// بازیکن خودمان
// =====================================

const me = {

    id: "",

    name: myName,

    x: 250,

    y: 300,

    vx: 0,

    vy: 0,

    health: 100,

    flying: false,

    rainbow: isAdmin,

    onGround: false

};


// =====================================
// بازیکنان دیگر
// =====================================

const players = {};


// =====================================
// کنترل
// =====================================

const keys = {
    left: false,
    right: false
};


// =====================================
// اتصال
// =====================================

socket.on("connect", () => {

    me.id = socket.id;

    if (roomCode) {

        socket.emit("joinRoom", {

            roomCode: roomCode,

            playerName: myName

        });

    }

});


// =====================================
// بازیکنان اتاق
// =====================================

socket.on("players", (list) => {

    if (!Array.isArray(list)) {
        return;
    }

    list.forEach((player) => {

        if (!player || !player.id) {
            return;
        }

        if (player.id === socket.id) {
            return;
        }

        players[player.id] = {

            id: player.id,

            name:
                player.name || "Player",

            admin:
                player.admin === true,

            x:
                typeof player.x === "number"
                    ? player.x
                    : 300,

            y:
                typeof player.y === "number"
                    ? player.y
                    : 400,

            health:
                typeof player.health === "number"
                    ? player.health
                    : 100,

            flying:
                player.flying === true,

            rainbow:
                player.rainbow === true

        };

    });


    const ids =
        list
            .filter(
                p => p && p.id
            )
            .map(
                p => p.id
            );


    Object.keys(players)
        .forEach((id) => {

            if (!ids.includes(id)) {

                delete players[id];

            }

        });

});


// =====================================
// حرکت بازیکنان دیگر
// =====================================

socket.on("playerMoved", (data) => {

    if (!data || !data.id) {
        return;
    }


    if (!players[data.id]) {

        players[data.id] = {

            id: data.id,

            name: "Player",

            admin: false,

            x: 300,

            y: 400,

            health: 100,

            flying: false,

            rainbow: false

        };

    }


    if (
        typeof data.x ===
        "number"
    ) {

        players[data.id].x =
            data.x;

    }


    if (
        typeof data.y ===
        "number"
    ) {

        players[data.id].y =
            data.y;

    }

});


// =====================================
// نتیجه قابلیت ادمین
// =====================================

socket.on(
    "adminEffect",
    (data) => {

        if (!data) {
            return;
        }


        const targetId =
            data.targetId;


        // -------------------------------
        // رنگی کردن همه
        // -------------------------------

        if (
            data.action ===
            "allColor"
        ) {

            me.rainbow = true;


            Object.values(players)
                .forEach(
                    player => {

                        player.rainbow =
                            true;

                    }
                );


            return;

        }


        // -------------------------------
        // اگر هدف خودمان هستیم
        // -------------------------------

        if (
            targetId ===
            socket.id
        ) {

            if (
                data.action ===
                "fly"
            ) {

                me.flying =
                    data.value === true;

            }


            if (
                data.action ===
                "color"
            ) {

                me.rainbow =
                    data.value === true;

            }


            if (
                data.action ===
                "kill"
            ) {

                me.health = 0;

            }


            return;

        }


        // -------------------------------
        // اگر هدف بازیکن دیگر است
        // -------------------------------

        if (
            players[targetId]
        ) {

            if (
                data.action ===
                "fly"
            ) {

                players[targetId].flying =
                    data.value === true;

            }


            if (
                data.action ===
                "color"
            ) {

                players[targetId].rainbow =
                    data.value === true;

            }


            if (
                data.action ===
                "kill"
            ) {

                players[targetId].health =
                    0;

            }

        }

    }
);


// =====================================
// اخراج شدن
// =====================================

socket.on(
    "kicked",
    (data) => {

        alert(
            data &&
            data.reason
                ? data.reason
                : "از بازی خارج شدید."
        );


        window.location.href =
            "/";

    }
);


// =====================================
// خطای ادمین
// =====================================

socket.on(
    "adminError",
    (message) => {

        alert(
            message ||
            "خطای ادمین"
        );

    }
);


// =====================================
// کیبورد
// =====================================

window.addEventListener(
    "keydown",
    (e) => {

        const key =
            e.key.toLowerCase();


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

            jump();

        }

    }
);


window.addEventListener(
    "keyup",
    (e) => {

        const key =
            e.key.toLowerCase();


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

    }
);


// =====================================
// دکمه‌های بازی
// =====================================

const leftButton =
    document.getElementById("left");

const rightButton =
    document.getElementById("right");

const jumpButton =
    document.getElementById("jump");


if (leftButton) {

    leftButton.addEventListener(
        "pointerdown",
        () => {

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
        () => {

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
        (e) => {

            e.preventDefault();

            jump();

        }
    );

}


// =====================================
// پرش
// =====================================

function jump() {

    if (
        me.onGround ||
        me.flying
    ) {

        me.vy = -13;

        me.onGround = false;

    }

}


// =====================================
// حرکت
// =====================================

function update() {

    if (
        me.health <= 0
    ) {

        me.vx = 0;

        return;

    }


    if (keys.left) {

        me.vx = -5;

    }

    else if (keys.right) {

        me.vx = 5;

    }

    else {

        me.vx *= 0.8;

    }


    me.x += me.vx;


    // -------------------------------
    // پرواز
    // -------------------------------

    if (me.flying) {

        if (keys.left) {

            me.vy -= 0.35;

        }

        if (keys.right) {

            me.vy -= 0.35;

        }


        me.vy *= 0.92;

    }

    else {

        me.vy += 0.6;

    }


    me.y += me.vy;


    const ground =
        canvas.height * 0.65;


    if (
        !me.flying &&
        me.y + 55 >= ground
    ) {

        me.y =
            ground - 55;

        me.vy = 0;

        me.onGround = true;

    }

    else {

        me.onGround = false;

    }


    // -------------------------------
    // مرزها
    // -------------------------------

    if (me.x < 30) {

        me.x = 30;

    }


    if (
        me.x >
        canvas.width - 30
    ) {

        me.x =
            canvas.width - 30;

    }


    if (
        me.y < 30
    ) {

        me.y = 30;

        me.vy = 0;

    }


    if (
        me.y >
        canvas.height + 300
    ) {

        me.y =
            ground - 55;

        me.vy = 0;

    }


    // -------------------------------
    // ارسال حرکت
    // -------------------------------

    socket.emit(
        "move",
        {

            x: me.x,

            y: me.y,

            vx: me.vx,

            vy: me.vy

        }
    );

}


// =====================================
// رنگ
// =====================================

function rainbowColor() {

    return (
        "hsl(" +
        ((Date.now() / 5) % 360) +
        ", 100%, 60%)"
    );

}


// =====================================
// رسم استیکمن
// =====================================

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

    ctx.translate(
        x,
        y
    );


    // =================================
    // سایه
    // =================================

    ctx.beginPath();

    ctx.ellipse(
        0,
        58,
        25,
        7,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(0,0,0,.3)";

    ctx.fill();


    // =================================
    // سر
    // =================================

    ctx.beginPath();

    ctx.arc(
        0,
        -35,
        18,
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


    // =================================
    // چشم
    // =================================

    ctx.fillStyle =
        "#111827";


    ctx.beginPath();

    ctx.arc(
        -6,
        -37,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        6,
        -37,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // =================================
    // بدن
    // =================================

    ctx.beginPath();

    ctx.moveTo(
        0,
        -17
    );

    ctx.lineTo(
        0,
        25
    );


    if (rainbow) {

        ctx.strokeStyle =
            rainbowColor();

    }

    else {

        ctx.strokeStyle =
            mine
                ? "#2563eb"
                : "#ef4444";

    }


    ctx.lineWidth = 9;

    ctx.lineCap =
        "round";

    ctx.stroke();


    // =================================
    // دست‌ها
    // =================================

    ctx.beginPath();

    ctx.moveTo(
        0,
        -7
    );

    ctx.lineTo(
        -27,
        12
    );

    ctx.strokeStyle =
        "#111827";

    ctx.lineWidth = 7;

    ctx.stroke();


    ctx.beginPath();

    ctx.moveTo(
        0,
        -7
    );

    ctx.lineTo(
        27,
        12
    );

    ctx.stroke();


    // =================================
    // پاها
    // =================================

    ctx.beginPath();

    ctx.moveTo(
        0,
        25
    );

    ctx.lineTo(
        -20,
        55
    );

    ctx.stroke();


    ctx.beginPath();

    ctx.moveTo(
        0,
        25
    );

    ctx.lineTo(
        20,
        55
    );

    ctx.stroke();


    // =================================
    // ADMIN
    // =================================

    ctx.textAlign =
        "center";


    if (admin) {

        ctx.font =
            "bold 14px Arial";

        ctx.lineWidth = 4;

        ctx.strokeStyle =
            "#000000";

        ctx.strokeText(
            "👑 ADMIN",
            0,
            -88
        );

        ctx.fillStyle =
            "#facc15";

        ctx.fillText(
            "👑 ADMIN",
            0,
            -88
        );

    }


    // =================================
    // اسم
    // =================================

    ctx.font =
        "bold 17px Arial";

    ctx.lineWidth = 4;

    ctx.strokeStyle =
        "#000000";

    ctx.strokeText(
        safeName,
        0,
        -68
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
        -68
    );


    // =================================
    // جان
    // =================================

    const hp =
        Math.max(
            0,
            Math.min(
                100,
                health ?? 100
            )
        );


    const barWidth =
        55;

    const barHeight =
        7;


    ctx.fillStyle =
        "#111827";


    ctx.fillRect(
        -barWidth / 2,
        -105,
        barWidth,
        barHeight
    );


    ctx.fillStyle =
        "#22c55e";


    ctx.fillRect(
        -barWidth / 2,
        -105,
        barWidth * (hp / 100),
        barHeight
    );


    ctx.restore();

}


// =====================================
// دنیای بازی
// =====================================

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


    // زمین

    ctx.fillStyle =
        "#365314";


    ctx.fillRect(
        0,
        ground,
        canvas.width,
        canvas.height -
        ground
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


    // خورشید

    ctx.beginPath();

    ctx.arc(
        canvas.width - 100,
        100,
        45,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#fde047";

    ctx.fill();

}


// =====================================
// دکمه ADMIN
// =====================================

function setupAdminButton() {

    if (!isAdmin) {
        return;
    }


    const button =
        document.getElementById(
            "adminButton"
        );


    if (!button) {
        return;
    }


    button.style.display =
        "block";


    const overlay =
        document.getElementById(
            "adminOverlay"
        );


    if (!overlay) {
        return;
    }


    // -------------------------------
    // دکمه باز کردن پنل
    // -------------------------------

    button.onclick =
        () => {

            overlay.style.display =
                "flex";

            refreshPlayerList();

        };


    const closeButton =
        document.getElementById(
            "closeAdmin"
        );


    if (closeButton) {

        closeButton.onclick =
            () => {

                overlay.style.display =
                    "none";

            };

    }


    // -------------------------------
    // پرواز
    // -------------------------------

    const flyButton =
        document.getElementById(
            "flyButton"
        );


    if (flyButton) {

        flyButton.onclick =
            () => {

                sendAdminAction(
                    "fly"
                );

            };

    }


    // -------------------------------
    // رنگ
    // -------------------------------

    const colorButton =
        document.getElementById(
            "colorButton"
        );


    if (colorButton) {

        colorButton.onclick =
            () => {

                sendAdminAction(
                    "color"
                );

            };

    }


    // -------------------------------
    // کشتن
    // -------------------------------

    const killButton =
        document.getElementById(
            "killButton"
        );


    if (killButton) {

        killButton.onclick =
            () => {

                sendAdminAction(
                    "kill"
                );

            };

    }


    // -------------------------------
    // اخراج
    // -------------------------------

    const kickButton =
        document.getElementById(
            "kickButton"
        );


    if (kickButton) {

        kickButton.onclick =
            () => {

                sendAdminAction(
                    "kick"
                );

            };

    }


    // -------------------------------
    // رنگی کردن همه
    // -------------------------------

    const allColorButton =
        document.getElementById(
            "allColorButton"
        );


    if (allColorButton) {

        allColorButton.onclick =
            () => {

                socket.emit(
                    "adminAction",
                    {
                        action:
                            "allColor"
                    }
                );

            };

    }


    // -------------------------------
    // بازیکن خودمان به صورت پیش‌فرض
    // -------------------------------

    selectedPlayer =
        socket.id;


    updateAdminStatus(
        "🎯 هدف فعلی: خودم"
    );

}


// =====================================
// انتخاب بازیکن ادمین
// =====================================

let selectedPlayer = null;


function refreshPlayerList() {

    const list =
        document.getElementById(
            "playerList"
        );


    if (!list) {
        return;
    }


    list.innerHTML = "";


    // خود ادمین

    addPlayerButton(
        list,
        socket.id,
        myName + " 👑 (خودم)"
    );


    Object.values(players)
        .forEach(
            player => {

                addPlayerButton(

                    list,

                    player.id,

                    player.name

                );

            }
        );

}


function addPlayerButton(
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


    button.onclick =
        () => {

            selectedPlayer =
                id;


            document
                .querySelectorAll(
                    ".playerButton"
                )
                .forEach(
                    b => {

                        b.classList.remove(
                            "selected"
                        );

                    }
                );


            button.classList.add(
                "selected"
            );


            updateAdminStatus(
                "🎯 انتخاب: " + name
            );

        };


    list.appendChild(
        button
    );

}


// =====================================
// ارسال دستور ادمین
// =====================================

function sendAdminAction(
    action
) {

    if (!isAdmin) {
        return;
    }


    /*
       اگر هیچ بازیکنی انتخاب نشده،
       خود ادمین هدف باشد.
    */

    const targetId =
        selectedPlayer ||
        socket.id;


    socket.emit(
        "adminAction",
        {

            action:
                action,

            targetId:
                targetId

        }
    );


    updateAdminStatus(
        "✅ دستور ارسال شد"
    );

}


// =====================================
// وضعیت پنل
// =====================================

function updateAdminStatus(
    text
) {

    const status =
        document.getElementById(
            "adminStatus"
        );


    if (status) {

        status.textContent =
            text;

    }

}


// =====================================
// فعال کردن ادمین
// =====================================

setupAdminButton();


// =====================================
// رسم
// =====================================

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
        .forEach(
            player => {

                drawStickman(

                    player.x,

                    player.y,

                    player.name,

                    player.admin,

                    player.rainbow,

                    player.health,

                    false

                );

            }
        );


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


// =====================================
// حلقه بازی
// =====================================

function loop() {

    update();

    draw();

    requestAnimationFrame(
        loop
    );

}


loop();


// =====================================
// تغییر اندازه
// =====================================

window.addEventListener(
    "resize",
    () => {

        canvas.width =
            window.innerWidth;

        canvas.height =
            window.innerHeight;

    }
);
