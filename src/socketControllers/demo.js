var users = {},
    User = require("../game/User"),
    log = require("../core").log;

module.exports = {
    handshake: "demo",
    bindSocket: function(socket){
        log("starting demo for new user.");
        function login(credentials){
            var key = credentials && credentials.userName && credentials.userName.toLocaleUpperCase();
            if(key && !users[key]){
                log("new user = $1.", key);
                users[key] = new User(credentials.userName, credentials.password);
            }
        
            if(key && users[key].password == credentials.password){
                if(!users[key].isConnected()){
                    log("user login = $1.", key);
                }
                users[key].addDevice(users, socket);
                socket.removeListener("login", login);
            }
            else{
                log("failed to authenticate = $1.", key);
                socket.emit("loginFailed");
            }
        }
        socket.on("login", login);
    }
}