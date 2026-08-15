let canvas=document.getElementById("canvas");
let ctx=canvas.getContext("2d");


let x=400;
let y=350;

let left=false;
let right=false;


document.addEventListener("keydown",e=>{

if(e.key==="ArrowLeft")
left=true;

if(e.key==="ArrowRight")
right=true;

});


document.addEventListener("keyup",e=>{

if(e.key==="ArrowLeft")
left=false;

if(e.key==="ArrowRight")
right=false;

});


function update(){

if(left)x-=5;
if(right)x+=5;

}


function draw(){

ctx.clearRect(0,0,800,500);


// زمین
ctx.fillStyle="green";
ctx.fillRect(0,430,800,70);


// اسم
ctx.fillStyle="black";
ctx.font="25px Arial";
ctx.fillText(
localStorage.getItem("player"),
x-30,
80
);


// سر
ctx.strokeStyle="black";
ctx.lineWidth=5;

ctx.beginPath();
ctx.arc(x,y-70,20,0,Math.PI*2);
ctx.stroke();


// بدن

ctx.beginPath();
ctx.moveTo(x,y-50);
ctx.lineTo(x,y+40);
ctx.stroke();


// پاها

ctx.beginPath();
ctx.moveTo(x,y+40);
ctx.lineTo(x-25,y+80);

ctx.moveTo(x,y+40);
ctx.lineTo(x+25,y+80);

ctx.stroke();


}


function loop(){

update();
draw();

requestAnimationFrame(loop);

}


loop();
