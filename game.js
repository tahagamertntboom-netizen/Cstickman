const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


// =====================================
// اطلاعات بازیکن
// =====================================

const savedName =
    localStorage.getItem("player");

const myName =
    savedName &&
    savedName !== "undefined" &&
    savedName !== "null"
        ? savedName
        : "Player";

const roomCode =
    localStorage.getItem("room") || "";


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

    width: 36,

    height: 80,

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
                player.name &&
                player.name !== "undefined"
                    ? player.name
                    : "Player",

            admin:
                player.admin === true,

            x:
                typeof player.x === "number"
                    ? player.x
                    : 300,

            y:
                typeof player.y === "number"
                    ? player.y
                    : 400

        };

    });


    const ids =
        list
            .filter(p => p && p.id)
            .map(p => p.id);


    Object.keys(players).forEach((id) => {

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

            y: 400

        };

    }

    if (typeof data.x === "number") {

        players[data.id].x = data.x;

    }

    if (typeof data.y === "number") {

        players[data.id].y = data.y;

    }

});


// =====================================
// صفحه کلید
// =====================================

window.addEventListener("keydown", (e) => {

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

});


window.addEventListener("keyup", (e) => {

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

});


// =====================================
// دکمه‌های موبایل
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

    if (me.onGround) {

        me.vy = -13;

        me.onGround = false;

    }

}


// =====================================
// حرکت
// =====================================

function update() {

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


    me.vy += 0.6;

    me.y += me.vy;


    const ground =
        canvas.height * 0.65;


    if (
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
// استیکمن
// =====================================

function drawStickman(
    x,
    y,
    name,
    admin,
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
            : (mine ? myName : "Player");


    ctx.save();

    ctx.translate(x, y);


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
    // چشم‌ها
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

    ctx.strokeStyle =
        mine
            ? "#2563eb"
            : "#ef4444";

    ctx.lineWidth = 9;

    ctx.lineCap =
        "round";

    ctx.stroke();


    // =================================
    // دست چپ
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


    // =================================
    // دست راست
    // =================================

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
    // پای چپ
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


    // =================================
    // پای راست
    // =================================

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
    // اسم و ADMIN
    // =================================

    ctx.textAlign =
        "center";


    /*
       فقط برای ادمین:
       نوشته ADMIN بالای اسم
    */

    if (admin === true) {

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


    /*
       اسم ادمین رنگین‌کمانی
    */

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


    if (admin === true) {

        const hue =
            (Date.now() / 8) % 360;


        ctx.fillStyle =
            `hsl(${hue}, 100%, 60%)`;

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


    ctx.restore();

}


// =====================================
// دنیا
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

function createAdminButton() {

    if (
        myName.toLowerCase() !==
        "tahagamertnt"
    ) {

        return;

    }


    const existingButton =
        document.getElementById(
            "adminButton"
        );


    if (existingButton) {

        existingButton.style.display =
            "block";

        return;

    }


    const button =
        document.createElement(
            "button"
        );


    button.id =
        "adminButton";


    button.textContent =
        "👑 ADMIN";


    button.style.cssText = `
        position:fixed;
        top:15px;
        right:15px;
        z-index:10000;
        padding:12px 18px;
        border:0;
        border-radius:12px;
        background:#ef4444;
        color:white;
        font-size:16px;
        font-weight:bold;
        cursor:pointer;
    `;


    button.onclick =
        () => {

            alert(
                "👑 پنل ادمین آماده است"
            );

        };


    document.body.appendChild(
        button
    );

}


createAdminButton();


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
            (player) => {

                drawStickman(

                    player.x,

                    player.y,

                    player.name,

                    player.admin,

                    false

                );

            }
        );


    // خودمان

    drawStickman(

        me.x,

        me.y,

        myName,

        myName.toLowerCase() ===
            "tahagamertnt",

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
