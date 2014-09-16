var types = ["gamepad", "keyboard", "mouse", "touch", "motion", "speech"],
    users = {};

function User(userName, password, socket){
    this.devices = [socket];
    this.userName = userName;
    this.password = password;
}

User.prototype.addDevice = function(socket){
    var index = this.devices.length;
    this.devices.push(socket);
    return index;
};

User.prototype.emit = function(){
    for(var i = 0; i < this.devices.length; ++i){
        this.devices[i].emit.apply(this.devices[i], arguments);
    }
};

module.exports = function (socket) {
    var user, lastKey;

    function disconnect(){
        if(group){
            group.splice(socket.index, 1);
            for(var i = 0; i < group.length; ++i){
                group[i].index = i;
                group[i].emit("close", socket.index);
            }
            if(group.length == 0){
                delete users[lastKey];
                group = null;
            }
        }
    }
    
    socket.on("disconnect", disconnect);

    socket.on("user", function(credentials){
        if(user
        
        for(var g in users){
            var grp  = users[g];
            for(var i = 0; i < grp.length; ++i){
                grp[i].emit("user", userName, userName == grp.name);
            }
        }
    });

    socket.on("state", function(state){
        for(var g in users){
            var grp  = users[g];
            if(grp.name != group.name){
                for(var i = 0; i < grp.length; ++i){
                    grp[i].emit("state", state);
                }
            }
        }
    });

    socket.on("key", function (key) {
        if(lastKey){
            disconnect();
            lastKey = null;
        }

        lastKey = key;
        if(!users[key]){
            users[key] = [];
        }

        group = users[key];

        socket.index = group.length;
        group.push(socket);

        for(var i = 0; i < types.length; ++i) {
            socket.on(types[i], proxyCommand.bind(socket, key, types[i]));
        }

        socket.emit("good", {index: socket.index, total: group.length});
        for(var i = 0; i < group.length && i < socket.index; ++i){
            group[i].emit("open", {index: socket.index, total: group.length});
        }
    });
}