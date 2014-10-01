function Oscope(key, path){
    if(!path){
        path = document.location.hostname;
    }

    this.socket = io.connect(path, {
        "reconnect": true,
        "reconnection delay": 1000,
        "max reconnection attempts": 60
    });

    this.socket.emit("handshake", "oscope");

    if(key){
        this.socket.emit("appKey", key);
    }
}

Oscope.prototype.send = function(name, value){
    this.socket.emit("value", {
        name: name,
        value: value
    });
};