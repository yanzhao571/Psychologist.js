var log = require("../core").log;

module.exports = {
    handshake: "oscope",
    bindSocket: function(socket){
        var appKey = null;
        log("starting oscope for new user.");
        socket.on("appKey", function(value){
            if(appKey != null){
                socket.leave(appKey);
            }
            appKey = value;
            socket.join(appKey);
        });

        socket.on("value", function(value){
            if(appKey != null){
                socket.to(appKey).emit("value", value);
            }
        });
    }
};
