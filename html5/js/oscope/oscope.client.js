function Oscope(key, path){
    var socketReady = null;
    if(!path){
        path = document.location.hostname;
    }

    this.connect = function(){
        this.socket = io.connect(path, {
            "reconnect": true,
            "reconnection delay": 1000,
            "max reconnection attempts": 60
        });

        this.socket.emit("handshake", "oscope");

        var socket = this.socket;

        function onHandshakeComplete(controller){
            if(controller === "oscope"){
                socket.emit("appKey", key);
                socketReady = true;
                socket.removeListener("handshakeComplete", onHandshakeComplete);
            }
        }

        this.socket.on("handshakeComplete", onHandshakeComplete);
    };

    this.send = function(name, value){
        if(this.socket && socketReady){
            this.socket.emit("value", {
                name: name,
                value: value
            });
        }
    };
}