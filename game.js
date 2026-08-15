const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resize();

window.addEventListener("resize", resize);


// =====================================
// اسم بازیکن
// =====================================

const savedName = localStorage.getItem("player");

const myName =
    savedName &&
    savedName !== "undefined" &&
    savedName !== "null"
        ? String(savedName).trim()
        : "Player";


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

    console.log("Connected:", socket.id);

});


// =====================================
// دریافت بازیکنان
// =====================================

socket.on("players", (list) => {

    if (!Array.isArray(list)) {
        return;
    }

    const currentIds = [];

    list.forEach((player) => {

        if (!player || !player.id) {
            return;
        }

        currentIds.push(player.id);

        // خودمان
        if (player.id === socket.id) {

            if (typeof player.x === "number") {
                me.x = player.x;
            }

            if (typeof player.y === "number") {
                me.y = player.y;
            }

            return;
        }

        // بازیکن جدید
        if (!players[player.id]) {

            players[player.id] = {
                id: player.id,
                name: "Player",
                admin: false,
                x: 300,
                y: 400
            };

        }

        players[player.id].name =
            player.name || "Player";

        players[player.id].admin =
            player.admin === true;

        if (typeof player.x === "number") {
            players[player.id].x = player.x;
        }

        if (typeof player.y === "number") {
            players[player.id].y = player.y;
        }

    });


    // حذف بازیکنان خارج‌شده

    Object.keys(players).forEach((id) => {

        if (!currentIds.includes(id)) {

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
// کنترل کیبورد
// =====================================

window.addEventListener("keydown", (e) => {

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
        jump();
    }

});


window.addEventListener("keyup", (e) => {

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
        "pointerleave",
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
        "pointerleave",
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
// آپدیت بازی
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


    // جاذبه

    me.vy += 0.6;

    me.y += me.vy;


    // زمین

    const ground =
        canvas.height * 0.65;


    if (me.y + 55 >= ground) {

        me.y =
            ground - 55;

        me.vy = 0;

        me.onGround = true;

    }
    else {

        me.onGround = false;

    }


    // محدودیت صفحه

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


    // ارسال حرکت

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
// رسم استیکمن
// =====================================

function drawStickman(
    x,
    y,
    name,
    admin,
    mine
) {

    const safeName =
        typeof name === "string" &&
        name.trim() !== "" &&
        name !== "undefined" &&
        name !== "null"
            ? name
            : "Player";


    ctx.save();

    ctx.translate(x, y);


    // سایه

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


    // سر

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


    // چشم چپ

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


    // چشم راست

    ctx.beginPath();

    ctx.arc(
        6,
        -37,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // بدن

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
            ? "#22c55e"
            : "#ef4444";

    ctx.lineWidth = 8;

    ctx.lineCap =
        "round";

    ctx.stroke();


    // دست چپ

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


    // دست راست

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


    // پای چپ

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


    // پای راست

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


    // اسم

    ctx.font =
        "bold 16px Arial";

    ctx.textAlign =
        "center";

    ctx.lineWidth = 4;

    ctx.strokeStyle =
        "#000000";


    const displayName =
        safeName +
        (
            admin === true
                ? " 👑"
                : ""
        );


    ctx.strokeText(
        displayName,
        0,
        -68
    );


    ctx.fillStyle =
        admin === true
            ? "#22c55e"
            : "#ffffff";


    ctx.fillText(
        displayName,
        0,
        -68
    );


    // نوشته ADMIN

    if (admin === true) {

        ctx.font =
            "bold 15px Arial";

        ctx.strokeStyle =
            "#000000";

        ctx.lineWidth = 4;

        ctx.strokeText(
            "ADMIN",
            0,
            -88
        );

        ctx.fillStyle =
            "#facc15";

        ctx.fillText(
            "ADMIN",
            0,
            -88
        );

    }


    ctx.restore();

}


// =====================================
// آسمان و زمین
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


    // خورشید

    ctx.beginPath();

    ctx.arc(
        canvas.width - 120,
        90,
        45,
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


// =====================================
// رسم همه چیز
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
        .forEach((player) => {

            drawStickman(
                player.x,
                player.y,
                player.name,
                player.admin,
                false
            );

        });


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

    requestAnimationFrame(loop);

}


loop();
