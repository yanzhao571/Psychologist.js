var users = {},
    User = require("../game/User");

module.exports = {
    handshake: "demo",
    bindSocket: function(socket){
        console.log("Elected demo!");
        function login(credentials){
            if(!users[credentials.userName]){
                console.log("new user", credentials.userName);
                users[credentials.userName] = new User(credentials.userName, credentials.password);
            }
        
            if(users[credentials.userName].password == credentials.password){
                if(!users[credentials.userName].isConnected()){
                    console.log("user login", credentials.userName);
                }
                users[credentials.userName].addDevice(users, socket);
                socket.removeListener("login", login);
            }
            else{
                console.log("Failed to authenticate!", credentials.userName);
                socket.emit("loginFailed");
            }
        }
        socket.on("login", login);
    }
}