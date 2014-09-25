var types = ["gamepad", "keyboard", "mouse", "touch", "head", "arm", "speech"],
    log = require("../core").log;

function User(userName, password){
    this.devices = [];
    this.state = {
        x: 0,
        y: 0,
        z: 0,
        dx: 0,
        dy: 0,
        dz: 0,
        heading: 0,
        isRunning: false,
        userName: userName
    };
    this.password = password;
}

User.prototype.addDevice = function(users, socket){
    var index = 0;
    while(index < this.devices.length && this.devices[index]){
        ++index;
    }

    log("Device added for $1", this.state.userName);
    this.devices[index] = socket;
    
    for(var i = 0; i < types.length; ++i){
        socket.on(types[i], User.prototype.emit.bind(this, index, types[i]));
    }

    socket.on("disconnect", User.prototype.disconnect.bind(this, users, index));

    socket.on("userState", function(state){
        this.state.x = state.x;
        this.state.y = state.y;
        this.state.z = state.z;
        this.state.heading = state.heading;
        this.state.isRunning = state.isRunning;
        this.broadcast(users, index, "userState", this.state);
    }.bind(this));
    
    var userList = [];
    for(var key in users){
        if(users[key].isConnected()){
            userList.push(users[key].state.userName);
        }
    }
    socket.emit("userList", userList);
    if(index == 0){
        this.broadcast(users, index, "userJoin", this.state.userName);
    }

    if(index > 0){
        this.emit(index, "deviceAdded");
        socket.emit("userState", this.state);
    }
};

User.prototype.broadcast = function(users, skipIndex){
    var args = Array.prototype.slice.call(arguments, 2);
    for(var key in users){
        var toUser = users[key];
        toUser.emit
            .bind(toUser, (toUser.state.userName == this.state.userName) ? skipIndex : -1)
            .apply(toUser, args);
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

User.prototype.isConnected = function(){
    var devicesLeft = 0;
    for(var i = 0; i < this.devices.length; ++i){
        if(this.devices[i]){
            ++devicesLeft;
        }
    }
    return devicesLeft > 0;
};

User.prototype.disconnect = function(users, index, reason){
    this.devices[index] = null;
    if(this.isConnected()){
        log("Device #$1 lost for $2.", index, this.state.userName);
        this.emit(index, "deviceLost");
    }
    else{
        log("disconnect = $1.", this.state.userName);
        this.broadcast(users, -1, "userLeft", this.state.userName);
        this.devices.splice(0);
    }
};

module.exports = User;