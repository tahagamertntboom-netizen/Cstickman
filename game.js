const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");


// اتصال به سرور
let socket = new WebSocket("ws://localhost:8080");

let myId = null;
let otherPlayers = {};

socket.onopen = function(){
    console.log("وصل شد به سرور");
};


socket.onmessage = function(event){

    let data = JSON.parse(event.data);


    if(data.type === "id"){

        myId = data.id;

    }


    if(data.type === "players"){

        otherPlayers = data.players;

    }

};



// بازیکن خودمان

let player = {
    x:400,
    y:250
};


let speed = 5;
let keys = {};



// کنترل

document.addEventListener("keydown", function(e){
    keys[e.code] = true;
});


document.addEventListener("keyup", function(e){
    keys[e.code] = false;
});




// حرکت

function update(){


    if(keys["KeyW"])
        player.y -= speed;


    if(keys["KeyS"])
        player.y += speed;


    if(keys["KeyA"])
        player.x -= speed;


    if(keys["KeyD"])
        player.x += speed;



    if(player.x < 50)
        player.x = 50;

    if(player.x > 750)
        player.x = 750;


    if(player.y < 100)
        player.y = 100;

    if(player.y > 350)
        player.y = 350;



    // ارسال حرکت به سرور

    if(socket.readyState === WebSocket.OPEN){

        socket.send(JSON.stringify({

            type:"move",
            x:player.x,
            y:player.y

        }));

    }

}



// مپ

function drawMap(){

    ctx.fillStyle="#3fa34d";

    ctx.fillRect(0,0,800,500);



    ctx.fillStyle="#2196f3";

    ctx.fillRect(300,0,150,180);



    ctx.fillStyle="#c89b5b";

    ctx.fillRect(0,220,800,70);



    ctx.fillStyle="#555";

    ctx.fillRect(100,80,100,250);

    ctx.fillRect(600,100,100,200);

}



// کشیدن استیکمن

function drawStick(x,y,color){


    ctx.strokeStyle=color;
    ctx.lineWidth=8;
    ctx.lineCap="round";


    ctx.beginPath();

    ctx.arc(
        x,
        y-60,
        30,
        0,
        Math.PI*2
    );

    ctx.stroke();



    ctx.beginPath();

    ctx.moveTo(x,y-30);

    ctx.lineTo(x,y+70);


    ctx.moveTo(x,y);

    ctx.lineTo(x-50,y+30);


    ctx.moveTo(x,y);

    ctx.lineTo(x+50,y+30);


    ctx.moveTo(x,y+70);

    ctx.lineTo(x-40,y+130);


    ctx.moveTo(x,y+70);

    ctx.lineTo(x+40,y+130);


    ctx.stroke();

}



// بازیکن‌های دیگر

function drawOtherPlayers(){


    for(let id in otherPlayers){


        if(id == myId)
            continue;


        let p = otherPlayers[id];


        drawStick(
            p.x,
            p.y,
            "blue"
        );

    }

}




// حلقه بازی

function loop(){


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    update();


    drawMap();


    drawStick(
        player.x,
        player.y,
        "red"
    );


    drawOtherPlayers();



    requestAnimationFrame(loop);

}


loop();