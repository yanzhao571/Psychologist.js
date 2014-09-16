var types = ["gamepad", "keyboard", "mouse", "touch", "motion", "speech"],
    users = {};

function User(userName, password, socket){
    this.devices = [socket];
    this.userName = userName;
    this.password = password;
    socket.index = 0;
    this.bindEvents(socket, this);
}

User.prototype.addDevice = function(socket){
    socket.index = 0;
    while(socket.index < this.devices.length && this.devices[socket.index]){
        ++socket.index;
    }
    this.devices[socket.index] = socket;
    this.bindEvents(socket, this);
    this.emit(socket.index, "open");
    return index;
};

function broadcast(thunk){
    for(var userName in users){
        var user = users[userName];
        thunk(user);
    }
}

User.prototype.bindEvents = function(socket){
    for(var i = 0; i < types.length; ++i) {
        socket.on(types[i], this.emit.bind(this, socket.index));
    }
    socket.on("disconnect", this.disconnect.bind(this, socket.index));

    socket.on("userState", function(state){
        state.userName = this.userName;
        broadcast(function(user){
            user.emit(user.userName == this.userName ? socket.index : -1, "userState", state);
        }.bind(this));
    }.bind(this));
    
    socket.emit("good");
    
    broadcast(function(user){
        user.emit(user.userName == this.userName ? socket.index : -1, "user", user.userName);
    }.bind(this));
};

User.prototype.disconnect = function(index){
    this.devices[index] = null;
    this.emit(index, "close");
};

User.prototype.emit = function(skipIndex){
    var args = Array.prototype.splice.call(arguments, 0, 1);
    for(var i = 0; i < this.devices.length; ++i){
        if(i != skipIndex && this.devices[i]){
            this.devices[i].emit.apply(this.devices[i], args);
        }
    }
};

module.exports = function (socket) {
    var user;

    socket.on("user", function(credentials){
        if(!users[credentials.userName]){
            users[credentials.userName] = new User(credentials.userName, credentials.password, socket);
        }
        else if(users[credentials.userName].password == credentials.password){
            users[credentials.userName].addDevice(socket);
        }
        else{
            socket.emit("bad");
        }
    });
}