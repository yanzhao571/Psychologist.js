function Oscope(webSocket){
    this.socket = new WebRTCSocket(webSocket);    
    this.connect = this.socket.connect.bind(this.socket, "oscope");
    this.send = function(name, value){
        this.socket.emit("value", {
            name: name,
            value: value
        });
    };
}