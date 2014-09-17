var types = ["gamepad", "keyboard", "mouse", "touch", "motion", "speech"],
    users = {},
    fmt = require("./core.js").fmt;

function User(userName, password){
    this.devices = [];
    this.userName = userName;
    this.password = password;
}

User.prototype.addDevice = function(socket){
    var index = 0;
    while(index < this.devices.length && this.devices[index]){
        ++index;
    }

    this.devices[index] = socket;
    this.bindEvents(index, this);

    if(index > 0){
        this.emit(index, "deviceAdded");
    }
};

User.prototype.broadcast = function(skipIndex){
    var args = Array.prototype.slice.call(arguments, 2);
    for(var userName in users){
        var toUser = users[userName];
        toUser.emit
            .bind(toUser, (toUser.userName == this.userName) ? skipIndex : -1)
            .apply(toUser, args);
    }
};

User.prototype.bindEvents = function(index){
    for(var i = 0; i < types.length; ++i) {
        this.devices[index].on(types[i], User.prototype.emit.bind(this, index));
    }

    this.devices[index].on("disconnect", User.prototype.disconnect.bind(this, index));

    this.devices[index].on("userState", function(state){
        state.userName = this.userName;
        this.broadcast(index, "userState", state);
    }.bind(this));
    
    var userList = [];
    for(var userName in users){
        userList.push(userName);
    }
    this.devices[index].emit("userList", userList);
    if(index == 0){
        this.broadcast(index, "userJoin", this.userName);
    }
};

User.prototype.disconnect = function(index, reason){
    var devicesLeft = 0;
    this.devices[index] = null;
    for(var i = 0; i < this.devices.length; ++i){
        if(this.devices[i]){
            devicesLeft ++;
        }
    }
    if(devicesLeft > 0){
        this.emit(index, "deviceLost");
    }
    else{
        this.broadcast(-1, "userLeft", this.userName);
        this.devices.splice(0);
    }
};

User.prototype.emit = function(skipIndex){
    var args = Array.prototype.slice.call(arguments, 1);
    for(var i = 0; i < this.devices.length; ++i){
        if(i != skipIndex && this.devices[i]){
            this.devices[i].emit.apply(this.devices[i], args);
        }
    }
};

module.exports = function (socket) {
    var user;
    console.log("New connection!");
    function login(credentials){
        if(!users[credentials.userName]){
            users[credentials.userName] = new User(credentials.userName, credentials.password);
        }
        
        if(users[credentials.userName].password == credentials.password){
            users[credentials.userName].addDevice(socket);
            socket.removeListener("login", login);
        }
        else{
            console.log("Failed to authenticate!", credentials.userName);
            socket.emit("loginFailed");
        }
    }
    socket.on("login", login);
}