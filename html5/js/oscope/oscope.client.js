function Oscope(key, path){
    var socketReady = null;
    if(!path){
        path = document.location.hostname;
    }

    this.socket = io.connect(path, {
        "reconnect": true,
        "reconnection delay": 1000,
        "max reconnection attempts": 60
    });

    this.socket.emit("handshake", "oscope");

    this.socket.once("handshakeComplete", function(){
        this.socket.emit("appKey", key);
        socketReady = true;
    }.bind(this));

    this.send = function(name, value){
        if(socketReady){
            this.socket.emit("value", {
                name: name,
                value: value
            });
        }
    };
}