const socket = io();

let playerName = "";
let roomCode = "";

let myPlayer = null;

let players = {};

let gameStarted = false;

let velocityY = 0;

let onGround = false;

const SPEED = 5;
const GRAVITY = 0.7;
const JUMP = 13;


// =====================================
// ELEMENTS
// =====================================

const nameScreen =
    document.getElementById(
        "nameScreen"
    );

const lobbyScreen =
    document.getElementById(
        "lobbyScreen"
    );

const roomScreen =
    document.getElementById(
        "roomScreen"
    );

const gameScreen =
    document.getElementById(
        "gameScreen"
    );

const nameInput =
    document.getElementById(
        "nameInput"
    );

const confirmName =
    document.getElementById(
        "confirmName"
    );

const createRoom =
    document.getElementById(
        "createRoom"
    );

const showJoin =
    document.getElementById(
        "showJoin"
    );

const joinBox =
    document.getElementById(
        "joinBox"
    );

const roomInput =
    document.getElementById(
        "roomInput"
    );

const joinRoom =
    document.getElementById(
        "joinRoom"
    );

const roomCodeElement =
    document.getElementById(
        "roomCode"
    );

const readyButton =
    document.getElementById(
        "readyButton"
    );

const readyStatus =
    document.getElementById(
        "readyStatus"
    );


// =====================================
// NAME
// =====================================

confirmName.onclick = function(){

    const name =
        nameInput.value.trim();

    if(!name){

        document.getElementById(
            "nameError"
        ).textContent =
            "لطفاً اسم را وارد کن.";

        return;
    }

    playerName =
        name.substring(0,20);

    document.getElementById(
        "welcome"
    ).textContent =
        "سلام " +
        playerName +
        " 👋";

    nameScreen.classList.add(
        "hidden"
    );

    lobbyScreen.classList.remove(
        "hidden"
    );
};


// =====================================
// ENTER KEY FOR NAME
// =====================================

nameInput.addEventListener(
    "keydown",
    function(e){

        if(e.key === "Enter"){

            confirmName.click();
        }
    }
);


// =====================================
// CREATE ROOM
// =====================================

createRoom.onclick = function(){

    createRoom.disabled = true;

    createRoom.textContent =
        "⏳ در حال ساخت...";

    socket.emit(
        "createRoom",
        {
            name:playerName
        }
    );
};


// =====================================
// ROOM CREATED
// =====================================

socket.on(
    "roomCreated",
    function(data){

        roomCode =
            String(data.roomCode)
            .replace(/\D/g,"");

        myPlayer =
            data.player;

        players = {};

        players[
            myPlayer.id
        ] = myPlayer;

        openRoom();
    }
);


// =====================================
// SHOW JOIN
// =====================================

showJoin.onclick = function(){

    joinBox.classList.toggle(
        "hidden"
    );
};


// =====================================
// ONLY NUMBERS
// =====================================

roomInput.addEventListener(
    "input",
    function(){

        roomInput.value =
            roomInput.value
            .replace(/\D/g,"")
            .substring(0,6);
    }
);


// =====================================
// JOIN
// =====================================

joinRoom.onclick = function(){

    const code =
        roomInput.value
        .replace(/\D/g,"")
        .substring(0,6);

    if(code.length !== 6){

        document.getElementById(
            "lobbyError"
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
            roomCode:code,
            name:playerName
        }
    );
};


// =====================================
// ROOM JOINED
// =====================================

socket.on(
    "roomJoined",
    function(data){

        roomCode =
            String(data.roomCode)
            .replace(/\D/g,"");

        myPlayer =
            data.player;

        players = {};

        players[
            myPlayer.id
        ] = myPlayer;

        openRoom();
    }
);


// =====================================
// OPEN ROOM
// =====================================

function openRoom(){

    lobbyScreen.classList.add(
        "hidden"
    );

    roomScreen.classList.remove(
        "hidden"
    );

    roomCodeElement.textContent =
        roomCode;

    readyButton.disabled = false;

    readyButton.textContent =
        "🎮 بزن بریم تو بازی";

    readyStatus.textContent =
        "منتظر بازیکن دوم...";
}


// =====================================
// READY
// =====================================

readyButton.onclick = function(){

    readyButton.disabled = true;

    readyButton.textContent =
        "✅ آماده شدی";

    readyStatus.textContent =
        "⏳ منتظر بازیکن دیگر...";

    socket.emit(
        "readyForGame"
    );
};


// =====================================
// READY UPDATE
// =====================================

socket.on(
    "readyUpdate",
    function(data){

        readyStatus.textContent =
            "بازیکنان آماده: " +
            data.ready +
            " / " +
            data.total;
    }
);


// =====================================
// START GAME
// =====================================

socket.on(
    "startGame",
    function(){

        startGame();
    }
);


// =====================================
// PLAYERS
// =====================================

socket.on(
    "playersUpdate",
    function(list){

        players = {};

        list.forEach(
            function(player){

                players[
                    player.id
                ] = player;

                if(
                    player.id ===
                    socket.id
                ){

                    myPlayer =
                        player;
                }
            }
        );
    }
);


// =====================================
// PLAYER MOVED
// =====================================

socket.on(
    "playerMoved",
    function(player){

        if(
            players[player.id]
        ){

            players[player.id].x =
                player.x;

            players[player.id].y =
                player.y;
        }
    }
);


