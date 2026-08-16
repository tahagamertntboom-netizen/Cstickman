const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");


// =====================================
// اندازه صفحه
// =====================================

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resize();

window.addEventListener("resize", resize);


// =====================================
// اطلاعات بازیکن
// =====================================

const savedName = localStorage.getItem("player");

const myName =
    savedName &&
    savedName !== "undefined" &&
    savedName !== "null"
        ? String(savedName).trim()
        : "Player";


const roomCode =
    String(
        localStorage.getItem("roomCode") || ""
    ).trim();


console.log("PLAYER:", myName);
console.log("ROOM:", roomCode);


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

    onGround: false,

    admin:
        myName.toLowerCase() ===
        "tahagamertnt"

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
// اتصال Socket
// =====================================

socket.on("connect", () => {

    me.id = socket.id;

    console.log(
        "CONNECTED:",
        socket.id
    );


    // ---------------------------------
    // ورود دوباره به همان اتاق
    // ---------------------------------

    if (
        roomCode &&
        /^\d{6}$/.test(roomCode)
    ) {

        console.log(
            "JOINING ROOM:",
            roomCode
        );


        socket.emit(
            "joinRoom",
            {

                roomCode:
                    roomCode,

                playerName:
                    myName

            }
        );

    }
    else {

        console.log(
            "NO ROOM CODE"
        );

    }

});


// =====================================
// ورود موفق به اتاق
// =====================================

socket.on(
    "joinedRoom",
    (code) => {

        console.log(
            "JOINED ROOM:",
            code
        );

        localStorage.setItem(
            "roomCode",
            code
        );

    }
);


// =====================================
// لیست بازیکنان
// =====================================

socket.on(
    "players",
    (list) => {

        console.log(
            "PLAYERS:",
            list
        );


        if (
            !Array.isArray(list)
        ) {
            return;
        }


        const ids = [];


        list.forEach(
            (player) => {

                if (
                    !player ||
                    !player.id
                ) {
                    return;
                }


                ids.push(
                    player.id
                );


                // -------------------------
                // خودمان
                // -------------------------

                if (
                    player.id ===
                    socket.id
                ) {

                    me.name =
                        player.name ||
                        myName;


                    me.admin =
                        player.admin === true;


                    if (
                        typeof player.x ===
                        "number"
                    ) {

                        me.x =
                            player.x;

                    }


                    if (
                        typeof player.y ===
                        "number"
                    ) {

                        me.y =
                            player.y;

                    }


                    return;
                }


                // -------------------------
                // بازیکن جدید
                // -------------------------

                if (
                    !players[player.id]
                ) {

                    players[player.id] = {

                        id:
                            player.id,

                        name:
                            player.name ||
                            "Player",

                        admin:
                            player.admin === true,

                        x:
                            typeof player.x ===
                            "number"
                                ? player.x
                                : 300,

                        y:
                            typeof player.y ===
                            "number"
                                ? player.y
                                : 400,

                        vx: 0,

                        vy: 0

                    };

                }
                else {

                    // اسم را همیشه به‌روز کن

                    players[player.id].name =
                        player.name ||
                        "Player";


                    players[player.id].admin =
                        player.admin === true;


                    if (
                        typeof player.x ===
                        "number"
                    ) {

                        players[player.id].x =
                            player.x;

                    }


                    if (
                        typeof player.y ===
                        "number"
                    ) {

                        players[player.id].y =
                            player.y;

                    }

                }

            }
        );


        // -----------------------------
        // حذف بازیکنان خارج‌شده
        // -----------------------------

        Object.keys(
            players
        ).forEach(
            (id) => {

                if (
                    !ids.includes(id)
                ) {

                    delete players[id];

                }

            }
        );

    }
);


// =====================================
// حرکت بازیکنان دیگر
// =====================================

