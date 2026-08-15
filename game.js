const canvas =
    document.getElementById("game");

const ctx =
    canvas.getContext("2d");


/* =========================
   اندازه صفحه
========================= */

function resize(){

    canvas.width =
        window.innerWidth *
        devicePixelRatio;

    canvas.height =
        window.innerHeight *
        devicePixelRatio;

    ctx.setTransform(
        devicePixelRatio,
        0,
        0,
        devicePixelRatio,
        0,
        0
    );

}

resize();

window.addEventListener(
    "resize",
    resize
);


/* =========================
   اطلاعات بازیکن
========================= */

const myName =
    localStorage.getItem("player")
    || "Player";


const roomCode =
    localStorage.getItem("room")
    || "";


/* =========================
   Socket
========================= */

const socket =
    io();


/* =========================
   بازیکن خودم
========================= */

const me = {

    x:300,

    y:0,

    vx:0,

    vy:0,

    width:30,

    height:70,

    speed:5,

    name:myName,

    direction:1,

    walking:false,

    frame:0

};


/* =========================
   بازیکنان دیگر
========================= */

const players = {};


/* =========================
   کنترل
========================= */

const keys = {

    left:false,

    right:false

};


window.addEventListener(
    "keydown",
    function(e){

        if(
            e.key === "a" ||
            e.key === "A" ||
            e.key === "ش"
        ){

            keys.left = true;

        }


        if(
            e.key === "d" ||
            e.key === "D" ||
            e.key === "ی"
        ){

            keys.right = true;

        }

    }
);


window.addEventListener(
    "keyup",
    function(e){

        if(
            e.key === "a" ||
            e.key === "A" ||
            e.key === "ش"
        ){

            keys.left = false;

        }


        if(
            e.key === "d" ||
            e.key === "D" ||
            e.key === "ی"
        ){

            keys.right = false;

        }

    }
);


/* =========================
   موبایل
========================= */

function mobileButton(
    id,
    side
){

    const button =
        document.getElementById(id);


    button.addEventListener(
        "pointerdown",
        function(e){

            e.preventDefault();

            keys[side] = true;

        }
    );


    button.addEventListener(
        "pointerup",
        function(e){

            e.preventDefault();

            keys[side] = false;

        }
    );


    button.addEventListener(
        "pointercancel",
        function(){

            keys[side] = false;

        }
    );


    button.addEventListener(
        "pointerleave",
        function(){

            keys[side] = false;

        }
    );

}


mobileButton(
    "left",
    "left"
);

mobileButton(
    "right",
    "right"
);


/* =========================
   زمین
========================= */

const groundY =
    0.78;


/* =========================
   دوربین
========================= */

let cameraX = 0;


/* =========================
   درخت‌ها
========================= */

const trees = [];

for(
    let i = 0;
    i < 60;
    i++
){

    trees.push({

        x:
            i * 300 +
            Math.random() * 150,

        scale:
            0.7 +
            Math.random() * 0.6

    });

}


/* =========================
   اتصال
========================= */

socket.on(
    "connect",
    function(){

        socket.emit(
            "gameJoin",
            {
                roomCode:roomCode,
                name:myName
            }
        );

    }
);


/* =========================
   بازیکن‌های آنلاین
========================= */

socket.on(
    "gamePlayers",
    function(list){

        list.forEach(
            function(p){

                if(
                    p.id === socket.id
                ){

                    return;

                }


                players[p.id] = p;

            }
        );

    }
);


/* =========================
   حرکت آنلاین
========================= */

socket.on(
    "playerMove",
    function(p){

        if(
            p.id === socket.id
        ){

            return;

        }


        players[p.id] = {

            ...players[p.id],

            ...p

        };

    }
);


/* =========================
   خروج
========================= */

socket.on(
    "playerLeave",
    function(id){

        delete players[id];

    }
);


/* =========================
   ارسال حرکت
========================= */

function sendPosition(){

    socket.emit(
        "playerMove",
        {

            roomCode:roomCode,

            x:me.x,

            y:me.y,

            direction:
                me.direction,

            walking:
                me.walking

        }
    );

}


/* =========================
   رسم آسمان
========================= */

