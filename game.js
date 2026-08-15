const canvas =
    document.getElementById("game");

const ctx =
    canvas.getContext("2d");


/* =========================
   اسم بازیکن
========================= */

const PLAYER_NAME =
    localStorage.getItem("player") || "Player";


/* فقط این اسم ادمین است */

const ADMIN_NAME =
    "tahagamertnt";


/* =========================
   اندازه صفحه
========================= */

let W = 0;
let H = 0;

function resize(){

    W = window.innerWidth;
    H = window.innerHeight;

    const dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );

    canvas.width =
        Math.floor(W * dpr);

    canvas.height =
        Math.floor(H * dpr);

    canvas.style.width =
        W + "px";

    canvas.style.height =
        H + "px";

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
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
   بازیکن
========================= */

let player = {

    x: W / 2,

    y: H - 180,

    speed: 6,

    walk: 0,

    coins: 0

};


/* =========================
   کیبورد
========================= */

const keys = {};

document.addEventListener(
    "keydown",
    function(e){

        keys[e.key] = true;

    }
);

document.addEventListener(
    "keyup",
    function(e){

        keys[e.key] = false;

    }
);


/* =========================
   کنترل موبایل
========================= */

let moveLeft = false;
let moveRight = false;


const leftButton =
    document.getElementById("left");

const rightButton =
    document.getElementById("right");


function leftStart(e){

    e.preventDefault();

    moveLeft = true;

}


function leftEnd(e){

    e.preventDefault();

    moveLeft = false;

}


function rightStart(e){

    e.preventDefault();

    moveRight = true;

}


function rightEnd(e){

    e.preventDefault();

    moveRight = false;

}


leftButton.addEventListener(
    "pointerdown",
    leftStart,
    {passive:false}
);

leftButton.addEventListener(
    "pointerup",
    leftEnd,
    {passive:false}
);

leftButton.addEventListener(
    "pointercancel",
    leftEnd,
    {passive:false}
);

leftButton.addEventListener(
    "pointerleave",
    leftEnd,
    {passive:false}
);


rightButton.addEventListener(
    "pointerdown",
    rightStart,
    {passive:false}
);

rightButton.addEventListener(
    "pointerup",
    rightEnd,
    {passive:false}
);

rightButton.addEventListener(
    "pointercancel",
    rightEnd,
    {passive:false}
);

rightButton.addEventListener(
    "pointerleave",
    rightEnd,
    {passive:false}
);


/* جلوگیری از منوی نگه داشتن */

document.addEventListener(
    "contextmenu",
    function(e){

        e.preventDefault();

    }
);

document.addEventListener(
    "selectstart",
    function(e){

        e.preventDefault();

    }
);

document.addEventListener(
    "dragstart",
    function(e){

        e.preventDefault();

    }
);


/* =========================
   حرکت
========================= */

function update(){

    let moving = false;


    if(
        keys["a"] ||
        keys["A"] ||
        keys["ش"] ||
        moveLeft
    ){

        player.x -=
            player.speed;

        player.walk +=
            0.35;

        moving = true;

    }


    if(
        keys["d"] ||
        keys["D"] ||
        keys["ی"] ||
        moveRight
    ){

        player.x +=
            player.speed;

        player.walk +=
            0.35;

        moving = true;

    }


    if(!moving){

        player.walk *= 0.8;

    }


    if(player.x < 50){

        player.x = 50;

    }


    if(player.x > W - 50){

        player.x = W - 50;

    }


    player.y =
        H - 180;

}


/* =========================
   جنگل
========================= */

