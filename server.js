const WebSocket = require("ws");


const server = new WebSocket.Server({

    port:8080

});


let rooms={};



server.on("connection",function(socket){


    console.log("بازیکن وصل شد");



    socket.on("message",function(message){


        let data =
        JSON.parse(message);



        if(data.type==="create"){


            let code =
            Math.floor(1000+Math.random()*9000);



            rooms[code]=[{

                socket:socket,
                name:data.name

            }];



            console.log(
                "لابی ساخته شد:",
                code,
                data.name
            );



            socket.send(JSON.stringify({

                type:"room",
                code:code

            }));

        }





        if(data.type==="join"){



            if(rooms[data.code]){


                rooms[data.code].push({

                    socket:socket,
                    name:data.name

                });



                console.log(
                    "ورود:",
                    data.name
                );



                socket.send(JSON.stringify({

                    type:"joined"

                }));


            }
            else{


                socket.send(JSON.stringify({

                    type:"error",
                    message:"کد اشتباه است"

                }));


            }

        }


    });


});


console.log("Server running on 8080");