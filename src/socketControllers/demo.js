var users = {},
    User = require("../game/User"),
    log = require("../core").log;

module.exports = {
    handshake: "demo",
    bindSocket: function(socket){
        log("starting demo for new user.");
        function login(credentials){
            if(!users[credentials.userName]){
                log("new user = $1.", credentials.userName);
                users[credentials.userName] = new User(credentials.userName, credentials.password);
            }
        
            if(users[credentials.userName].password == credentials.password){
                if(!users[credentials.userName].isConnected()){
                    log("user login = $1.", credentials.userName);
                }
                users[credentials.userName].addDevice(users, socket);
                socket.removeListener("login", login);
            }
            else{
                log("failed to authenticate = $1.", credentials.userName);
                socket.emit("loginFailed");
            }
        }
        socket.on("login", login);
    }
}