// =====================================
// PLAYER LEFT
// =====================================

socket.on(
    "playerLeft",
    function(id){

        delete players[id];
    }
);


// =====================================
// ERROR
// =====================================

socket.on(
    "roomError",
    function(message){

        document.getElementById(
            "lobbyError"
        ).textContent =
            String(message);

        joinRoom.disabled = false;

        joinRoom.textContent =
            "🚪 ورود";

        createRoom.disabled = false;

        createRoom.textContent =
            "🏠 ساخت اتاق";
    }
);


// =====================================
// CANVAS
// =====================================

const canvas =
    document.getElementById(
        "gameCanvas"
    );

const ctx =
    canvas.getContext("2d");


function resize(){

    canvas.width =
        window.innerWidth;

    canvas.height =
        window.innerHeight;
}

window.addEventListener(
    "resize",
    resize
);

resize();


// =====================================
// START GAME
// =====================================

function startGame(){

    if(gameStarted) return;

    gameStarted = true;

    roomScreen.classList.add(
        "hidden"
    );

    gameScreen.style.display =
        "block";

    resize();

    requestAnimationFrame(
        gameLoop
    );
}


// =====================================
// KEYBOARD
// =====================================

const keys = {};

document.addEventListener(
    "keydown",
    function(e){

        keys[
            e.key.toLowerCase()
        ] = true;

        if(
            e.code === "Space"
        ){

            keys.space = true;
        }
    }
);

document.addEventListener(
    "keyup",
    function(e){

        keys[
            e.key.toLowerCase()
        ] = false;

        if(
            e.code === "Space"
        ){

            keys.space = false;
        }
    }
);


// =====================================
// MOBILE BUTTONS
// =====================================

function mobileButton(
    id,
    key
){

    const button =
        document.getElementById(id);

    if(!button) return;

    button.addEventListener(
        "touchstart",
        function(e){

            e.preventDefault();

            keys[key] = true;
        },
        {
            passive:false
        }
    );

    button.addEventListener(
        "touchend",
        function(e){

            e.preventDefault();

            keys[key] = false;
        },
        {
            passive:false
        }
    );

    button.addEventListener(
        "touchcancel",
        function(){

            keys[key] = false;
        }
    );

    button.addEventListener(
        "mousedown",
        function(){

            keys[key] = true;
        }
    );

    button.addEventListener(
        "mouseup",
        function(){

            keys[key] = false;
        }
    );

    button.addEventListener(
        "mouseleave",
        function(){

            keys[key] = false;
        }
    );
}


mobileButton(
    "leftButton",
    "mobileLeft"
);

mobileButton(
    "rightButton",
    "mobileRight"
);

mobileButton(
    "jumpButton",
    "mobileJump"
);


// =====================================
// UPDATE PLAYER
// =====================================

function updatePlayer(){

    if(
        !myPlayer ||
        !gameStarted
    ){

        return;
    }

    let moving = false;


    // LEFT

    if(
        keys.a ||
        keys.arrowleft ||
        keys.mobileLeft
    ){

        myPlayer.x -= SPEED;

        moving = true;
    }


    // RIGHT

    if(
        keys.d ||
        keys.arrowright ||
        keys.mobileRight
    ){

        myPlayer.x += SPEED;

        moving = true;
    }


    // JUMP

    if(
        (
            keys.w ||
            keys.arrowup ||
            keys.space ||
            keys.mobileJump
        )
        &&
        onGround
    ){

        velocityY =
            -JUMP;

        onGround = false;
    }


    // GRAVITY

    velocityY += GRAVITY;

    myPlayer.y += velocityY;


    // GROUND

    const ground =
        canvas.height - 120;


    if(
        myPlayer.y >= ground
    ){

        myPlayer.y =
            ground;

        velocityY = 0;

        onGround = true;
    }


    // BOUNDARIES

    if(
        myPlayer.x < 30
    ){

        myPlayer.x = 30;
    }


    if(
        myPlayer.x >
        canvas.width - 30
    ){

        myPlayer.x =
            canvas.width - 30;
    }


    // SEND

    if(
        moving ||
        !onGround
    ){

        players[
            myPlayer.id
        ] = myPlayer;

        socket.emit(
            "playerMovement",
            {
                x:myPlayer.x,
                y:myPlayer.y
            }
        );
    }
}


// =====================================
// SKY
// =====================================

function drawSky(){

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


    // SUN

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


// =====================================
// GROUND
// =====================================

function drawGround(){

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


// =====================================
// STICKMAN
// =====================================

function drawStickman(player){

    const x = player.x;
    const y = player.y;


    ctx.strokeStyle =
        player.id === socket.id
            ? "#16a34a"
            : "#1d4ed8";

    ctx.lineWidth = 5;

    ctx.lineCap =
        "round";


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


// =====================================
// DRAW GAME
// =====================================

function drawGame(){

    if(!gameStarted) return;

    drawSky();

    drawGround();

    Object.values(players)
        .forEach(
            function(player){

                drawStickman(
                    player
                );
            }
        );
}


// =====================================
// GAME LOOP
// =====================================

function gameLoop(){

    if(!gameStarted) return;

    updatePlayer();

    drawGame();

    requestAnimationFrame(
        gameLoop
    );
}