function drawForest(){

    let sky =
        ctx.createLinearGradient(
            0,
            0,
            0,
            H
        );

    sky.addColorStop(
        0,
        "#69cfff"
    );

    sky.addColorStop(
        1,
        "#d8f7ff"
    );

    ctx.fillStyle = sky;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    /* خورشید */

    ctx.fillStyle =
        "#ffd83d";

    ctx.beginPath();

    ctx.arc(
        90,
        80,
        42,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* زمین */

    ctx.fillStyle =
        "#3fa447";

    ctx.fillRect(
        0,
        H - 100,
        W,
        100
    );


    ctx.fillStyle =
        "#268631";

    ctx.fillRect(
        0,
        H - 100,
        W,
        12
    );


    /* درخت‌ها */

    for(
        let x = -50;
        x < W + 200;
        x += 230
    ){

        drawTree(
            x,
            H - 270
        );

    }

}


/* =========================
   درخت
========================= */

function drawTree(x,y){

    ctx.fillStyle =
        "#704214";

    ctx.fillRect(
        x,
        y,
        45,
        170
    );


    ctx.fillStyle =
        "#238b35";

    ctx.beginPath();

    ctx.arc(
        x + 22,
        y - 20,
        75,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        x - 25,
        y + 20,
        50,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        x + 70,
        y + 20,
        50,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


/* =========================
   استیکمن
========================= */

function drawPlayer(){

    const x =
        player.x;

    const y =
        player.y;

    const move =
        Math.sin(
            player.walk
        ) * 25;


    ctx.strokeStyle =
        "#111";

    ctx.lineWidth =
        7;

    ctx.lineCap =
        "round";


    /* اسم واقعی بازیکن */

    ctx.fillStyle =
        "#111";

    ctx.font =
        "bold 23px Arial";

    ctx.textAlign =
        "center";

    ctx.fillText(
        PLAYER_NAME,
        x,
        y - 175
    );


    /* سر */

    ctx.beginPath();

    ctx.arc(
        x,
        y - 115,
        28,
        0,
        Math.PI * 2
    );

    ctx.stroke();


    /* بدن */

    ctx.beginPath();

    ctx.moveTo(
        x,
        y - 87
    );

    ctx.lineTo(
        x,
        y
    );

    ctx.stroke();


    /* دست چپ */

    ctx.beginPath();

    ctx.moveTo(
        x,
        y - 60
    );

    ctx.lineTo(
        x - 50,
        y - 25 + move
    );

    ctx.stroke();


    /* دست راست */

    ctx.beginPath();

    ctx.moveTo(
        x,
        y - 60
    );

    ctx.lineTo(
        x + 50,
        y - 25 - move
    );

    ctx.stroke();


    /* پا چپ */

    ctx.beginPath();

    ctx.moveTo(
        x,
        y
    );

    ctx.lineTo(
        x - 30,
        y + 70 + move
    );

    ctx.stroke();


    /* پا راست */

    ctx.beginPath();

    ctx.moveTo(
        x,
        y
    );

    ctx.lineTo(
        x + 30,
        y + 70 - move
    );

    ctx.stroke();


    ctx.textAlign =
        "left";

}


/* =========================
   ADMIN
========================= */

const adminButton =
    document.getElementById(
        "adminButton"
    );

const adminPanel =
    document.getElementById(
        "adminPanel"
    );

const adminName =
    document.getElementById(
        "adminName"
    );


/* فقط tahagamertnt */

if(
    PLAYER_NAME === ADMIN_NAME
){

    adminButton.style.display =
        "block";

    adminName.textContent =
        "👑 " + PLAYER_NAME;

}


adminButton.addEventListener(
    "click",
    function(){

        adminPanel.style.display =
            "block";

    }
);


function closeAdmin(){

    adminPanel.style.display =
        "none";

}


function adminMessage(){

    const msg =
        prompt(
            "📢 پیام ادمین:"
        );

    if(msg){

        alert(
            "📢 ADMIN:\n\n" +
            msg
        );

    }

}


function changeSpeed(){

    const value =
        prompt(
            "🏃 سرعت جدید:",
            player.speed
        );

    if(value !== null){

        const n =
            Number(value);

        if(
            n > 0 &&
            n <= 50
        ){

            player.speed =
                n;

        }

    }

}


function giveCoins(){

    player.coins += 100;

    alert(
        "🪙 +100 Coins\n\n" +
        "Coins: " +
        player.coins
    );

}


function teleport(){

    player.x =
        W / 2;

}


let night = false;

function nightMode(){

    night =
        !night;

}


/* =========================
   اجرای بازی
========================= */

function gameLoop(){

    update();

    drawForest();


    if(night){

        ctx.fillStyle =
            "rgba(10,20,60,.6)";

        ctx.fillRect(
            0,
            0,
            W,
            H
        );

    }


    drawPlayer();


    requestAnimationFrame(
        gameLoop
    );

}


gameLoop();
