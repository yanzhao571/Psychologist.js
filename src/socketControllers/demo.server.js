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
        try{
            var userList = JSON.parse(file);
            for(var i = 0; i < userList.length; ++i){
                userList[i].userName = userList[i].userName || userList[i].name; 
                users[userList[i].userName.toLocaleUpperCase()] = new User(userList[i]);
            }
        }
        catch(exp){
            log("User file corrupted");
        }
    }
});

module.exports = {
    handshake: "demo",
    bindSocket: function(socket){
        log("starting demo for new user.");        
        socket.once("login", function (credentials){
            var key = credentials 
                && credentials.userName 
                && credentials.userName.toLocaleUpperCase().trim();

            if(key && !users[key]){
                log("[$1] > new user", credentials.userName);
                users[key] = new User(credentials);
                var userList = [];
                for(var key in users){
                    var user = users[key];
                    userList.push({
                        userName: user.state.userName,
                        password: user.password,
                        email: user.email
                    });
                }

                // synchronous so two new users at the same time can't get into
                // a race condition, right?
                fs.writeFileSync("users.json", JSON.stringify(userList));
            }
        
            if(key && users[key].password === credentials.password){
                if(!users[key].isConnected()){
                    log("[$1] > user login", key);
                }
                users[key].email = credentials.email || users[key].email;
                users[key].addDevice(users, socket);
            }
            else{
                log("[$1] > failed to authenticate", key);
                socket.emit("loginFailed");
            }
        });
    }
};
