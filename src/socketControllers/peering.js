var log = require("../core").log;

var users = {};

module.exports = {
    handshake: "peer",
    bindSocket: function(socket){
        log("new peering request.");
        socket.on("joinRequest", function(name){
            if(users[name] === undefined){
                users[name] = [];
            }
            
            var sockets = users[name];
            
            function forAll(thunk){
                for(var i = 0; i < sockets.length; ++i){
                    thunk(sockets[i], i);
                }
            }
            
            function forOthers(thunk){
                forAll(function(skt, i){
                    if(skt !== socket){
                        thunk(skt, i);
                    }
                });
            }
            
            function removeSocket(){                
                for(var i = sockets.length - 1; i >= 0; --i){
                    if(sockets[i] === socket){
                        sockets.splice(i, 1);
                        break;
                    }
                }
                log("DISCONNECT: currently " + sockets.length + " connections for " + name);
            }
            
            socket.on("error", removeSocket);
            socket.on("disconnect", removeSocket);
            
            ["offer", "answer", "ice"].forEach(function(o){
                socket.on(o, function(obj){
                    sockets[obj.toIndex].emit(o, obj);
                });
            });
            
            sockets.push(socket);
            
            forOthers(function(skt, i){
                skt.emit("user", i, sockets.length - 1);
            });
            
            forOthers(function(skt, i){
                socket.emit("user", sockets.length - 1, i);
            });
            
            log("CONNECT: currently " + sockets.length + " connections for " + name);
        });
    }
};
