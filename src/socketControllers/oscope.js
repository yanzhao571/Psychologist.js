var log = require("../core").log,
    io = require("socket.io"),
    sockets = {};

module.exports = {
    handshake: "oscope",
    bindSocket: function(socket){
        var appKey = null,
            index = -1;
        log("starting oscope for new user.");

        function disconnect(){
            if(index > -1){
                sockets[appKey][index] = null;
                var count = 0;
                for(var i = 0; i < sockets[appKey].length; ++i){
                    if(sockets[appKey][i]){
                        ++count;
                    }
                }

                if(count == 0){
                    delete sockets[appKey];
                }
            }
        }

        socket.on("appKey", function(value){
            if(appKey != null){
                disconnect();
            }
            appKey = value;
            if(!sockets[appKey]){
                sockets[appKey] = [];
            }
            index = sockets[appKey].length;
            sockets[appKey].push(socket);
        });

        socket.on("value", function(value){
            for(var i = 0; i < sockets[appKey].length; ++i){
                if(i != index && sockets[appKey][i]){
                    sockets[appKey][i].emit("value", value);
                }
            }
        });

        socket.on("disconnect", disconnect);
    }
};