socket.on(
    "playerMoved",
    (data) => {

        if (
            !data ||
            !data.id
        ) {

            return;

        }


        // اگر هنوز اطلاعاتش را نداریم
        if (
            !players[data.id]
        ) {

            players[data.id] = {

                id:
                    data.id,

                name:
                    data.name ||
                    "Player",

                admin:
                    data.admin === true,

                x:
                    typeof data.x ===
                    "number"
                        ? data.x
                        : 300,

                y:
                    typeof data.y ===
                    "number"
                        ? data.y
                        : 400,

                vx: 0,

                vy: 0

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


        if (
            typeof data.vx ===
            "number"
        ) {

            players[data.id].vx =
                data.vx;

        }


        if (
            typeof data.vy ===
            "number"
        ) {

            players[data.id].vy =
                data.vy;

        }


        // اگر سرور اسم را هم فرستاد
        if (
            typeof data.name ===
            "string"
        ) {

            players[data.id].name =
                data.name;

        }


        if (
            typeof data.admin ===
            "boolean"
        ) {

            players[data.id].admin =
                data.admin;

        }

    }
);


// =====================================
// کیبورد
// A / D
// فارسی ش / ی
// =====================================

window.addEventListener(
    "keydown",
    (e) => {

        if (
            e.code === "KeyA"
        ) {

            keys.left = true;

            e.preventDefault();

        }


        if (
            e.code === "KeyD"
        ) {

            keys.right = true;

            e.preventDefault();

        }


        if (
            e.code === "KeyW" ||
            e.code === "Space" ||
            e.code === "ArrowUp"
        ) {

            jump();

            e.preventDefault();

        }

    }
);


window.addEventListener(
    "keyup",
    (e) => {

        if (
            e.code === "KeyA"
        ) {

            keys.left = false;

            e.preventDefault();

        }


        if (
            e.code === "KeyD"
        ) {

            keys.right = false;

            e.preventDefault();

        }

    }
);


// =====================================
// کنترل لمسی
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
        (e) => {

            e.preventDefault();

            keys.left = true;

        }
    );


    leftButton.addEventListener(
        "pointerup",
        (e) => {

            e.preventDefault();

            keys.left = false;

        }
    );


    leftButton.addEventListener(
        "pointercancel",
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
        (e) => {

            e.preventDefault();

            keys.right = true;

        }
    );


    rightButton.addEventListener(
        "pointerup",
        (e) => {

            e.preventDefault();

            keys.right = false;

        }
    );


    rightButton.addEventListener(
        "pointercancel",
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

    if (
        me.onGround
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
        keys.left
    ) {

        me.vx = -5;

    }
    else if (
        keys.right
    ) {

        me.vx = 5;

    }
    else {

        me.vx *= 0.8;

    }


    me.x += me.vx;


    // -----------------------------
    // جاذبه
    // -----------------------------

    me.vy += 0.6;

    me.y += me.vy;


    // -----------------------------
    // زمین
    // -----------------------------

    const ground =
        canvas.height * 0.65;


    if (
        me.y + 55 >=
        ground
    ) {

        me.y =
            ground - 55;

        me.vy = 0;

        me.onGround = true;

    }
    else {

        me.onGround = false;

    }


    // -----------------------------
    // مرز صفحه
    // -----------------------------

    if (
        me.x < 30
    ) {

        me.x = 30;

    }


    if (
        me.x >
        canvas.width - 30
    ) {

        me.x =
            canvas.width - 30;

    }


    // -----------------------------
    // ارسال حرکت
    // -----------------------------

    if (
        socket.connected
    ) {

        socket.emit(
            "move",
            {

                x:
                    me.x,

                y:
                    me.y,

                vx:
                    me.vx,

                vy:
                    me.vy

            }
        );

    }

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
        name.trim() !== ""
            ? name
            : "Player";


    ctx.save();


    ctx.translate(
        x,
        y
    );


    // -----------------------------
    // سایه
    // -----------------------------

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


    // -----------------------------
    // سر
    // -----------------------------

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


    // -----------------------------
    // چشم چپ
    // -----------------------------

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


    // -----------------------------
    // چشم راست
    // -----------------------------

    ctx.beginPath();

    ctx.arc(
        6,
        -37,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // -----------------------------
    // بدن
    // -----------------------------

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


    // -----------------------------
    // دست چپ
    // -----------------------------

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


    // -----------------------------
    // دست راست
    // -----------------------------

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


    // -----------------------------
    // پای چپ
    // -----------------------------

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


    // -----------------------------
    // پای راست
    // -----------------------------

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


    // -----------------------------
    // اسم
    // -----------------------------

    ctx.font =
        "bold 16px Arial";

    ctx.textAlign =
        "center";


    const displayName =
        safeName +
        (
            admin
                ? " 👑"
                : ""
        );


    ctx.lineWidth = 4;

    ctx.strokeStyle =
        "#000000";

    ctx.strokeText(
        displayName,
        0,
        -68
    );


    ctx.fillStyle =
        admin
            ? "#22c55e"
            : "#ffffff";

    ctx.fillText(
        displayName,
        0,
        -68
    );


    // -----------------------------
    // ADMIN
    // -----------------------------

    if (
        admin
    ) {

        ctx.font =
            "bold 14px Arial";

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
// دنیای بازی
// =====================================

function drawWorld() {

    const ground =
        canvas.height * 0.65;


    // -----------------------------
    // آسمان
    // -----------------------------

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


    // -----------------------------
    // خورشید
    // -----------------------------

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


    // -----------------------------
    // زمین
    // -----------------------------

    ctx.fillStyle =
        "#365314";

    ctx.fillRect(
        0,
        ground,
        canvas.width,
        canvas.height - ground
    );


    // -----------------------------
    // چمن
    // -----------------------------

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
// رسم بازی
// =====================================

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    drawWorld();


    // -----------------------------
    // بازیکنان دیگر
    // -----------------------------

    Object.values(
        players
    ).forEach(
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


    // -----------------------------
    // خودمان
    // -----------------------------

    drawStickman(

        me.x,

        me.y,

        me.name,

        me.admin,

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
