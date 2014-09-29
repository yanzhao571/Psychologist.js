var fs = require("fs"),
    User = require("../game/User"),
    log = require("../core").log,

    users = {};

fs.readFile("users.json", "utf8", function(err, file){
    if(err){
        log("No users file");
    }
    else{
        log("Reading users from disk.");
        var userList = JSON.parse(file);
        for(var i = 0; i < userList.length; ++i){
            var userName = userList[i].name;
            var password = userList[i].password;
            users[userName.toLocaleUpperCase()] = new User(userName, password);
        }
    }
});

module.exports = {
    handshake: "demo",
    bindSocket: function(socket){
        log("starting demo for new user.");
        function login(credentials){
            var key = credentials && credentials.userName && credentials.userName.toLocaleUpperCase();
            if(key && !users[key]){
                log("new user = $1.", key);
                users[key] = new User(credentials.userName, credentials.password);
                log("Writing users to disk.");
                var userList = [];
                for(var key in users){
                    var user = users[key];
                    userList.push({
                        name: user.state.userName,
                        password: user.password
                    });
                }
                fs.writeFile("users.json", JSON.stringify(userList));
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
};
