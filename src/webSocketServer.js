var socketControllers = require("./socketControllers");

module.exports = function (socket) {
    console.log("New connection!");
    function handshake(controllerName){
        var found = false;
        for(var i = 0; i < socketControllers.length; ++i){
            if(socketControllers[i].handshake == controllerName){
                socket.removeListener("handshake", handshake);
                socketControllers[i].bindSocket(socket);
                found = true;
            }
        }
        if(!found){
            console.log("unknown web socket controller type", controllerName);
            socket.emit("handshakeFailed", socketControllers.map(function(o){ return o.handshake; }));
        }
    }
    socket.on("handshake", handshake);
}