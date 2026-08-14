let socket = new WebSocket(
    "ws://localhost:8080"
);


socket.onopen = function(){

    console.log("وصل شد");

};



function createRoom(){


    let name =
    document.getElementById("name").value;


    console.log(
        "ساخت لابی:",
        name
    );


    socket.send(JSON.stringify({

        type:"create",
        name:name

    }));

}



function joinRoom(){


    let name =
    document.getElementById("name").value;


    let code =
    document.getElementById("code").value;



    socket.send(JSON.stringify({

        type:"join",
        name:name,
        code:code

    }));

}




socket.onmessage=function(event){


    console.log(
        "سرور:",
        event.data
    );


    let data =
    JSON.parse(event.data);



    if(data.type==="room"){


        document.getElementById("room").innerHTML =

        "کد لابی: " + data.code;


    }



    if(data.type==="joined"){


        window.location.href="game.html";


    }



    if(data.type==="error"){


        alert(data.message);

    }


};