function drawSky(){

    const w =
        window.innerWidth;

    const h =
        window.innerHeight;


    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            h
        );


    gradient.addColorStop(
        0,
        "#60a5fa"
    );


    gradient.addColorStop(
        1,
        "#dbeafe"
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        w,
        h
    );


    /* خورشید */

    ctx.fillStyle =
        "#fde047";


    ctx.beginPath();

    ctx.arc(
        w - 100,
        90,
        45,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


/* =========================
   رسم ابر
========================= */

function drawCloud(
    x,
    y,
    scale
){

    ctx.fillStyle =
        "#ffffffcc";


    ctx.beginPath();

    ctx.arc(
        x,
        y,
        25 * scale,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + 30 * scale,
        y - 10 * scale,
        35 * scale,
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + 65 * scale,
        y,
        25 * scale,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


/* =========================
   رسم درخت
========================= */

function drawTree(
    x,
    scale
){

    const baseY =
        window.innerHeight *
        groundY;


    ctx.save();

    ctx.translate(
        x,
        baseY
    );

    ctx.scale(
        scale,
        scale
    );


    /* تنه */

    ctx.fillStyle =
        "#78350f";


    ctx.fillRect(
        -15,
        -150,
        30,
        150
    );


    /* برگ */

    ctx.fillStyle =
        "#166534";


    ctx.beginPath();

    ctx.arc(
        0,
        -180,
        65,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        -45,
        -145,
        45,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        45,
        -145,
        45,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();

}


/* =========================
   زمین
========================= */

function drawGround(){

    const y =
        window.innerHeight *
        groundY;


    ctx.fillStyle =
        "#15803d";


    ctx.fillRect(
        0,
        y,
        window.innerWidth,
        window.innerHeight - y
    );


    ctx.fillStyle =
        "#166534";


    ctx.fillRect(
        0,
        y,
        window.innerWidth,
        12
    );

}


/* =========================
   استیکمن
========================= */

function drawStickman(
    p,
    screenX,
    screenY
){

    const walk =
        p.walking
        ? Math.sin(
            p.frame * 0.35
        )
        : 0;


    const dir =
        p.direction || 1;


    ctx.save();

    ctx.translate(
        screenX,
        screenY
    );


    ctx.scale(
        dir,
        1
    );


    ctx.strokeStyle =
        "#111827";

    ctx.fillStyle =
        "#f8fafc";

    ctx.lineWidth =
        5;

    ctx.lineCap =
        "round";


    /* اسم */

    ctx.save();

    ctx.scale(
        dir,
        1
    );

    ctx.font =
        "bold 15px Arial";

    ctx.textAlign =
        "center";

    ctx.fillStyle =
        "white";

    ctx.strokeStyle =
        "#000";

    ctx.lineWidth =
        4;

    ctx.strokeText(
        p.name,
        0,
        -95
    );

    ctx.fillText(
        p.name,
        0,
        -95
    );

    ctx.restore();


    /* سر */

    ctx.beginPath();

    ctx.arc(
        0,
        -70,
        13,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.stroke();


    /* بدن */

    ctx.beginPath();

    ctx.moveTo(
        0,
        -57
    );

    ctx.lineTo(
        0,
        -25
    );

    ctx.stroke();


    /* دست عقب */

    ctx.beginPath();

    ctx.moveTo(
        0,
        -50
    );

    ctx.lineTo(
        -18,
        -32 + walk * 8
    );

    ctx.stroke();


    /* دست جلو */

    ctx.beginPath();

    ctx.moveTo(
        0,
        -50
    );

    ctx.lineTo(
        18,
        -32 - walk * 8
    );

    ctx.stroke();


    /* پای عقب */

    ctx.beginPath();

    ctx.moveTo(
        0,
        -25
    );

    ctx.lineTo(
        -15 + walk * 10,
        0
    );

    ctx.stroke();


    /* پای جلو */

    ctx.beginPath();

    ctx.moveTo(
        0,
        -25
    );

    ctx.lineTo(
        15 - walk * 10,
        0
    );

    ctx.stroke();


    ctx.restore();

}


/* =========================
   آپدیت
========================= */

function update(){

    me.vx = 0;


    if(keys.left){

        me.vx =
            -me.speed;

        me.direction =
            -1;

    }


    if(keys.right){

        me.vx =
            me.speed;

        me.direction =
            1;

    }


    me.walking =
        me.vx !== 0;


    me.x +=
        me.vx;


    if(me.x < 0){

        me.x = 0;

    }


    me.frame++;


    cameraX =
        me.x -
        window.innerWidth / 2;


    if(cameraX < 0){

        cameraX = 0;

    }


    sendPosition();

}


/* =========================
   رسم
========================= */

function draw(){

    drawSky();


    drawCloud(
        150,
        120,
        1
    );


    drawCloud(
        500,
        180,
        .8
    );


    drawGround();


    /* درخت‌ها */

    for(
        const tree of trees
    ){

        const x =
            tree.x -
            cameraX;


        if(
            x > -150 &&
            x < window.innerWidth + 150
        ){

            drawTree(
                x,
                tree.scale
            );

        }

    }


    /* بازیکن‌های دیگر */

    for(
        const id in players
    ){

        const p =
            players[id];


        if(!p){
            continue;
        }


        drawStickman(
            p,
            p.x - cameraX,
            window.innerHeight *
            groundY
        );

    }


    /* خودم */

    drawStickman(
        me,
        me.x - cameraX,
        window.innerHeight *
        groundY
    );

}


/* =========================
   حلقه بازی
========================= */

function gameLoop(){

    update();

    draw();

    requestAnimationFrame(
        gameLoop
    );

}


gameLoop();
